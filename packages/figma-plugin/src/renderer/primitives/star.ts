/**
 * Star primitive renderer
 */

import type { Star } from '@yafai/primitives';
import { fillsFromColor } from '../colors.js';
import type { RenderContext } from '../types.js';

export async function renderStar(
  star: Star,
  _ctx: RenderContext,
): Promise<StarNode> {
  const node = figma.createStar();

  if (star.name || star.id) node.name = (star.name || star.id)!;
  if (star.visible !== undefined) node.visible = star.visible;
  if (star.opacity !== undefined) node.opacity = star.opacity;
  if (star.locked !== undefined) node.locked = star.locked;

  if (star.x !== undefined) node.x = star.x;
  if (star.y !== undefined) node.y = star.y;
  if (star.rotation !== undefined) node.rotation = star.rotation;

  const width = typeof star.width === 'number' ? star.width : 100;
  const height = typeof star.height === 'number' ? star.height : 100;
  node.resize(width, height);

  if (star.pointCount !== undefined) node.pointCount = star.pointCount;
  if (star.innerRadius !== undefined) node.innerRadius = star.innerRadius;

  if (star.cornerRadius !== undefined) {
    if (typeof star.cornerRadius === 'number') {
      node.cornerRadius = star.cornerRadius;
    }
  }

  if (star.fill) {
    node.fills = fillsFromColor(star.fill);
  }

  if (star.stroke) {
    const strokeColor =
      typeof star.stroke === 'string' ? star.stroke : (star.stroke as any).color;
    const weight =
      typeof star.stroke === 'string'
        ? (star.strokeWeight ?? 1)
        : (star.stroke as any).weight;
    if (strokeColor) {
      node.strokes = fillsFromColor(strokeColor);
      node.strokeWeight = weight;
    }
  }

  return node;
}
