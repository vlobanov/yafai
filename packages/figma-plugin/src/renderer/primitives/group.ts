/**
 * Group primitive renderer
 *
 * Creates Figma GroupNode from Group primitive
 */

import type { Group, Primitive } from '@yafai/primitives';
import { renderPrimitive } from '../render.js';
import type { RenderContext } from '../types.js';

/**
 * Render a Group primitive to Figma
 */
export async function renderGroup(
  group: Group,
  ctx: RenderContext,
): Promise<GroupNode | null> {
  // First render all children
  const childNodes: SceneNode[] = [];

  for (const child of group.children) {
    const childNode = await renderPrimitive(child as Primitive, ctx);
    if (childNode) {
      childNodes.push(childNode);
    }
  }

  // Groups need at least one child
  if (childNodes.length === 0) {
    ctx.warnings.push({
      type: 'invalid-property',
      message: 'Group has no valid children',
      nodeId: group.id,
    });
    return null;
  }

  // Create the group from children
  const node = figma.group(childNodes, figma.currentPage);

  // Apply properties
  if (group.name || group.id) node.name = (group.name || group.id)!;
  if (group.visible !== undefined) node.visible = group.visible;
  if (group.opacity !== undefined) node.opacity = group.opacity;
  if (group.locked !== undefined) node.locked = group.locked;

  // Position - groups derive their position from children,
  // but we can offset them
  if (group.x !== undefined || group.y !== undefined) {
    const offsetX = (group.x ?? 0) - node.x;
    const offsetY = (group.y ?? 0) - node.y;

    if (offsetX !== 0 || offsetY !== 0) {
      node.x += offsetX;
      node.y += offsetY;
    }
  }

  return node;
}
