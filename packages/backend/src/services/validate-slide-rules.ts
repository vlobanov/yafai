import type { Primitive } from '@yafai/primitives';

interface SlideRuleViolation {
  nodeId: string | undefined;
  rule: string;
  message: string;
  fix: string;
}

/**
 * Check if a color string is exactly white (#FFF or #FFFFFF).
 */
function isWhiteFill(color: string): boolean {
  const c = color.trim().toLowerCase();
  return c === '#fff' || c === '#ffffff';
}

function getChildren(node: Primitive): Primitive[] {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children as Primitive[];
  }
  return [];
}

/**
 * Validate design rules on a parsed DSL tree.
 * Returns an array of violations. Empty array = all good.
 *
 * Rules checked:
 * 1. No gap={0} on auto-layout frames (use a real value)
 * 2. No white/near-white fill on frames (usually unintentional)
 * 3. No fixed pixel width/height on inner auto-layout frames (root is exempt)
 * 4. No empty spacer frames (use gap instead)
 */
export function validateSlideRules(root: Primitive): SlideRuleViolation[] {
  const violations: SlideRuleViolation[] = [];

  function check(node: Primitive, isRoot: boolean): void {
    if (node.type !== 'frame') {
      return;
    }

    const frame = node as Primitive & {
      layoutMode?: string;
      gap?: number;
      fill?: string;
      width?: number | string;
      height?: number | string;
      children?: Primitive[];
    };

    const hasAutoLayout = frame.layoutMode && frame.layoutMode !== 'none';

    // Rule 1: gap={0} on auto-layout frames
    if (hasAutoLayout && frame.gap === 0) {
      violations.push({
        nodeId: frame.id,
        rule: 'no-zero-gap',
        message: `Frame "${frame.id || '(no id)'}" has gap={0}. Elements will be crammed together with no spacing.`,
        fix: 'Use a real gap value: gap={8}, gap={16}, gap={24}, gap={32}, or gap={48}.',
      });
    }

    // Rule 2: white fill on frames (root exempt — slide canvas background is fine)
    if (!isRoot && frame.fill && isWhiteFill(frame.fill)) {
      violations.push({
        nodeId: frame.id,
        rule: 'no-white-fill',
        message: `Frame "${frame.id || '(no id)'}" has fill="${frame.fill}". White fills are almost always unnecessary — layout frames should be transparent.`,
        fix: 'Remove the fill attribute. Only use fill on intentional cards/containers with visible background colors (e.g., fill="#F8F8F8").',
      });
    }

    // Rule 3: fixed pixel width/height on inner auto-layout frames (root exempt)
    if (!isRoot && hasAutoLayout) {
      const hasFixedWidth = typeof frame.width === 'number' && frame.width !== 1920;
      const hasFixedHeight = typeof frame.height === 'number' && frame.height !== 1080;

      if (hasFixedWidth || hasFixedHeight) {
        const dims = [];
        if (hasFixedWidth) dims.push(`width={${frame.width}}`);
        if (hasFixedHeight) dims.push(`height={${frame.height}}`);

        violations.push({
          nodeId: frame.id,
          rule: 'no-fixed-inner-size',
          message: `Frame "${frame.id || '(no id)'}" has fixed ${dims.join(' and ')} with auto-layout. This will crop content if it grows.`,
          fix: 'Use width="fill" or width="hug" instead. Fixed dimensions should only be on the root slide frame (1920×1080).',
        });
      }
    }

    // Rule 4: empty spacer frames
    const children = getChildren(node);
    if (children.length === 0 && !hasAutoLayout) {
      const hasOnlySize =
        (typeof frame.width === 'number' || frame.width === 'fill') &&
        (typeof frame.height === 'number');
      const id = (frame.id || '').toLowerCase();

      if (hasOnlySize && (id.includes('spacer') || id.includes('divider') || id.includes('separator'))) {
        violations.push({
          nodeId: frame.id,
          rule: 'no-spacer-frames',
          message: `Frame "${frame.id}" appears to be a spacer. Use gap on the parent frame instead of empty spacer elements.`,
          fix: 'Remove this spacer frame and set an appropriate gap value on its parent.',
        });
      }
    }

    // Recurse into children
    for (const child of children) {
      check(child, false);
    }
  }

  check(root, true);
  return violations;
}

/**
 * Format violations into a readable error string for the agent.
 */
export function formatViolations(violations: SlideRuleViolation[]): string {
  return violations
    .map((v, i) => `${i + 1}. [${v.rule}] ${v.message}\n   Fix: ${v.fix}`)
    .join('\n\n');
}
