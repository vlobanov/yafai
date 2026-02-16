/**
 * Color representation types
 * Supports hex strings, RGBA objects, and gradient definitions
 */

/** Hex color string (e.g., "#ffffff" or "#fff") */
export type HexColor = string;

/** RGBA color with values 0-1 */
export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Gradient stop */
export interface GradientStop {
  position: number; // 0-1
  color: HexColor | RGBAColor;
}

/** Linear gradient definition */
export interface LinearGradient {
  type: 'linear';
  angle: number; // degrees, 0 = top to bottom
  stops: GradientStop[];
}

/** Radial gradient definition */
export interface RadialGradient {
  type: 'radial';
  centerX: number; // 0-1, relative to element
  centerY: number; // 0-1, relative to element
  radius: number; // 0-1, relative to element size
  stops: GradientStop[];
}

export type Gradient = LinearGradient | RadialGradient;

/** Any color value */
export type Color = HexColor | RGBAColor | Gradient;

/** Paint type - can be solid, gradient, or image */
export interface SolidPaint {
  type: 'solid';
  color: HexColor | RGBAColor;
  opacity?: number; // 0-1
}

export interface GradientPaint {
  type: 'gradient';
  gradient: Gradient;
  opacity?: number;
}

export interface ImagePaint {
  type: 'image';
  imageRef: string; // Reference to image asset
  scaleMode: 'fill' | 'fit' | 'crop' | 'tile';
  opacity?: number;
}

export type Paint = SolidPaint | GradientPaint | ImagePaint;

/**
 * Helper to convert hex to RGBA
 */
export function hexToRGBA(hex: HexColor): RGBAColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Try 3-character hex
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (short) {
      return {
        r: Number.parseInt(short[1] + short[1], 16) / 255,
        g: Number.parseInt(short[2] + short[2], 16) / 255,
        b: Number.parseInt(short[3] + short[3], 16) / 255,
        a: 1,
      };
    }
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: Number.parseInt(result[1], 16) / 255,
    g: Number.parseInt(result[2], 16) / 255,
    b: Number.parseInt(result[3], 16) / 255,
    a: 1,
  };
}
