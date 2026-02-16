/**
 * Yafai AI Figma Plugin - Main Code
 *
 * This is the main entry point for the Figma plugin.
 * It handles:
 * - Communication with the UI
 * - Rendering primitives to Figma nodes
 * - Validation of rendered output
 */

import { type Primitive, parseDSL } from '@yafai/primitives';
import { render, renderAll } from './renderer/index.js';

// Plugin configuration
const PLUGIN_WIDTH = 400;
const PLUGIN_HEIGHT = 600;

// Plugin data keys for storing metadata on Figma nodes
const PLUGIN_DATA_SLIDE_ID = 'yafai:slideId';
const PLUGIN_DATA_NODE_ID = 'yafai:nodeId';

/**
 * Message types from UI to plugin
 */
interface RenderMessage {
  type: 'render';
  primitive: Primitive;
  options?: {
    x?: number;
    y?: number;
    select?: boolean;
  };
}

interface RenderBatchMessage {
  type: 'render-batch';
  primitives: Primitive[];
}

interface RenderDSLMessage {
  type: 'render-dsl';
  dsl: string;
  slideId?: string;
}

interface ValidateMessage {
  type: 'validate';
  nodeId: string;
}

type PluginMessage =
  | RenderMessage
  | RenderBatchMessage
  | RenderDSLMessage
  | ValidateMessage;

/**
 * Message types from plugin to UI
 */
interface RenderResultMessage {
  type: 'render-result';
  success: boolean;
  nodeId?: string;
  warnings?: Array<{ type: string; message: string }>;
  error?: string;
}

interface ValidationResultMessage {
  type: 'validation-result';
  nodeId: string;
  errors: ValidationError[];
}

interface ValidationError {
  type: 'text-overflow' | 'out-of-bounds' | 'overlap';
  element: string;
  message: string;
  suggestion?: string;
}

/**
 * Initialize the plugin
 */
function init() {
  // Show the UI with theme colors enabled for light/dark mode support
  figma.showUI(__html__, {
    width: PLUGIN_WIDTH,
    height: PLUGIN_HEIGHT,
    title: 'Yafai AI',
    themeColors: true, // Enable Figma CSS variables for theming
  });

  // Handle messages from UI
  figma.ui.onmessage = handleMessage;

  console.log('Yafai AI plugin initialized');
}

/**
 * Handle incoming messages from UI
 */
async function handleMessage(msg: PluginMessage) {
  console.log('[Yafai Plugin] Received message:', msg.type);
  try {
    switch (msg.type) {
      case 'render':
        await handleRender(msg);
        break;

      case 'render-batch':
        await handleRenderBatch(msg);
        break;

      case 'render-dsl':
        await handleRenderDSL(msg);
        break;

      case 'validate':
        await handleValidate(msg);
        break;

      default:
        console.warn('[Yafai Plugin] Unknown message type:', (msg as { type: string }).type);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Yafai Plugin] Error handling message:', {
      type: msg.type,
      error: errorMessage,
      stack: errorStack,
    });
    figma.ui.postMessage({
      type: 'error',
      message: errorMessage,
    });
  }
}

/**
 * Handle render request
 */
async function handleRender(msg: RenderMessage) {
  try {
    const result = await render(msg.primitive, {
      x: msg.options?.x,
      y: msg.options?.y,
      select: msg.options?.select ?? true,
    });

    const response: RenderResultMessage = {
      type: 'render-result',
      success: true,
      nodeId: result.node.id,
      warnings: result.warnings,
    };

    figma.ui.postMessage(response);
  } catch (error) {
    const response: RenderResultMessage = {
      type: 'render-result',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

    figma.ui.postMessage(response);
  }
}

/**
 * Handle batch render request
 */
async function handleRenderBatch(msg: RenderBatchMessage) {
  const results = await renderAll(msg.primitives, { select: true });

  for (const result of results) {
    figma.ui.postMessage({
      type: 'render-result',
      success: true,
      nodeId: result.node.id,
      warnings: result.warnings,
    } as RenderResultMessage);
  }
}

/**
 * Find an existing slide on the current page by its slide ID
 * Slides are stored as top-level children of the page with plugin data
 */
async function findExistingSlide(slideId: string): Promise<FrameNode | null> {
  // Search top-level children of the current page
  for (const child of figma.currentPage.children) {
    if (child.type === 'FRAME') {
      const storedSlideId = child.getPluginData(PLUGIN_DATA_SLIDE_ID);
      if (storedSlideId === slideId) {
        console.log('[Yafai Plugin] Found existing slide:', slideId, 'node:', child.id);
        return child;
      }
    }
  }
  return null;
}

/**
 * Store slide ID and node IDs in plugin data on the rendered nodes
 */
function storePluginData(node: SceneNode, slideId: string, primitive: Primitive): void {
  // Store slide ID on root node
  node.setPluginData(PLUGIN_DATA_SLIDE_ID, slideId);
  
  // Store the DSL node ID on the Figma node if it has one
  if (primitive.id) {
    node.setPluginData(PLUGIN_DATA_NODE_ID, primitive.id);
  }
  
  // Recursively store node IDs on children
  if ('children' in node && 'children' in primitive) {
    const figmaChildren = (node as FrameNode).children;
    const primitiveChildren = primitive.children as Primitive[] | undefined;
    
    if (primitiveChildren) {
      // Match children by index (they should be in the same order)
      for (let i = 0; i < Math.min(figmaChildren.length, primitiveChildren.length); i++) {
        const figmaChild = figmaChildren[i];
        const primitiveChild = primitiveChildren[i];
        if (primitiveChild.id) {
          figmaChild.setPluginData(PLUGIN_DATA_NODE_ID, primitiveChild.id);
        }
        // Recurse into children
        if ('children' in figmaChild && 'children' in primitiveChild) {
          storePluginDataRecursive(figmaChild as FrameNode, primitiveChild);
        }
      }
    }
  }
}

/**
 * Recursively store node IDs on children
 */
function storePluginDataRecursive(node: FrameNode | GroupNode, primitive: Primitive): void {
  if (!('children' in primitive) || !primitive.children) return;
  
  const primitiveChildren = primitive.children as Primitive[];
  const figmaChildren = node.children;
  
  for (let i = 0; i < Math.min(figmaChildren.length, primitiveChildren.length); i++) {
    const figmaChild = figmaChildren[i];
    const primitiveChild = primitiveChildren[i];
    
    if (primitiveChild.id) {
      figmaChild.setPluginData(PLUGIN_DATA_NODE_ID, primitiveChild.id);
    }
    
    if ('children' in figmaChild && 'children' in primitiveChild) {
      storePluginDataRecursive(figmaChild as FrameNode, primitiveChild);
    }
  }
}

/**
 * Handle DSL render request (from backend via WebSocket)
 */
async function handleRenderDSL(msg: RenderDSLMessage) {
  console.log('[Yafai Plugin] Rendering DSL:', {
    slideId: msg.slideId,
    dslLength: msg.dsl?.length || 0,
    dslPreview: msg.dsl?.slice(0, 300) + '...',
  });
  
  try {
    // Parse the DSL XML to a Primitive
    console.log('[Yafai Plugin] Parsing DSL...');
    const primitive = parseDSL(msg.dsl);
    console.log('[Yafai Plugin] Parse successful, primitive type:', primitive.type);

    // Check if a slide with this ID already exists
    let existingSlide: FrameNode | null = null;
    let existingPosition: { x: number; y: number } | null = null;
    
    if (msg.slideId) {
      existingSlide = await findExistingSlide(msg.slideId);
      if (existingSlide) {
        // Save the position so we can place the new slide in the same spot
        existingPosition = { x: existingSlide.x, y: existingSlide.y };
        console.log('[Yafai Plugin] Removing existing slide at position:', existingPosition);
        existingSlide.remove();
      }
    }

    // Render to Figma
    console.log('[Yafai Plugin] Rendering to Figma...');
    const result = await render(primitive, { 
      select: true,
      x: existingPosition?.x,
      y: existingPosition?.y,
    });
    console.log('[Yafai Plugin] Render successful, nodeId:', result.node.id);

    // Store slide ID in plugin data so we can find it later
    if (msg.slideId) {
      storePluginData(result.node, msg.slideId, primitive);
      console.log('[Yafai Plugin] Stored slideId in plugin data:', msg.slideId);
    }

    const response: RenderResultMessage = {
      type: 'render-result',
      success: true,
      nodeId: result.node.id,
      warnings: result.warnings,
    };

    figma.ui.postMessage(response);

    // Validate the rendered node
    const errors = validateNode(result.node);
    if (errors.length > 0) {
      console.warn('[Yafai Plugin] Validation errors:', errors);
      figma.ui.postMessage({
        type: 'validation-result',
        nodeId: result.node.id,
        errors,
      } as ValidationResultMessage);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Yafai Plugin] DSL render failed:', {
      error: errorMessage,
      dsl: msg.dsl,
    });
    
    const response: RenderResultMessage = {
      type: 'render-result',
      success: false,
      error: errorMessage,
    };

    figma.ui.postMessage(response);
  }
}

/**
 * Handle validation request
 */
async function handleValidate(msg: ValidateMessage) {
  const node = await figma.getNodeByIdAsync(msg.nodeId);

  if (!node || !('absoluteBoundingBox' in node)) {
    figma.ui.postMessage({
      type: 'validation-result',
      nodeId: msg.nodeId,
      errors: [
        {
          type: 'out-of-bounds',
          element: msg.nodeId,
          message: 'Node not found or has no bounds',
        },
      ],
    } as ValidationResultMessage);
    return;
  }

  const errors = validateNode(node as SceneNode);

  figma.ui.postMessage({
    type: 'validation-result',
    nodeId: msg.nodeId,
    errors,
  } as ValidationResultMessage);
}

/**
 * Validate a node for common issues
 */
function validateNode(node: SceneNode): ValidationError[] {
  const errors: ValidationError[] = [];

  // Get node bounds
  if (!('absoluteBoundingBox' in node) || !node.absoluteBoundingBox) {
    return errors;
  }

  const bounds = node.absoluteBoundingBox;

  // Check if node is within slide bounds (assuming 1920x1080)
  const SLIDE_WIDTH = 1920;
  const SLIDE_HEIGHT = 1080;
  const MARGIN = 110;

  // Check right edge
  if (bounds.x + bounds.width > SLIDE_WIDTH - MARGIN) {
    errors.push({
      type: 'out-of-bounds',
      element: node.name || node.id,
      message: `Extends ${Math.round(bounds.x + bounds.width - (SLIDE_WIDTH - MARGIN))}px past right margin`,
      suggestion: 'Move left or reduce width',
    });
  }

  // Check bottom edge
  if (bounds.y + bounds.height > SLIDE_HEIGHT - MARGIN) {
    errors.push({
      type: 'out-of-bounds',
      element: node.name || node.id,
      message: `Extends ${Math.round(bounds.y + bounds.height - (SLIDE_HEIGHT - MARGIN))}px past bottom margin`,
      suggestion: 'Move up or reduce height',
    });
  }

  // Check left margin
  if (bounds.x < MARGIN) {
    errors.push({
      type: 'out-of-bounds',
      element: node.name || node.id,
      message: `Starts ${Math.round(MARGIN - bounds.x)}px inside left margin`,
      suggestion: 'Move right',
    });
  }

  // Check for text overflow
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    // Text overflow detection would require more sophisticated checking
    // For now, we check if text is truncated
    if (textNode.textAutoResize === 'TRUNCATE') {
      // Could check if actual content exceeds bounds
    }
  }

  // Recursively validate children
  if ('children' in node) {
    for (const child of (node as FrameNode).children) {
      errors.push(...validateNode(child));
    }
  }

  return errors;
}

// Start the plugin
init();
