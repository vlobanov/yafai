/**
 * Effect conversion utilities for Figma
 *
 * Converts our effect types to Figma's Effect format
 */

import type { Effect as PrimitiveEffect } from '@yafai/primitives';
import { colorToFigmaRGB, getColorOpacity } from './colors.js';

/**
 * Convert primitive effects to Figma effects
 */
export function effectsToFigma(effects: PrimitiveEffect[]): Effect[] {
  return effects.map(effectToFigma);
}

/**
 * Convert a single effect to Figma format
 */
function effectToFigma(effect: PrimitiveEffect): Effect {
  switch (effect.type) {
    case 'drop-shadow':
      return {
        type: 'DROP_SHADOW',
        color: {
          ...colorToFigmaRGB(effect.color),
          a: getColorOpacity(effect.color),
        },
        offset: { x: effect.offsetX, y: effect.offsetY },
        radius: effect.blur,
        spread: effect.spread ?? 0,
        visible: effect.visible ?? true,
        blendMode: 'NORMAL',
      };

    case 'inner-shadow':
      return {
        type: 'INNER_SHADOW',
        color: {
          ...colorToFigmaRGB(effect.color),
          a: getColorOpacity(effect.color),
        },
        offset: { x: effect.offsetX, y: effect.offsetY },
        radius: effect.blur,
        spread: effect.spread ?? 0,
        visible: effect.visible ?? true,
        blendMode: 'NORMAL',
      };

    case 'layer-blur':
      return {
        type: 'LAYER_BLUR',
        radius: effect.radius,
        visible: effect.visible ?? true,
      };

    case 'background-blur':
      return {
        type: 'BACKGROUND_BLUR',
        radius: effect.radius,
        visible: effect.visible ?? true,
      };
  }
}
