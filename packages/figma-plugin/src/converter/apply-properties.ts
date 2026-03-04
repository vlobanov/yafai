/**
 * Apply DSL property values directly to a live Figma node.
 *
 * Used by the update_node MCP tool for surgical property updates
 * without re-rendering the whole slide.
 */

import { normalizePadding, normalizeFontWeight } from '@yafai/primitives';
import { fillsFromColor, primitiveToFigmaPaint } from '../renderer/colors.js';
import { effectsToFigma } from '../renderer/effects.js';
import {
  layoutModeToFigma,
  primaryAxisAlignToFigma,
  counterAxisAlignToFigma,
} from '../renderer/layout.js';

const FONT_WEIGHT_STYLES: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

/**
 * Apply a dictionary of DSL properties to a live Figma node.
 * Returns the list of property keys that were successfully applied.
 */
export async function applyDSLProperties(
  node: SceneNode,
  properties: Record<string, unknown>,
): Promise<string[]> {
  const applied: string[] = [];

  for (const [key, value] of Object.entries(properties)) {
    try {
      await applyProperty(node, key, value);
      applied.push(key);
    } catch (err) {
      console.warn(`[applyDSLProperties] Failed to apply "${key}":`, err);
    }
  }

  return applied;
}

async function applyProperty(
  node: SceneNode,
  key: string,
  value: unknown,
): Promise<void> {
  const n = node as any;

  switch (key) {
    // ── Fills ────────────────────────────────────────────────────────
    case 'fill':
      n.fills = fillsFromColor(value as string);
      break;

    case 'fills':
      n.fills = (value as any[]).map(primitiveToFigmaPaint);
      break;

    // ── Opacity / Visibility ────────────────────────────────────────
    case 'opacity':
      n.opacity = value as number;
      break;

    case 'visible':
      n.visible = value as boolean;
      break;

    // ── Size ─────────────────────────────────────────────────────────
    case 'width':
      if (typeof value === 'number') {
        n.resize(value, n.height);
      } else if (value === 'fill' && 'layoutSizingHorizontal' in n) {
        n.layoutSizingHorizontal = 'FILL';
      } else if (value === 'hug' && 'layoutSizingHorizontal' in n) {
        n.layoutSizingHorizontal = 'HUG';
      }
      break;

    case 'height':
      if (typeof value === 'number') {
        n.resize(n.width, value);
      } else if (value === 'fill' && 'layoutSizingVertical' in n) {
        n.layoutSizingVertical = 'FILL';
      } else if (value === 'hug' && 'layoutSizingVertical' in n) {
        n.layoutSizingVertical = 'HUG';
      }
      break;

    // ── Position ─────────────────────────────────────────────────────
    case 'x':
      n.x = value as number;
      break;

    case 'y':
      n.y = value as number;
      break;

    case 'rotation':
      n.rotation = value as number;
      break;

    // ── Corner Radius ────────────────────────────────────────────────
    case 'cornerRadius':
      if (typeof value === 'number') {
        n.cornerRadius = value;
      } else if (Array.isArray(value) && value.length === 4) {
        n.topLeftRadius = value[0];
        n.topRightRadius = value[1];
        n.bottomRightRadius = value[2];
        n.bottomLeftRadius = value[3];
      }
      break;

    // ── Stroke ───────────────────────────────────────────────────────
    case 'stroke':
      n.strokes = fillsFromColor(value as string);
      break;

    case 'strokeWeight':
      n.strokeWeight = value as number;
      break;

    case 'strokeTopWeight':
      n.strokeTopWeight = value as number;
      break;

    case 'strokeRightWeight':
      n.strokeRightWeight = value as number;
      break;

    case 'strokeBottomWeight':
      n.strokeBottomWeight = value as number;
      break;

    case 'strokeLeftWeight':
      n.strokeLeftWeight = value as number;
      break;

    // ── Effects ──────────────────────────────────────────────────────
    case 'effects':
      n.effects = effectsToFigma(value as any[]);
      break;

    // ── Meta ─────────────────────────────────────────────────────────
    case 'name':
      n.name = value as string;
      break;

    case 'locked':
      n.locked = value as boolean;
      break;

    case 'blendMode':
      n.blendMode = (value as string).toUpperCase().replace(/-/g, '_');
      break;

    // ── Auto-layout (frame only) ────────────────────────────────────
    case 'gap':
    case 'itemSpacing':
      n.itemSpacing = value as number;
      break;

    case 'padding': {
      const pad = normalizePadding(value as any);
      n.paddingTop = pad.top;
      n.paddingRight = pad.right;
      n.paddingBottom = pad.bottom;
      n.paddingLeft = pad.left;
      break;
    }

    case 'paddingTop':
      n.paddingTop = value as number;
      break;

    case 'paddingRight':
      n.paddingRight = value as number;
      break;

    case 'paddingBottom':
      n.paddingBottom = value as number;
      break;

    case 'paddingLeft':
      n.paddingLeft = value as number;
      break;

    case 'layoutMode':
      n.layoutMode = layoutModeToFigma(value as any);
      break;

    case 'primaryAxisAlign':
      n.primaryAxisAlignItems = primaryAxisAlignToFigma(value as any);
      break;

    case 'counterAxisAlign':
      n.counterAxisAlignItems = counterAxisAlignToFigma(value as any);
      break;

    case 'clipsContent':
      n.clipsContent = value as boolean;
      break;

    // ── Text properties ─────────────────────────────────────────────
    case 'text':
    case 'content':
      if (node.type === 'TEXT') {
        await loadCurrentFont(node as TextNode);
        (node as TextNode).characters = value as string;
      }
      break;

    case 'fontSize':
      if (node.type === 'TEXT') {
        await loadCurrentFont(node as TextNode);
        (node as TextNode).fontSize = value as number;
      }
      break;

    case 'fontWeight':
      if (node.type === 'TEXT') {
        const textNode = node as TextNode;
        const weight = normalizeFontWeight(value as any);
        const family = textNode.fontName !== figma.mixed
          ? (textNode.fontName as FontName).family
          : 'Inter';
        const style = FONT_WEIGHT_STYLES[weight] ?? 'Regular';
        await figma.loadFontAsync({ family, style });
        textNode.fontName = { family, style };
      }
      break;

    case 'fontFamily':
      if (node.type === 'TEXT') {
        const textNode = node as TextNode;
        const currentWeight = textNode.fontName !== figma.mixed
          ? (textNode.fontName as FontName).style
          : 'Regular';
        await figma.loadFontAsync({ family: value as string, style: currentWeight });
        textNode.fontName = { family: value as string, style: currentWeight };
      }
      break;

    case 'textAlign':
    case 'textAlignHorizontal':
      if (node.type === 'TEXT') {
        (node as TextNode).textAlignHorizontal = (value as string).toUpperCase() as TextNode['textAlignHorizontal'];
      }
      break;

    case 'textAlignVertical':
      if (node.type === 'TEXT') {
        (node as TextNode).textAlignVertical = (value as string).toUpperCase() as TextNode['textAlignVertical'];
      }
      break;

    case 'lineHeight':
      if (node.type === 'TEXT') {
        await loadCurrentFont(node as TextNode);
        if (typeof value === 'number') {
          (node as TextNode).lineHeight = { value: value as number, unit: 'PIXELS' };
        } else if (value === 'auto') {
          (node as TextNode).lineHeight = { unit: 'AUTO' };
        }
      }
      break;

    case 'letterSpacing':
      if (node.type === 'TEXT') {
        await loadCurrentFont(node as TextNode);
        (node as TextNode).letterSpacing = { value: value as number, unit: 'PIXELS' };
      }
      break;

    default:
      throw new Error(`Unknown property: ${key}`);
  }
}

/**
 * Load the current font of a text node so we can modify its properties.
 * Figma requires the font to be loaded before changing characters, fontSize, etc.
 */
async function loadCurrentFont(node: TextNode): Promise<void> {
  if (node.fontName === figma.mixed) {
    // Mixed fonts — load all unique fonts used in the node
    const len = node.characters.length;
    const loaded = new Set<string>();
    for (let i = 0; i < len; i++) {
      const font = node.getRangeFontName(i, i + 1) as FontName;
      const key = `${font.family}:${font.style}`;
      if (!loaded.has(key)) {
        await figma.loadFontAsync(font);
        loaded.add(key);
      }
    }
  } else {
    await figma.loadFontAsync(node.fontName as FontName);
  }
}
