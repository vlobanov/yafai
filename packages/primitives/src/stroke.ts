/**
 * Stroke-related types
 * Maps to Figma's stroke properties
 */

import type { HexColor, Paint, RGBAColor } from './colors.js';

/** Stroke alignment relative to the path */
export type StrokeAlign = 'inside' | 'outside' | 'center';

/** Stroke line cap style */
export type StrokeCap = 'none' | 'round' | 'square';

/** Stroke line join style */
export type StrokeJoin = 'miter' | 'bevel' | 'round';

/** Full stroke definition */
export interface Stroke {
  /** Stroke color - shorthand for solid paint */
  color?: HexColor | RGBAColor;

  /** Full paint definition (overrides color if both specified) */
  paint?: Paint;

  /** Stroke width in pixels */
  weight: number;

  /** Stroke alignment */
  align?: StrokeAlign;

  /** Line cap style */
  cap?: StrokeCap;

  /** Line join style */
  join?: StrokeJoin;

  /** Miter limit for miter joins */
  miterLimit?: number;

  /** Dash pattern: [dashLength, gapLength, ...] */
  dashPattern?: number[];
}

/**
 * Shorthand stroke value - can be just a color string or full definition
 */
export type StrokeValue = HexColor | Stroke;

/**
 * Normalize stroke value to full Stroke object
 */
export function normalizeStroke(
  stroke: StrokeValue,
  defaultWeight = 1,
): Stroke {
  if (typeof stroke === 'string') {
    return {
      color: stroke,
      weight: defaultWeight,
      align: 'center',
    };
  }
  return {
    align: 'center',
    ...stroke,
  };
}
