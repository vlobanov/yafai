import { getIcon, prepareIconSvg } from './icon-registry.js';

interface ResolveResult {
  resolvedDsl: string;
  errors: string[];
}

/**
 * Extract an attribute value from an Icon tag string.
 * Handles: name="check", size={24}, color="#fff"
 */
function extractAttr(tag: string, attr: string): string | undefined {
  // Brace form: attr={value} or attr={number}
  const braceRe = new RegExp(`${attr}=\\{([^}]+)\\}`);
  const braceMatch = tag.match(braceRe);
  if (braceMatch) return braceMatch[1].trim();

  // Quoted form: attr="value"
  const quotedRe = new RegExp(`${attr}="([^"]+)"`);
  const quotedMatch = tag.match(quotedRe);
  if (quotedMatch) return quotedMatch[1];

  return undefined;
}

/**
 * Resolve all `<Icon ... />` tags in DSL to `<Vector ... />` tags
 * with embedded SVGs from the Lucide icon library.
 *
 * Expects self-closing tags: `<Icon name="check" size={24} color="#2A9D8F" />`
 *
 * Attributes:
 * - name (required): kebab-case Lucide icon name
 * - size: pixel size (default 24)
 * - color: stroke color (default "currentColor")
 * - strokeWidth: override stroke width (default 2)
 * - id: preserved on the output Vector
 *
 * Any other attributes (e.g. opacity) are passed through to the Vector tag.
 */
export function resolveIconsInDSL(dsl: string): ResolveResult {
  const errors: string[] = [];

  // Match self-closing <Icon ... /> tags
  const iconTagRe = /<Icon\s+([^>]*?)\/>/g;

  const resolvedDsl = dsl.replace(iconTagRe, (fullMatch) => {
    const name = extractAttr(fullMatch, 'name');
    if (!name) {
      errors.push(`<Icon> tag missing required "name" attribute: ${fullMatch}`);
      return fullMatch;
    }

    const svg = getIcon(name);
    if (!svg) {
      errors.push(`Unknown icon name "${name}". Use search_icons to find valid names.`);
      return fullMatch;
    }

    const size = Number(extractAttr(fullMatch, 'size')) || 24;
    const color = extractAttr(fullMatch, 'color') || 'currentColor';
    const strokeWidth = extractAttr(fullMatch, 'strokeWidth');
    const id = extractAttr(fullMatch, 'id');

    const preparedSvg = prepareIconSvg(
      svg,
      color,
      size,
      strokeWidth ? Number(strokeWidth) : undefined,
    );

    // Build Vector attributes
    const vectorAttrs: string[] = [];
    if (id) vectorAttrs.push(`id="${id}"`);
    vectorAttrs.push(`svg={${preparedSvg}}`);
    vectorAttrs.push(`width={${size}}`);
    vectorAttrs.push(`height={${size}}`);

    return `<Vector ${vectorAttrs.join(' ')} />`;
  });

  return { resolvedDsl, errors };
}
