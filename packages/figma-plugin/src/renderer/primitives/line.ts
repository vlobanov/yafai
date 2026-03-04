/**
 * Line primitive renderer
 */

import type { Line } from '@yafai/primitives';
import type { RenderContext } from '../types.js';

/**
 * Render a Line primitive to Figma
 */
export async function renderLine(
  line: Line,
  _ctx: RenderContext,
): Promise<LineNode> {
  const node = figma.createLine();

  if (line.name || line.id) node.name = (line.name || line.id)!;
  if (line.visible !== undefined) node.visible = line.visible;
  if (line.opacity !== undefined) node.opacity = line.opacity;
  if (line.locked !== undefined) node.locked = line.locked;

  if (line.x !== undefined) node.x = line.x;
  if (line.y !== undefined) node.y = line.y;
  if (line.rotation !== undefined) node.rotation = line.rotation;

  // Line length is width
  if (typeof line.width === 'number') {
    node.resize(line.width, 0);
  }

  // Stroke
  if (line.stroke) {
    const strokeColor =
      typeof line.stroke === 'string' ? line.stroke : (line.stroke as any).color;
    const weight =
      typeof line.stroke === 'string'
        ? (line.strokeWeight ?? 1)
        : (line.stroke as any).weight;
    if (strokeColor) {
      const { fillsFromColor } = await import('../colors.js');
      node.strokes = fillsFromColor(strokeColor);
      node.strokeWeight = weight;
    }
  }

  return node;
}
