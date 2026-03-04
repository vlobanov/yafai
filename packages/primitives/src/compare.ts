/**
 * Primitive tree comparator — recursively diffs two Primitive trees.
 * Returns a list of differences with JSON paths.
 */

import type { Primitive } from './primitives/index.js';

export interface DiffEntry {
  path: string;
  expected: unknown;
  actual: unknown;
}

/**
 * Compare two primitive trees and return differences.
 * Ignores undefined values (treats missing and undefined as equal).
 */
export function comparePrimitives(a: Primitive, b: Primitive): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  compareValues(a, b, '', diffs);
  return diffs;
}

function compareValues(
  a: unknown,
  b: unknown,
  path: string,
  diffs: DiffEntry[],
): void {
  // Both undefined/null — equal
  if (a == null && b == null) return;

  // One is null/undefined, the other isn't
  if (a == null || b == null) {
    diffs.push({ path, expected: a, actual: b });
    return;
  }

  // Different types
  if (typeof a !== typeof b) {
    diffs.push({ path, expected: a, actual: b });
    return;
  }

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    if (a.length !== b.length) {
      diffs.push({ path: `${path}.length`, expected: a.length, actual: b.length });
    }
    for (let i = 0; i < maxLen; i++) {
      compareValues(a[i], b[i], `${path}[${i}]`, diffs);
    }
    return;
  }

  // Objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

    for (const key of allKeys) {
      const aVal = aObj[key];
      const bVal = bObj[key];

      // Skip if both are undefined
      if (aVal === undefined && bVal === undefined) continue;

      const childPath = path ? `${path}.${key}` : key;
      compareValues(aVal, bVal, childPath, diffs);
    }
    return;
  }

  // Primitives (string, number, boolean)
  if (a !== b) {
    diffs.push({ path, expected: a, actual: b });
  }
}
