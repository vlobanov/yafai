/**
 * WebSocket message types for MCP Server <-> Figma Plugin communication.
 * Compatible with existing backend protocol shapes where possible.
 */

// ============================================================================
// Shared
// ============================================================================

export interface ValidationError {
  type: 'text-overflow' | 'out-of-bounds' | 'overlap' | 'missing-font';
  element: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// Server -> Plugin
// ============================================================================

export interface RenderSlideMessage {
  type: 'render:slide';
  slideId: string;
  dsl: string;
}

export interface SnapshotRequestMessage {
  type: 'snapshot:request';
  slideId: string;
}

export interface SelectionHtmlRequestMessage {
  type: 'selection:html:request';
  requestId: string;
}

export interface SelectionSnapshotRequestMessage {
  type: 'snapshot:selection:request';
  requestId: string;
}

export interface SelectionDslRequestMessage {
  type: 'selection:dsl:request';
  requestId: string;
}

export interface GetNodeRequestMessage {
  type: 'node:get:request';
  requestId: string;
  nodeId: string;
}

export interface UpdateNodeRequestMessage {
  type: 'node:update:request';
  requestId: string;
  nodeId: string;
  properties: Record<string, unknown>;
}

export type ServerToPluginMessage =
  | RenderSlideMessage
  | SnapshotRequestMessage
  | SelectionHtmlRequestMessage
  | SelectionSnapshotRequestMessage
  | SelectionDslRequestMessage
  | GetNodeRequestMessage
  | UpdateNodeRequestMessage;

// ============================================================================
// Plugin -> Server
// ============================================================================

export interface PluginReadyMessage {
  type: 'plugin:ready';
}

export interface RenderResultMessage {
  type: 'render:result';
  slideId: string;
  success: boolean;
  nodeId?: string;
  error?: string;
}

export interface ValidationResultMessage {
  type: 'validation:result';
  slideId: string;
  errors: ValidationError[];
}

export interface SnapshotResultMessage {
  type: 'snapshot:result';
  slideId: string;
  imageBase64: string;
}

export interface SelectionHtmlResultMessage {
  type: 'selection:html:result';
  requestId: string;
  success: boolean;
  html?: string;
  nodeCount?: number;
  error?: string;
}

export interface SelectionSnapshotResultMessage {
  type: 'snapshot:selection:result';
  requestId: string;
  success: boolean;
  imageBase64?: string;
  nodeCount?: number;
  error?: string;
}

export interface SelectionDslResultMessage {
  type: 'selection:dsl:result';
  requestId: string;
  success: boolean;
  dsl?: string;
  nodeCount?: number;
  error?: string;
}

export interface GetNodeResultMessage {
  type: 'node:get:result';
  requestId: string;
  success: boolean;
  dsl?: string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  error?: string;
}

export interface UpdateNodeResultMessage {
  type: 'node:update:result';
  requestId: string;
  success: boolean;
  nodeId?: string;
  updatedProperties?: string[];
  dsl?: string;
  error?: string;
}

export type PluginToServerMessage =
  | PluginReadyMessage
  | RenderResultMessage
  | ValidationResultMessage
  | SnapshotResultMessage
  | SelectionHtmlResultMessage
  | SelectionSnapshotResultMessage
  | SelectionDslResultMessage
  | GetNodeResultMessage
  | UpdateNodeResultMessage;
