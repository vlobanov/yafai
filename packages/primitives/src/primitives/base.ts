/**
 * Base properties shared by all primitives
 * Maps to Figma's BaseNodeMixin and related mixins
 */

import type { Effect } from '../effects.js';
import type { Constraints } from '../layout.js';

/**
 * All primitive types
 */
export type PrimitiveType =
  | 'frame'
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'vector'
  | 'group'
  | 'image';

/**
 * Base properties for all scene nodes
 */
export interface BaseProps {
  /** Unique identifier for the node */
  id?: string;

  /** Human-readable name (shown in Figma layers panel) */
  name?: string;

  /** Whether the node is visible */
  visible?: boolean;

  /** Whether the node is locked */
  locked?: boolean;

  /** Opacity from 0 to 1 */
  opacity?: number;

  /** Blend mode */
  blendMode?: BlendMode;

  /** Effects (shadows, blurs) */
  effects?: Effect[];
}

/**
 * Positional properties - for absolute positioning
 */
export interface PositionProps {
  /** X position relative to parent */
  x?: number;

  /** Y position relative to parent */
  y?: number;

  /** Rotation in degrees */
  rotation?: number;
}

/**
 * Size properties
 */
export interface SizeProps {
  /** Width in pixels (or "fill" / "hug" in auto-layout) */
  width?: number | 'fill' | 'hug';

  /** Height in pixels (or "fill" / "hug" in auto-layout) */
  height?: number | 'fill' | 'hug';

  /** Minimum width constraint */
  minWidth?: number;

  /** Maximum width constraint */
  maxWidth?: number;

  /** Minimum height constraint */
  minHeight?: number;

  /** Maximum height constraint */
  maxHeight?: number;
}

/**
 * Constraint properties for positioning relative to parent
 */
export interface ConstraintProps {
  constraints?: Constraints;
}

/**
 * Blend modes matching Figma's BlendMode enum
 */
export type BlendMode =
  | 'normal'
  | 'darken'
  | 'multiply'
  | 'color-burn'
  | 'lighten'
  | 'screen'
  | 'color-dodge'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

/**
 * Combined layout props for any positionable node
 */
export interface LayoutProps
  extends PositionProps,
    SizeProps,
    ConstraintProps {}

/**
 * Base node interface combining all common properties
 */
export interface BaseNode extends BaseProps, LayoutProps {
  type: PrimitiveType;
}
