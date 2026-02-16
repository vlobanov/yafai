import { postToPlugin, useAppStore } from '../store';
import { AlertCircleIcon, CheckCircleIcon } from './Icons';

export function ValidationPanel() {
  const validationErrors = useAppStore((state) => state.validationErrors);
  const lastRenderNodeId = useAppStore((state) => state.lastRenderNodeId);

  const handleValidate = () => {
    if (lastRenderNodeId) {
      postToPlugin({
        type: 'validate',
        nodeId: lastRenderNodeId,
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-figma-border">
        <span className="text-xs font-medium text-figma-text">
          Validation Results
        </span>
        <button
          type="button"
          onClick={handleValidate}
          disabled={!lastRenderNodeId}
          className="btn btn-secondary text-xs py-1"
        >
          Validate
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {validationErrors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-10 h-10 rounded-full bg-figma-bg-success-tertiary flex items-center justify-center mb-3">
              <CheckCircleIcon className="text-figma-icon-success" size={20} />
            </div>
            <p className="text-xs text-figma-text-secondary">
              {lastRenderNodeId
                ? 'No validation errors found'
                : 'Render a slide to see validation results'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <ValidationErrorCard key={index} error={error} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ValidationErrorCardProps {
  error: {
    type: string;
    element: string;
    message: string;
    suggestion?: string;
  };
}

function ValidationErrorCard({ error }: ValidationErrorCardProps) {
  const typeLabels: Record<string, string> = {
    'text-overflow': 'Text Overflow',
    'out-of-bounds': 'Out of Bounds',
    overlap: 'Overlap',
  };

  return (
    <div className="card">
      <div className="flex items-start gap-2">
        <AlertCircleIcon
          className="text-figma-icon-danger flex-shrink-0 mt-0.5"
          size={14}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-figma-text">
              {typeLabels[error.type] || error.type}
            </span>
            <span className="text-2xs text-figma-text-tertiary truncate">
              {error.element}
            </span>
          </div>
          <p className="text-xs text-figma-text-secondary mb-1">
            {error.message}
          </p>
          {error.suggestion && (
            <p className="text-2xs text-figma-text-brand">{error.suggestion}</p>
          )}
        </div>
      </div>
    </div>
  );
}
