import { useState } from 'react';
import { useAppStore } from '../store';
import { wsClient, DEFAULT_MCP_URL } from '../websocket';

export function SettingsPanel() {
  const clearValidationErrors = useAppStore(
    (state) => state.clearValidationErrors,
  );
  const clearRenderWarnings = useAppStore((state) => state.clearRenderWarnings);
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const backendUrl = useAppStore((state) => state.backendUrl);
  const setBackendUrl = useAppStore((state) => state.setBackendUrl);

  const [urlInput, setUrlInput] = useState(backendUrl);

  const handleClearAll = () => {
    clearValidationErrors();
    clearRenderWarnings();
  };

  const handleConnect = () => {
    setBackendUrl(urlInput);
    wsClient.disconnect();
    wsClient.connect(urlInput);
  };

  const handleDisconnect = () => {
    wsClient.disconnect();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-figma-border">
        <span className="text-xs font-medium text-figma-text">Settings</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Connection settings */}
        <section>
          <h3 className="text-xs font-medium text-figma-text mb-2">
            MCP Connection
          </h3>
          <div className="card space-y-3">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-xs text-figma-text-secondary">
                {getStatusText()}
              </span>
            </div>

            <label className="block">
              <span className="block text-2xs text-figma-text-secondary mb-1">
                Server URL
              </span>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={DEFAULT_MCP_URL}
                className="input text-xs"
              />
            </label>

            <div className="flex gap-2">
              {connectionStatus === 'connected' ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="btn btn-secondary flex-1"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectionStatus === 'connecting'}
                  className="btn btn-primary flex-1"
                >
                  {connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Design tokens */}
        <section>
          <h3 className="text-xs font-medium text-figma-text mb-2">
            Design Tokens
          </h3>
          <div className="card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-figma-text-secondary">
                Slide Size
              </span>
              <span className="text-xs text-figma-text">1920 × 1080</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-figma-text-secondary">Margin</span>
              <span className="text-xs text-figma-text">80px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-figma-text-secondary">
                Font Family
              </span>
              <span className="text-xs text-figma-text">Inter</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section>
          <h3 className="text-xs font-medium text-figma-text mb-2">Actions</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="btn btn-secondary w-full"
            >
              Clear Validation Data
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-xs font-medium text-figma-text mb-2">About</h3>
          <div className="card">
            <p className="text-xs text-figma-text-secondary">
              Yafai AI helps you create professional pitch decks using AI.
              Connect via Claude Code MCP to generate slides directly in Figma.
            </p>
            <p className="text-2xs text-figma-text-tertiary mt-2">
              Version 0.1.0
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
