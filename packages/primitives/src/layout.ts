/**
 * Layout-related types
 * Maps to Figma's Auto Layout properties
 */

/** Layout direction - Figma uses "HORIZONTAL" | "VERTICAL" | "NONE" */
export type LayoutMode = 'horizontal' | 'vertical' | 'none';

/** Primary axis alignment (main axis) */
export type PrimaryAxisAlign = 'start' | 'center' | 'end' | 'space-between';

/** Counter axis alignment (cross axis) */
export type CounterAxisAlign = 'start' | 'center' | 'end' | 'baseline';

/** How children should size themselves */
export type LayoutSizing = 'fixed' | 'hug' | 'fill';

/** Overflow behavior */
export type Overflow = 'visible' | 'hidden' | 'scroll';

/** Text alignment */
export type TextAlign = 'left' | 'center' | 'right' | 'justified';

/** Vertical text alignment */
export type TextAlignVertical = 'top' | 'center' | 'bottom';

/** Constraints for positioning relative to parent */
export interface Constraints {
  horizontal: 'left' | 'right' | 'center' | 'left-right' | 'scale';
  vertical: 'top' | 'bottom' | 'center' | 'top-bottom' | 'scale';
}

/**
 * Padding can be specified as:
 * - Single number: all sides
 * - Two numbers: [vertical, horizontal]
 * - Four numbers: [top, right, bottom, left]
 * - Object: { top, right, bottom, left }
 */
export type PaddingValue =
  | number
  | [number, number]
  | [number, number, number, number]
  | { top?: number; right?: number; bottom?: number; left?: number };

/**
 * Normalize padding to { top, right, bottom, left }
 */
export function normalizePadding(padding: PaddingValue): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  if (Array.isArray(padding)) {
    if (padding.length === 2) {
      return {
        top: padding[0],
        right: padding[1],
        bottom: padding[0],
        left: padding[1],
      };
    }
    return {
      top: padding[0],
      right: padding[1],
      bottom: padding[2],
      left: padding[3],
    };
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}
