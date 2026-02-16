/**
 * Color conversion utilities for Figma
 *
 * Converts our color types to Figma's RGB/RGBA format
 */

import type {
  Gradient,
  HexColor,
  Paint as PrimitivePaint,
  RGBAColor,
} from '@yafai/primitives';

/**
 * Convert hex color to Figma RGB (0-1 range)
 */
export function hexToFigmaRGB(hex: HexColor): RGB {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Handle 3-character hex
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  const r = Number.parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(fullHex.slice(4, 6), 16) / 255;

  return { r, g, b };
}

/**
 * Convert RGBA color to Figma RGB
 */
export function rgbaToFigmaRGB(rgba: RGBAColor): RGB {
  return { r: rgba.r, g: rgba.g, b: rgba.b };
}

/**
 * Convert any color to Figma RGB
 */
export function colorToFigmaRGB(color: HexColor | RGBAColor): RGB {
  if (typeof color === 'string') {
    return hexToFigmaRGB(color);
  }
  return rgbaToFigmaRGB(color);
}

/**
 * Get opacity from a color value
 */
export function getColorOpacity(color: HexColor | RGBAColor): number {
  if (typeof color === 'string') {
    return 1;
  }
  return color.a ?? 1;
}

/**
 * Convert our Paint type to Figma Paint
 */
export function primitiveToFigmaPaint(paint: PrimitivePaint): Paint {
  switch (paint.type) {
    case 'solid':
      return {
        type: 'SOLID',
        color: colorToFigmaRGB(paint.color),
        opacity: paint.opacity ?? getColorOpacity(paint.color),
      };

    case 'gradient':
      return gradientToFigmaPaint(paint.gradient, paint.opacity);

    case 'image':
      // Image paints are handled separately
      return {
        type: 'SOLID',
        color: { r: 0.9, g: 0.9, b: 0.9 },
        opacity: paint.opacity ?? 1,
      };
  }
}

/**
 * Convert gradient to Figma gradient paint
 */
function gradientToFigmaPaint(
  gradient: Gradient,
  opacity?: number,
): GradientPaint {
  const stops: ColorStop[] = gradient.stops.map((stop) => ({
    position: stop.position,
    color: {
      ...colorToFigmaRGB(stop.color),
      a: typeof stop.color === 'object' && 'a' in stop.color ? stop.color.a : 1,
    },
  }));

  if (gradient.type === 'linear') {
    // Convert angle to transform matrix
    const angleRad = (gradient.angle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    return {
      type: 'GRADIENT_LINEAR',
      gradientStops: stops,
      gradientTransform: [
        [cos, sin, 0.5 - cos * 0.5 - sin * 0.5],
        [-sin, cos, 0.5 + sin * 0.5 - cos * 0.5],
      ],
      opacity: opacity ?? 1,
    };
  }

  // Radial gradient
  return {
    type: 'GRADIENT_RADIAL',
    gradientStops: stops,
    gradientTransform: [
      [gradient.radius * 2, 0, gradient.centerX - gradient.radius],
      [0, gradient.radius * 2, gradient.centerY - gradient.radius],
    ],
    opacity: opacity ?? 1,
  };
}

/**
 * Create a solid fill from a hex color
 */
export function solidFill(hex: HexColor, opacity = 1): SolidPaint {
  return {
    type: 'SOLID',
    color: hexToFigmaRGB(hex),
    opacity,
  };
}

/**
 * Create fills array from a single color
 */
export function fillsFromColor(color: HexColor | undefined): Paint[] {
  if (!color) return [];
  return [solidFill(color)];
}
