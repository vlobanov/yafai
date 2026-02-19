/**
 * Converts Figma SceneNodes to HTML with inline CSS.
 *
 * Uses Figma's built-in getCSSAsync() for style extraction and
 * recursively walks the node tree to produce structured HTML.
 */

const MAX_DEPTH = 20;
const INDENT = '  ';

function indent(depth: number): string {
  return INDENT.repeat(depth);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function cssObjToString(css: Record<string, string>): string {
  return Object.entries(css)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

function rgbToHex(color: RGB, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  if (opacity !== undefined && opacity < 1) {
    return `rgba(${r}, ${g}, ${b}, ${Math.round(opacity * 100) / 100})`;
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function fontStyleToWeight(style: string): number {
  const s = style.toLowerCase();
  if (s.includes('thin')) return 100;
  if (s.includes('extralight') || s.includes('ultra light')) return 200;
  if (s.includes('light')) return 300;
  if (s.includes('medium')) return 500;
  if (s.includes('semibold') || s.includes('demi bold')) return 600;
  if (s.includes('extrabold') || s.includes('ultra bold')) return 800;
  if (s.includes('bold')) return 700;
  if (s.includes('black') || s.includes('heavy')) return 900;
  return 400;
}

// ─── Text segment extraction ─────────────────────────────────────────────────

interface TextSegment {
  text: string;
  spanStyle: string; // inline CSS for this segment (empty = inherits parent)
}

/**
 * Extract styled text segments from a TextNode with mixed formatting.
 * Groups consecutive characters with the same style into segments.
 */
function extractTextSegments(node: TextNode): TextSegment[] {
  const len = node.characters.length;
  if (len === 0) return [];

  const segments: TextSegment[] = [];
  let currentStyle = getCharStyle(node, 0);
  let start = 0;

  for (let i = 1; i <= len; i++) {
    const style = i < len ? getCharStyle(node, i) : null;
    if (style === null || style !== currentStyle) {
      segments.push({
        text: node.characters.slice(start, i),
        spanStyle: currentStyle,
      });
      if (style !== null) {
        currentStyle = style;
        start = i;
      }
    }
  }
  return segments;
}

function getCharStyle(node: TextNode, index: number): string {
  const parts: string[] = [];
  const end = index + 1;

  try {
    const fontName = node.getRangeFontName(index, end);
    if (fontName !== figma.mixed) {
      const fn = fontName as FontName;
      parts.push(`font-family: "${fn.family}"`);
      const weight = fontStyleToWeight(fn.style);
      if (weight !== 400) parts.push(`font-weight: ${weight}`);
      if (fn.style.toLowerCase().includes('italic')) parts.push(`font-style: italic`);
    }

    const size = node.getRangeFontSize(index, end);
    if (typeof size === 'number') parts.push(`font-size: ${size}px`);

    const fills = node.getRangeFills(index, end);
    if (fills !== figma.mixed && Array.isArray(fills) && fills.length > 0) {
      const fill = fills[0] as SolidPaint;
      if (fill.type === 'SOLID') {
        parts.push(`color: ${rgbToHex(fill.color, fill.opacity)}`);
      }
    }

    const deco = node.getRangeTextDecoration(index, end);
    if (deco !== figma.mixed) {
      if (deco === 'UNDERLINE') parts.push('text-decoration: underline');
      if (deco === 'STRIKETHROUGH') parts.push('text-decoration: line-through');
    }
  } catch {
    // Some ranges may fail on special characters
  }

  return parts.join('; ');
}

// ─── Main converter ──────────────────────────────────────────────────────────

/**
 * Convert a Figma SceneNode tree to an HTML string with inline CSS.
 * @param parentIsAbsolute - true if parent uses layoutMode="NONE" (children need absolute pos)
 */
export async function nodeToHtml(
  node: SceneNode,
  depth: number,
  parentIsAbsolute = false,
): Promise<string> {
  if (depth > MAX_DEPTH) {
    return `${indent(depth)}<!-- max depth exceeded -->`;
  }

  switch (node.type) {
    case 'FRAME':
    case 'COMPONENT':
    case 'INSTANCE':
    case 'COMPONENT_SET':
    case 'SECTION':
      return containerToHtml(node as FrameNode, depth, parentIsAbsolute);
    case 'GROUP':
      return groupToHtml(node as GroupNode, depth, parentIsAbsolute);
    case 'TEXT':
      return textToHtml(node as TextNode, depth, parentIsAbsolute);
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'LINE':
    case 'VECTOR':
    case 'STAR':
    case 'POLYGON':
    case 'BOOLEAN_OPERATION':
      return shapeToHtml(node, depth, parentIsAbsolute);
    default:
      return `${indent(depth)}<!-- unsupported: ${node.type} "${escapeAttr(node.name)}" -->`;
  }
}

async function getNodeCSS(node: SceneNode): Promise<Record<string, string>> {
  try {
    return await (node as any).getCSSAsync();
  } catch {
    return {};
  }
}

function buildAttrs(node: SceneNode): string {
  const parts: string[] = [];
  if (node.name) parts.push(`data-name="${escapeAttr(node.name)}"`);
  if (node.type !== 'FRAME') parts.push(`data-type="${node.type.toLowerCase()}"`);
  return parts.join(' ');
}

function addPositionIfNeeded(
  css: Record<string, string>,
  node: SceneNode,
  parentIsAbsolute: boolean,
): void {
  if (parentIsAbsolute) {
    css['position'] = 'absolute';
    css['left'] = `${Math.round(node.x)}px`;
    css['top'] = `${Math.round(node.y)}px`;
  }
}

// ─── Container (Frame / Component / Instance) ───────────────────────────────

async function containerToHtml(
  node: FrameNode,
  depth: number,
  parentIsAbsolute: boolean,
): Promise<string> {
  const css = await getNodeCSS(node);
  const attrs = buildAttrs(node);
  addPositionIfNeeded(css, node, parentIsAbsolute);

  if (!node.visible) css['display'] = 'none';

  const childrenAreAbsolute = node.layoutMode === 'NONE';
  if (childrenAreAbsolute && !css['position']) {
    css['position'] = 'relative';
  }

  const children = node.children;
  if (children.length === 0) {
    return `${indent(depth)}<div ${attrs} style="${cssObjToString(css)}"></div>`;
  }

  const childLines: string[] = [];
  for (const child of children) {
    childLines.push(await nodeToHtml(child, depth + 1, childrenAreAbsolute));
  }

  return [
    `${indent(depth)}<div ${attrs} style="${cssObjToString(css)}">`,
    ...childLines,
    `${indent(depth)}</div>`,
  ].join('\n');
}

// ─── Group ───────────────────────────────────────────────────────────────────

async function groupToHtml(
  node: GroupNode,
  depth: number,
  parentIsAbsolute: boolean,
): Promise<string> {
  const css = await getNodeCSS(node);
  const attrs = buildAttrs(node);
  addPositionIfNeeded(css, node, parentIsAbsolute);

  const childLines: string[] = [];
  for (const child of node.children) {
    // Group children always use absolute positioning relative to the group
    childLines.push(await nodeToHtml(child, depth + 1, true));
  }

  return [
    `${indent(depth)}<div ${attrs} style="${cssObjToString(css)}">`,
    ...childLines,
    `${indent(depth)}</div>`,
  ].join('\n');
}

// ─── Text ────────────────────────────────────────────────────────────────────

async function textToHtml(
  node: TextNode,
  depth: number,
  parentIsAbsolute: boolean,
): Promise<string> {
  const css = await getNodeCSS(node);
  const attrs = buildAttrs(node);
  addPositionIfNeeded(css, node, parentIsAbsolute);

  if (!node.visible) css['display'] = 'none';

  const text = node.characters;
  if (text.length === 0) {
    return `${indent(depth)}<p ${attrs} style="${cssObjToString(css)}"></p>`;
  }

  // Check if text has uniform formatting
  const isUniform =
    node.fontName !== figma.mixed &&
    node.fontSize !== figma.mixed &&
    node.fills !== figma.mixed;

  if (isUniform) {
    return `${indent(depth)}<p ${attrs} style="${cssObjToString(css)}">${escapeHtml(text)}</p>`;
  }

  // Mixed formatting — extract segments and wrap in <span>s
  const segments = extractTextSegments(node);
  const inner = segments
    .map((seg) => {
      const escaped = escapeHtml(seg.text);
      if (!seg.spanStyle) return escaped;
      return `<span style="${seg.spanStyle}">${escaped}</span>`;
    })
    .join('');

  return `${indent(depth)}<p ${attrs} style="${cssObjToString(css)}">${inner}</p>`;
}

// ─── Shapes (Rectangle, Ellipse, Vector, Line, etc.) ────────────────────────

async function shapeToHtml(
  node: SceneNode,
  depth: number,
  parentIsAbsolute: boolean,
): Promise<string> {
  const css = await getNodeCSS(node);
  const attrs = buildAttrs(node);
  addPositionIfNeeded(css, node, parentIsAbsolute);

  if (!node.visible) css['display'] = 'none';

  return `${indent(depth)}<div ${attrs} style="${cssObjToString(css)}"></div>`;
}
