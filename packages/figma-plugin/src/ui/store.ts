import { create } from 'zustand';
import { wsClient, DEFAULT_MCP_URL } from './websocket';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

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
  activeTab: 'validation' | 'settings';
  setActiveTab: (tab: 'validation' | 'settings') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Connection state
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  backendUrl: DEFAULT_MCP_URL,
  setBackendUrl: (url) => set({ backendUrl: url }),

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
  activeTab: 'validation',
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
        // Forward render result to MCP server via WS
        wsClient.sendToWs({
          type: 'render:result',
          slideId: msg.slideId,
          success: msg.success,
          nodeId: msg.nodeId,
          error: msg.error,
        });

        if (msg.success) {
          console.log('[Yafai UI] Render success:', { nodeId: msg.nodeId });
          store.setLastRenderNodeId(msg.nodeId);
          if (msg.warnings?.length) {
            msg.warnings.forEach((w: RenderWarning) => {
              console.warn('[Yafai UI] Render warning:', w);
              store.addRenderWarning(w);
            });
          }
        } else {
          console.error('[Yafai UI] Render error:', msg.error);
        }
        break;

      case 'validation-result':
        // Forward validation result to MCP server via WS
        wsClient.sendToWs({
          type: 'validation:result',
          slideId: msg.slideId,
          errors: msg.errors || [],
        });

        console.log('[Yafai UI] Validation result:', { nodeId: msg.nodeId, errors: msg.errors });
        store.setValidationErrors(msg.errors || []);
        break;

      case 'snapshot-result':
        console.log('[Yafai UI] Snapshot captured for slide:', msg.slideId);
        // Forward snapshot to MCP server
        wsClient.sendToWs({
          type: 'snapshot:result',
          slideId: msg.slideId,
          imageBase64: msg.imageBase64,
        });
        break;

      case 'error':
        console.error('[Yafai UI] Plugin error:', msg.message);
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}
