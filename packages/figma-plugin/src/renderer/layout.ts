/**
 * Layout conversion utilities for Figma
 *
 * Converts our layout types to Figma's auto-layout properties
 */

import type {
  CounterAxisAlign,
  Frame,
  LayoutMode,
  LayoutSizing,
  PrimaryAxisAlign,
} from '@yafai/primitives';
import { normalizePadding } from '@yafai/primitives';

/**
 * Convert layout mode to Figma
 */
export function layoutModeToFigma(
  mode: LayoutMode | undefined,
): 'NONE' | 'HORIZONTAL' | 'VERTICAL' {
  switch (mode) {
    case 'horizontal':
      return 'HORIZONTAL';
    case 'vertical':
      return 'VERTICAL';
    default:
      return 'NONE';
  }
}

/**
 * Convert primary axis alignment to Figma
 */
export function primaryAxisAlignToFigma(
  align: PrimaryAxisAlign | undefined,
): 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' {
  switch (align) {
    case 'center':
      return 'CENTER';
    case 'end':
      return 'MAX';
    case 'space-between':
      return 'SPACE_BETWEEN';
    default:
      return 'MIN';
  }
}

/**
 * Convert counter axis alignment to Figma
 */
export function counterAxisAlignToFigma(
  align: CounterAxisAlign | undefined,
): 'MIN' | 'CENTER' | 'MAX' | 'BASELINE' {
  switch (align) {
    case 'center':
      return 'CENTER';
    case 'end':
      return 'MAX';
    case 'baseline':
      return 'BASELINE';
    default:
      return 'MIN';
  }
}

/**
 * Convert sizing mode to Figma
 */
export function sizingToFigma(
  sizing: LayoutSizing | undefined,
): 'FIXED' | 'HUG' | 'FILL' {
  switch (sizing) {
    case 'hug':
      return 'HUG';
    case 'fill':
      return 'FILL';
    default:
      return 'FIXED';
  }
}

/**
 * Apply auto-layout properties to a Figma frame
 */
export function applyAutoLayout(node: FrameNode, frame: Frame): void {
  const layoutMode = layoutModeToFigma(frame.layoutMode);

  if (layoutMode === 'NONE') {
    node.layoutMode = 'NONE';
    return;
  }

  // Enable auto-layout (Figma will auto-switch sizing modes to AUTO/hug)
  node.layoutMode = layoutMode;

  // Gap / item spacing
  node.itemSpacing = frame.gap ?? frame.itemSpacing ?? 0;

  // Padding
  if (frame.padding !== undefined) {
    const pad = normalizePadding(frame.padding);
    node.paddingTop = pad.top;
    node.paddingRight = pad.right;
    node.paddingBottom = pad.bottom;
    node.paddingLeft = pad.left;
  }

  // Individual padding overrides
  if (frame.paddingTop !== undefined) node.paddingTop = frame.paddingTop;
  if (frame.paddingRight !== undefined) node.paddingRight = frame.paddingRight;
  if (frame.paddingBottom !== undefined)
    node.paddingBottom = frame.paddingBottom;
  if (frame.paddingLeft !== undefined) node.paddingLeft = frame.paddingLeft;

  // Alignment
  node.primaryAxisAlignItems = primaryAxisAlignToFigma(frame.primaryAxisAlign);
  node.counterAxisAlignItems = counterAxisAlignToFigma(frame.counterAxisAlign);

  // Sizing
  if (frame.primaryAxisSizing) {
    node.primaryAxisSizingMode =
      frame.primaryAxisSizing === 'hug' ? 'AUTO' : 'FIXED';
  }
  if (frame.counterAxisSizing) {
    node.counterAxisSizingMode =
      frame.counterAxisSizing === 'hug' ? 'AUTO' : 'FIXED';
  }

  // Wrap
  if (frame.layoutWrap === 'wrap') {
    node.layoutWrap = 'WRAP';
  }
}

/**
 * Apply size to a node, handling "fill" and "hug" values
 *
 * Note: layoutSizing (fill/hug) can only be applied AFTER a node is
 * appended to an auto-layout parent. Use applyLayoutSizing separately.
 */
export function applySize(
  node: SceneNode & { resize: (w: number, h: number) => void },
  width: number | 'fill' | 'hug' | undefined,
  height: number | 'fill' | 'hug' | undefined,
  defaultWidth = 100,
  defaultHeight = 100,
): void {
  const w = typeof width === 'number' ? width : defaultWidth;
  const h = typeof height === 'number' ? height : defaultHeight;

  node.resize(w, h);
}

/**
 * Apply layout sizing (fill/hug) to a node.
 * Must be called AFTER the node is appended to an auto-layout parent.
 */
export function applyLayoutSizing(
  node: SceneNode,
  width: number | 'fill' | 'hug' | undefined,
  height: number | 'fill' | 'hug' | undefined,
): void {
  // layoutSizing can only be set on nodes that are children of auto-layout frames
  // Check if we're in an auto-layout context
  if (!('layoutSizingHorizontal' in node)) {
    return;
  }

  const parent = node.parent;
  const isInAutoLayout =
    parent &&
    'layoutMode' in parent &&
    (parent as FrameNode).layoutMode !== 'NONE';

  if (!isInAutoLayout) {
    return;
  }

  try {
    if (width === 'fill') {
      (node as FrameNode).layoutSizingHorizontal = 'FILL';
    } else if (width === 'hug' || width === undefined) {
      // Default to HUG when no width specified — prevents 100px default
      (node as FrameNode).layoutSizingHorizontal = 'HUG';
    }

    if (height === 'fill') {
      (node as FrameNode).layoutSizingVertical = 'FILL';
    } else if (height === 'hug' || height === undefined) {
      // Default to HUG when no height specified — prevents 100px default
      (node as FrameNode).layoutSizingVertical = 'HUG';
    }
  } catch (e) {
    // Ignore errors if node isn't in proper auto-layout context
    console.warn('Could not apply layout sizing:', e);
  }
}
