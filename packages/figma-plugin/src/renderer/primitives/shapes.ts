/**
 * Shape primitive renderers
 *
 * Creates Figma nodes from Rectangle, Ellipse, Vector, Image primitives
 */

import type {
  Effect,
  Ellipse,
  Image,
  Rectangle,
  Vector,
} from '@yafai/primitives';
import { fillsFromColor } from '../colors.js';
import { effectsToFigma } from '../effects.js';
import type { RenderContext } from '../types.js';

/**
 * Apply common properties to a shape node
 */
function applyBaseProps(
  node: SceneNode & {
    fills?: readonly Paint[] | typeof figma.mixed;
    strokes?: readonly Paint[];
    strokeWeight?: number;
    effects?: readonly Effect[];
    opacity?: number;
    visible?: boolean;
    locked?: boolean;
    x?: number;
    y?: number;
    rotation?: number;
  },
  props: {
    id?: string;
    name?: string;
    visible?: boolean;
    opacity?: number;
    locked?: boolean;
    x?: number;
    y?: number;
    rotation?: number;
    fill?: string;
    stroke?: string | { color?: string; weight: number };
    strokeWeight?: number;
    effects?: Effect[];
  },
): void {
  if (props.name || props.id) node.name = (props.name || props.id)!;
  if (props.visible !== undefined) node.visible = props.visible;
  if (props.opacity !== undefined) node.opacity = props.opacity;
  if (props.locked !== undefined) node.locked = props.locked;

  if (props.x !== undefined) node.x = props.x;
  if (props.y !== undefined) node.y = props.y;
  if (props.rotation !== undefined) node.rotation = props.rotation;

  // Fill
  if (props.fill && 'fills' in node) {
    (node as any).fills = fillsFromColor(props.fill);
  }

  // Stroke
  if (props.stroke && 'strokes' in node) {
    const strokeColor =
      typeof props.stroke === 'string' ? props.stroke : props.stroke.color;
    const strokeWeight =
      typeof props.stroke === 'string'
        ? (props.strokeWeight ?? 1)
        : props.stroke.weight;

    if (strokeColor) {
      (node as any).strokes = fillsFromColor(strokeColor);
      (node as any).strokeWeight = strokeWeight;
    }
  }

  // Effects
  if (props.effects && props.effects.length > 0 && 'effects' in node) {
    (node as any).effects = effectsToFigma(props.effects);
  }
}

/**
 * Render a Rectangle primitive to Figma
 */
export async function renderRectangle(
  rect: Rectangle,
  _ctx: RenderContext,
): Promise<RectangleNode> {
  const node = figma.createRectangle();

  applyBaseProps(node, rect);

  // Size
  const width = typeof rect.width === 'number' ? rect.width : 100;
  const height = typeof rect.height === 'number' ? rect.height : 100;
  node.resize(width, height);

  // Corner radius
  if (rect.cornerRadius !== undefined) {
    if (typeof rect.cornerRadius === 'number') {
      node.cornerRadius = rect.cornerRadius;
    } else {
      node.topLeftRadius = rect.cornerRadius[0];
      node.topRightRadius = rect.cornerRadius[1];
      node.bottomRightRadius = rect.cornerRadius[2];
      node.bottomLeftRadius = rect.cornerRadius[3];
    }
  }

  // Corner smoothing
  if (rect.cornerSmoothing !== undefined) {
    node.cornerSmoothing = rect.cornerSmoothing;
  }

  return node;
}

/**
 * Render an Ellipse primitive to Figma
 */
export async function renderEllipse(
  ellipse: Ellipse,
  _ctx: RenderContext,
): Promise<EllipseNode> {
  const node = figma.createEllipse();

  applyBaseProps(node, ellipse);

  // Size
  const width = typeof ellipse.width === 'number' ? ellipse.width : 100;
  const height = typeof ellipse.height === 'number' ? ellipse.height : 100;
  node.resize(width, height);

  // Arc data (for pie charts, etc.)
  if (ellipse.arcData) {
    node.arcData = {
      startingAngle: ellipse.arcData.startAngle,
      endingAngle: ellipse.arcData.endAngle,
      innerRadius: ellipse.arcData.innerRadius ?? 0,
    };
  }

  return node;
}

/**
 * Render a Vector primitive to Figma
 */
export async function renderVector(
  vector: Vector,
  ctx: RenderContext,
): Promise<VectorNode | FrameNode> {
  // If full SVG is provided, use Figma's SVG import
  if (vector.svg) {
    const svgNode = figma.createNodeFromSvg(vector.svg);

    // Apply position
    if (vector.x !== undefined) svgNode.x = vector.x;
    if (vector.y !== undefined) svgNode.y = vector.y;
    if (vector.name || vector.id) svgNode.name = (vector.name || vector.id)!;
    if (vector.visible !== undefined) svgNode.visible = vector.visible;
    if (vector.opacity !== undefined) svgNode.opacity = vector.opacity;

    // Resize if dimensions specified
    if (typeof vector.width === 'number' && typeof vector.height === 'number') {
      svgNode.resize(vector.width, vector.height);
    }

    return svgNode;
  }

  // Create vector from path data
  const node = figma.createVector();

  applyBaseProps(node, vector);

  // Size
  if (typeof vector.width === 'number' && typeof vector.height === 'number') {
    node.resize(vector.width, vector.height);
  }

  // Path data
  if (vector.path) {
    try {
      // Figma expects vectorPaths format
      node.vectorPaths = [
        {
          windingRule: vector.windingRule === 'evenodd' ? 'EVENODD' : 'NONZERO',
          data: vector.path,
        },
      ];
    } catch (e) {
      ctx.warnings.push({
        type: 'invalid-property',
        message: `Invalid vector path: ${e}`,
        property: 'path',
      });
    }
  }

  return node;
}

/**
 * Render an Image primitive to Figma
 */
export async function renderImage(
  image: Image,
  ctx: RenderContext,
): Promise<RectangleNode> {
  // Images in Figma are rectangles with image fills
  const node = figma.createRectangle();

  if (image.name || image.id) node.name = (image.name || image.id)!;
  if (image.visible !== undefined) node.visible = image.visible;
  if (image.opacity !== undefined) node.opacity = image.opacity;

  // Position
  if (image.x !== undefined) node.x = image.x;
  if (image.y !== undefined) node.y = image.y;

  // Size
  const width = typeof image.width === 'number' ? image.width : 200;
  const height = typeof image.height === 'number' ? image.height : 200;
  node.resize(width, height);

  // Corner radius
  if (image.cornerRadius !== undefined) {
    if (typeof image.cornerRadius === 'number') {
      node.cornerRadius = image.cornerRadius;
    } else {
      node.topLeftRadius = image.cornerRadius[0];
      node.topRightRadius = image.cornerRadius[1];
      node.bottomRightRadius = image.cornerRadius[2];
      node.bottomLeftRadius = image.cornerRadius[3];
    }
  }

  // Image fill
  if (image.imageRef) {
    // Use existing image from cache
    const cachedImage = ctx.imageCache.get(image.imageRef);
    if (cachedImage) {
      const scaleModeMap: Record<string, 'FILL' | 'FIT' | 'CROP' | 'TILE'> = {
        fill: 'FILL',
        fit: 'FIT',
        crop: 'CROP',
        tile: 'TILE',
      };

      node.fills = [
        {
          type: 'IMAGE',
          imageHash: cachedImage.hash,
          scaleMode: scaleModeMap[image.scaleMode ?? 'fill'],
        },
      ];
    } else {
      ctx.warnings.push({
        type: 'image-not-found',
        message: `Image not found: ${image.imageRef}`,
      });
      // Show placeholder gray fill
      node.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    }
  } else if (image.src) {
    // URL-based image - would need to be fetched
    ctx.warnings.push({
      type: 'unsupported',
      message:
        'URL-based images require backend fetching - use imageRef instead',
      property: 'src',
    });
    node.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  } else {
    // No image source - placeholder
    node.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  }

  return node;
}
