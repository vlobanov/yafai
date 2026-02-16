import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  status: 'started' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
  toolCalls?: ToolCall[];
}

export interface RenderWarning {
  type: string;
  message: string;
}

export interface ValidationError {
  type: 'text-overflow' | 'out-of-bounds' | 'overlap';
  element: string;
  message: string;
  suggestion?: string;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

interface AppState {
  // Connection state
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  backendUrl: string;
  setBackendUrl: (url: string) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  addToolCallToMessage: (messageId: string, toolCall: ToolCall) => void;
  updateToolCall: (
    messageId: string,
    toolCallId: string,
    updates: Partial<ToolCall>,
  ) => void;
  clearMessages: () => void;

  // Input
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Render results
  lastRenderNodeId: string | null;
  setLastRenderNodeId: (id: string | null) => void;
  renderWarnings: RenderWarning[];
  addRenderWarning: (warning: RenderWarning) => void;
  clearRenderWarnings: () => void;

  // Validation
  validationErrors: ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;

  // UI state
  activeTab: 'chat' | 'validation' | 'settings';
  setActiveTab: (tab: 'chat' | 'validation' | 'settings') => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const DEFAULT_BACKEND_URL = 'ws://localhost:3001/ws';

export const useAppStore = create<AppState>((set, _get) => ({
  // Connection state
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  backendUrl: DEFAULT_BACKEND_URL,
  setBackendUrl: (url) => set({ backendUrl: url }),

  // Messages
  messages: [],
  addMessage: (message) => {
    const id = generateId();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id,
          timestamp: new Date(),
        },
      ],
    }));
    return id;
  },
  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg,
      ),
    }));
  },
  addToolCallToMessage: (messageId, toolCall) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, toolCalls: [...(msg.toolCalls || []), toolCall] }
          : msg,
      ),
    }));
  },
  updateToolCall: (messageId, toolCallId, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              toolCalls: (msg.toolCalls || []).map((tc) =>
                tc.id === toolCallId ? { ...tc, ...updates } : tc,
              ),
            }
          : msg,
      ),
    }));
  },
  clearMessages: () => set({ messages: [] }),

  // Input
  inputValue: '',
  setInputValue: (value) => set({ inputValue: value }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Render results
  lastRenderNodeId: null,
  setLastRenderNodeId: (id) => set({ lastRenderNodeId: id }),
  renderWarnings: [],
  addRenderWarning: (warning) => {
    set((state) => ({
      renderWarnings: [...state.renderWarnings, warning],
    }));
  },
  clearRenderWarnings: () => set({ renderWarnings: [] }),

  // Validation
  validationErrors: [],
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  clearValidationErrors: () => set({ validationErrors: [] }),

  // UI state
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

// ═══════════════════════════════════════════════════════════════════════════
// PLUGIN COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a message to the Figma plugin
 */
export function postToPlugin(message: unknown): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

/**
 * Set up listener for messages from the plugin
 */
export function setupPluginListener(): () => void {
  const handleMessage = (event: MessageEvent) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    const store = useAppStore.getState();

    switch (msg.type) {
      case 'render-result':
        if (msg.success) {
          console.log('[Yafai UI] Render success:', { nodeId: msg.nodeId });
          store.setLastRenderNodeId(msg.nodeId);
          store.addMessage({
            role: 'system',
            content: `Rendered successfully (node: ${msg.nodeId})`,
            status: 'success',
          });
          if (msg.warnings?.length) {
            msg.warnings.forEach((w: RenderWarning) => {
              console.warn('[Yafai UI] Render warning:', w);
              store.addRenderWarning(w);
              store.addMessage({
                role: 'system',
                content: `Warning: ${w.message}`,
                status: 'error',
              });
            });
          }
        } else {
          console.error('[Yafai UI] Render error:', msg.error);
          store.addMessage({
            role: 'system',
            content: `Render error: ${msg.error}`,
            status: 'error',
          });
        }
        store.setIsLoading(false);
        break;

      case 'validation-result':
        console.log('[Yafai UI] Validation result:', { nodeId: msg.nodeId, errors: msg.errors });
        store.setValidationErrors(msg.errors || []);
        if (msg.errors?.length) {
          msg.errors.forEach((e: ValidationError) => {
            console.warn('[Yafai UI] Validation error:', e);
            store.addMessage({
              role: 'system',
              content: `Validation: ${e.message}`,
              status: 'error',
            });
          });
        }
        break;

      case 'error':
        console.error('[Yafai UI] Plugin error:', msg.message);
        store.addMessage({
          role: 'system',
          content: `Error: ${msg.message}`,
          status: 'error',
        });
        store.setIsLoading(false);
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}
