import { tool } from '@langchain/core/tools';
import {
  collectNodeIds,
  deleteNodeById,
  findNodeById,
  mergePrimitiveUpdates,
  replaceNodeById,
  serializeDSL,
  updateNodeById,
  validateDSL,
} from '@yafai/primitives';
import { z } from 'zod';
import { preprocessDSL } from '../../services/preprocess-dsl.js';
import { resolveIconsInDSL } from '../../services/resolve-icons.js';
import { slideStore } from '../../services/slide-store.js';
import { formatViolations, validateSlideRules } from '../../services/validate-slide-rules.js';

export const updateNodeTool = tool(
  async ({ slideId, nodeId, operation, updates, replacement }) => {
    // Get the slide
    const slide = slideStore.getSlide(slideId);
    if (!slide) {
      return JSON.stringify({
        success: false,
        error: `Slide ${slideId} not found`,
      });
    }

    // Parse the current DSL
    const parseResult = validateDSL(slide.snapshot);
    if (!parseResult.success || !parseResult.primitive) {
      return JSON.stringify({
        success: false,
        error: 'Failed to parse current slide DSL',
        details: parseResult.error,
      });
    }

    let root = parseResult.primitive;

    // Find the target node
    const targetNode = findNodeById(root, nodeId);
    if (!targetNode) {
      const existingIds = collectNodeIds(root);
      return JSON.stringify({
        success: false,
        error: `Node with id "${nodeId}" not found in slide`,
        availableIds: existingIds,
        hint: `Available node IDs: ${existingIds.join(', ')}`,
      });
    }

    // Perform the operation
    switch (operation) {
      case 'update': {
        if (!updates) {
          return JSON.stringify({
            success: false,
            error: 'Missing "updates" parameter for update operation',
            hint: 'Provide an object with the properties to update, e.g., { "text": "New text", "fill": "#ff0000" }',
          });
        }

        // Parse updates if it's a string (JSON)
        let parsedUpdates: Record<string, unknown>;
        if (typeof updates === 'string') {
          try {
            parsedUpdates = JSON.parse(updates);
          } catch {
            return JSON.stringify({
              success: false,
              error: 'Invalid JSON in updates parameter',
              hint: 'Updates must be a valid JSON object',
            });
          }
        } else {
          parsedUpdates = updates as Record<string, unknown>;
        }

        // Merge updates into the node
        const updatedNode = mergePrimitiveUpdates(targetNode, parsedUpdates);
        root = updateNodeById(root, nodeId, updatedNode);
        break;
      }

      case 'replace': {
        if (!replacement) {
          return JSON.stringify({
            success: false,
            error: 'Missing "replacement" parameter for replace operation',
            hint: 'Provide DSL XML for the replacement node',
          });
        }

        // Auto-fix and resolve icons in replacement DSL
        const preprocessedReplacement = preprocessDSL(replacement);
        const { resolvedDsl: resolvedReplacement, errors: iconErrors } =
          resolveIconsInDSL(preprocessedReplacement);
        if (iconErrors.length > 0) {
          return JSON.stringify({
            success: false,
            error: 'Icon resolution failed in replacement DSL',
            details: iconErrors.join('; '),
            hint: 'Use search_icons to find valid icon names.',
          });
        }

        // Parse the replacement DSL
        const replaceResult = validateDSL(resolvedReplacement);
        if (!replaceResult.success || !replaceResult.primitive) {
          return JSON.stringify({
            success: false,
            error: 'Invalid replacement DSL',
            details: replaceResult.error,
            line: replaceResult.line,
            column: replaceResult.column,
            context: replaceResult.context,
          });
        }

        // Validate slide design rules on replacement subtree
        const violations = validateSlideRules(replaceResult.primitive);
        if (violations.length > 0) {
          return JSON.stringify({
            success: false,
            error: 'Replacement DSL violates slide design rules',
            details: formatViolations(violations),
            hint: 'Fix the issues listed above and try again.',
          });
        }

        root = replaceNodeById(root, nodeId, replaceResult.primitive);
        break;
      }

      case 'delete': {
        const newRoot = deleteNodeById(root, nodeId);
        if (!newRoot) {
          return JSON.stringify({
            success: false,
            error: 'Cannot delete the root node',
            hint: 'Use update_slide to replace the entire slide instead',
          });
        }
        root = newRoot;
        break;
      }

      default:
        return JSON.stringify({
          success: false,
          error: `Unknown operation: ${operation}`,
          hint: 'Valid operations are: update, replace, delete',
        });
    }

    // Serialize the updated tree back to DSL
    const newDsl = serializeDSL(root);

    // Update the slide
    slideStore.updateSlide(slideId, { snapshot: newDsl });

    const nodeIds = collectNodeIds(root);

    return JSON.stringify({
      success: true,
      slideId,
      nodeId,
      operation,
      nodeIds,
      message: `Successfully ${operation}d node "${nodeId}" in slide ${slideId}`,
      newDsl, // Include the new DSL so agent can see the result
    });
  },
  {
    name: 'update_node',
    description: `Surgically update a specific node in an existing slide by its ID. This is more efficient than replacing the entire slide.

Operations:
- "update": Merge property updates into an existing node (e.g., change text, color, size)
- "replace": Replace a node entirely with new DSL
- "delete": Remove a node from the slide

Examples:
1. Update text content:
   { slideId: "...", nodeId: "title", operation: "update", updates: { "text": "New Title" } }

2. Change fill color:
   { slideId: "...", nodeId: "card-bg", operation: "update", updates: { "fill": "#2563eb" } }

3. Replace a section:
   { slideId: "...", nodeId: "stats-row", operation: "replace", replacement: "<Frame id=\\"stats-row\\" ...>...</Frame>" }

4. Delete a node:
   { slideId: "...", nodeId: "unused-element", operation: "delete" }`,
    schema: z.object({
      slideId: z.string().describe('The ID of the slide containing the node'),
      nodeId: z
        .string()
        .describe('The ID of the node to update (from the DSL id attribute)'),
      operation: z
        .enum(['update', 'replace', 'delete'])
        .describe(
          'The operation to perform: update (merge properties), replace (swap entire node), or delete',
        ),
      updates: z
        .record(z.unknown())
        .optional()
        .describe(
          'For "update" operation: object of properties to merge (e.g., { "text": "New text", "fill": "#000" })',
        ),
      replacement: z
        .string()
        .optional()
        .describe(
          'For "replace" operation: DSL XML string for the replacement node',
        ),
    }),
  },
);
