/**
 * BooleanOperation primitive renderer
 */

import type { BooleanOperation, Primitive } from '@yafai/primitives';
import { fillsFromColor } from '../colors.js';
import { renderPrimitive } from '../render.js';
import type { RenderContext } from '../types.js';

const OP_MAP: Record<string, 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE'> =
  {
    union: 'UNION',
    subtract: 'SUBTRACT',
    intersect: 'INTERSECT',
    exclude: 'EXCLUDE',
  };

export async function renderBooleanOperation(
  boolOp: BooleanOperation,
  ctx: RenderContext,
): Promise<BooleanOperationNode | null> {
  // Render children first
  const childNodes: SceneNode[] = [];
  for (const child of boolOp.children || []) {
    const childNode = await renderPrimitive(child as Primitive, ctx);
    if (childNode) childNodes.push(childNode);
  }

  if (childNodes.length < 2) {
    ctx.warnings.push({
      type: 'invalid-property',
      message: 'BooleanOperation requires at least 2 children',
    });
    return childNodes[0] as any ?? null;
  }

  // Flatten into the current page first (required for boolean operations)
  for (const child of childNodes) {
    figma.currentPage.appendChild(child);
  }

  const operation = OP_MAP[boolOp.operation] || 'UNION';
  const node = figma.union(childNodes, figma.currentPage);

  // Figma creates a UNION by default — change operation if needed
  if (operation !== 'UNION') {
    // We need to use the correct method
    // Actually figma.union/subtract/intersect/exclude return BooleanOperationNode
    // Let's recreate with the right method
    node.remove();
    let resultNode: BooleanOperationNode;
    switch (operation) {
      case 'SUBTRACT':
        resultNode = figma.subtract(childNodes, figma.currentPage);
        break;
      case 'INTERSECT':
        resultNode = figma.intersect(childNodes, figma.currentPage);
        break;
      case 'EXCLUDE':
        resultNode = figma.exclude(childNodes, figma.currentPage);
        break;
      default:
        resultNode = figma.union(childNodes, figma.currentPage);
    }

    applyBoolOpProps(resultNode, boolOp);
    return resultNode;
  }

  applyBoolOpProps(node, boolOp);
  return node;
}

function applyBoolOpProps(
  node: BooleanOperationNode,
  boolOp: BooleanOperation,
): void {
  if (boolOp.name || boolOp.id) node.name = (boolOp.name || boolOp.id)!;
  if (boolOp.visible !== undefined) node.visible = boolOp.visible;
  if (boolOp.opacity !== undefined) node.opacity = boolOp.opacity;
  if (boolOp.locked !== undefined) node.locked = boolOp.locked;

  if (boolOp.x !== undefined) node.x = boolOp.x;
  if (boolOp.y !== undefined) node.y = boolOp.y;

  if (boolOp.fill) {
    node.fills = fillsFromColor(boolOp.fill);
  }
}
