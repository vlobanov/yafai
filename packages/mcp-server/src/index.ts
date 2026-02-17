import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import { FigmaBridge } from './websocket/figma-bridge.js';
import { log } from './util/logger.js';

const PORT = Number(process.env.YAFAI_MCP_PORT) || 3002;

// ── Figma bridge ──────────────────────────────────────────────────────
const bridge = new FigmaBridge();

// ── Express app ───────────────────────────────────────────────────────
const app = express();

// Map to track transports by session ID for Streamable HTTP
const transports = new Map<string, StreamableHTTPServerTransport>();

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // If we have an existing session, reuse the transport
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }

  // Stale session ID — tell the client to re-initialize (HTTP 404 per MCP spec)
  if (sessionId) {
    log.info(`Stale session ID: ${sessionId}, requesting re-initialize`);
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Session expired. Please re-initialize.' },
      id: null,
    });
    return;
  }

  // New session — create a fresh MCP server + transport pair
  // (McpServer can only connect to one transport, so we need one per session)
  const mcp = createMcpServer(bridge);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => `yafai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    onsessioninitialized: (id) => {
      transports.set(id, transport);
      log.info(`MCP session initialized: ${id}`);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      transports.delete(transport.sessionId);
      log.info(`MCP session closed: ${transport.sessionId}`);
    }
  };

  await mcp.connect(transport);
  await transport.handleRequest(req, res);
});

// Handle GET for SSE streams (server-to-client notifications)
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// Handle DELETE to close sessions
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// ── Start server ──────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  log.info(`MCP server on http://localhost:${PORT}/mcp`);
  log.info(`WebSocket on ws://localhost:${PORT}/ws`);
});

// Attach WebSocket upgrade handler for Figma plugin
bridge.attach(server);
