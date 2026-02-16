import type { WebSocket } from '@fastify/websocket';
import { HumanMessage } from '@langchain/core/messages';
import { type YafaiAgent, createYafaiAgent } from '../agents/agent.js';
import { sessionManager } from '../services/session-manager.js';
import type {
  ClientMessage,
  ServerChatResponse,
  ServerMessage,
  ServerRenderSlide,
  ServerToolCall,
} from './types.js';

// Store active connections
const connections = new Map<
  string,
  { socket: WebSocket; sessionId: string | null }
>();

// Agent instance (shared across connections for now)
let agent: YafaiAgent | null = null;

function getAgent(): YafaiAgent {
  if (!agent) {
    agent = createYafaiAgent();
  }
  return agent;
}

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === 1) {
    // WebSocket.OPEN
    socket.send(JSON.stringify(message));
  }
}

/**
 * Handle incoming WebSocket messages from Figma plugin
 */
export async function handleMessage(
  socket: WebSocket,
  connectionId: string,
  data: string,
): Promise<void> {
  let message: ClientMessage;

  try {
    message = JSON.parse(data) as ClientMessage;
    console.log('[WS] Received message:', message.type);
  } catch (err) {
    console.error('[WS] Failed to parse JSON message:', data.slice(0, 200), err);
    send(socket, {
      type: 'error',
      message: 'Invalid JSON message',
      code: 'PARSE_ERROR',
    });
    return;
  }

  switch (message.type) {
    case 'session:start':
      await handleSessionStart(socket, connectionId, message.deckId);
      break;

    case 'session:end':
      handleSessionEnd(connectionId, message.sessionId);
      break;

    case 'chat:message':
      await handleChatMessage(socket, message.sessionId, message.content);
      break;

    case 'validation:result':
      await handleValidationResult(
        socket,
        message.sessionId,
        message.slideId,
        message.errors,
      );
      break;

    default:
      send(socket, {
        type: 'error',
        message: `Unknown message type: ${(message as { type: string }).type}`,
        code: 'UNKNOWN_TYPE',
      });
  }
}

async function handleSessionStart(
  socket: WebSocket,
  connectionId: string,
  deckId?: string,
): Promise<void> {
  const session = sessionManager.createSession(deckId);

  // Update connection with session
  const conn = connections.get(connectionId);
  if (conn) {
    conn.sessionId = session.id;
  }

  send(socket, {
    type: 'session:created',
    sessionId: session.id,
    deckId: session.deckId,
  });

  console.log(`Session created: ${session.id} for deck: ${session.deckId}`);
}

function handleSessionEnd(connectionId: string, sessionId: string): void {
  sessionManager.deleteSession(sessionId);

  const conn = connections.get(connectionId);
  if (conn) {
    conn.sessionId = null;
  }

  console.log(`Session ended: ${sessionId}`);
}

async function handleChatMessage(
  socket: WebSocket,
  sessionId: string,
  content: string,
): Promise<void> {
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    send(socket, {
      type: 'error',
      sessionId,
      message: 'Session not found',
      code: 'SESSION_NOT_FOUND',
    });
    return;
  }

  // Send thinking indicator
  send(socket, {
    type: 'chat:thinking',
    sessionId,
    status: 'Processing your request...',
  });

  try {
    const yafaiAgent = getAgent();

    // Build the message with deck context
    const userMessage = new HumanMessage(
      `[Deck ID: ${session.deckId}]\n\n${content}`,
    );

    // Track tool calls that have been started
    const startedToolCalls = new Set<string>();

    // Stream the agent execution to capture tool calls in real-time
    const stream = await yafaiAgent.stream({
      messages: [userMessage],
    });

    let responseContent = '';

    for await (const event of stream) {
      // Handle agent node events (contains AI messages with tool calls)
      if (event.agent?.messages) {
        for (const msg of event.agent.messages) {
          // Check for tool calls in AI messages
          if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
            for (const toolCall of msg.tool_calls) {
              if (!startedToolCalls.has(toolCall.id)) {
                startedToolCalls.add(toolCall.id);
                // Send tool call started event
                send(socket, {
                  type: 'tool:call',
                  sessionId,
                  toolCallId: toolCall.id,
                  toolName: toolCall.name,
                  args: toolCall.args || {},
                  status: 'started',
                } as ServerToolCall);
              }
            }
          }

          // Capture the final AI response content
          if (msg._getType?.() === 'ai' && msg.content) {
            responseContent =
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content);
          }
        }
      }

      // Handle tools node events (contains tool results)
      if (event.tools?.messages) {
        for (const msg of event.tools.messages) {
          if (msg._getType?.() === 'tool') {
            const toolCallId = msg.tool_call_id;
            const toolName = msg.name;
            const result =
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content);

            // Check if result indicates an error
            const isError =
              result.includes('"success":false') || result.includes('"error"');

            send(socket, {
              type: 'tool:call',
              sessionId,
              toolCallId,
              toolName,
              args: {}, // Args were sent with 'started' status
              status: isError ? 'error' : 'completed',
              result: isError ? undefined : result,
              error: isError ? result : undefined,
            } as ServerToolCall);
          }
        }
      }
    }

    // Send the final response
    if (responseContent) {
      send(socket, {
        type: 'chat:response',
        sessionId,
        content: responseContent,
        isStreaming: false,
        done: true,
      } as ServerChatResponse);
    } else {
      send(socket, {
        type: 'chat:response',
        sessionId,
        content: 'I processed your request but have no response to show.',
        isStreaming: false,
        done: true,
      } as ServerChatResponse);
    }

    // Check for any slides created
    const { slideStore } = await import('../services/slide-store.js');
    const slides = slideStore.getSlidesByDeck(session.deckId);
    if (slides.length > 0) {
      const latestSlide = slides[slides.length - 1];
      console.log('[WS] Sending slide for render:', {
        slideId: latestSlide.id,
        dslLength: latestSlide.snapshot?.length || 0,
        dslPreview: latestSlide.snapshot?.slice(0, 200) + '...',
      });
      send(socket, {
        type: 'render:slide',
        sessionId,
        slideId: latestSlide.id,
        dsl: latestSlide.snapshot,
      } as ServerRenderSlide);
    }

    // Store the conversation
    sessionManager.addMessages(sessionId, [new HumanMessage(content)]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[WS] Agent error:', {
      message: errorMessage,
      stack: errorStack,
      sessionId,
    });
    send(socket, {
      type: 'error',
      sessionId,
      message: errorMessage,
      code: 'AGENT_ERROR',
    });
  }
}

async function handleValidationResult(
  socket: WebSocket,
  sessionId: string,
  slideId: string,
  errors: { type: string; element: string; message: string }[],
): Promise<void> {
  if (errors.length === 0) {
    console.log(`Slide ${slideId} validated successfully`);
    return;
  }

  // Format validation errors as a message to the agent
  const errorSummary = errors
    .map((e) => `- ${e.type}: ${e.message} (${e.element})`)
    .join('\n');

  const validationMessage = `The slide ${slideId} has validation issues after rendering in Figma:\n${errorSummary}\n\nPlease fix these issues.`;

  // Send this as a follow-up message to the agent
  await handleChatMessage(socket, sessionId, validationMessage);
}

/**
 * Register a new WebSocket connection
 */
export function registerConnection(
  socket: WebSocket,
  connectionId: string,
): void {
  connections.set(connectionId, { socket, sessionId: null });
  console.log(`Connection registered: ${connectionId}`);
}

/**
 * Unregister a WebSocket connection
 */
export function unregisterConnection(connectionId: string): void {
  const conn = connections.get(connectionId);
  if (conn?.sessionId) {
    sessionManager.deleteSession(conn.sessionId);
  }
  connections.delete(connectionId);
  console.log(`Connection unregistered: ${connectionId}`);
}
