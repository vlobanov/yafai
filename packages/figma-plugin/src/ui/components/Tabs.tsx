import { useAppStore } from '../store';
import { ChatIcon, CheckCircleIcon, SettingsIcon } from './Icons';

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: ChatIcon },
  { id: 'validation' as const, label: 'Validation', icon: CheckCircleIcon },
  { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
];

export function Tabs() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const validationErrors = useAppStore((state) => state.validationErrors);

  return (
    <div className="flex border-b border-figma-border bg-figma-bg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const hasErrors =
          tab.id === 'validation' && validationErrors.length > 0;

        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative ${
              isActive
                ? 'text-figma-text-brand bg-figma-bg-selected'
                : 'text-figma-text-secondary hover:text-figma-text hover:bg-figma-bg-hover'
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
            {hasErrors && (
              <span className="absolute top-1.5 right-1/4 w-1.5 h-1.5 bg-figma-bg-danger rounded-full" />
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-figma-bg-brand" />
            )}
          </button>
        );
      })}
    </div>
  );
}
