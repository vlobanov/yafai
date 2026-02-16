/**
 * Frame primitive - the primary container type
 * Maps to Figma's FrameNode
 *
 * Frames support:
 * - Auto-layout (flexbox-like)
 * - Fills and strokes
 * - Corner radius
 * - Clipping
 * - Effects
 */

import type { HexColor, Paint } from '../colors.js';
import type {
  CounterAxisAlign,
  LayoutMode,
  LayoutSizing,
  Overflow,
  PaddingValue,
  PrimaryAxisAlign,
} from '../layout.js';
import type { StrokeValue } from '../stroke.js';
import type { BaseNode } from './base.js';

/**
 * Corner radius can be:
 * - Single number: all corners
 * - Four numbers: [topLeft, topRight, bottomRight, bottomLeft]
 */
export type CornerRadius = number | [number, number, number, number];

/**
 * Frame-specific properties
 */
export interface FrameProps {
  // ═══════════════════════════════════════════════════════════
  // FILLS & STROKES
  // ═══════════════════════════════════════════════════════════

  /** Background fill - shorthand for solid color */
  fill?: HexColor;

  /** Multiple fills (overrides fill if specified) */
  fills?: Paint[];

  /** Stroke - shorthand for single stroke */
  stroke?: StrokeValue;

  /** Stroke weight (when using stroke shorthand) */
  strokeWeight?: number;

  // ═══════════════════════════════════════════════════════════
  // CORNER RADIUS
  // ═══════════════════════════════════════════════════════════

  /** Corner radius - all corners or [TL, TR, BR, BL] */
  cornerRadius?: CornerRadius;

  /** Whether to smooth corners (iOS-style) */
  cornerSmoothing?: number; // 0-1

  // ═══════════════════════════════════════════════════════════
  // AUTO-LAYOUT (Flexbox-like)
  // ═══════════════════════════════════════════════════════════

  /** Layout mode: horizontal, vertical, or none */
  layoutMode?: LayoutMode;

  /** Gap between children (itemSpacing in Figma) */
  gap?: number;

  /** Alternative name for gap (matches Figma API) */
  itemSpacing?: number;

  /** Padding - single value, [v, h], [t, r, b, l], or object */
  padding?: PaddingValue;

  /** Individual padding values (override padding) */
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  /** Primary axis alignment (main axis - justify-content) */
  primaryAxisAlign?: PrimaryAxisAlign;

  /** Counter axis alignment (cross axis - align-items) */
  counterAxisAlign?: CounterAxisAlign;

  /** How this frame sizes on primary axis */
  primaryAxisSizing?: LayoutSizing;

  /** How this frame sizes on counter axis */
  counterAxisSizing?: LayoutSizing;

  /** Whether to wrap children (Figma's "Wrap" feature) */
  layoutWrap?: 'no-wrap' | 'wrap';

  // ═══════════════════════════════════════════════════════════
  // CLIPPING & OVERFLOW
  // ═══════════════════════════════════════════════════════════

  /** Whether to clip content that overflows */
  clipsContent?: boolean;

  /** Overflow behavior */
  overflow?: Overflow;
}

/**
 * Frame primitive definition
 */
export interface Frame extends BaseNode, FrameProps {
  type: 'frame';

  /** Child nodes */
  children?: AnyPrimitive[];
}

// Forward reference - will be properly typed in index
type AnyPrimitive = unknown;

/**
 * Create a Frame with defaults
 */
export function createFrame(props: Partial<Omit<Frame, 'type'>> = {}): Frame {
  return {
    type: 'frame',
    visible: true,
    opacity: 1,
    layoutMode: 'none',
    clipsContent: true,
    ...props,
  };
}

/**
 * Helper to check if layout mode is auto-layout
 */
export function isAutoLayout(frame: Frame): boolean {
  return frame.layoutMode !== undefined && frame.layoutMode !== 'none';
}
