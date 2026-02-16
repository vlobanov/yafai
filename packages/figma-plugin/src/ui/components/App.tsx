import { useEffect } from 'react';
import { setupPluginListener, useAppStore } from '../store';
import { wsClient } from '../websocket';
import { ChatPanel } from './ChatPanel';
import { Header } from './Header';
import { SettingsPanel } from './SettingsPanel';
import { Tabs } from './Tabs';
import { ValidationPanel } from './ValidationPanel';

export function App() {
  const activeTab = useAppStore((state) => state.activeTab);
  const backendUrl = useAppStore((state) => state.backendUrl);

  // Set up plugin message listener
  useEffect(() => {
    const cleanup = setupPluginListener();
    return cleanup;
  }, []);

  // Connect to WebSocket backend
  useEffect(() => {
    // Connect to backend
    wsClient.connect(backendUrl);

    // Cleanup on unmount
    return () => {
      wsClient.disconnect();
    };
  }, [backendUrl]);

  return (
    <div className="flex flex-col h-screen bg-figma-bg">
      <Header />
      <Tabs />
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'validation' && <ValidationPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}
