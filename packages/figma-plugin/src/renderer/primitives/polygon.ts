/**
 * Polygon primitive renderer
 */

import type { Polygon } from '@yafai/primitives';
import { fillsFromColor } from '../colors.js';
import type { RenderContext } from '../types.js';

export async function renderPolygon(
  polygon: Polygon,
  _ctx: RenderContext,
): Promise<PolygonNode> {
  const node = figma.createPolygon();

  if (polygon.name || polygon.id) node.name = (polygon.name || polygon.id)!;
  if (polygon.visible !== undefined) node.visible = polygon.visible;
  if (polygon.opacity !== undefined) node.opacity = polygon.opacity;
  if (polygon.locked !== undefined) node.locked = polygon.locked;

  if (polygon.x !== undefined) node.x = polygon.x;
  if (polygon.y !== undefined) node.y = polygon.y;
  if (polygon.rotation !== undefined) node.rotation = polygon.rotation;

  const width = typeof polygon.width === 'number' ? polygon.width : 100;
  const height = typeof polygon.height === 'number' ? polygon.height : 100;
  node.resize(width, height);

  if (polygon.pointCount !== undefined) node.pointCount = polygon.pointCount;

  if (polygon.cornerRadius !== undefined) {
    if (typeof polygon.cornerRadius === 'number') {
      node.cornerRadius = polygon.cornerRadius;
    }
  }

  if (polygon.fill) {
    node.fills = fillsFromColor(polygon.fill);
  }

  if (polygon.stroke) {
    const strokeColor =
      typeof polygon.stroke === 'string'
        ? polygon.stroke
        : (polygon.stroke as any).color;
    const weight =
      typeof polygon.stroke === 'string'
        ? (polygon.strokeWeight ?? 1)
        : (polygon.stroke as any).weight;
    if (strokeColor) {
      node.strokes = fillsFromColor(strokeColor);
      node.strokeWeight = weight;
    }
  }

  return node;
}
