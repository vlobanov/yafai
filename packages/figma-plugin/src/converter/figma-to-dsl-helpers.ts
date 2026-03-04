/**
 * Figma → DSL value mappers
 *
 * Inverse of the renderer mappings: converts Figma API values to DSL types.
 */

import type {
  BlendMode,
  CounterAxisAlign,
  Effect,
  LayoutMode,
  LetterSpacing,
  LineHeight,
  Overflow,
  Paint,
  PrimaryAxisAlign,
  TextAlign,
  TextAlignVertical,
  TextAutoResize,
  TextCase,
  TextDecoration,
  TextSegment,
  TextSegmentStyle,
} from '@yafai/primitives';
import type { CornerRadius } from '@yafai/primitives';

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

export function figmaLayoutModeToDS(
  mode: string,
): LayoutMode | undefined {
  switch (mode) {
    case 'HORIZONTAL':
      return 'horizontal';
    case 'VERTICAL':
      return 'vertical';
    case 'NONE':
    case 'GRID':
    default:
      return undefined; // omit default
  }
}

export function figmaPrimaryAlignToDS(
  align: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN',
): PrimaryAxisAlign | undefined {
  switch (align) {
    case 'CENTER':
      return 'center';
    case 'MAX':
      return 'end';
    case 'SPACE_BETWEEN':
      return 'space-between';
    case 'MIN':
    default:
      return undefined; // omit default
  }
}

export function figmaCounterAlignToDS(
  align: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE',
): CounterAxisAlign | undefined {
  switch (align) {
    case 'CENTER':
      return 'center';
    case 'MAX':
      return 'end';
    case 'BASELINE':
      return 'baseline';
    case 'MIN':
    default:
      return undefined; // omit default
  }
}

export function figmaSizingToDS(
  sizing: 'FIXED' | 'HUG' | 'FILL',
): 'fixed' | 'hug' | 'fill' {
  switch (sizing) {
    case 'HUG':
      return 'hug';
    case 'FILL':
      return 'fill';
    default:
      return 'fixed';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COLORS & FILLS
// ═══════════════════════════════════════════════════════════════════════════

function figmaRGBToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extract fill(s) from a Figma node → { fill?, fills? }
 * Single solid visible fill → `fill` hex string (keep DSL concise)
 * Multi/gradient/image → `fills` array
 *
 * Accepts Figma's Paint[] (SOLID/GRADIENT_LINEAR/IMAGE) — NOT DSL Paint[].
 */
export function extractFills(
  fillsRaw: any,
): { fill?: string; fills?: Paint[] } {
  if (fillsRaw === figma.mixed || !fillsRaw || fillsRaw.length === 0) {
    return {};
  }

  const visible = (fillsRaw as any[]).filter(
    (p: any) => p.visible !== false,
  );
  if (visible.length === 0) return {};

  // Single solid fill → shorthand (only if fully opaque)
  if (visible.length === 1 && (visible[0] as any).type === 'SOLID') {
    const p = visible[0] as any;
    const hex = figmaRGBToHex(p.color.r, p.color.g, p.color.b);
    const opacity = p.opacity ?? 1;
    if (opacity < 1) {
      // Paint-level opacity → use fills array to preserve it
      return { fills: [{ type: 'solid', color: hex, opacity }] };
    }
    return { fill: hex };
  }

  // Multiple or complex fills → full array
  const fills: Paint[] = visible.map((p: any) => figmaPaintToDS(p));
  return { fills };
}

function figmaPaintToDS(p: any): Paint {
  if (p.type === 'SOLID') {
    const hex = figmaRGBToHex(p.color.r, p.color.g, p.color.b);
    return {
      type: 'solid',
      color: hex,
      opacity: p.opacity ?? 1,
    };
  }
  if (p.type === 'GRADIENT_LINEAR' || p.type === 'GRADIENT_RADIAL') {
    // Simplified gradient conversion
    return {
      type: 'gradient',
      gradient: {
        type: p.type === 'GRADIENT_LINEAR' ? 'linear' : 'radial',
        ...(p.type === 'GRADIENT_LINEAR' ? { angle: 0 } : { centerX: 0.5, centerY: 0.5, radius: 0.5 }),
        stops: (p.gradientStops || []).map((s: any) => {
          const a = s.color.a ?? 1;
          if (a < 1) {
            // Preserve per-stop opacity via RGBA
            return {
              position: s.position,
              color: { r: s.color.r, g: s.color.g, b: s.color.b, a },
            };
          }
          return {
            position: s.position,
            color: figmaRGBToHex(s.color.r, s.color.g, s.color.b),
          };
        }),
      },
      opacity: p.opacity ?? 1,
    } as Paint;
  }
  if (p.type === 'IMAGE') {
    return {
      type: 'image',
      imageRef: p.imageHash || '',
      scaleMode: (p.scaleMode || 'FILL').toLowerCase() as any,
      opacity: p.opacity ?? 1,
    };
  }
  // Fallback
  return { type: 'solid', color: '#000000' };
}

// ═══════════════════════════════════════════════════════════════════════════
// STROKES
// ═══════════════════════════════════════════════════════════════════════════

export function extractStrokes(
  node: SceneNode,
): {
  stroke?: string;
  strokeWeight?: number;
  strokeTopWeight?: number;
  strokeRightWeight?: number;
  strokeBottomWeight?: number;
  strokeLeftWeight?: number;
  strokeAlign?: string;
} {
  if (!('strokes' in node) || !('strokeWeight' in node)) return {};

  const n = node as any;
  const strokes = n.strokes as readonly Paint[];

  if (!strokes || strokes.length === 0) return {};

  const visible = strokes.filter((s: any) => s.visible !== false);
  if (visible.length === 0) return {};

  // Extract stroke color
  let stroke: string | undefined;
  const first = visible[0] as any;
  if (first.type === 'SOLID') {
    stroke = figmaRGBToHex(first.color.r, first.color.g, first.color.b);
  }

  // Check for per-side stroke weights (Figma supports individual side weights)
  const top = n.strokeTopWeight as number | undefined;
  const right = n.strokeRightWeight as number | undefined;
  const bottom = n.strokeBottomWeight as number | undefined;
  const left = n.strokeLeftWeight as number | undefined;
  const weight = n.strokeWeight as number;

  // If all per-side weights are the same (or missing), use uniform strokeWeight
  const hasMixed = (top !== undefined || right !== undefined || bottom !== undefined || left !== undefined) &&
    !(top === weight && right === weight && bottom === weight && left === weight);

  const result: any = {};
  if (stroke) result.stroke = stroke;

  if (hasMixed) {
    // Per-side strokes — emit ALL sides (including 0) so renderer
    // knows to suppress borders on sides that should have none
    if (top !== undefined) result.strokeTopWeight = top;
    if (right !== undefined) result.strokeRightWeight = right;
    if (bottom !== undefined) result.strokeBottomWeight = bottom;
    if (left !== undefined) result.strokeLeftWeight = left;
  } else if (weight > 0) {
    result.strokeWeight = weight;
  }

  // Stroke alignment
  const align = n.strokeAlign as string | undefined;
  if (align && align !== 'INSIDE') {
    result.strokeAlign = align.toLowerCase();
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// EFFECTS
// ═══════════════════════════════════════════════════════════════════════════

export function extractEffects(effects: readonly Effect[]): Effect[] | undefined {
  if (!effects || effects.length === 0) return undefined;

  const visible = effects.filter((e: any) => e.visible !== false);
  if (visible.length === 0) return undefined;

  return visible.map((e: any) => {
    switch (e.type) {
      case 'DROP_SHADOW':
        return {
          type: 'drop-shadow' as const,
          color: figmaRGBToHex(e.color.r, e.color.g, e.color.b),
          offsetX: e.offset?.x ?? 0,
          offsetY: e.offset?.y ?? 0,
          blur: e.radius ?? 0,
          spread: e.spread ?? 0,
        };
      case 'INNER_SHADOW':
        return {
          type: 'inner-shadow' as const,
          color: figmaRGBToHex(e.color.r, e.color.g, e.color.b),
          offsetX: e.offset?.x ?? 0,
          offsetY: e.offset?.y ?? 0,
          blur: e.radius ?? 0,
          spread: e.spread ?? 0,
        };
      case 'LAYER_BLUR':
        return {
          type: 'layer-blur' as const,
          radius: e.radius ?? 0,
        };
      case 'BACKGROUND_BLUR':
        return {
          type: 'background-blur' as const,
          radius: e.radius ?? 0,
        };
      default:
        return {
          type: 'layer-blur' as const,
          radius: 0,
        };
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CORNER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export function extractCornerRadius(
  node: RectangleNode | FrameNode,
): CornerRadius | undefined {
  if (node.cornerRadius !== figma.mixed) {
    return node.cornerRadius > 0 ? node.cornerRadius : undefined;
  }
  // Per-corner
  const tl = node.topLeftRadius;
  const tr = node.topRightRadius;
  const br = node.bottomRightRadius;
  const bl = node.bottomLeftRadius;
  if (tl === 0 && tr === 0 && br === 0 && bl === 0) return undefined;
  return [tl, tr, br, bl];
}

// ═══════════════════════════════════════════════════════════════════════════
// BLEND MODE
// ═══════════════════════════════════════════════════════════════════════════

export function figmaBlendModeToDS(
  mode: string,
): BlendMode | undefined {
  if (mode === 'PASS_THROUGH' || mode === 'NORMAL') return undefined;
  return mode.toLowerCase().replace(/_/g, '-') as BlendMode;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT
// ═══════════════════════════════════════════════════════════════════════════

export function extractLineHeight(
  lh: any,
): LineHeight | undefined {
  if (!lh || lh === figma.mixed) return undefined;
  if (lh.unit === 'AUTO') return undefined; // omit default
  if (lh.unit === 'PERCENT') return `${lh.value}%` as `${number}%`;
  if (lh.unit === 'PIXELS') return lh.value;
  return undefined;
}

export function extractLetterSpacing(
  ls: any,
): LetterSpacing | undefined {
  if (!ls || ls === figma.mixed) return undefined;
  if (ls.unit === 'PERCENT' && ls.value === 0) return undefined;
  if (ls.unit === 'PIXELS' && ls.value === 0) return undefined;
  if (ls.unit === 'PERCENT') return `${ls.value}%` as `${number}%`;
  if (ls.unit === 'PIXELS') return ls.value;
  return undefined;
}

export function figmaTextAlignToDS(
  align: string,
): TextAlign | undefined {
  switch (align) {
    case 'LEFT':
      return undefined; // omit default
    case 'CENTER':
      return 'center';
    case 'RIGHT':
      return 'right';
    case 'JUSTIFIED':
      return 'justified';
    default:
      return undefined;
  }
}

export function figmaTextAlignVerticalToDS(
  align: string,
): TextAlignVertical | undefined {
  switch (align) {
    case 'TOP':
      return undefined; // omit default
    case 'CENTER':
      return 'center';
    case 'BOTTOM':
      return 'bottom';
    default:
      return undefined;
  }
}

export function figmaTextAutoResizeToDS(
  mode: string,
): TextAutoResize | undefined {
  switch (mode) {
    case 'NONE':
      return 'none';
    case 'WIDTH_AND_HEIGHT':
      return undefined; // omit default
    case 'HEIGHT':
      return 'height';
    case 'TRUNCATE':
      return 'truncate';
    default:
      return undefined;
  }
}

export function figmaTextDecorationToDS(
  dec: string | typeof figma.mixed,
): TextDecoration | undefined {
  if (dec === figma.mixed) return undefined;
  switch (dec) {
    case 'UNDERLINE':
      return 'underline';
    case 'STRIKETHROUGH':
      return 'strikethrough';
    case 'NONE':
    default:
      return undefined;
  }
}

export function figmaTextCaseToDS(
  tc: string | typeof figma.mixed,
): TextCase | undefined {
  if (tc === figma.mixed) return undefined;
  switch (tc) {
    case 'UPPER':
      return 'uppercase';
    case 'LOWER':
      return 'lowercase';
    case 'TITLE':
      return 'title';
    case 'ORIGINAL':
    default:
      return undefined;
  }
}

const FIGMA_WEIGHT_MAP: Record<string, number> = {
  Thin: 100,
  ExtraLight: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
  Black: 900,
};

function figmaFontStyleToWeight(styleName: string): number {
  // styleName can be "Bold", "Bold Italic", "Regular", etc.
  const parts = styleName.split(' ');
  for (const part of parts) {
    if (FIGMA_WEIGHT_MAP[part] !== undefined) {
      return FIGMA_WEIGHT_MAP[part];
    }
  }
  return 400;
}

function figmaFontStyleIsItalic(styleName: string): boolean {
  return styleName.toLowerCase().includes('italic');
}

/**
 * Extract text segments for mixed formatting.
 * Groups consecutive characters by style.
 */
export function extractTextSegments(
  node: TextNode,
): TextSegment[] | undefined {
  const len = node.characters.length;
  if (len === 0) return undefined;

  // Check if formatting is uniform (no mixed styles) — skip segments
  const fontName = node.fontName;
  const fontSize = node.fontSize;
  const fills = (node as any).fills;

  if (
    fontName !== figma.mixed &&
    fontSize !== figma.mixed &&
    fills !== figma.mixed
  ) {
    // Uniform — no segments needed
    return undefined;
  }

  // Walk character ranges and group by style
  const segments: TextSegment[] = [];
  let currentStyle: TextSegmentStyle | undefined;
  let currentText = '';

  // Get the "base" style from the node-level properties for comparison
  const baseFontName =
    fontName !== figma.mixed ? fontName : { family: 'Inter', style: 'Regular' };
  const baseFontSize = fontSize !== figma.mixed ? fontSize : 16;

  for (let i = 0; i < len; i++) {
    const charFontName = node.getRangeFontName(i, i + 1) as FontName;
    const charFontSize = node.getRangeFontSize(i, i + 1) as number;
    const charFills = node.getRangeFills(i, i + 1) as SolidPaint[];

    const style: TextSegmentStyle = {};
    let hasOverride = false;

    // Font family
    if (charFontName.family !== baseFontName.family) {
      style.fontFamily = charFontName.family;
      hasOverride = true;
    }

    // Font weight
    const weight = figmaFontStyleToWeight(charFontName.style);
    const baseWeight = figmaFontStyleToWeight(baseFontName.style);
    if (weight !== baseWeight) {
      style.fontWeight = weight as any;
      hasOverride = true;
    }

    // Italic
    const isItalic = figmaFontStyleIsItalic(charFontName.style);
    const baseItalic = figmaFontStyleIsItalic(baseFontName.style);
    if (isItalic !== baseItalic) {
      style.fontStyle = isItalic ? 'italic' : 'normal';
      hasOverride = true;
    }

    // Font size
    if (charFontSize !== baseFontSize) {
      style.fontSize = charFontSize;
      hasOverride = true;
    }

    // Fill color
    if (charFills && charFills.length > 0 && charFills[0]?.type === 'SOLID') {
      const charHex = figmaRGBToHex(
        charFills[0].color.r,
        charFills[0].color.g,
        charFills[0].color.b,
      );
      // Compare to base fill
      const baseFills = fills !== figma.mixed ? fills : [];
      const baseHex =
        baseFills.length > 0 && baseFills[0]?.type === 'SOLID'
          ? figmaRGBToHex(
              baseFills[0].color.r,
              baseFills[0].color.g,
              baseFills[0].color.b,
            )
          : '#000000';
      if (charHex !== baseHex) {
        style.fill = charHex;
        hasOverride = true;
      }
    }

    const segStyle = hasOverride ? style : undefined;
    const styleKey = JSON.stringify(segStyle);
    const prevKey = JSON.stringify(currentStyle);

    if (styleKey === prevKey) {
      currentText += node.characters[i];
    } else {
      if (currentText) {
        segments.push({
          text: currentText,
          style: currentStyle,
        });
      }
      currentText = node.characters[i];
      currentStyle = segStyle;
    }
  }

  // Push final segment
  if (currentText) {
    segments.push({
      text: currentText,
      style: currentStyle,
    });
  }

  // If all segments have no style override, no segments needed
  if (segments.every((s) => !s.style)) {
    return undefined;
  }

  return segments;
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERFLOW
// ═══════════════════════════════════════════════════════════════════════════

export function figmaOverflowToDS(
  scrollBehavior: string,
  clips: boolean,
): Overflow | undefined {
  if (scrollBehavior === 'SCROLL') return 'scroll';
  if (clips) return undefined; // 'hidden' is default for frames
  return 'visible';
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strip undefined and default values to keep DSL concise.
 */
export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}
