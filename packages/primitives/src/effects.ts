/**
 * Effect definitions (shadows, blurs)
 * Maps to Figma's Effect types
 */

import type { HexColor, RGBAColor } from './colors.js';

/** Drop shadow effect */
export interface DropShadow {
  type: 'drop-shadow';
  color: HexColor | RGBAColor;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread?: number;
  visible?: boolean;
}

/** Inner shadow effect */
export interface InnerShadow {
  type: 'inner-shadow';
  color: HexColor | RGBAColor;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread?: number;
  visible?: boolean;
}

/** Layer blur effect */
export interface LayerBlur {
  type: 'layer-blur';
  radius: number;
  visible?: boolean;
}

/** Background blur effect */
export interface BackgroundBlur {
  type: 'background-blur';
  radius: number;
  visible?: boolean;
}

export type Effect = DropShadow | InnerShadow | LayerBlur | BackgroundBlur;

/**
 * Common shadow presets for convenience
 */
export const ShadowPresets = {
  sm: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.05 },
    offsetX: 0,
    offsetY: 1,
    blur: 2,
    spread: 0,
  },
  md: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offsetX: 0,
    offsetY: 4,
    blur: 6,
    spread: -1,
  },
  lg: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offsetX: 0,
    offsetY: 10,
    blur: 15,
    spread: -3,
  },
  xl: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offsetX: 0,
    offsetY: 20,
    blur: 25,
    spread: -5,
  },
} as const;
