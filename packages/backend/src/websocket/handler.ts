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

// Per-session agent instances (deckId-bound tools)
const sessionAgents = new Map<string, YafaiAgent>();

// Track slides currently under visual review to prevent infinite review loops
const slidesUnderReview = new Set<string>();

function getAgentForSession(sessionId: string): YafaiAgent {
  let agent = sessionAgents.get(sessionId);
  if (!agent) {
    const session = sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    agent = createYafaiAgent(session.deckId);
    sessionAgents.set(sessionId, agent);
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

    case 'snapshot:result':
      await handleSnapshotResult(
        socket,
        message.sessionId,
        message.slideId,
        message.imageBase64,
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
  sessionAgents.delete(sessionId);

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
    const yafaiAgent = getAgentForSession(sessionId);

    const userMessage = new HumanMessage(content);

    // Snapshot slide state before agent runs so we know what changed
    const { slideStore } = await import('../services/slide-store.js');
    const slidesBefore = slideStore.getSlidesByDeck(session.deckId);
    const slideCountBefore = slidesBefore.length;
    const lastUpdatedBefore = slidesBefore.length > 0
      ? Math.max(...slidesBefore.map(s => s.updatedAt.getTime()))
      : 0;

    // Track tool calls that have been started
    const startedToolCalls = new Set<string>();

    // Stream the agent execution to capture tool calls in real-time
    // thread_id links to the MemorySaver checkpointer so the agent
    // remembers previous turns within this session
    const stream = await yafaiAgent.stream(
      { messages: [userMessage] },
      { configurable: { thread_id: sessionId } },
    );

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

    // Only send render:slide if slides were actually created or modified
    const slidesAfter = slideStore.getSlidesByDeck(session.deckId);
    const lastUpdatedAfter = slidesAfter.length > 0
      ? Math.max(...slidesAfter.map(s => s.updatedAt.getTime()))
      : 0;

    if (slidesAfter.length > slideCountBefore || lastUpdatedAfter > lastUpdatedBefore) {
      // Find the most recently changed slide
      const changedSlide = slidesAfter.reduce((latest, s) =>
        s.updatedAt.getTime() > latest.updatedAt.getTime() ? s : latest
      );
      console.log('[WS] Sending slide for render:', {
        slideId: changedSlide.id,
        dslLength: changedSlide.snapshot?.length || 0,
        dslPreview: changedSlide.snapshot?.slice(0, 200) + '...',
      });
      send(socket, {
        type: 'render:slide',
        sessionId,
        slideId: changedSlide.id,
        dsl: changedSlide.snapshot,
      } as ServerRenderSlide);
    }
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

async function handleSnapshotResult(
  socket: WebSocket,
  sessionId: string,
  slideId: string,
  imageBase64: string,
): Promise<void> {
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    console.log(`[WS] Snapshot received for unknown session: ${sessionId}`);
    return;
  }

  console.log(`[WS] Snapshot received for slide ${slideId}, size: ${Math.round(imageBase64.length * 0.75 / 1024)}KB`);

  // Prevent infinite review loops: skip if this slide is already being reviewed
  if (slidesUnderReview.has(slideId)) {
    console.log(`[WS] Skipping review for slide ${slideId} (already reviewed this cycle)`);
    return;
  }

  slidesUnderReview.add(slideId);

  send(socket, {
    type: 'chat:thinking',
    sessionId,
    status: 'Reviewing rendered slide...',
  });

  try {
    const yafaiAgent = getAgentForSession(sessionId);

    // Record slide state before review so we can detect if agent made changes
    const { slideStore } = await import('../services/slide-store.js');
    const slideBefore = slideStore.getSlide(slideId);
    const snapshotBefore = slideBefore?.snapshot;

    const currentDsl = slideBefore?.snapshot || '(DSL not available)';
    const deckId = slideBefore?.deckId || session.deckId;

    const reviewMessage = new HumanMessage({
      content: [
        {
          type: 'text',
          text: `[Visual Review] Here is a screenshot of slide ${slideId} (deck: ${deckId}) as rendered in Figma.

Current DSL:
\`\`\`xml
${currentDsl}
\`\`\`

Review the screenshot for visual quality — layout, spacing, alignment, readability, and overall aesthetics. Compare what you see in the image against what the DSL intended.

If it looks good, confirm briefly and do NOT call any tools.
If there are clear visual problems (bad spacing, misalignment, overlapping text, unreadable elements, ugly layout), fix them using update_node (for targeted fixes) or update_slide (for major restructuring). The slide ID is ${slideId} and deck ID is ${deckId}.`,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
          },
        },
      ],
    });

    const stream = await yafaiAgent.stream(
      { messages: [reviewMessage] },
      { configurable: { thread_id: sessionId } },
    );

    let responseContent = '';
    const startedToolCalls = new Set<string>();

    for await (const event of stream) {
      if (event.agent?.messages) {
        for (const msg of event.agent.messages) {
          if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
            for (const toolCall of msg.tool_calls) {
              if (!startedToolCalls.has(toolCall.id)) {
                startedToolCalls.add(toolCall.id);
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

          if (msg._getType?.() === 'ai' && msg.content) {
            responseContent =
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content);
          }
        }
      }

      if (event.tools?.messages) {
        for (const msg of event.tools.messages) {
          if (msg._getType?.() === 'tool') {
            const toolCallId = msg.tool_call_id;
            const toolName = msg.name;
            const result =
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content);

            const isError =
              result.includes('"success":false') || result.includes('"error"');

            send(socket, {
              type: 'tool:call',
              sessionId,
              toolCallId,
              toolName,
              args: {},
              status: isError ? 'error' : 'completed',
              result: isError ? undefined : result,
              error: isError ? result : undefined,
            } as ServerToolCall);
          }
        }
      }
    }

    if (responseContent) {
      send(socket, {
        type: 'chat:response',
        sessionId,
        content: responseContent,
        isStreaming: false,
        done: true,
      } as ServerChatResponse);
    }

    // Only re-render if the agent actually modified the slide
    const slideAfter = slideStore.getSlide(slideId);
    if (slideAfter && slideAfter.snapshot !== snapshotBefore) {
      console.log(`[WS] Agent modified slide ${slideId} during review, re-rendering`);
      // Don't clear the review guard — the re-render will trigger another snapshot,
      // but slidesUnderReview will prevent a second review cycle
      send(socket, {
        type: 'render:slide',
        sessionId,
        slideId: slideAfter.id,
        dsl: slideAfter.snapshot,
      } as ServerRenderSlide);
    }

    // Clear the guard after everything settles so future renders get reviewed
    setTimeout(() => slidesUnderReview.delete(slideId), 5000);
  } catch (error) {
    slidesUnderReview.delete(slideId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[WS] Snapshot review error:', errorMessage);
    send(socket, {
      type: 'error',
      sessionId,
      message: errorMessage,
      code: 'SNAPSHOT_REVIEW_ERROR',
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
    sessionAgents.delete(conn.sessionId);
    sessionManager.deleteSession(conn.sessionId);
  }
  connections.delete(connectionId);
  console.log(`Connection unregistered: ${connectionId}`);
}
