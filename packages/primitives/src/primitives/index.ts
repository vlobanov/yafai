/**
 * Primitives index - exports all primitive types
 */

export * from './base.js';
export * from './frame.js';
export * from './group.js';
export * from './shapes.js';
export * from './text.js';

// Re-import for union type
import type { Frame } from './frame.js';
import type { Group } from './group.js';
import type { Ellipse, Image, Rectangle, Vector } from './shapes.js';
import type { Text } from './text.js';

/**
 * Union of all primitive types
 */
export type Primitive =
  | Frame
  | Text
  | Rectangle
  | Ellipse
  | Vector
  | Image
  | Group;

/**
 * Primitives that can contain children
 */
export type ContainerPrimitive = Frame | Group;

/**
 * Type guard for Frame
 */
export function isFrame(node: Primitive): node is Frame {
  return node.type === 'frame';
}

/**
 * Type guard for Text
 */
export function isText(node: Primitive): node is Text {
  return node.type === 'text';
}

/**
 * Type guard for container primitives
 */
export function isContainer(node: Primitive): node is ContainerPrimitive {
  return node.type === 'frame' || node.type === 'group';
}

/**
 * Type guard for shapes
 */
export function isShape(node: Primitive): node is Rectangle | Ellipse | Vector {
  return (
    node.type === 'rectangle' ||
    node.type === 'ellipse' ||
    node.type === 'vector'
  );
}
