import { useEffect } from 'react';
import { setupPluginListener, useAppStore } from '../store';
import { wsClient } from '../websocket';
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

  // Connect to MCP server
  useEffect(() => {
    wsClient.connect(backendUrl);

    return () => {
      wsClient.disconnect();
    };
  }, [backendUrl]);

  return (
    <div className="flex flex-col h-screen bg-figma-bg">
      <Header />
      <Tabs />
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'validation' && <ValidationPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}
