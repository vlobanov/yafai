/**
 * WebSocket message types for communication between Figma plugin and backend
 */

// ============================================================================
// Client -> Server Messages (from Figma plugin)
// ============================================================================

export interface ClientChatMessage {
  type: 'chat:message';
  sessionId: string;
  content: string;
}

export interface ClientValidationResult {
  type: 'validation:result';
  sessionId: string;
  slideId: string;
  errors: ValidationError[];
}

export interface ClientSessionStart {
  type: 'session:start';
  deckId?: string;
}

export interface ClientSessionEnd {
  type: 'session:end';
  sessionId: string;
}

export interface ClientSnapshotResult {
  type: 'snapshot:result';
  sessionId: string;
  slideId: string;
  imageBase64: string;
}

export type ClientMessage =
  | ClientChatMessage
  | ClientValidationResult
  | ClientSnapshotResult
  | ClientSessionStart
  | ClientSessionEnd;

// ============================================================================
// Server -> Client Messages (to Figma plugin)
// ============================================================================

export interface ServerChatResponse {
  type: 'chat:response';
  sessionId: string;
  content: string;
  isStreaming: boolean;
  done: boolean;
}

export interface ServerChatThinking {
  type: 'chat:thinking';
  sessionId: string;
  status: string;
}

export interface ServerToolCall {
  type: 'tool:call';
  sessionId: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  status: 'started' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export interface ServerRenderSlide {
  type: 'render:slide';
  sessionId: string;
  slideId: string;
  dsl: string; // XML DSL for the slide
}

export interface ServerSessionCreated {
  type: 'session:created';
  sessionId: string;
  deckId: string;
}

export interface ServerError {
  type: 'error';
  sessionId?: string;
  message: string;
  code: string;
}

export type ServerMessage =
  | ServerChatResponse
  | ServerChatThinking
  | ServerToolCall
  | ServerRenderSlide
  | ServerSessionCreated
  | ServerError;

// ============================================================================
// Shared Types
// ============================================================================

export interface ValidationError {
  type: 'text-overflow' | 'out-of-bounds' | 'overlap' | 'missing-font';
  element: string;
  message: string;
  suggestion?: string;
}
