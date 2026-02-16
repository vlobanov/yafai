/**
 * Text primitive renderer
 *
 * Creates Figma TextNode from Text primitive
 */

import type { Text } from '@yafai/primitives';
import { normalizeFontWeight } from '@yafai/primitives';
import { fillsFromColor } from '../colors.js';
import { effectsToFigma } from '../effects.js';
import type { RenderContext } from '../types.js';

/**
 * Font weight name mapping for Figma font loading
 */
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
 * Load a font if not already loaded
 * Returns the actual style that was loaded (may differ if fallback was used)
 */
async function ensureFont(
  family: string,
  weight: number,
  italic: boolean,
  ctx: RenderContext,
): Promise<string> {
  const weightStyle = FONT_WEIGHT_STYLES[weight] ?? 'Regular';
  const style = italic ? `${weightStyle} Italic` : weightStyle;
  const fontKey = `${family}:${style}`;

  if (ctx.loadedFonts.has(fontKey)) {
    return style;
  }

  try {
    await figma.loadFontAsync({ family, style });
    ctx.loadedFonts.add(fontKey);
    return style;
  } catch {
    // Try falling back to regular style for this family
    try {
      await figma.loadFontAsync({ family, style: 'Regular' });
      ctx.loadedFonts.add(`${family}:Regular`);
      ctx.warnings.push({
        type: 'font-fallback',
        message: `Font style "${family} ${style}" not available, using Regular`,
      });
      return 'Regular';
    } catch {
      // Fall back to Inter Regular (always available in Figma)
      ctx.warnings.push({
        type: 'missing-font',
        message: `Could not load font: ${family}, falling back to Inter`,
      });
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      ctx.loadedFonts.add('Inter:Regular');
      return 'Regular';
    }
  }
}

/**
 * Render a Text primitive to Figma
 */
export async function renderText(
  text: Text,
  ctx: RenderContext,
): Promise<TextNode> {
  // Create the text node
  const node = figma.createText();

  // Determine font properties
  const fontFamily = text.fontFamily ?? 'Inter';
  const fontWeight =
    typeof text.fontWeight === 'number'
      ? text.fontWeight
      : text.fontWeight
        ? normalizeFontWeight(text.fontWeight)
        : 400;
  const isItalic = text.fontStyle === 'italic';

  // Load the font FIRST before any text operations
  // ensureFont returns the actual style loaded (may be fallback)
  const loadedStyle = await ensureFont(fontFamily, fontWeight, isItalic, ctx);

  // Determine if we need to fall back the family too
  const actualFamily = ctx.loadedFonts.has(`${fontFamily}:${loadedStyle}`)
    ? fontFamily
    : 'Inter';

  // Set fontName BEFORE setting characters (required by Figma API)
  node.fontName = { family: actualFamily, style: loadedStyle };

  // Now set the text content
  const content = text.text ?? text.children ?? '';
  node.characters = content;

  // Basic properties
  if (text.name) node.name = text.name;
  if (text.visible !== undefined) node.visible = text.visible;
  if (text.opacity !== undefined) node.opacity = text.opacity;

  // Position
  if (text.x !== undefined) node.x = text.x;
  if (text.y !== undefined) node.y = text.y;
  if (text.rotation !== undefined) node.rotation = text.rotation;

  // Font size (fontName already set above before characters)
  if (text.fontSize !== undefined) {
    node.fontSize = text.fontSize;
  }

  // Line height
  if (text.lineHeight !== undefined) {
    if (text.lineHeight === 'auto') {
      node.lineHeight = { unit: 'AUTO' };
    } else if (typeof text.lineHeight === 'number') {
      node.lineHeight = { value: text.lineHeight, unit: 'PIXELS' };
    } else {
      // Percentage string like "150%"
      const match = text.lineHeight.match(/^([\d.]+)%$/);
      if (match) {
        node.lineHeight = {
          value: Number.parseFloat(match[1]),
          unit: 'PERCENT',
        };
      }
    }
  }

  // Letter spacing
  if (text.letterSpacing !== undefined) {
    if (typeof text.letterSpacing === 'number') {
      node.letterSpacing = { value: text.letterSpacing, unit: 'PIXELS' };
    } else {
      // Percentage string
      const match = text.letterSpacing.match(/^([\d.]+)%$/);
      if (match) {
        node.letterSpacing = {
          value: Number.parseFloat(match[1]),
          unit: 'PERCENT',
        };
      }
    }
  }

  // Paragraph spacing
  if (text.paragraphSpacing !== undefined) {
    node.paragraphSpacing = text.paragraphSpacing;
  }

  // Text alignment
  if (text.textAlign) {
    const alignMap: Record<string, TextNode['textAlignHorizontal']> = {
      left: 'LEFT',
      center: 'CENTER',
      right: 'RIGHT',
      justified: 'JUSTIFIED',
    };
    node.textAlignHorizontal = alignMap[text.textAlign] ?? 'LEFT';
  }

  if (text.textAlignVertical) {
    const alignMap: Record<string, TextNode['textAlignVertical']> = {
      top: 'TOP',
      center: 'CENTER',
      bottom: 'BOTTOM',
    };
    node.textAlignVertical = alignMap[text.textAlignVertical] ?? 'TOP';
  }

  // Auto resize
  if (text.textAutoResize) {
    const resizeMap: Record<string, TextNode['textAutoResize']> = {
      none: 'NONE',
      'width-and-height': 'WIDTH_AND_HEIGHT',
      height: 'HEIGHT',
      truncate: 'TRUNCATE',
    };
    node.textAutoResize = resizeMap[text.textAutoResize] ?? 'WIDTH_AND_HEIGHT';
  }

  // Size (for fixed-size text)
  if (typeof text.width === 'number' && typeof text.height === 'number') {
    node.resize(text.width, text.height);
  } else if (typeof text.width === 'number') {
    node.resize(text.width, node.height);
  }

  // Text decoration
  if (text.textDecoration) {
    const decorationMap: Record<string, TextDecoration> = {
      none: 'NONE',
      underline: 'UNDERLINE',
      strikethrough: 'STRIKETHROUGH',
    };
    node.textDecoration = decorationMap[text.textDecoration] ?? 'NONE';
  }

  // Text case
  if (text.textCase) {
    const caseMap: Record<string, TextCase> = {
      original: 'ORIGINAL',
      uppercase: 'UPPER',
      lowercase: 'LOWER',
      title: 'TITLE',
    };
    node.textCase = caseMap[text.textCase] ?? 'ORIGINAL';
  }

  // Fill (text color)
  if (text.fill) {
    node.fills = fillsFromColor(text.fill);
  }

  // Effects
  if (text.effects && text.effects.length > 0) {
    node.effects = effectsToFigma(text.effects);
  }

  return node;
}
