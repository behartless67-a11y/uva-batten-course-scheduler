'use client';

import React from 'react';
import { Cloud, CloudOff } from 'lucide-react';

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  enabled: boolean;
  onToggle?: () => void;
}

export default function AutoSaveIndicator({
  lastSaved,
  isSaving,
  enabled,
  onToggle,
}: AutoSaveIndicatorProps) {
  // Format last saved time
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes === 1) {
      return '1 minute ago';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
      {/* Icon */}
      <button
        onClick={onToggle}
        className="focus:outline-none hover:opacity-70 transition-opacity"
        title={enabled ? 'Auto-save enabled' : 'Auto-save disabled'}
      >
        {enabled ? (
          <Cloud className={`w-4 h-4 ${isSaving ? 'text-blue-600 animate-pulse' : 'text-green-600'}`} />
        ) : (
          <CloudOff className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Status Text */}
      <div className="text-xs">
        {isSaving ? (
          <span className="text-blue-600 font-medium">Saving...</span>
        ) : lastSaved && enabled ? (
          <span className="text-gray-600">
            Saved <span className="font-medium">{formatLastSaved(lastSaved)}</span>
          </span>
        ) : enabled ? (
          <span className="text-gray-500">Auto-save enabled</span>
        ) : (
          <span className="text-gray-400">Auto-save off</span>
        )}
      </div>
    </div>
  );
}
