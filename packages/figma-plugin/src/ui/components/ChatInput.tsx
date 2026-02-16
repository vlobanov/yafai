import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { wsClient } from '../websocket';
import { LoaderIcon, SendIcon } from './Icons';

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputValue = useAppStore((state) => state.inputValue);
  const setInputValue = useAppStore((state) => state.setInputValue);
  const isLoading = useAppStore((state) => state.isLoading);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const addMessage = useAppStore((state) => state.addMessage);
  const connectionStatus = useAppStore((state) => state.connectionStatus);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isLoading) return;

    // Add user message
    addMessage({
      role: 'user',
      content: trimmedValue,
    });

    // Clear input
    setInputValue('');

    // Set loading state
    setIsLoading(true);

    // Send to backend via WebSocket
    wsClient.sendChatMessage(trimmedValue);
  }, [inputValue, isLoading, addMessage, setInputValue, setIsLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isDisabled = isLoading || connectionStatus === 'connecting';

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your slide..."
          disabled={isDisabled}
          rows={1}
          className="textarea min-h-[36px] max-h-[120px] pr-10"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isDisabled || !inputValue.trim()}
        className="btn btn-primary h-9 w-9 p-0 flex-shrink-0"
        title="Send message"
      >
        {isLoading ? <LoaderIcon size={16} /> : <SendIcon size={16} />}
      </button>
    </div>
  );
}
