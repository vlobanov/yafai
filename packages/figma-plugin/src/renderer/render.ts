/**
 * Main renderer - dispatches to primitive-specific renderers
 */

import type { Primitive } from '@yafai/primitives';
import { renderFrame } from './primitives/frame.js';
import { renderGroup } from './primitives/group.js';
import {
  renderEllipse,
  renderImage,
  renderRectangle,
  renderVector,
} from './primitives/shapes.js';
import { renderText } from './primitives/text.js';
import type { RenderContext, RenderOptions, RenderResult } from './types.js';
import { createRenderContext } from './types.js';

/**
 * Render a primitive to a Figma node
 */
export async function renderPrimitive(
  primitive: Primitive,
  ctx: RenderContext,
): Promise<SceneNode | null> {
  switch (primitive.type) {
    case 'frame':
      return renderFrame(primitive, ctx);

    case 'text':
      return renderText(primitive, ctx);

    case 'rectangle':
      return renderRectangle(primitive, ctx);

    case 'ellipse':
      return renderEllipse(primitive, ctx);

    case 'vector':
      return renderVector(primitive, ctx);

    case 'image':
      return renderImage(primitive, ctx);

    case 'group':
      return renderGroup(primitive, ctx);

    default:
      ctx.warnings.push({
        type: 'unsupported',
        message: `Unknown primitive type: ${(primitive as { type: unknown }).type}`,
      });
      return null;
  }
}

/**
 * Render a primitive tree to Figma
 *
 * This is the main entry point for rendering.
 */
export async function render(
  primitive: Primitive,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const ctx = createRenderContext();

  // Render the primitive tree
  const node = await renderPrimitive(primitive, ctx);

  if (!node) {
    throw new Error('Failed to render primitive - no node created');
  }

  // Apply position offset if specified
  if (options.x !== undefined) node.x = options.x;
  if (options.y !== undefined) node.y = options.y;

  // Add to parent if specified
  if (options.parent) {
    options.parent.appendChild(node);
  }

  // Select if requested
  if (options.select) {
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  }

  return {
    node,
    warnings: ctx.warnings,
  };
}

/**
 * Render multiple primitives
 */
export async function renderAll(
  primitives: Primitive[],
  options: RenderOptions = {},
): Promise<RenderResult[]> {
  const results: RenderResult[] = [];

  for (const primitive of primitives) {
    results.push(await render(primitive, options));
  }

  return results;
}
