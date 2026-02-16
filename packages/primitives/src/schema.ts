// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVE SCHEMA DEFINITIONS (for documentation & validation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema for a single property
 */
export interface PropertySchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'array' | 'object' | 'enum';
  required?: boolean;
  default?: unknown;
  description?: string;
  enumValues?: string[];
  items?: PropertySchema; // For arrays
  properties?: PropertySchema[]; // For objects

  /** Figma API property name (if different from DSL name) */
  figmaName?: string;
}

/**
 * Schema for a primitive type
 */
export interface PrimitiveSchema {
  name: string;
  description: string;
  figmaType: string; // Corresponding Figma node type
  properties: PropertySchema[];
  canHaveChildren: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FRAME SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export const FrameSchema: PrimitiveSchema = {
  name: 'Frame',
  description:
    'Container element with optional auto-layout. The primary building block.',
  figmaType: 'FRAME',
  canHaveChildren: true,
  properties: [
    // Base properties
    { name: 'id', type: 'string', description: 'Unique identifier' },
    { name: 'name', type: 'string', description: 'Layer name in Figma' },
    { name: 'visible', type: 'boolean', default: true },
    { name: 'opacity', type: 'number', default: 1, description: '0 to 1' },

    // Position & Size
    { name: 'x', type: 'number', description: 'X position relative to parent' },
    { name: 'y', type: 'number', description: 'Y position relative to parent' },
    {
      name: 'width',
      type: 'number',
      description: "Width in pixels, or 'fill'/'hug'",
    },
    {
      name: 'height',
      type: 'number',
      description: "Height in pixels, or 'fill'/'hug'",
    },
    {
      name: 'rotation',
      type: 'number',
      default: 0,
      description: 'Rotation in degrees',
    },

    // Fills & Strokes
    {
      name: 'fill',
      type: 'color',
      description: 'Background color (hex string)',
    },
    { name: 'stroke', type: 'color', description: 'Border color (hex string)' },
    {
      name: 'strokeWeight',
      type: 'number',
      description: 'Border width in pixels',
    },

    // Corner Radius
    {
      name: 'cornerRadius',
      type: 'number',
      description: 'All corners, or [TL, TR, BR, BL]',
    },

    // Auto-Layout
    {
      name: 'layoutMode',
      type: 'enum',
      enumValues: ['none', 'horizontal', 'vertical'],
      default: 'none',
      description: 'Layout direction for children',
      figmaName: 'layoutMode',
    },
    {
      name: 'gap',
      type: 'number',
      description: 'Space between children',
      figmaName: 'itemSpacing',
    },
    {
      name: 'padding',
      type: 'number',
      description: 'Inner padding (single value or [t,r,b,l])',
    },
    { name: 'paddingTop', type: 'number' },
    { name: 'paddingRight', type: 'number' },
    { name: 'paddingBottom', type: 'number' },
    { name: 'paddingLeft', type: 'number' },
    {
      name: 'primaryAxisAlign',
      type: 'enum',
      enumValues: ['start', 'center', 'end', 'space-between'],
      default: 'start',
      description: 'Main axis alignment (like justify-content)',
      figmaName: 'primaryAxisAlignItems',
    },
    {
      name: 'counterAxisAlign',
      type: 'enum',
      enumValues: ['start', 'center', 'end', 'baseline'],
      default: 'start',
      description: 'Cross axis alignment (like align-items)',
      figmaName: 'counterAxisAlignItems',
    },

    // Clipping
    {
      name: 'clipsContent',
      type: 'boolean',
      default: true,
      description: 'Clip overflowing content',
    },

    // Effects
    {
      name: 'effects',
      type: 'array',
      items: { name: 'effect', type: 'object' },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TEXT SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export const TextSchema: PrimitiveSchema = {
  name: 'Text',
  description: 'Text content with typography styling',
  figmaType: 'TEXT',
  canHaveChildren: false,
  properties: [
    // Base properties
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'visible', type: 'boolean', default: true },
    { name: 'opacity', type: 'number', default: 1 },

    // Position & Size
    { name: 'x', type: 'number' },
    { name: 'y', type: 'number' },
    { name: 'width', type: 'number' },
    { name: 'height', type: 'number' },

    // Content
    {
      name: 'text',
      type: 'string',
      required: true,
      description: 'Text content (or use children)',
    },

    // Typography
    { name: 'fontFamily', type: 'string', default: 'Inter' },
    { name: 'fontSize', type: 'number', default: 16 },
    {
      name: 'fontWeight',
      type: 'enum',
      enumValues: [
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
      ],
      default: '400',
    },
    {
      name: 'fontStyle',
      type: 'enum',
      enumValues: ['normal', 'italic'],
      default: 'normal',
    },
    {
      name: 'lineHeight',
      type: 'number',
      description: 'Pixels or percentage string',
    },
    {
      name: 'letterSpacing',
      type: 'number',
      description: 'Pixels or percentage string',
    },

    // Alignment
    {
      name: 'textAlign',
      type: 'enum',
      enumValues: ['left', 'center', 'right', 'justified'],
      default: 'left',
    },
    {
      name: 'textAlignVertical',
      type: 'enum',
      enumValues: ['top', 'center', 'bottom'],
      default: 'top',
    },

    // Sizing
    {
      name: 'textAutoResize',
      type: 'enum',
      enumValues: ['none', 'width-and-height', 'height', 'truncate'],
      default: 'width-and-height',
    },

    // Color
    {
      name: 'fill',
      type: 'color',
      default: '#000000',
      description: 'Text color',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// RECTANGLE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export const RectangleSchema: PrimitiveSchema = {
  name: 'Rectangle',
  description: 'Rectangle shape with optional rounded corners',
  figmaType: 'RECTANGLE',
  canHaveChildren: false,
  properties: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'visible', type: 'boolean', default: true },
    { name: 'opacity', type: 'number', default: 1 },
    { name: 'x', type: 'number' },
    { name: 'y', type: 'number' },
    { name: 'width', type: 'number', required: true },
    { name: 'height', type: 'number', required: true },
    { name: 'fill', type: 'color' },
    { name: 'stroke', type: 'color' },
    { name: 'strokeWeight', type: 'number' },
    { name: 'cornerRadius', type: 'number' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ELLIPSE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export const EllipseSchema: PrimitiveSchema = {
  name: 'Ellipse',
  description: 'Ellipse/circle shape, supports arcs for pie charts',
  figmaType: 'ELLIPSE',
  canHaveChildren: false,
  properties: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'visible', type: 'boolean', default: true },
    { name: 'opacity', type: 'number', default: 1 },
    { name: 'x', type: 'number' },
    { name: 'y', type: 'number' },
    { name: 'width', type: 'number', required: true },
    { name: 'height', type: 'number', required: true },
    { name: 'fill', type: 'color' },
    { name: 'stroke', type: 'color' },
    { name: 'strokeWeight', type: 'number' },
    {
      name: 'arcData',
      type: 'object',
      description: 'For arcs: { startAngle, endAngle, innerRadius }',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// VECTOR SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export const VectorSchema: PrimitiveSchema = {
  name: 'Vector',
  description: 'SVG path or complex vector shape',
  figmaType: 'VECTOR',
  canHaveChildren: false,
  properties: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'visible', type: 'boolean', default: true },
    { name: 'opacity', type: 'number', default: 1 },
    { name: 'x', type: 'number' },
    { name: 'y', type: 'number' },
    { name: 'width', type: 'number' },
    { name: 'height', type: 'number' },
    { name: 'path', type: 'string', description: 'SVG path d attribute' },
    { name: 'svg', type: 'string', description: 'Full SVG content' },
    { name: 'fill', type: 'color' },
    { name: 'stroke', type: 'color' },
    { name: 'strokeWeight', type: 'number' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// GROUP SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export const GroupSchema: PrimitiveSchema = {
  name: 'Group',
  description: 'Non-layout grouping of elements',
  figmaType: 'GROUP',
  canHaveChildren: true,
  properties: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'visible', type: 'boolean', default: true },
    { name: 'opacity', type: 'number', default: 1 },
    { name: 'x', type: 'number' },
    { name: 'y', type: 'number' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ALL SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const PrimitiveSchemas = {
  frame: FrameSchema,
  text: TextSchema,
  rectangle: RectangleSchema,
  ellipse: EllipseSchema,
  vector: VectorSchema,
  group: GroupSchema,
} as const;

/**
 * Get schema for a primitive type
 */
export function getSchema(type: string): PrimitiveSchema | undefined {
  return PrimitiveSchemas[type as keyof typeof PrimitiveSchemas];
}

/**
 * Generate markdown documentation for all primitives
 */
export function generatePrimitiveDocs(): string {
  const docs: string[] = ['# Primitive Reference\n'];

  for (const schema of Object.values(PrimitiveSchemas)) {
    docs.push(`## ${schema.name}\n`);
    docs.push(`${schema.description}\n`);
    docs.push(`**Figma Type:** \`${schema.figmaType}\`\n`);
    docs.push(
      `**Can Have Children:** ${schema.canHaveChildren ? 'Yes' : 'No'}\n`,
    );
    docs.push('\n### Properties\n');
    docs.push('| Property | Type | Default | Description |');
    docs.push('|----------|------|---------|-------------|');

    for (const prop of schema.properties) {
      const typeStr =
        prop.type === 'enum'
          ? (prop.enumValues?.join(' \\| ') ?? prop.type)
          : prop.type;
      const defaultStr =
        prop.default !== undefined ? `\`${prop.default}\`` : '-';
      docs.push(
        `| \`${prop.name}\` | ${typeStr} | ${defaultStr} | ${prop.description ?? ''} |`,
      );
    }

    docs.push('\n');
  }

  return docs.join('\n');
}
