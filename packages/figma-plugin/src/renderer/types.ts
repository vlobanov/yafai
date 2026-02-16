/**
 * Result of rendering a primitive to Figma
 */
export interface RenderResult {
  /** The created Figma node */
  node: SceneNode;

  /** Any warnings during rendering */
  warnings: RenderWarning[];
}

/**
 * Warning that occurred during rendering
 */
export interface RenderWarning {
  type: 'missing-font' | 'image-not-found' | 'invalid-property' | 'unsupported';
  message: string;
  nodeId?: string;
  property?: string;
}

/**
 * Options for rendering
 */
export interface RenderOptions {
  /** Parent node to render into */
  parent?: FrameNode | GroupNode | PageNode;

  /** Starting X position */
  x?: number;

  /** Starting Y position */
  y?: number;

  /** Whether to select the rendered nodes */
  select?: boolean;
}

/**
 * Context passed during rendering
 */
export interface RenderContext {
  /** Accumulated warnings */
  warnings: RenderWarning[];

  /** Font cache to avoid redundant loading */
  loadedFonts: Set<string>;

  /** Image cache */
  imageCache: Map<string, Image>;
}

/**
 * Create a new render context
 */
export function createRenderContext(): RenderContext {
  return {
    warnings: [],
    loadedFonts: new Set(),
    imageCache: new Map(),
  };
}
