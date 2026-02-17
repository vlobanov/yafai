import { useAppStore } from '../store';
import { SparklesIcon } from './Icons';

export function Header() {
  const connectionStatus = useAppStore((state) => state.connectionStatus);

  const statusConfig = {
    disconnected: {
      color: 'bg-figma-text-tertiary',
      text: 'Offline',
    },
    connecting: {
      color: 'bg-figma-bg-warning',
      text: 'Connecting...',
    },
    connected: {
      color: 'bg-figma-bg-success',
      text: 'MCP',
    },
    error: {
      color: 'bg-figma-bg-danger',
      text: 'Error',
    },
  };

  const status = statusConfig[connectionStatus];

  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-figma-border bg-figma-bg">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-figma-bg-brand flex items-center justify-center">
          <SparklesIcon className="text-figma-icon-onbrand" size={14} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-figma-text leading-tight">
            Yafai AI
          </h1>
          <p className="text-2xs text-figma-text-secondary leading-tight">
            Pitch Deck Generator
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
        <span className="text-2xs text-figma-text-tertiary">{status.text}</span>
      </div>
    </header>
  );
}
