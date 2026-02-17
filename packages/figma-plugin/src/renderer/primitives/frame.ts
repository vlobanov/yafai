/**
 * Frame primitive renderer
 *
 * Creates Figma FrameNode from Frame primitive
 */

import type { Frame, Primitive } from '@yafai/primitives';
import { fillsFromColor } from '../colors.js';
import { effectsToFigma } from '../effects.js';
import { applyAutoLayout, applyLayoutSizing, applySize } from '../layout.js';
import { renderPrimitive } from '../render.js';
import type { RenderContext } from '../types.js';

/**
 * Get sizing values from a primitive for layout sizing application
 */
function getSizing(primitive: Primitive): {
  width?: number | 'fill' | 'hug';
  height?: number | 'fill' | 'hug';
} {
  if ('width' in primitive || 'height' in primitive) {
    return {
      width: (primitive as { width?: number | 'fill' | 'hug' }).width,
      height: (primitive as { height?: number | 'fill' | 'hug' }).height,
    };
  }
  return {};
}

/**
 * Render a Frame primitive to Figma
 */
export async function renderFrame(
  frame: Frame,
  ctx: RenderContext,
): Promise<FrameNode> {
  // Create the frame node
  const node = figma.createFrame();

  // Basic properties
  if (frame.name) node.name = frame.name;
  if (frame.visible !== undefined) node.visible = frame.visible;
  if (frame.opacity !== undefined) node.opacity = frame.opacity;
  if (frame.locked !== undefined) node.locked = frame.locked;

  // Position
  if (frame.x !== undefined) node.x = frame.x;
  if (frame.y !== undefined) node.y = frame.y;
  if (frame.rotation !== undefined) node.rotation = frame.rotation;

  // Size (basic resize, layout sizing applied later if needed)
  applySize(
    node,
    frame.width,
    frame.height,
    100, // default width
    100, // default height
  );

  // Fills — Figma defaults new frames to white, so we must explicitly
  // clear fills when none are specified to make frames transparent.
  if (frame.fill) {
    node.fills = fillsFromColor(frame.fill);
  } else if (frame.fills) {
    // Handle multiple fills - convert from primitive format
    const { primitiveToFigmaPaint } = await import('../colors.js');
    node.fills = frame.fills.map(primitiveToFigmaPaint);
  } else {
    node.fills = [];
  }

  // Stroke
  if (frame.stroke) {
    const strokeColor =
      typeof frame.stroke === 'string' ? frame.stroke : frame.stroke.color;
    const strokeWeight =
      typeof frame.stroke === 'string'
        ? (frame.strokeWeight ?? 1)
        : frame.stroke.weight;

    if (strokeColor) {
      node.strokes = fillsFromColor(strokeColor as string);
      node.strokeWeight = strokeWeight;
    }
  }

  // Corner radius
  if (frame.cornerRadius !== undefined) {
    if (typeof frame.cornerRadius === 'number') {
      node.cornerRadius = frame.cornerRadius;
    } else {
      // Per-corner radius
      node.topLeftRadius = frame.cornerRadius[0];
      node.topRightRadius = frame.cornerRadius[1];
      node.bottomRightRadius = frame.cornerRadius[2];
      node.bottomLeftRadius = frame.cornerRadius[3];
    }
  }

  // Corner smoothing (iOS-style)
  if (frame.cornerSmoothing !== undefined) {
    node.cornerSmoothing = frame.cornerSmoothing;
  }

  // Auto-layout MUST be applied before children so children can use fill/hug
  applyAutoLayout(node, frame);

  // Clipping
  if (frame.clipsContent !== undefined) {
    node.clipsContent = frame.clipsContent;
  }

  // Effects
  if (frame.effects && frame.effects.length > 0) {
    node.effects = effectsToFigma(frame.effects);
  }

  // Blend mode
  if (frame.blendMode) {
    node.blendMode = frame.blendMode
      .toUpperCase()
      .replace(/-/g, '_') as BlendMode;
  }

  // Render children - collect sizing info to apply after appending
  if (frame.children && frame.children.length > 0) {
    const isAutoLayout = frame.layoutMode && frame.layoutMode !== 'none';

    for (const child of frame.children) {
      const childPrimitive = child as Primitive;
      const childNode = await renderPrimitive(childPrimitive, ctx);
      if (childNode) {
        // First append to parent (required for layoutSizing to work)
        node.appendChild(childNode);

        // Then apply layout sizing if parent is auto-layout
        if (isAutoLayout) {
          const sizing = getSizing(childPrimitive);
          applyLayoutSizing(childNode, sizing.width, sizing.height);
        }
      }
    }
  }

  return node;
}
