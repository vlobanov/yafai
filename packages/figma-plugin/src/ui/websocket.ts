import { postToPlugin, useAppStore } from './store';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (matching backend protocol)
// ═══════════════════════════════════════════════════════════════════════════

interface ClientChatMessage {
  type: 'chat:message';
  sessionId: string;
  content: string;
}

interface ClientSessionStart {
  type: 'session:start';
  deckId?: string;
}

interface ServerChatResponse {
  type: 'chat:response';
  sessionId: string;
  content: string;
  isStreaming: boolean;
  done: boolean;
}

interface ServerChatThinking {
  type: 'chat:thinking';
  sessionId: string;
  status: string;
}

interface ServerToolCall {
  type: 'tool:call';
  sessionId: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  status: 'started' | 'completed' | 'error';
  result?: string;
  error?: string;
}

interface ServerRenderSlide {
  type: 'render:slide';
  sessionId: string;
  slideId: string;
  dsl: string;
}

interface ServerSessionCreated {
  type: 'session:created';
  sessionId: string;
  deckId: string;
}

interface ServerError {
  type: 'error';
  sessionId?: string;
  message: string;
  code: string;
}

type ServerMessage =
  | ServerChatResponse
  | ServerChatThinking
  | ServerToolCall
  | ServerRenderSlide
  | ServerSessionCreated
  | ServerError;

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET CLIENT
// ═══════════════════════════════════════════════════════════════════════════

class WebSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private deckId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentAssistantMessageId: string | null = null;
  private accumulatedContent = '';

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
        console.log('WebSocket connected');
        store.setConnectionStatus('connected');
        this.reconnectAttempts = 0;

        // Start a session
        this.send({ type: 'session:start' } as ClientSessionStart);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        store.setConnectionStatus('disconnected');
        this.ws = null;
        this.sessionId = null;

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
      this.sessionId = null;
    }
  }

  private send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  sendChatMessage(content: string): void {
    if (!this.sessionId) {
      console.warn('No session ID, cannot send message');
      const store = useAppStore.getState();
      store.addMessage({
        role: 'system',
        content:
          'Not connected to backend. Please check your connection settings.',
        status: 'error',
      });
      store.setIsLoading(false);
      return;
    }

    this.send({
      type: 'chat:message',
      sessionId: this.sessionId,
      content,
    } as ClientChatMessage);
  }

  private handleMessage(message: ServerMessage): void {
    const store = useAppStore.getState();

    switch (message.type) {
      case 'session:created':
        this.sessionId = message.sessionId;
        this.deckId = message.deckId;
        console.log(
          `Session created: ${message.sessionId}, deck: ${message.deckId}`,
        );
        store.addMessage({
          role: 'system',
          content: 'Connected to Yafai AI backend. Ready to create slides!',
          status: 'success',
        });
        break;

      case 'chat:thinking':
        // Create or update assistant message for tool calls
        if (!this.currentAssistantMessageId) {
          this.currentAssistantMessageId = store.addMessage({
            role: 'assistant',
            content: '',
            status: 'pending',
            toolCalls: [],
          });
        }
        break;

      case 'tool:call':
        // Ensure we have an assistant message to attach tool calls to
        if (!this.currentAssistantMessageId) {
          this.currentAssistantMessageId = store.addMessage({
            role: 'assistant',
            content: '',
            status: 'pending',
            toolCalls: [],
          });
        }

        if (message.status === 'started') {
          // Add new tool call
          store.addToolCallToMessage(this.currentAssistantMessageId, {
            id: message.toolCallId,
            toolName: message.toolName,
            args: message.args,
            status: 'started',
          });
        } else {
          // Update existing tool call with result
          store.updateToolCall(
            this.currentAssistantMessageId,
            message.toolCallId,
            {
              status: message.status,
              result: message.result,
              error: message.error,
            },
          );
        }
        break;

      case 'chat:response':
        if (message.isStreaming) {
          // Accumulate streaming content
          this.accumulatedContent += message.content;

          if (!this.currentAssistantMessageId) {
            // Create new assistant message
            this.currentAssistantMessageId = store.addMessage({
              role: 'assistant',
              content: this.accumulatedContent,
              status: 'pending',
            });
          } else {
            // Update existing message with accumulated content
            store.updateMessage(this.currentAssistantMessageId, {
              content: this.accumulatedContent,
            });
          }
        }

        if (message.done) {
          // Update existing message or create new one with final content
          if (this.currentAssistantMessageId) {
            store.updateMessage(this.currentAssistantMessageId, {
              content: message.content || this.accumulatedContent,
              status: 'success',
            });
          } else if (message.content) {
            // No existing message, create one with the content
            store.addMessage({
              role: 'assistant',
              content: message.content,
              status: 'success',
            });
          }
          this.currentAssistantMessageId = null;
          this.accumulatedContent = '';
          store.setIsLoading(false);
        }
        break;

      case 'render:slide':
        // Send DSL to Figma plugin for rendering
        console.log('Received slide to render:', message.slideId);
        postToPlugin({
          type: 'render-dsl',
          dsl: message.dsl,
          slideId: message.slideId,
        });
        store.addMessage({
          role: 'system',
          content: `Rendering slide ${message.slideId}...`,
        });
        break;

      case 'error':
        store.addMessage({
          role: 'system',
          content: `Error: ${message.message}`,
          status: 'error',
        });
        store.setIsLoading(false);
        this.currentAssistantMessageId = null;
        this.accumulatedContent = '';
        break;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getDeckId(): string | null {
    return this.deckId;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

// Default backend URL
export const DEFAULT_BACKEND_URL = 'ws://localhost:3001/ws';
