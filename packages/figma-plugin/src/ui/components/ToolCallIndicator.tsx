import { useState } from 'react';
import type { ToolCall } from '../store';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LoaderIcon,
  AlertCircleIcon,
  WrenchIcon,
} from './Icons';

interface ToolCallIndicatorProps {
  toolCall: ToolCall;
}

/**
 * Formats a tool name from snake_case to Title Case
 */
function formatToolName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Pretty prints JSON with syntax highlighting for XML content
 */
function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

export function ToolCallIndicator({ toolCall }: ToolCallIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoading = toolCall.status === 'started';
  const isSuccess = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';

  const statusIcon = isLoading ? (
    <LoaderIcon size={12} className="text-figma-icon-brand" />
  ) : isSuccess ? (
    <CheckCircleIcon size={12} className="text-figma-icon-success" />
  ) : (
    <AlertCircleIcon size={12} className="text-figma-icon-danger" />
  );

  const hasArgs = Object.keys(toolCall.args).length > 0;
  const hasResult = toolCall.result || toolCall.error;
  const isExpandable = hasArgs || hasResult;

  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
          isExpandable
            ? 'hover:bg-figma-bg-hover cursor-pointer'
            : 'cursor-default'
        } ${
          isLoading
            ? 'text-figma-text-secondary'
            : isError
              ? 'text-figma-text-danger'
              : 'text-figma-text-secondary'
        }`}
        disabled={!isExpandable}
      >
        {/* Expand/Collapse chevron */}
        {isExpandable && (
          <span className="text-figma-icon-tertiary">
            {isExpanded ? (
              <ChevronDownIcon size={12} />
            ) : (
              <ChevronRightIcon size={12} />
            )}
          </span>
        )}

        {/* Tool icon */}
        <WrenchIcon size={12} className="text-figma-icon-secondary" />

        {/* Tool name */}
        <span className="font-medium">{formatToolName(toolCall.toolName)}</span>

        {/* Status indicator */}
        {statusIcon}

        {/* Status text */}
        {isLoading && (
          <span className="text-figma-text-tertiary">Running...</span>
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="ml-5 mt-1 border-l-2 border-figma-border pl-3 space-y-2">
          {/* Arguments */}
          {hasArgs && (
            <div>
              <div className="text-2xs font-medium text-figma-text-tertiary mb-1">
                Arguments
              </div>
              <div className="bg-figma-bg-tertiary rounded p-2 overflow-x-auto">
                {Object.entries(toolCall.args).map(([key, value]) => (
                  <div key={key} className="mb-2 last:mb-0">
                    <div className="text-2xs font-medium text-figma-text-secondary mb-0.5">
                      {key}
                    </div>
                    <pre className="text-2xs text-figma-text whitespace-pre-wrap break-all font-mono">
                      {formatValue(value)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {toolCall.result && (
            <div>
              <div className="text-2xs font-medium text-figma-text-tertiary mb-1">
                Result
              </div>
              <div className="bg-figma-bg-tertiary rounded p-2 overflow-x-auto">
                <pre className="text-2xs text-figma-text-success whitespace-pre-wrap break-all font-mono">
                  {formatValue(
                    (() => {
                      try {
                        return JSON.parse(toolCall.result);
                      } catch {
                        return toolCall.result;
                      }
                    })(),
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* Error */}
          {toolCall.error && (
            <div>
              <div className="text-2xs font-medium text-figma-text-danger mb-1">
                Error
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded p-2 overflow-x-auto">
                <pre className="text-2xs text-figma-text-danger whitespace-pre-wrap break-all font-mono">
                  {toolCall.error}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ToolCallListProps {
  toolCalls: ToolCall[];
}

export function ToolCallList({ toolCalls }: ToolCallListProps) {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-figma-border mt-2 pt-2">
      {toolCalls.map((toolCall) => (
        <ToolCallIndicator key={toolCall.id} toolCall={toolCall} />
      ))}
    </div>
  );
}
