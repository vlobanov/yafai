/**
 * DSL Parser - Parses XML DSL to Primitive objects
 *
 * This parser handles the XML format that AI agents output.
 * It converts XML like <Frame fill="#fff">...</Frame> to Primitive objects.
 */

import type { Frame } from './primitives/frame.js';
import type { Group } from './primitives/group.js';
import type { Primitive } from './primitives/index.js';
import type { Ellipse, Image, Rectangle, Vector } from './primitives/shapes.js';
import type { Text } from './primitives/text.js';

/**
 * Warning produced during parsing (non-fatal)
 */
export interface ParseWarning {
  type: 'unknown-attribute';
  element: string;
  attribute: string;
  message: string;
}

/**
 * Parser options
 */
export interface ParserOptions {
  /** Whether to validate property values */
  validate?: boolean;

  /** Whether to apply design tokens for shorthand values */
  applyTokens?: boolean;

  /** If provided, unknown-attribute warnings are pushed here */
  warnings?: ParseWarning[];
}

/**
 * Parser error with context
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: number,
    public context?: string,
    public found?: string,
  ) {
    const locationInfo =
      line !== undefined ? ` at line ${line}, column ${column}` : '';
    const foundInfo =
      found !== undefined ? ` (found: ${JSON.stringify(found)})` : '';
    const contextInfo = context ? `\n\nContext:\n${context}` : '';
    super(`${message}${locationInfo}${foundInfo}${contextInfo}`);
    this.name = 'ParseError';
  }
}

/**
 * Get context around a position in the input for error messages
 */
function getErrorContext(
  input: string,
  pos: number,
  contextChars = 40,
): string {
  const start = Math.max(0, pos - contextChars);
  const end = Math.min(input.length, pos + contextChars);
  const before = input.slice(start, pos);
  const after = input.slice(pos, end);
  const pointer = ' '.repeat(before.length) + '^';
  return `${before}${after}\n${pointer}`;
}

/**
 * Simple XML parser state
 */
interface ParseState {
  input: string;
  pos: number;
  line: number;
  column: number;
}

/**
 * Parsed XML element
 */
interface XMLElement {
  tag: string;
  attributes: Record<string, string>;
  children: (XMLElement | string)[];
  selfClosing: boolean;
}

/**
 * Parse XML DSL to Primitive
 */
export function parseDSL(xml: string, _options: ParserOptions = {}): Primitive {
  const state: ParseState = {
    input: xml.trim(),
    pos: 0,
    line: 1,
    column: 1,
  };

  skipWhitespaceAndComments(state);
  const element = parseElement(state);

  if (!element) {
    const context = getErrorContext(state.input, 0);
    throw new ParseError(
      'Empty or invalid XML - expected element starting with "<"',
      1,
      1,
      context,
      state.input[0] || 'empty string',
    );
  }

  return elementToPrimitive(element, _options.warnings);
}

/**
 * Parse multiple primitives from XML
 */
export function parseDSLMultiple(
  xml: string,
  _options: ParserOptions = {},
): Primitive[] {
  const state: ParseState = {
    input: xml.trim(),
    pos: 0,
    line: 1,
    column: 1,
  };

  const primitives: Primitive[] = [];

  while (state.pos < state.input.length) {
    skipWhitespaceAndComments(state);
    if (state.pos >= state.input.length) break;

    const element = parseElement(state);
    if (element) {
      primitives.push(elementToPrimitive(element, _options.warnings));
    }

    skipWhitespaceAndComments(state);
  }

  return primitives;
}

// ═══════════════════════════════════════════════════════════════════════════
// XML PARSING
// ═══════════════════════════════════════════════════════════════════════════

function skipWhitespace(state: ParseState): void {
  while (state.pos < state.input.length) {
    const char = state.input[state.pos];
    if (char === ' ' || char === '\t' || char === '\r') {
      state.pos++;
      state.column++;
    } else if (char === '\n') {
      state.pos++;
      state.line++;
      state.column = 1;
    } else {
      break;
    }
  }
}

/**
 * Skip XML comments (<!-- ... -->)
 * Returns true if a comment was skipped
 */
function skipComment(state: ParseState): boolean {
  if (state.input.slice(state.pos, state.pos + 4) !== '<!--') {
    return false;
  }

  // Skip the opening <!--
  state.pos += 4;
  state.column += 4;

  // Find the closing -->
  while (state.pos < state.input.length) {
    if (state.input.slice(state.pos, state.pos + 3) === '-->') {
      state.pos += 3;
      state.column += 3;
      return true;
    }

    if (state.input[state.pos] === '\n') {
      state.pos++;
      state.line++;
      state.column = 1;
    } else {
      state.pos++;
      state.column++;
    }
  }

  // Comment not closed - just return true anyway (permissive)
  return true;
}

/**
 * Skip whitespace and comments
 */
function skipWhitespaceAndComments(state: ParseState): void {
  while (state.pos < state.input.length) {
    skipWhitespace(state);
    if (!skipComment(state)) {
      break;
    }
  }
}

function parseElement(state: ParseState): XMLElement | null {
  if (state.input[state.pos] !== '<') {
    return null;
  }

  state.pos++; // Skip <
  state.column++;

  // Parse tag name
  const tagStart = state.pos;
  while (
    state.pos < state.input.length &&
    /[a-zA-Z0-9_-]/.test(state.input[state.pos])
  ) {
    state.pos++;
    state.column++;
  }
  const tag = state.input.slice(tagStart, state.pos);

  if (!tag) {
    const found = state.input[state.pos] || 'end of input';
    const context = getErrorContext(state.input, state.pos);
    throw new ParseError(
      'Expected tag name after "<"',
      state.line,
      state.column,
      context,
      found,
    );
  }

  // Parse attributes
  const attributes: Record<string, string> = {};

  while (state.pos < state.input.length) {
    skipWhitespace(state);

    // Check for end of opening tag
    if (state.input[state.pos] === '>') {
      state.pos++;
      state.column++;
      break;
    }

    // Check for self-closing
    if (state.input.slice(state.pos, state.pos + 2) === '/>') {
      state.pos += 2;
      state.column += 2;
      return { tag, attributes, children: [], selfClosing: true };
    }

    // Parse attribute
    const attrStart = state.pos;
    while (
      state.pos < state.input.length &&
      /[a-zA-Z0-9_-]/.test(state.input[state.pos])
    ) {
      state.pos++;
      state.column++;
    }
    const attrName = state.input.slice(attrStart, state.pos);

    if (!attrName) continue;

    skipWhitespace(state);

    // Expect =
    if (state.input[state.pos] !== '=') {
      const found = state.input[state.pos] || 'end of input';
      const context = getErrorContext(state.input, state.pos);
      throw new ParseError(
        `Expected "=" after attribute "${attrName}"`,
        state.line,
        state.column,
        context,
        found,
      );
    }
    state.pos++;
    state.column++;

    skipWhitespace(state);

    // Parse value (supports " or { for JSX-style)
    let value: string;

    if (state.input[state.pos] === '"') {
      state.pos++;
      state.column++;
      const valueStart = state.pos;
      while (state.pos < state.input.length && state.input[state.pos] !== '"') {
        state.pos++;
        state.column++;
      }
      value = state.input.slice(valueStart, state.pos);
      state.pos++; // Skip closing "
      state.column++;
    } else if (state.input[state.pos] === '{') {
      // JSX-style value {123} or {"string"}
      state.pos++;
      state.column++;
      let braceDepth = 1;
      const valueStart = state.pos;
      while (state.pos < state.input.length && braceDepth > 0) {
        if (state.input[state.pos] === '{') braceDepth++;
        else if (state.input[state.pos] === '}') braceDepth--;
        if (braceDepth > 0) {
          state.pos++;
          state.column++;
        }
      }
      value = state.input.slice(valueStart, state.pos).trim();
      // Remove quotes if it's a string in braces
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      state.pos++; // Skip closing }
      state.column++;
    } else {
      const found = state.input[state.pos] || 'end of input';
      const context = getErrorContext(state.input, state.pos);
      throw new ParseError(
        `Expected '"' or '{' for attribute value`,
        state.line,
        state.column,
        context,
        found,
      );
    }

    attributes[attrName] = value;
  }

  // Parse children
  const children: (XMLElement | string)[] = [];

  while (state.pos < state.input.length) {
    skipWhitespaceAndComments(state);

    // Check for closing tag
    if (state.input.slice(state.pos, state.pos + 2) === '</') {
      state.pos += 2;
      state.column += 2;

      // Parse closing tag name
      const closeTagStart = state.pos;
      while (
        state.pos < state.input.length &&
        /[a-zA-Z0-9_-]/.test(state.input[state.pos])
      ) {
        state.pos++;
        state.column++;
      }
      const closeTag = state.input.slice(closeTagStart, state.pos);

      if (closeTag !== tag) {
        const context = getErrorContext(state.input, state.pos);
        throw new ParseError(
          `Mismatched closing tag: expected </${tag}>, got </${closeTag}>`,
          state.line,
          state.column,
          context,
          `</${closeTag}>`,
        );
      }

      skipWhitespace(state);

      if (state.input[state.pos] !== '>') {
        const found = state.input[state.pos] || 'end of input';
        const context = getErrorContext(state.input, state.pos);
        throw new ParseError(
          `Expected ">" after closing tag </${tag}>`,
          state.line,
          state.column,
          context,
          found,
        );
      }
      state.pos++;
      state.column++;

      break;
    }

    // Check for child element
    if (state.input[state.pos] === '<') {
      const child = parseElement(state);
      if (child) {
        children.push(child);
      }
    } else {
      // Text content
      const textStart = state.pos;
      while (state.pos < state.input.length && state.input[state.pos] !== '<') {
        state.pos++;
        state.column++;
      }
      const text = state.input.slice(textStart, state.pos).trim();
      if (text) {
        children.push(text);
      }
    }
  }

  return { tag, attributes, children, selfClosing: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVE CONVERSION
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// KNOWN ATTRIBUTES PER ELEMENT (for unknown-attribute warnings)
// ═══════════════════════════════════════════════════════════════════════════

const BASE_ATTRS = [
  'id',
  'name',
  'visible',
  'opacity',
  'x',
  'y',
  'width',
  'height',
  'rotation',
];

const KNOWN_ATTRIBUTES: Record<string, Set<string>> = {
  frame: new Set([
    ...BASE_ATTRS,
    'fill',
    'stroke',
    'strokeWeight',
    'cornerRadius',
    'layoutMode',
    'gap',
    'itemSpacing',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'primaryAxisAlign',
    'counterAxisAlign',
    'primaryAxisSizing',
    'counterAxisSizing',
    'layoutWrap',
    'clipsContent',
  ]),
  text: new Set([
    ...BASE_ATTRS,
    'text',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'textAlign',
    'textAlignVertical',
    'fill',
    'lineHeight',
    'letterSpacing',
    'textAutoResize',
    'textDecoration',
    'textCase',
    'maxLines',
    'stroke',
    'strokeWeight',
  ]),
  rectangle: new Set([
    ...BASE_ATTRS,
    'fill',
    'stroke',
    'strokeWeight',
    'cornerRadius',
  ]),
  ellipse: new Set([...BASE_ATTRS, 'fill', 'stroke', 'strokeWeight']),
  vector: new Set([
    ...BASE_ATTRS,
    'path',
    'svg',
    'fill',
    'stroke',
    'strokeWeight',
  ]),
  image: new Set([
    ...BASE_ATTRS,
    'imageRef',
    'src',
    'scaleMode',
    'cornerRadius',
  ]),
  group: new Set(['id', 'name', 'visible', 'opacity', 'x', 'y']),
  slide: new Set(['id', 'name', 'x', 'y', 'fill', 'background']),
  slidetitle: new Set([
    'id',
    'name',
    'x',
    'y',
    'text',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fill',
    'color',
  ]),
  card: new Set([
    'id',
    'name',
    'x',
    'y',
    'width',
    'height',
    'fill',
    'background',
    'cornerRadius',
    'padding',
    'gap',
  ]),
  statnumber: new Set(['id', 'name', 'x', 'y', 'value', 'label']),
  bulletlist: new Set(['id', 'name', 'x', 'y', 'items']),
  heading: new Set([
    'id',
    'name',
    'x',
    'y',
    'text',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fill',
    'level',
  ]),
  paragraph: new Set([
    'id',
    'name',
    'x',
    'y',
    'width',
    'text',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fill',
  ]),
};

function checkUnknownAttributes(
  element: XMLElement,
  warnings: ParseWarning[] | undefined,
): void {
  if (!warnings) return;

  const tag = element.tag.toLowerCase();
  const known = KNOWN_ATTRIBUTES[tag];
  if (!known) return;

  for (const attr of Object.keys(element.attributes)) {
    if (!known.has(attr)) {
      warnings.push({
        type: 'unknown-attribute',
        element: element.tag,
        attribute: attr,
        message: `Unknown attribute "${attr}" on <${element.tag}>`,
      });
    }
  }
}

function elementToPrimitive(
  element: XMLElement,
  warnings?: ParseWarning[],
): Primitive {
  const tag = element.tag.toLowerCase();

  checkUnknownAttributes(element, warnings);

  switch (tag) {
    // Primitives
    case 'frame':
      return parseFrame(element, warnings);
    case 'text':
      return parseText(element);
    case 'rectangle':
      return parseRectangle(element);
    case 'ellipse':
      return parseEllipse(element);
    case 'vector':
      return parseVector(element);
    case 'image':
      return parseImage(element);
    case 'group':
      return parseGroup(element, warnings);

    // High-level components (expand to primitives)
    case 'slide':
      return parseSlide(element, warnings);
    case 'slidetitle':
      return parseSlideTitle(element);
    case 'card':
      return parseCard(element, warnings);
    case 'statnumber':
      return parseStatNumber(element);
    case 'bulletlist':
      return parseBulletList(element);
    case 'heading':
      return parseHeading(element);
    case 'paragraph':
      return parseParagraph(element);

    default: {
      const validTypes = [
        'Frame',
        'Text',
        'Rectangle',
        'Ellipse',
        'Vector',
        'Image',
        'Group',
        'Slide',
        'SlideTitle',
        'Card',
        'StatNumber',
        'BulletList',
        'Heading',
        'Paragraph',
      ];
      throw new ParseError(
        `Unknown element type: <${element.tag}>. Valid types are: ${validTypes.join(', ')}`,
      );
    }
  }
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? undefined : num;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value === 'true' || value === '1';
}

function parseSizeValue(
  value: string | undefined,
): number | 'fill' | 'hug' | undefined {
  if (value === undefined) return undefined;
  if (value === 'fill' || value === 'hug') return value;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? undefined : num;
}

function parseFrame(
  element: XMLElement,
  warnings?: ParseWarning[],
): Frame {
  const attrs = element.attributes;

  const frame: Frame = {
    type: 'frame',
    id: attrs.id,
    name: attrs.name,
    visible: parseBoolean(attrs.visible),
    opacity: parseNumber(attrs.opacity),
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    width: parseSizeValue(attrs.width),
    height: parseSizeValue(attrs.height),
    rotation: parseNumber(attrs.rotation),
    fill: attrs.fill,
    stroke: attrs.stroke,
    strokeWeight: parseNumber(attrs.strokeWeight),
    cornerRadius: parseNumber(attrs.cornerRadius),
    layoutMode: attrs.layoutMode as any,
    gap: parseNumber(attrs.gap) ?? parseNumber(attrs.itemSpacing),
    padding: parseNumber(attrs.padding),
    paddingTop: parseNumber(attrs.paddingTop),
    paddingRight: parseNumber(attrs.paddingRight),
    paddingBottom: parseNumber(attrs.paddingBottom),
    paddingLeft: parseNumber(attrs.paddingLeft),
    primaryAxisAlign: attrs.primaryAxisAlign as any,
    counterAxisAlign: attrs.counterAxisAlign as any,
    primaryAxisSizing: attrs.primaryAxisSizing as Frame['primaryAxisSizing'],
    counterAxisSizing: attrs.counterAxisSizing as Frame['counterAxisSizing'],
    layoutWrap: attrs.layoutWrap as Frame['layoutWrap'],
    clipsContent: parseBoolean(attrs.clipsContent),
  };

  // Parse children
  if (element.children.length > 0) {
    frame.children = element.children
      .filter((c): c is XMLElement => typeof c !== 'string')
      .map((c) => elementToPrimitive(c, warnings));
  }

  return frame;
}

function parseText(element: XMLElement): Text {
  const attrs = element.attributes;

  // Get text content from children or text attribute
  let textContent = attrs.text;
  if (!textContent) {
    const textChild = element.children.find(
      (c): c is string => typeof c === 'string',
    );
    if (textChild) {
      textContent = textChild;
    }
  }

  return {
    type: 'text',
    id: attrs.id,
    name: attrs.name,
    visible: parseBoolean(attrs.visible),
    opacity: parseNumber(attrs.opacity),
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    width: parseSizeValue(attrs.width),
    height: parseSizeValue(attrs.height),
    text: textContent,
    fontFamily: attrs.fontFamily,
    fontSize: parseNumber(attrs.fontSize),
    fontWeight: parseNumber(attrs.fontWeight) as any,
    fontStyle: attrs.fontStyle as any,
    textAlign: attrs.textAlign as any,
    textAlignVertical: attrs.textAlignVertical as any,
    fill: attrs.fill,
  };
}

function parseRectangle(element: XMLElement): Rectangle {
  const attrs = element.attributes;

  return {
    type: 'rectangle',
    id: attrs.id,
    name: attrs.name,
    visible: parseBoolean(attrs.visible),
    opacity: parseNumber(attrs.opacity),
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    width: parseSizeValue(attrs.width),
    height: parseSizeValue(attrs.height),
    fill: attrs.fill,
    stroke: attrs.stroke,
    strokeWeight: parseNumber(attrs.strokeWeight),
    cornerRadius: parseNumber(attrs.cornerRadius),
  };
}

function parseEllipse(element: XMLElement): Ellipse {
  const attrs = element.attributes;

  return {
    type: 'ellipse',
    id: attrs.id,
    name: attrs.name,
    visible: parseBoolean(attrs.visible),
    opacity: parseNumber(attrs.opacity),
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    width: parseSizeValue(attrs.width),
    height: parseSizeValue(attrs.height),
    fill: attrs.fill,
    stroke: attrs.stroke,
    strokeWeight: parseNumber(attrs.strokeWeight),
  };
}

function parseVector(element: XMLElement): Vector {
  const attrs = element.attributes;

  return {
    type: 'vector',
    id: attrs.id,
    name: attrs.name,
    visible: parseBoolean(attrs.visible),
    opacity: parseNumber(attrs.opacity),
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    width: parseSizeValue(attrs.width),
    height: parseSizeValue(attrs.height),
    path: attrs.path,
    svg: attrs.svg,
    fill: attrs.fill,
    stroke: attrs.stroke,
    strokeWeight: parseNumber(attrs.strokeWeight),
  };
}

function parseImage(element: XMLElement): Image {
  const attrs = element.attributes;

  return {
    type: 'image',
    id: attrs.id,
    name: attrs.name,
    visible: parseBoolean(attrs.visible),
    opacity: parseNumber(attrs.opacity),
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    width: parseSizeValue(attrs.width),
    height: parseSizeValue(attrs.height),
    imageRef: attrs.imageRef,
    src: attrs.src,
    scaleMode: attrs.scaleMode as any,
    cornerRadius: parseNumber(attrs.cornerRadius),
  };
}

function parseGroup(
  element: XMLElement,
  warnings?: ParseWarning[],
): Group {
  const attrs = element.attributes;

  return {
    type: 'group',
    id: attrs.id,
    name: attrs.name,
    visible: parseBoolean(attrs.visible),
    opacity: parseNumber(attrs.opacity),
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    children: element.children
      .filter((c): c is XMLElement => typeof c !== 'string')
      .map((c) => elementToPrimitive(c, warnings)),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGH-LEVEL COMPONENT PARSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Slide - Base container (1920×1080)
 */
function parseSlide(
  element: XMLElement,
  warnings?: ParseWarning[],
): Frame {
  const attrs = element.attributes;

  return {
    type: 'frame',
    id: attrs.id,
    name: attrs.name || 'Slide',
    x: parseNumber(attrs.x) ?? 0,
    y: parseNumber(attrs.y) ?? 0,
    width: 1920,
    height: 1080,
    fill: attrs.fill || attrs.background || '#ffffff',
    clipsContent: true,
    children: element.children
      .filter((c): c is XMLElement => typeof c !== 'string')
      .map((c) => elementToPrimitive(c, warnings)),
  };
}

/**
 * SlideTitle - Main heading at y=60
 */
function parseSlideTitle(element: XMLElement): Text {
  const attrs = element.attributes;

  // Get text content from children or text attribute
  let textContent = attrs.text;
  if (!textContent) {
    const textChild = element.children.find(
      (c): c is string => typeof c === 'string',
    );
    if (textChild) {
      textContent = textChild;
    }
  }

  return {
    type: 'text',
    id: attrs.id,
    name: attrs.name || 'SlideTitle',
    x: parseNumber(attrs.x) ?? 80,
    y: parseNumber(attrs.y) ?? 60,
    text: textContent,
    fontFamily: attrs.fontFamily || 'Inter',
    fontSize: parseNumber(attrs.fontSize) ?? 48,
    fontWeight: (parseNumber(attrs.fontWeight) ?? 600) as any,
    fill: attrs.fill || attrs.color || '#1a1a2e',
  };
}

/**
 * Card - Content container with background
 */
function parseCard(
  element: XMLElement,
  warnings?: ParseWarning[],
): Frame {
  const attrs = element.attributes;

  return {
    type: 'frame',
    id: attrs.id,
    name: attrs.name || 'Card',
    x: parseNumber(attrs.x) ?? 80,
    y: parseNumber(attrs.y) ?? 180,
    width: parseSizeValue(attrs.width) ?? 800,
    height: parseSizeValue(attrs.height),
    fill: attrs.fill || attrs.background || '#f8fafc',
    cornerRadius: parseNumber(attrs.cornerRadius) ?? 8,
    padding: parseNumber(attrs.padding) ?? 24,
    layoutMode: 'vertical',
    gap: parseNumber(attrs.gap) ?? 16,
    children: element.children
      .filter((c): c is XMLElement => typeof c !== 'string')
      .map((c) => elementToPrimitive(c, warnings)),
  };
}

/**
 * StatNumber - Large metric with label
 * Note: Children are auto-generated and don't need IDs
 */
function parseStatNumber(element: XMLElement): Frame {
  const attrs = element.attributes;

  return {
    type: 'frame',
    id: attrs.id,
    name: attrs.name || 'StatNumber',
    x: parseNumber(attrs.x) ?? 0,
    y: parseNumber(attrs.y) ?? 0,
    layoutMode: 'vertical',
    gap: 8,
    children: [
      {
        type: 'text',
        text: attrs.value || '0',
        fontFamily: 'Inter',
        fontSize: 64,
        fontWeight: 700,
        fill: '#2563eb',
      },
      {
        type: 'text',
        text: attrs.label || '',
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: 400,
        fill: '#6b7280',
      },
    ],
  };
}

/**
 * BulletList - Styled list items
 * Note: Child bullet items are auto-generated and don't need IDs
 */
function parseBulletList(element: XMLElement): Frame {
  const attrs = element.attributes;

  // Parse items from attribute or children
  let items: string[] = [];
  if (attrs.items) {
    try {
      // Try to parse as JSON array
      items = JSON.parse(attrs.items.replace(/'/g, '"'));
    } catch {
      // If not JSON, split by comma
      items = attrs.items.split(',').map((s) => s.trim());
    }
  }

  // Also check for child Text elements
  const childTexts = element.children
    .filter(
      (c): c is XMLElement =>
        typeof c !== 'string' && c.tag.toLowerCase() === 'text',
    )
    .map((c) => {
      const textChild = c.children.find(
        (ch): ch is string => typeof ch === 'string',
      );
      return textChild || c.attributes.text || '';
    });

  if (childTexts.length > 0) {
    items = childTexts;
  }

  return {
    type: 'frame',
    id: attrs.id,
    name: attrs.name || 'BulletList',
    x: parseNumber(attrs.x) ?? 80,
    y: parseNumber(attrs.y) ?? 180,
    layoutMode: 'vertical',
    gap: 16,
    children: items.map((item) => ({
      type: 'frame' as const,
      layoutMode: 'horizontal' as const,
      gap: 12,
      children: [
        {
          type: 'text' as const,
          text: '•',
          fontFamily: 'Inter',
          fontSize: 18,
          fill: '#2563eb',
        },
        {
          type: 'text' as const,
          text: item,
          fontFamily: 'Inter',
          fontSize: 18,
          fill: '#1a1a2e',
        },
      ],
    })),
  };
}

/**
 * Heading - Section heading (levels 1-3)
 */
function parseHeading(element: XMLElement): Text {
  const attrs = element.attributes;
  const level = parseNumber(attrs.level) ?? 2;

  const sizes: Record<number, number> = { 1: 48, 2: 32, 3: 24 };
  const weights: Record<number, number> = { 1: 700, 2: 600, 3: 600 };

  // Get text content
  let textContent = attrs.text;
  if (!textContent) {
    const textChild = element.children.find(
      (c): c is string => typeof c === 'string',
    );
    if (textChild) {
      textContent = textChild;
    }
  }

  return {
    type: 'text',
    id: attrs.id,
    name: attrs.name || `Heading${level}`,
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    text: textContent,
    fontFamily: attrs.fontFamily || 'Inter',
    fontSize: sizes[level] || 32,
    fontWeight: (weights[level] || 600) as any,
    fill: attrs.fill || '#1a1a2e',
  };
}

/**
 * Paragraph - Body text
 */
function parseParagraph(element: XMLElement): Text {
  const attrs = element.attributes;

  // Get text content
  let textContent = attrs.text;
  if (!textContent) {
    const textChild = element.children.find(
      (c): c is string => typeof c === 'string',
    );
    if (textChild) {
      textContent = textChild;
    }
  }

  return {
    type: 'text',
    id: attrs.id,
    name: attrs.name || 'Paragraph',
    x: parseNumber(attrs.x),
    y: parseNumber(attrs.y),
    width: parseSizeValue(attrs.width),
    text: textContent,
    fontFamily: attrs.fontFamily || 'Inter',
    fontSize: parseNumber(attrs.fontSize) ?? 18,
    fontWeight: (parseNumber(attrs.fontWeight) ?? 400) as any,
    fill: attrs.fill || '#1a1a2e',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DSL SERIALIZATION (Primitive → XML)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Serialize a Primitive tree back to XML DSL
 */
export function serializeDSL(primitive: Primitive, indent = 0): string {
  const spaces = '  '.repeat(indent);
  const tag = getTagName(primitive.type);
  const attrs = serializeAttributes(primitive);
  const children = getChildren(primitive);
  const textContent = getTextContent(primitive);

  // Self-closing tag if no children and no text content
  if (children.length === 0 && !textContent) {
    return `${spaces}<${tag}${attrs} />`;
  }

  // Tag with text content only (no element children)
  if (children.length === 0 && textContent) {
    // If text is short and single line, inline it
    if (textContent.length < 60 && !textContent.includes('\n')) {
      return `${spaces}<${tag}${attrs}>${escapeXml(textContent)}</${tag}>`;
    }
    // Multi-line or long text
    return `${spaces}<${tag}${attrs}>\n${spaces}  ${escapeXml(textContent)}\n${spaces}</${tag}>`;
  }

  // Tag with children
  const childrenXml = children
    .map((child) => serializeDSL(child, indent + 1))
    .join('\n');

  return `${spaces}<${tag}${attrs}>\n${childrenXml}\n${spaces}</${tag}>`;
}

/**
 * Get the XML tag name for a primitive type
 */
function getTagName(type: string): string {
  // Capitalize first letter
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Serialize primitive attributes to XML attribute string
 */
function serializeAttributes(primitive: Primitive): string {
  const attrs: string[] = [];

  // Get all properties except type, children, and text
  for (const [key, value] of Object.entries(primitive)) {
    if (key === 'type' || key === 'children' || key === 'text') continue;
    if (value === undefined || value === null) continue;

    const attrValue = serializeAttributeValue(value);
    if (attrValue !== null) {
      attrs.push(`${key}=${attrValue}`);
    }
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * Serialize a single attribute value
 */
function serializeAttributeValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return `"${escapeXml(value)}"`;
  }
  if (typeof value === 'number') {
    return `{${value}}`;
  }
  if (typeof value === 'boolean') {
    return `{${value}}`;
  }
  if (Array.isArray(value)) {
    return `{${JSON.stringify(value)}}`;
  }
  return null;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Get children of a primitive (if any)
 */
function getChildren(primitive: Primitive): Primitive[] {
  if ('children' in primitive && Array.isArray(primitive.children)) {
    return primitive.children as Primitive[];
  }
  return [];
}

/**
 * Get text content of a primitive (for Text nodes)
 */
function getTextContent(primitive: Primitive): string | undefined {
  if (primitive.type === 'text' && 'text' in primitive) {
    return primitive.text as string | undefined;
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// TREE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find a node in the tree by ID
 */
export function findNodeById(root: Primitive, id: string): Primitive | null {
  if (root.id === id) {
    return root;
  }

  const children = getChildren(root);
  for (const child of children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }

  return null;
}

/**
 * Find a node and its parent by ID
 */
export function findNodeWithParent(
  root: Primitive,
  id: string,
  parent: Primitive | null = null,
): { node: Primitive; parent: Primitive | null; index: number } | null {
  if (root.id === id) {
    return { node: root, parent, index: -1 };
  }

  const children = getChildren(root);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.id === id) {
      return { node: child, parent: root, index: i };
    }
    const found = findNodeWithParent(child, id, root);
    if (found) return found;
  }

  return null;
}

/**
 * Update a node in the tree by ID, returning a new tree
 * (immutable update - creates new objects along the path)
 */
export function updateNodeById(
  root: Primitive,
  id: string,
  updates: Partial<Primitive>,
): Primitive {
  if (root.id === id) {
    return { ...root, ...updates } as Primitive;
  }

  const children = getChildren(root);
  if (children.length === 0) {
    return root;
  }

  const newChildren = children.map((child) =>
    updateNodeById(child, id, updates),
  );

  // Check if any child actually changed
  const hasChanges = newChildren.some((child, i) => child !== children[i]);
  if (!hasChanges) {
    return root;
  }

  return { ...root, children: newChildren } as Primitive;
}

/**
 * Replace a node in the tree by ID with a new subtree
 */
export function replaceNodeById(
  root: Primitive,
  id: string,
  replacement: Primitive,
): Primitive {
  if (root.id === id) {
    return replacement;
  }

  const children = getChildren(root);
  if (children.length === 0) {
    return root;
  }

  const newChildren = children.map((child) =>
    replaceNodeById(child, id, replacement),
  );

  const hasChanges = newChildren.some((child, i) => child !== children[i]);
  if (!hasChanges) {
    return root;
  }

  return { ...root, children: newChildren } as Primitive;
}

/**
 * Delete a node from the tree by ID
 */
export function deleteNodeById(root: Primitive, id: string): Primitive | null {
  // Can't delete the root
  if (root.id === id) {
    return null;
  }

  const children = getChildren(root);
  if (children.length === 0) {
    return root;
  }

  const newChildren: Primitive[] = [];
  let hasChanges = false;

  for (const child of children) {
    if (child.id === id) {
      hasChanges = true;
      continue; // Skip this child (delete it)
    }
    const updatedChild = deleteNodeById(child, id);
    if (updatedChild !== child) {
      hasChanges = true;
    }
    if (updatedChild) {
      newChildren.push(updatedChild);
    }
  }

  if (!hasChanges) {
    return root;
  }

  return { ...root, children: newChildren } as Primitive;
}

/**
 * Collect all node IDs in the tree
 */
export function collectNodeIds(root: Primitive): string[] {
  const ids: string[] = [];

  function traverse(node: Primitive): void {
    if (node.id) {
      ids.push(node.id);
    }
    for (const child of getChildren(node)) {
      traverse(child);
    }
  }

  traverse(root);
  return ids;
}

/**
 * Check if all nodes have IDs (for validation)
 */
export function validateNodeIds(root: Primitive): {
  valid: boolean;
  missingIds: string[];
} {
  const missingIds: string[] = [];
  let nodeIndex = 0;

  function traverse(node: Primitive, path: string): void {
    if (!node.id) {
      missingIds.push(`${path} (${node.type} at index ${nodeIndex})`);
    }
    nodeIndex++;

    const children = getChildren(node);
    children.forEach((child, i) => {
      traverse(child, `${path}.children[${i}]`);
    });
  }

  traverse(root, 'root');
  return { valid: missingIds.length === 0, missingIds };
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Result of DSL validation
 */
export interface ValidationResult {
  success: boolean;
  primitive?: Primitive;
  error?: string;
  line?: number;
  column?: number;
  context?: string;
}

/**
 * Validate DSL without throwing - returns result object
 */
export function validateDSL(
  xml: string,
  options: ParserOptions = {},
): ValidationResult {
  try {
    const primitive = parseDSL(xml, options);
    return { success: true, primitive };
  } catch (error) {
    if (error instanceof ParseError) {
      return {
        success: false,
        error: error.message,
        line: error.line,
        column: error.column,
        context: error.context,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

/**
 * Merge partial updates into a primitive
 * Handles nested properties appropriately
 */
export function mergePrimitiveUpdates(
  original: Primitive,
  updates: Record<string, unknown>,
): Primitive {
  const result = { ...original };

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'type') continue; // Never change type
    if (key === 'children' && Array.isArray(value)) {
      // Children should be parsed primitives
      (result as any)[key] = value;
    } else if (value === null) {
      // Null means delete the property
      delete (result as any)[key];
    } else {
      (result as any)[key] = value;
    }
  }

  return result;
}
