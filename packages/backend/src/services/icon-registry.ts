import * as allIcons from 'lucide-static';

/**
 * Converts PascalCase to kebab-case: "ArrowUpRight" → "arrow-up-right"
 */
function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** kebab-case name → SVG string */
const iconMap = new Map<string, string>();

/** All available kebab-case icon names (for search) */
const iconNames: string[] = [];

// Build the lookup map once at import time
for (const [pascal, svg] of Object.entries(allIcons)) {
  if (typeof svg !== 'string') continue;
  const kebab = toKebab(pascal);
  iconMap.set(kebab, svg);
  iconNames.push(kebab);
}

/**
 * Look up an icon SVG by kebab-case name.
 * Returns undefined if not found.
 */
export function getIcon(name: string): string | undefined {
  return iconMap.get(name);
}

/**
 * Search icons by keyword. Scoring: exact > prefix > segment > substring.
 */
export function searchIcons(query: string, limit = 20): string[] {
  const q = query.toLowerCase();

  const exact: string[] = [];
  const prefix: string[] = [];
  const segment: string[] = [];
  const substring: string[] = [];

  for (const name of iconNames) {
    if (name === q) {
      exact.push(name);
    } else if (name.startsWith(q)) {
      prefix.push(name);
    } else if (name.includes(`-${q}`) || name.includes(`${q}-`)) {
      segment.push(name);
    } else if (name.includes(q)) {
      substring.push(name);
    }
  }

  return [...exact, ...prefix, ...segment, ...substring].slice(0, limit);
}

/**
 * Prepare an icon SVG for embedding: set size, replace currentColor, optional stroke-width.
 */
export function prepareIconSvg(
  svg: string,
  color: string,
  size: number,
  strokeWidth?: number,
): string {
  let result = svg;

  // Replace size attributes
  result = result.replace(/width="24"/g, `width="${size}"`);
  result = result.replace(/height="24"/g, `height="${size}"`);

  // Replace currentColor with the specified color
  result = result.replace(/currentColor/g, color);

  // Optionally override stroke-width
  if (strokeWidth !== undefined) {
    result = result.replace(/stroke-width="2"/g, `stroke-width="${strokeWidth}"`);
  }

  // Collapse to single line for clean embedding (preserve spaces between attributes)
  result = result.replace(/\n\s*/g, ' ').replace(/> </g, '><').trim();

  return result;
}

/**
 * Total number of available icons.
 */
export const iconCount = iconNames.length;
