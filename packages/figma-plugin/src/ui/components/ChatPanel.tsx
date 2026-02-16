import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { SparklesIcon } from './Icons';

export function ChatPanel() {
  const messages = useAppStore((state) => state.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-figma-border">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-figma-border p-3">
        <ChatInput />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-figma-bg-brand-tertiary flex items-center justify-center mb-4">
        <SparklesIcon className="text-figma-icon-brand" size={24} />
      </div>
      <h3 className="text-sm font-medium text-figma-text mb-1">
        Welcome to Yafai AI
      </h3>
      <p className="text-xs text-figma-text-secondary max-w-[200px]">
        Describe your startup and I'll help you create a professional pitch
        deck.
      </p>
      <div className="mt-4 space-y-2 w-full max-w-[220px]">
        <PromptSuggestion text="Create a title slide for a fintech startup" />
        <PromptSuggestion text="Design a team slide with 4 members" />
        <PromptSuggestion text="Make a metrics slide showing growth" />
      </div>
    </div>
  );
}

interface PromptSuggestionProps {
  text: string;
}

function PromptSuggestion({ text }: PromptSuggestionProps) {
  const setInputValue = useAppStore((state) => state.setInputValue);

  return (
    <button
      type="button"
      onClick={() => setInputValue(text)}
      className="w-full text-left px-3 py-2 text-xs text-figma-text-secondary bg-figma-bg-secondary rounded-lg hover:bg-figma-bg-hover transition-colors"
    >
      {text}
    </button>
  );
}
