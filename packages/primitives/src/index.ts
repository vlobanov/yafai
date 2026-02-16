/**
 * @yafai/primitives
 *
 * Core primitive definitions for Yafai AI pitch deck system.
 *
 * This package defines:
 * - Primitive types (Frame, Text, Rectangle, etc.)
 * - Design tokens (colors, typography, spacing)
 * - Schemas for validation and documentation
 *
 * Used by both:
 * - Figma plugin (rendering primitives to Figma nodes)
 * - AI agent (generating DSL output)
 */

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

export * from './primitives/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export * from './colors.js';
export * from './effects.js';
export * from './layout.js';
export * from './stroke.js';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════

export * from './tokens.js';

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export * from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════════════════════════

export * from './parser.js';
