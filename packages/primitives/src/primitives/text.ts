/**
 * Text primitive - for all text content
 * Maps to Figma's TextNode
 */

import type { HexColor, Paint } from '../colors.js';
import type { TextAlign, TextAlignVertical } from '../layout.js';
import type { StrokeValue } from '../stroke.js';
import type { BaseNode } from './base.js';

/**
 * Font weight - can be numeric or named
 */
export type FontWeight =
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 'thin'
  | 'extralight'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold'
  | 'black';

/**
 * Font style
 */
export type FontStyle = 'normal' | 'italic';

/**
 * Text decoration
 */
export type TextDecoration = 'none' | 'underline' | 'strikethrough';

/**
 * Text case transformation
 */
export type TextCase = 'original' | 'uppercase' | 'lowercase' | 'title';

/**
 * How text should resize
 */
export type TextAutoResize =
  | 'none'
  | 'width-and-height'
  | 'height'
  | 'truncate';

/**
 * Line height can be:
 * - Number: explicit pixel value
 * - String with %: percentage of font size (e.g., "150%")
 * - "auto": Figma's auto line height
 */
export type LineHeight = number | `${number}%` | 'auto';

/**
 * Letter spacing in pixels or percentage
 */
export type LetterSpacing = number | `${number}%`;

/**
 * Text-specific properties
 */
export interface TextProps {
  // ═══════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════

  /** The text content - can also be specified as children */
  text?: string;

  /** Alternative: text as children (for XML compatibility) */
  children?: string;

  // ═══════════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════

  /** Font family name */
  fontFamily?: string;

  /** Font size in pixels */
  fontSize?: number;

  /** Font weight */
  fontWeight?: FontWeight;

  /** Font style (normal/italic) */
  fontStyle?: FontStyle;

  /** Line height */
  lineHeight?: LineHeight;

  /** Letter spacing */
  letterSpacing?: LetterSpacing;

  /** Paragraph spacing (space after paragraphs) */
  paragraphSpacing?: number;

  /** Paragraph indentation */
  paragraphIndent?: number;

  // ═══════════════════════════════════════════════════════════
  // ALIGNMENT & LAYOUT
  // ═══════════════════════════════════════════════════════════

  /** Horizontal text alignment */
  textAlign?: TextAlign;

  /** Vertical text alignment (within text box) */
  textAlignVertical?: TextAlignVertical;

  /** How the text box should resize */
  textAutoResize?: TextAutoResize;

  /** Maximum lines before truncation (when textAutoResize is "truncate") */
  maxLines?: number;

  // ═══════════════════════════════════════════════════════════
  // DECORATION & TRANSFORMS
  // ═══════════════════════════════════════════════════════════

  /** Text decoration */
  textDecoration?: TextDecoration;

  /** Text case transformation */
  textCase?: TextCase;

  // ═══════════════════════════════════════════════════════════
  // FILLS & STROKES
  // ═══════════════════════════════════════════════════════════

  /** Text color - shorthand for solid fill */
  fill?: HexColor;

  /** Multiple fills (overrides fill) */
  fills?: Paint[];

  /** Text stroke */
  stroke?: StrokeValue;

  /** Stroke weight */
  strokeWeight?: number;
}

/**
 * Text primitive definition
 */
export interface Text extends BaseNode, TextProps {
  type: 'text';
}

/**
 * Create a Text node with defaults
 */
export function createText(
  content: string,
  props: Partial<Omit<Text, 'type' | 'text'>> = {},
): Text {
  return {
    type: 'text',
    text: content,
    visible: true,
    opacity: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    textAlign: 'left',
    textAlignVertical: 'top',
    textAutoResize: 'width-and-height',
    fill: '#000000',
    ...props,
  };
}

/**
 * Normalize font weight to numeric value
 */
export function normalizeFontWeight(weight: FontWeight): number {
  if (typeof weight === 'number') return weight;

  const map: Record<string, number> = {
    thin: 100,
    extralight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };

  return map[weight] ?? 400;
}

/**
 * Parse line height to pixels given a font size
 */
export function parseLineHeight(
  lineHeight: LineHeight,
  fontSize: number,
): number | null {
  if (lineHeight === 'auto') return null;
  if (typeof lineHeight === 'number') return lineHeight;

  // Parse percentage
  const match = lineHeight.match(/^([\d.]+)%$/);
  if (match) {
    return (Number.parseFloat(match[1]) / 100) * fontSize;
  }

  return null;
}
