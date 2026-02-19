import { WebSocketServer, type WebSocket } from 'ws';
import type http from 'node:http';
import { log } from '../util/logger.js';
import crypto from 'node:crypto';
import type {
  PluginToServerMessage,
  RenderResultMessage,
  SelectionHtmlResultMessage,
  SnapshotResultMessage,
  ValidationResultMessage,
} from './types.js';

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT_MS = 30_000;

export class FigmaBridge {
  private wss: WebSocketServer | null = null;
  private plugin: WebSocket | null = null;
  private pluginReady = false;

  private renderRequests = new Map<string, PendingRequest<RenderResultMessage>>();
  private snapshotRequests = new Map<string, PendingRequest<SnapshotResultMessage>>();
  private selectionHtmlRequests = new Map<string, PendingRequest<SelectionHtmlResultMessage>>();
  private validationResults = new Map<string, ValidationResultMessage>();

  /**
   * Attach WS upgrade handling to an existing HTTP server.
   * Upgrades requests to `/ws` only.
   */
  attach(server: http.Server): void {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      if (url.pathname !== '/ws') {
        socket.destroy();
        return;
      }
      this.wss!.handleUpgrade(req, socket, head, (ws) => {
        this.wss!.emit('connection', ws, req);
      });
    });

    this.wss.on('connection', (ws) => {
      log.info('Figma plugin connected');
      this.plugin = ws;
      this.pluginReady = false;

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as PluginToServerMessage;
          this.handleMessage(msg);
        } catch (err) {
          log.error('Bad message from plugin:', err);
        }
      });

      ws.on('close', () => {
        log.info('Figma plugin disconnected');
        if (this.plugin === ws) {
          this.plugin = null;
          this.pluginReady = false;
        }
        // Reject all pending requests
        this.rejectAll('Plugin disconnected');
      });

      ws.on('error', (err) => {
        log.error('Plugin WS error:', err.message);
      });
    });
  }

  isConnected(): boolean {
    return this.pluginReady && this.plugin?.readyState === 1;
  }

  /**
   * Send a render:slide to the plugin and wait for both
   * render:result and validation:result.
   */
  async renderSlide(
    slideId: string,
    dsl: string,
  ): Promise<{
    render: RenderResultMessage;
    validation: ValidationResultMessage | null;
  }> {
    this.assertConnected();

    // Clear any stale validation result for this slide
    this.validationResults.delete(slideId);

    const renderPromise = this.createPendingRequest<RenderResultMessage>(
      this.renderRequests,
      slideId,
    );

    this.send({ type: 'render:slide', slideId, dsl });

    const render = await renderPromise;

    // Give a short grace period for the validation message to arrive
    await new Promise((r) => setTimeout(r, 500));
    const validation = this.validationResults.get(slideId) ?? null;
    this.validationResults.delete(slideId);

    return { render, validation };
  }

  /**
   * Request HTML representation of the currently selected Figma element(s).
   */
  async getSelectionHtml(): Promise<SelectionHtmlResultMessage> {
    this.assertConnected();

    const requestId = crypto.randomUUID();
    const promise = this.createPendingRequest<SelectionHtmlResultMessage>(
      this.selectionHtmlRequests,
      requestId,
    );

    this.send({ type: 'selection:html:request', requestId });

    return promise;
  }

  /**
   * Request a snapshot and wait for the base64 PNG result.
   */
  async takeSnapshot(slideId: string): Promise<SnapshotResultMessage> {
    this.assertConnected();

    const promise = this.createPendingRequest<SnapshotResultMessage>(
      this.snapshotRequests,
      slideId,
    );

    this.send({ type: 'snapshot:request', slideId });

    return promise;
  }

  // ──────────────────────────────────────────────────────────────────────

  private handleMessage(msg: PluginToServerMessage): void {
    switch (msg.type) {
      case 'plugin:ready':
        log.info('Plugin ready');
        this.pluginReady = true;
        break;

      case 'render:result':
        this.resolvePending(this.renderRequests, msg.slideId, msg);
        break;

      case 'validation:result':
        // Store for retrieval after render completes
        this.validationResults.set(msg.slideId, msg);
        break;

      case 'snapshot:result':
        this.resolvePending(this.snapshotRequests, msg.slideId, msg);
        break;

      case 'selection:html:result':
        this.resolvePending(this.selectionHtmlRequests, msg.requestId, msg);
        break;
    }
  }

  private send(msg: unknown): void {
    if (this.plugin?.readyState === 1) {
      this.plugin.send(JSON.stringify(msg));
    }
  }

  private assertConnected(): void {
    if (!this.isConnected()) {
      throw new Error(
        'Figma plugin is not connected. Open the Yafai plugin in Figma and connect to this MCP server.',
      );
    }
  }

  private createPendingRequest<T>(
    map: Map<string, PendingRequest<T>>,
    key: string,
  ): Promise<T> {
    // Cancel any existing request for the same key
    const existing = map.get(key);
    if (existing) {
      clearTimeout(existing.timer);
      existing.reject(new Error('Superseded by new request'));
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        map.delete(key);
        reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms (key: ${key})`));
      }, REQUEST_TIMEOUT_MS);

      map.set(key, { resolve: resolve as any, reject, timer });
    });
  }

  private resolvePending<T>(
    map: Map<string, PendingRequest<T>>,
    key: string,
    value: T,
  ): void {
    const pending = map.get(key);
    if (pending) {
      clearTimeout(pending.timer);
      map.delete(key);
      pending.resolve(value);
    }
  }

  private rejectAll(reason: string): void {
    const error = new Error(reason);
    for (const [, pending] of this.renderRequests) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.renderRequests.clear();

    for (const [, pending] of this.snapshotRequests) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.snapshotRequests.clear();

    for (const [, pending] of this.selectionHtmlRequests) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.selectionHtmlRequests.clear();
  }
}
