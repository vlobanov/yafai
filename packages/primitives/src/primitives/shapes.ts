/**
 * Shape primitives - Rectangle, Ellipse, Vector
 * Maps to Figma's RectangleNode, EllipseNode, VectorNode
 */

import type { HexColor, Paint } from '../colors.js';
import type { StrokeValue } from '../stroke.js';
import type { BaseNode } from './base.js';
import type { CornerRadius } from './frame.js';

/**
 * Common properties for all shapes
 */
export interface ShapeProps {
  /** Fill color - shorthand for solid paint */
  fill?: HexColor;

  /** Multiple fills */
  fills?: Paint[];

  /** Stroke */
  stroke?: StrokeValue;

  /** Stroke weight */
  strokeWeight?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// RECTANGLE
// ═══════════════════════════════════════════════════════════════════════════

export interface RectangleProps extends ShapeProps {
  /** Corner radius - all corners or [TL, TR, BR, BL] */
  cornerRadius?: CornerRadius;

  /** Corner smoothing (iOS-style corners) */
  cornerSmoothing?: number;
}

export interface Rectangle extends BaseNode, RectangleProps {
  type: 'rectangle';
}

export function createRectangle(
  props: Partial<Omit<Rectangle, 'type'>> = {},
): Rectangle {
  return {
    type: 'rectangle',
    visible: true,
    opacity: 1,
    ...props,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ELLIPSE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Arc data for partial ellipses (pie charts, etc.)
 */
export interface ArcData {
  /** Start angle in radians */
  startAngle: number;

  /** End angle in radians */
  endAngle: number;

  /** Inner radius ratio (0-1) for donuts */
  innerRadius?: number;
}

export interface EllipseProps extends ShapeProps {
  /** Arc data for partial ellipses */
  arcData?: ArcData;
}

export interface Ellipse extends BaseNode, EllipseProps {
  type: 'ellipse';
}

export function createEllipse(
  props: Partial<Omit<Ellipse, 'type'>> = {},
): Ellipse {
  return {
    type: 'ellipse',
    visible: true,
    opacity: 1,
    ...props,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VECTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vector node - for SVG paths and complex shapes
 */
export interface VectorProps extends ShapeProps {
  /** SVG path data (d attribute) */
  path?: string;

  /** Full SVG content (for complex vectors) */
  svg?: string;

  /** Winding rule for fills */
  windingRule?: 'nonzero' | 'evenodd';
}

export interface Vector extends BaseNode, VectorProps {
  type: 'vector';
}

export function createVector(
  props: Partial<Omit<Vector, 'type'>> = {},
): Vector {
  return {
    type: 'vector',
    visible: true,
    opacity: 1,
    windingRule: 'nonzero',
    ...props,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Image scale modes
 */
export type ImageScaleMode = 'fill' | 'fit' | 'crop' | 'tile';

export interface ImageProps {
  /** Reference to image asset */
  imageRef?: string;

  /** URL to image (will be fetched and uploaded) */
  src?: string;

  /** How to scale the image within bounds */
  scaleMode?: ImageScaleMode;

  /** Corner radius */
  cornerRadius?: CornerRadius;
}

export interface Image extends BaseNode, ImageProps {
  type: 'image';
}

export function createImage(props: Partial<Omit<Image, 'type'>> = {}): Image {
  return {
    type: 'image',
    visible: true,
    opacity: 1,
    scaleMode: 'fill',
    ...props,
  };
}
