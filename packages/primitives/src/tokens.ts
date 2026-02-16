/**
 * Design Tokens - Immutable design system values
 *
 * These tokens ensure consistency across all generated slides.
 * Both the AI agent and Figma plugin use these values.
 *
 * Extracted from Figma designs: 2026-01-21
 */

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS
// ═══════════════════════════════════════════════════════════════════════════

export const Canvas = {
  width: 1920,
  height: 1080,
  aspectRatio: 16 / 9,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SAFE ZONES
// ═══════════════════════════════════════════════════════════════════════════

export const SafeZones = {
  /** Margin from all edges */
  margin: 110,

  /** Y position for slide title/header */
  headerY: 80,

  /** Y position where main content starts */
  contentStartY: 228,

  /** Calculated content area dimensions */
  get contentWidth() {
    return Canvas.width - this.margin * 2;
  },
  get contentHeight() {
    return Canvas.height - this.contentStartY - this.margin;
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

export const Typography = {
  /** Primary font family */
  fontFamily: 'Inter',

  /** Secondary font (used for checkmarks, special symbols) */
  fontFamilyAlt: 'Helvetica',

  scale: {
    /** Hero title - bold, large (cover slides) */
    hero: {
      size: 72,
      weight: 700,
      lineHeight: 1.21,
      letterSpacing: 0,
    },

    /** Display title - LIGHT weight, elegant (slide titles) */
    display: {
      size: 60,
      weight: 300,
      lineHeight: 1.43,
      letterSpacing: -0.017, // -1.7%
    },

    /** H1 - medium weight (responsive/scaled titles) */
    h1: {
      size: 46,
      weight: 500,
      lineHeight: 1.2,
      letterSpacing: 0,
    },

    /** H2 - section headings, card titles */
    h2: {
      size: 24,
      weight: 500,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    /** H3 - subheadings (light weight) */
    h3: {
      size: 24,
      weight: 300,
      lineHeight: 1.31,
      letterSpacing: 0,
    },

    /** Stat - large numbers/metrics */
    stat: {
      size: 54,
      weight: 400,
      lineHeight: 1.0,
      letterSpacing: 0,
    },

    /** Stat label - metric descriptions */
    statLabel: {
      size: 23,
      weight: 400,
      lineHeight: 1.0,
      letterSpacing: 0,
    },

    /** Body large - primary body text */
    bodyLarge: {
      size: 20,
      weight: 400,
      lineHeight: 1.35,
      letterSpacing: 0,
    },

    /** Body large medium - emphasized body text */
    bodyLargeMedium: {
      size: 20,
      weight: 500,
      lineHeight: 1.35,
      letterSpacing: 0,
    },

    /** Body - regular body text */
    body: {
      size: 16,
      weight: 400,
      lineHeight: 1.55,
      letterSpacing: 0,
    },

    /** Body semibold - bold body text */
    bodySemibold: {
      size: 19,
      weight: 600,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    /** Body small - smaller body text */
    bodySmall: {
      size: 15,
      weight: 400,
      lineHeight: 1.4,
      letterSpacing: 0,
    },

    /** Caption - footnotes, small text */
    caption: {
      size: 13,
      weight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    /** Overline - section labels, UPPERCASE */
    overline: {
      size: 12,
      weight: 500,
      lineHeight: 1.5,
      letterSpacing: 0.2, // +20%
      textTransform: 'uppercase' as const,
    },

    /** Overline light - light variant */
    overlineLight: {
      size: 12,
      weight: 300,
      lineHeight: 1.5,
      letterSpacing: 0.2, // +20%
      textTransform: 'uppercase' as const,
    },

    /** Tag - small metadata tags */
    tag: {
      size: 12,
      weight: 400,
      lineHeight: 1.5,
      letterSpacing: 0.05, // +5%
    },

    /** Checkmark - special symbol style (uses fontFamilyAlt) */
    checkmark: {
      size: 20,
      weight: 700,
      lineHeight: 1.5,
      letterSpacing: 0,
      fontFamily: 'Helvetica',
    },
  },
} as const;

export type TypographyScale = keyof typeof Typography.scale;

// ═══════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════

export const Colors = {
  // Core text palette
  primary: '#1D1D1D', // Main text, headings
  primaryAlt: '#1A1A2E', // Alternate primary (darker blue-black)
  secondary: '#444444', // Body text, list items
  tertiary: '#6B7280', // Supporting text
  muted: '#999999', // Labels, placeholders
  subtle: '#9CA3AF', // Very light text

  // Brand accent
  accent: '#DC3C44', // Primary brand red
  accentBlue: '#2563EB', // Blue accent (CTAs, highlights)

  // Semantic colors
  success: '#2A9D8F', // Green (checkmarks, positive)
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red (errors, not brand red)
  info: '#3B82F6', // Blue

  // Surfaces
  background: '#F8F9FB', // Slide background (off-white)
  backgroundWhite: '#FFFFFF', // Pure white
  surface: '#F8F8F8', // Cards, containers
  surfaceAlt: '#F1F5F9', // Alternate surface

  // Borders
  border: '#E8E8E8', // Card borders, dividers
  borderLight: '#F1F5F9', // Light borders

  // Special
  black: '#000000',
  white: '#FFFFFF',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════════════════════════════════════

export const Spacing = {
  /** Base unit (all spacing should be multiples of this) */
  unit: 8,

  /** Allowed spacing values */
  values: [4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 96, 110, 120] as const,

  /** Named spacing shortcuts */
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
  '5xl': 96,
  '6xl': 110,
} as const;

export type SpacingValue = (typeof Spacing.values)[number];

// ═══════════════════════════════════════════════════════════════════════════
// CORNER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════════════════

export const Shadows = {
  sm: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.05 },
    offsetX: 0,
    offsetY: 1,
    blur: 2,
  },
  md: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offsetX: 0,
    offsetY: 4,
    blur: 6,
  },
  lg: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offsetX: 0,
    offsetY: 10,
    blur: 15,
  },
  xl: {
    type: 'drop-shadow' as const,
    color: { r: 0, g: 0, b: 0, a: 0.15 },
    offsetX: 0,
    offsetY: 20,
    blur: 25,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// STROKE STYLES
// ═══════════════════════════════════════════════════════════════════════════

export const Strokes = {
  /** Card section divider (bottom border) */
  divider: {
    color: Colors.border,
    weight: 2,
    position: 'bottom' as const,
  },

  /** Callout left accent border */
  accentLeft: {
    color: Colors.accent,
    weight: 6,
    position: 'left' as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE TOKENS EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const DesignTokens = {
  canvas: Canvas,
  safeZones: SafeZones,
  typography: Typography,
  colors: Colors,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  strokes: Strokes,
} as const;

export type DesignTokens = typeof DesignTokens;
