/**
 * Figma → Primitive converter
 *
 * Reads Figma SceneNodes and produces Primitive trees that can be
 * serialized to DSL XML via serializeDSL().
 */

import type {
  BooleanOperation,
  Ellipse,
  Frame,
  Group,
  Image,
  Line,
  Polygon,
  Primitive,
  Rectangle,
  Star,
  Text,
  Vector,
} from '@yafai/primitives';

import {
  cleanUndefined,
  extractCornerRadius,
  extractEffects,
  extractFills,
  extractLetterSpacing,
  extractLineHeight,
  extractStrokes,
  extractTextSegments,
  figmaBlendModeToDS,
  figmaCounterAlignToDS,
  figmaLayoutModeToDS,
  figmaOverflowToDS,
  figmaPrimaryAlignToDS,
  figmaSizingToDS,
  figmaTextAlignToDS,
  figmaTextAlignVerticalToDS,
  figmaTextAutoResizeToDS,
  figmaTextCaseToDS,
  figmaTextDecorationToDS,
} from './figma-to-dsl-helpers.js';

const MAX_DEPTH = 30;

/**
 * Convert a Figma SceneNode to a Primitive tree.
 * Returns null for unsupported node types.
 */
export async function nodeToPrimitive(
  node: SceneNode,
  depth = 0,
): Promise<Primitive | null> {
  if (depth > MAX_DEPTH) return null;
  if (!node.visible) {
    // Still convert hidden nodes — capture visible: false
  }

  switch (node.type) {
    case 'FRAME':
    case 'COMPONENT':
    case 'INSTANCE':
    case 'COMPONENT_SET':
    case 'SECTION':
      return frameNodeToPrimitive(node as FrameNode, depth);

    case 'TEXT':
      return textNodeToPrimitive(node as TextNode);

    case 'RECTANGLE':
      return rectangleNodeToPrimitive(node as RectangleNode);

    case 'ELLIPSE':
      return ellipseNodeToPrimitive(node as EllipseNode);

    case 'VECTOR':
      return vectorNodeToPrimitive(node as VectorNode);

    case 'GROUP':
      return groupNodeToPrimitive(node as GroupNode, depth);

    case 'LINE':
      return lineNodeToPrimitive(node as LineNode);

    case 'STAR':
      return starNodeToPrimitive(node as StarNode);

    case 'POLYGON':
      return polygonNodeToPrimitive(node as PolygonNode);

    case 'BOOLEAN_OPERATION':
      return booleanOpNodeToPrimitive(node as BooleanOperationNode, depth);

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE PROPERTY EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function baseProps(node: SceneNode) {
  return cleanUndefined({
    id: node.id,
    name: node.name || undefined,
    visible: node.visible === false ? false : undefined,
    opacity: 'opacity' in node && (node as any).opacity < 1 ? (node as any).opacity : undefined,
    locked: node.locked ? true : undefined,
    blendMode:
      'blendMode' in node
        ? figmaBlendModeToDS((node as any).blendMode)
        : undefined,
    effects:
      'effects' in node
        ? extractEffects((node as any).effects)
        : undefined,
  });
}

function positionProps(node: SceneNode) {
  return cleanUndefined({
    x: node.x !== 0 ? node.x : undefined,
    y: node.y !== 0 ? node.y : undefined,
    rotation:
      'rotation' in node && (node as any).rotation !== 0
        ? (node as any).rotation
        : undefined,
  });
}

function sizeProps(node: SceneNode) {
  const n = node as any;
  return cleanUndefined({
    width: n.width,
    height: n.height,
    minWidth: n.minWidth != null && n.minWidth > 0 ? n.minWidth : undefined,
    maxWidth: n.maxWidth != null && n.maxWidth < Infinity ? n.maxWidth : undefined,
    minHeight: n.minHeight != null && n.minHeight > 0 ? n.minHeight : undefined,
    maxHeight: n.maxHeight != null && n.maxHeight < Infinity ? n.maxHeight : undefined,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// FRAME
// ═══════════════════════════════════════════════════════════════════════════

async function frameNodeToPrimitive(
  node: FrameNode,
  depth: number,
): Promise<Frame> {
  const layoutMode = figmaLayoutModeToDS(node.layoutMode);
  const isAutoLayout = layoutMode != null;

  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  // Convert children
  const children: Primitive[] = [];
  for (const child of node.children) {
    const prim = await nodeToPrimitive(child, depth + 1);
    if (prim) {
      // For auto-layout children, capture fill/hug sizing
      if (isAutoLayout && 'layoutSizingHorizontal' in child) {
        const hSizing = (child as FrameNode).layoutSizingHorizontal;
        const vSizing = (child as FrameNode).layoutSizingVertical;
        if (hSizing === 'FILL') (prim as any).width = 'fill';
        else if (hSizing === 'HUG') (prim as any).width = 'hug';
        if (vSizing === 'FILL') (prim as any).height = 'fill';
        else if (vSizing === 'HUG') (prim as any).height = 'hug';
      }
      children.push(prim);
    }
  }

  // Determine primary/counter axis sizing
  let primaryAxisSizing: string | undefined;
  let counterAxisSizing: string | undefined;
  if (isAutoLayout) {
    const pMode = node.primaryAxisSizingMode;
    const cMode = node.counterAxisSizingMode;
    primaryAxisSizing = pMode === 'AUTO' ? 'hug' : undefined; // FIXED is default
    counterAxisSizing = cMode === 'AUTO' ? 'hug' : undefined;
  }

  const frame: Frame = cleanUndefined({
    type: 'frame' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    // Fills
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
    // Corner radius
    cornerRadius: extractCornerRadius(node),
    cornerSmoothing:
      node.cornerSmoothing > 0 ? node.cornerSmoothing : undefined,
    // Auto-layout
    layoutMode,
    gap: isAutoLayout && node.itemSpacing > 0 ? node.itemSpacing : undefined,
    paddingTop: node.paddingTop > 0 ? node.paddingTop : undefined,
    paddingRight: node.paddingRight > 0 ? node.paddingRight : undefined,
    paddingBottom: node.paddingBottom > 0 ? node.paddingBottom : undefined,
    paddingLeft: node.paddingLeft > 0 ? node.paddingLeft : undefined,
    primaryAxisAlign: isAutoLayout
      ? figmaPrimaryAlignToDS(node.primaryAxisAlignItems)
      : undefined,
    counterAxisAlign: isAutoLayout
      ? figmaCounterAlignToDS(node.counterAxisAlignItems)
      : undefined,
    primaryAxisSizing: primaryAxisSizing as any,
    counterAxisSizing: counterAxisSizing as any,
    layoutWrap:
      isAutoLayout && node.layoutWrap === 'WRAP' ? 'wrap' : undefined,
    // Clipping
    clipsContent:
      node.clipsContent === false ? false : undefined, // true is default
    overflow: figmaOverflowToDS(
      (node as any).overflowDirection || 'NONE',
      node.clipsContent,
    ),
    // Children
    children: children.length > 0 ? children : undefined,
  }) as Frame;

  return frame;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT
// ═══════════════════════════════════════════════════════════════════════════

function textNodeToPrimitive(node: TextNode): Text {
  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  // Font properties (may be mixed)
  const fontName = node.fontName;
  const fontFamily =
    fontName !== figma.mixed ? fontName.family : undefined;
  const fontWeight =
    fontName !== figma.mixed
      ? figmaStyleToWeight(fontName.style)
      : undefined;
  const fontStyle =
    fontName !== figma.mixed && fontName.style.toLowerCase().includes('italic')
      ? ('italic' as const)
      : undefined;

  const fontSize = node.fontSize !== figma.mixed ? node.fontSize : undefined;

  // Text segments for mixed formatting
  const segments = extractTextSegments(node);

  return cleanUndefined({
    type: 'text' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    // Content
    text: node.characters,
    // Typography
    fontFamily,
    fontSize,
    fontWeight: fontWeight !== 400 ? fontWeight : undefined,
    fontStyle,
    lineHeight: extractLineHeight(node.lineHeight),
    letterSpacing: extractLetterSpacing(node.letterSpacing),
    paragraphSpacing:
      node.paragraphSpacing > 0 ? node.paragraphSpacing : undefined,
    paragraphIndent:
      node.paragraphIndent > 0 ? node.paragraphIndent : undefined,
    // Alignment
    textAlign: figmaTextAlignToDS(node.textAlignHorizontal),
    textAlignVertical: figmaTextAlignVerticalToDS(node.textAlignVertical),
    textAutoResize: figmaTextAutoResizeToDS(node.textAutoResize),
    maxLines:
      (node as any).maxLines != null && (node as any).maxLines > 0
        ? (node as any).maxLines
        : undefined,
    // Decoration
    textDecoration: figmaTextDecorationToDS(node.textDecoration),
    textCase: figmaTextCaseToDS(node.textCase),
    // Fills
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
    // Segments
    segments,
  }) as Text;
}

const WEIGHT_MAP: Record<string, number> = {
  Thin: 100,
  ExtraLight: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
  Black: 900,
};

function figmaStyleToWeight(style: string): number | undefined {
  for (const part of style.split(' ')) {
    if (WEIGHT_MAP[part] !== undefined) return WEIGHT_MAP[part];
  }
  return 400;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHAPES
// ═══════════════════════════════════════════════════════════════════════════

function rectangleNodeToPrimitive(node: RectangleNode): Rectangle | Image {
  // Check if this is actually an image (rectangle with image fill)
  const fills = node.fills as readonly Paint[];
  if (fills && fills.length > 0 && (fills[0] as any).type === 'IMAGE') {
    return imageFromRectangle(node);
  }

  const { fill, fills: fillsArr } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  return cleanUndefined({
    type: 'rectangle' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    fill,
    fills: fillsArr,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
    cornerRadius: extractCornerRadius(node),
    cornerSmoothing:
      node.cornerSmoothing > 0 ? node.cornerSmoothing : undefined,
  }) as Rectangle;
}

function imageFromRectangle(node: RectangleNode): Image {
  const fill = (node.fills as readonly Paint[])[0] as any;
  return cleanUndefined({
    type: 'image' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    imageRef: fill.imageHash || undefined,
    scaleMode: fill.scaleMode
      ? (fill.scaleMode.toLowerCase() as any)
      : undefined,
    cornerRadius: extractCornerRadius(node),
  }) as Image;
}

function ellipseNodeToPrimitive(node: EllipseNode): Ellipse {
  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  const arcData = node.arcData;
  const hasArc =
    arcData &&
    (arcData.startingAngle !== 0 ||
      arcData.endingAngle !== Math.PI * 2 ||
      arcData.innerRadius !== 0);

  return cleanUndefined({
    type: 'ellipse' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
    arcData: hasArc
      ? {
          startAngle: arcData.startingAngle,
          endAngle: arcData.endingAngle,
          innerRadius:
            arcData.innerRadius > 0 ? arcData.innerRadius : undefined,
        }
      : undefined,
  }) as Ellipse;
}

function vectorNodeToPrimitive(node: VectorNode): Vector {
  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  return cleanUndefined({
    type: 'vector' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
  }) as Vector;
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP
// ═══════════════════════════════════════════════════════════════════════════

async function groupNodeToPrimitive(
  node: GroupNode,
  depth: number,
): Promise<Group> {
  const children: Primitive[] = [];
  for (const child of node.children) {
    const prim = await nodeToPrimitive(child, depth + 1);
    if (prim) children.push(prim);
  }

  return cleanUndefined({
    type: 'group' as const,
    ...baseProps(node),
    ...positionProps(node),
    children,
  }) as Group;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW SHAPE TYPES
// ═══════════════════════════════════════════════════════════════════════════

function lineNodeToPrimitive(node: LineNode): Line {
  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  return cleanUndefined({
    type: 'line' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
  }) as Line;
}

function starNodeToPrimitive(node: StarNode): Star {
  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  return cleanUndefined({
    type: 'star' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
    pointCount: node.pointCount !== 5 ? node.pointCount : undefined,
    innerRadius: node.innerRadius !== 0.382 ? node.innerRadius : undefined,
    cornerRadius:
      node.cornerRadius > 0 ? node.cornerRadius : undefined,
  }) as Star;
}

function polygonNodeToPrimitive(node: PolygonNode): Polygon {
  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  return cleanUndefined({
    type: 'polygon' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
    pointCount: node.pointCount !== 3 ? node.pointCount : undefined,
    cornerRadius:
      node.cornerRadius > 0 ? node.cornerRadius : undefined,
  }) as Polygon;
}

async function booleanOpNodeToPrimitive(
  node: BooleanOperationNode,
  depth: number,
): Promise<BooleanOperation> {
  const { fill, fills } = extractFills(node.fills);
  const { stroke, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = extractStrokes(node);

  const opMap: Record<string, string> = {
    UNION: 'union',
    SUBTRACT: 'subtract',
    INTERSECT: 'intersect',
    EXCLUDE: 'exclude',
  };

  const children: Primitive[] = [];
  for (const child of node.children) {
    const prim = await nodeToPrimitive(child, depth + 1);
    if (prim) children.push(prim);
  }

  return cleanUndefined({
    type: 'boolean-operation' as const,
    ...baseProps(node),
    ...positionProps(node),
    ...sizeProps(node),
    fill,
    fills,
    stroke,
    strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight,
    operation: (opMap[node.booleanOperation] || 'union') as any,
    children,
  }) as BooleanOperation;
}
