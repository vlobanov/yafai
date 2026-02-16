import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { v4 as uuid } from 'uuid';
import { config, validateConfig } from './config.js';
import { componentRegistry } from './services/component-registry.js';
import { slideStore } from './services/slide-store.js';
import {
  handleMessage,
  registerConnection,
  unregisterConnection,
} from './websocket/handler.js';

export async function createServer() {
  // Validate config before starting
  validateConfig();

  const fastify = Fastify({
    logger: true,
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true, // Allow all origins for development
  });

  await fastify.register(websocket);

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API endpoints for debugging/admin
  fastify.get('/api/components', async (request) => {
    const { deckId } = request.query as { deckId?: string };
    return componentRegistry.listAllComponents(deckId);
  });

  fastify.get('/api/slides/:deckId', async (request) => {
    const { deckId } = request.params as { deckId: string };
    return slideStore.getSlidesByDeck(deckId);
  });

  // WebSocket endpoint for Figma plugin
  fastify.get('/ws', { websocket: true }, (socket, _request) => {
    const connectionId = uuid();
    registerConnection(socket, connectionId);

    socket.on('message', async (data: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        await handleMessage(socket, connectionId, data.toString());
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          }),
        );
      }
    });

    socket.on('close', () => {
      unregisterConnection(connectionId);
    });

    socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      unregisterConnection(connectionId);
    });
  });

  return fastify;
}

export async function startServer() {
  const server = await createServer();

  try {
    const address = await server.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`Yafai AI Backend running at ${address}`);
    console.log(`WebSocket endpoint: ws://${config.host}:${config.port}/ws`);
    console.log(`Model: ${config.openrouter.model}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}
