/**
 * Group primitive - for non-layout grouping of nodes
 * Maps to Figma's GroupNode
 *
 * Unlike Frame, Group does not:
 * - Have its own fills/strokes
 * - Support auto-layout
 * - Clip content
 *
 * Groups are useful for:
 * - Organizing related elements
 * - Applying transforms/effects to multiple nodes
 * - Creating reusable symbol-like structures
 */

import type { BaseProps, PositionProps } from './base.js';

/**
 * Group primitive definition
 * Groups have no unique properties - they derive bounds from children
 */
export interface Group extends BaseProps, PositionProps {
  type: 'group';

  /** Child nodes - required for groups */
  children: AnyPrimitive[];
}

// Forward reference - will be properly typed in index
type AnyPrimitive = unknown;

/**
 * Create a Group with defaults
 */
export function createGroup(
  children: AnyPrimitive[],
  props: Partial<Omit<Group, 'type' | 'children'>> = {},
): Group {
  return {
    type: 'group',
    visible: true,
    opacity: 1,
    children,
    ...props,
  };
}
