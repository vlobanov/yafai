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

export type ServerToPluginMessage = RenderSlideMessage | SnapshotRequestMessage;

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

export type PluginToServerMessage =
  | PluginReadyMessage
  | RenderResultMessage
  | ValidationResultMessage
  | SnapshotResultMessage;
