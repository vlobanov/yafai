import type { Message } from '../store';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  SparklesIcon,
  UserIcon,
} from './Icons';
import { Markdown } from './Markdown';
import { ToolCallList } from './ToolCallIndicator';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex items-start gap-2 py-2 px-3 text-xs">
        <div
          className={`flex-shrink-0 mt-0.5 ${
            message.status === 'error'
              ? 'text-figma-icon-danger'
              : message.status === 'success'
                ? 'text-figma-icon-success'
                : 'text-figma-icon-secondary'
          }`}
        >
          {message.status === 'error' ? (
            <AlertCircleIcon size={12} />
          ) : message.status === 'success' ? (
            <CheckCircleIcon size={12} />
          ) : (
            <AlertCircleIcon size={12} />
          )}
        </div>
        <p
          className={`${
            message.status === 'error'
              ? 'text-figma-text-danger'
              : message.status === 'success'
                ? 'text-figma-text-success'
                : 'text-figma-text-secondary'
          }`}
        >
          {message.content}
        </p>
      </div>
    );
  }

  const isAssistant = message.role === 'assistant';
  const hasToolCalls = isAssistant && message.toolCalls && message.toolCalls.length > 0;
  const isPending = message.status === 'pending';
  const hasContent = message.content && message.content.trim().length > 0;

  return (
    <div
      className={`flex gap-2 py-3 px-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-figma-bg-brand text-figma-icon-onbrand'
            : 'bg-figma-bg-tertiary text-figma-icon-secondary'
        }`}
      >
        {isUser ? <UserIcon size={14} /> : <SparklesIcon size={14} />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block max-w-[85%] px-3 py-2 rounded-lg text-sm ${
            isUser
              ? 'bg-figma-bg-brand text-figma-text-onbrand rounded-tr-sm'
              : 'bg-figma-bg-secondary text-figma-text rounded-tl-sm'
          }`}
        >
          {/* Show loading state when pending with no content */}
          {isPending && !hasContent && !hasToolCalls && (
            <div className="flex items-center gap-2 text-figma-text-secondary">
              <LoaderIcon size={14} />
              <span>Thinking...</span>
            </div>
          )}

          {/* Message content */}
          {hasContent && (
            isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <Markdown content={message.content} />
            )
          )}

          {/* Tool calls */}
          {hasToolCalls && message.toolCalls && (
            <ToolCallList toolCalls={message.toolCalls} />
          )}
        </div>
        <div
          className={`mt-1 text-2xs text-figma-text-tertiary ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
