import { postToPlugin, useAppStore } from './store';

// ═══════════════════════════════════════════════════════════════════════════
// MCP PROTOCOL TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface McpRenderSlide {
  type: 'render:slide';
  slideId: string;
  dsl: string;
}

interface McpSnapshotRequest {
  type: 'snapshot:request';
  slideId: string;
}

type McpServerMessage = McpRenderSlide | McpSnapshotRequest;

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET CLIENT
// ═══════════════════════════════════════════════════════════════════════════

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string): void {
    const store = useAppStore.getState();

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    store.setConnectionStatus('connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected (MCP mode)');
        store.setConnectionStatus('connected');
        this.reconnectAttempts = 0;
        this.send({ type: 'plugin:ready' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message as McpServerMessage);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        store.setConnectionStatus('disconnected');
        this.ws = null;

        // Attempt reconnect if not intentional close
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * this.reconnectAttempts;
          console.log(
            `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
          );
          setTimeout(() => this.connect(url), delay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        store.setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      store.setConnectionStatus('error');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
  }

  private send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Forward a plugin message to the MCP server via WS.
   */
  sendToWs(msg: unknown): void {
    this.send(msg);
  }

  private handleMessage(message: McpServerMessage): void {
    switch (message.type) {
      case 'render:slide':
        console.log('[MCP] Rendering slide:', message.slideId);
        postToPlugin({
          type: 'render-dsl',
          dsl: message.dsl,
          slideId: message.slideId,
        });
        break;

      case 'snapshot:request':
        console.log('[MCP] Snapshot requested:', message.slideId);
        postToPlugin({
          type: 'export-snapshot',
          slideId: message.slideId,
        });
        break;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

// Default MCP server URL
export const DEFAULT_MCP_URL = 'ws://localhost:3002/ws';
