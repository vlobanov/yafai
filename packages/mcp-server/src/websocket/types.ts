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

export type ServerToPluginMessage =
  | RenderSlideMessage
  | SnapshotRequestMessage
  | SelectionHtmlRequestMessage;

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

export type PluginToServerMessage =
  | PluginReadyMessage
  | RenderResultMessage
  | ValidationResultMessage
  | SnapshotResultMessage
  | SelectionHtmlResultMessage;
