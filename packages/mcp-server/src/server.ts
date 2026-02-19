import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { validateDSL } from '@yafai/primitives';
import { FigmaBridge } from './websocket/figma-bridge.js';
import { SessionManager } from './session/session-manager.js';
import { SlideTracker } from './state/slide-tracker.js';
import { log } from './util/logger.js';

export function createMcpServer(bridge: FigmaBridge): McpServer {
  const sessions = new SessionManager();
  const slides = new SlideTracker();

  const mcp = new McpServer({
    name: 'yafai-figma',
    version: '0.1.0',
  });

  // ────────────────────────────────────────────────────────────────────
  // 1. start_session
  // ────────────────────────────────────────────────────────────────────
  mcp.tool(
    'start_session',
    'Create a working session for slide files and snapshots',
    { name: z.string().optional().describe('Session name (default: "default")') },
    async ({ name }) => {
      sessions.start(name);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                slidesDir: 'design/slides',
                snapshotsDir: 'design/screenshots',
                projectRoot: sessions.getProjectRoot(),
                figmaConnected: bridge.isConnected(),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ────────────────────────────────────────────────────────────────────
  // 2. apply_slide
  // ────────────────────────────────────────────────────────────────────
  mcp.tool(
    'apply_slide',
    'Read a DSL XML file, validate it, send it to Figma for rendering, and return the result',
    {
      file: z.string().describe('Path to DSL XML file (absolute or relative to session)'),
      slideId: z.string().optional().describe('Slide ID for updates (auto-generated if omitted)'),
    },
    async ({ file, slideId }) => {
      const resolvedPath = sessions.resolveFilePath(file);

      // Read file
      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [{ type: 'text' as const, text: `Error: File not found: ${resolvedPath}` }],
          isError: true,
        };
      }

      const dsl = fs.readFileSync(resolvedPath, 'utf-8');

      // Validate DSL
      const validation = validateDSL(dsl);
      if (!validation.success) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `DSL validation failed:\n${validation.error}${validation.context ? `\n\nContext:\n${validation.context}` : ''}`,
            },
          ],
          isError: true,
        };
      }

      // Auto-derive slideId from filename if not provided
      const id = slideId || path.basename(file, '.xml');
      slides.track(id, resolvedPath);

      // Send to Figma
      try {
        const result = await bridge.renderSlide(id, dsl);

        slides.updateRender(id, {
          success: result.render.success,
          nodeId: result.render.nodeId,
          error: result.render.error,
        });

        if (result.validation) {
          slides.updateValidation(id, result.validation.errors);
        }

        const response: Record<string, unknown> = {
          slideId: id,
          success: result.render.success,
          nodeId: result.render.nodeId,
        };

        if (result.render.error) {
          response.error = result.render.error;
        }

        if (result.validation && result.validation.errors.length > 0) {
          response.validationErrors = result.validation.errors;
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
          isError: !result.render.success,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        slides.updateRender(id, { success: false, error: message });
        return {
          content: [{ type: 'text' as const, text: `Render failed: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────
  // 3. take_snapshot
  // ────────────────────────────────────────────────────────────────────
  mcp.tool(
    'take_snapshot',
    'Export a PNG screenshot of a rendered slide from Figma',
    {
      slideId: z.string().describe('ID of the slide to snapshot'),
    },
    async ({ slideId }) => {
      try {
        const result = await bridge.takeSnapshot(slideId);

        // Save to design/screenshots/ under project root
        const snapshotsDir = path.join(sessions.getProjectRoot(), 'design', 'screenshots');
        fs.mkdirSync(snapshotsDir, { recursive: true });

        const timestamp = Date.now();
        const savePath = path.join(snapshotsDir, `${slideId}-${timestamp}.png`);

        // Decode and save
        const buffer = Buffer.from(result.imageBase64, 'base64');
        fs.writeFileSync(savePath, buffer);

        const relativePath = sessions.toProjectRelative(savePath);
        log.info(`Snapshot saved: ${relativePath} (${Math.round(buffer.length / 1024)}KB)`);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ slideId, path: relativePath, sizeKB: Math.round(buffer.length / 1024) }, null, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text' as const, text: `Snapshot failed: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────
  // 4. list_slides
  // ────────────────────────────────────────────────────────────────────
  mcp.tool(
    'list_slides',
    'List all applied slides with their render status and validation error counts',
    {},
    async () => {
      const all = slides.getAll();

      if (all.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No slides applied yet.' }],
        };
      }

      const summary = all.map((s) => ({
        slideId: s.slideId,
        file: s.filePath,
        status: s.renderStatus,
        nodeId: s.nodeId,
        validationErrors: s.validationErrors.length,
        lastRendered: s.lastRendered,
      }));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
      };
    },
  );

  // ────────────────────────────────────────────────────────────────────
  // 5. get_validation_errors
  // ────────────────────────────────────────────────────────────────────
  mcp.tool(
    'get_validation_errors',
    'Get validation errors (text-overflow, out-of-bounds, overlap) for slides',
    {
      slideId: z.string().optional().describe('Specific slide ID, or omit for all slides'),
    },
    async ({ slideId }) => {
      const errors = slides.getErrors(slideId);

      if (errors.length === 0) {
        return {
          content: [{ type: 'text' as const, text: slideId ? `No validation errors for ${slideId}.` : 'No validation errors.' }],
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(errors, null, 2) }],
      };
    },
  );

  // ────────────────────────────────────────────────────────────────────
  // 6. get_selection_html
  // ────────────────────────────────────────────────────────────────────
  mcp.tool(
    'get_selection_html',
    'Get the currently selected Figma element(s) as HTML with inline CSS. Select a frame in Figma first, then call this to extract its structure and styles.',
    {},
    async () => {
      try {
        const result = await bridge.getSelectionHtml();

        if (!result.success) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${result.error}` }],
            isError: true,
          };
        }

        return {
          content: [{ type: 'text' as const, text: result.html ?? 'No HTML generated' }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text' as const, text: `Selection HTML failed: ${message}` }],
          isError: true,
        };
      }
    },
  );

  return mcp;
}
