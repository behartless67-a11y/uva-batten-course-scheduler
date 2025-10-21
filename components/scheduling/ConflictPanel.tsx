'use client';

import { Conflict } from '@/types/scheduling';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ConflictPanelProps {
  conflicts: Conflict[];
}

export default function ConflictPanel({ conflicts }: ConflictPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const errorConflicts = conflicts.filter(c => c.severity === 'error');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');
  const infoConflicts = conflicts.filter(c => c.severity === 'info');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (conflicts.length === 0) {
    return (
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">No Conflicts Detected</h3>
            <p className="text-green-700 text-sm mt-1">
              The schedule has been generated without any conflicts or warnings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">Schedule Conflicts</h3>
            <div className="flex gap-3">
              {errorConflicts.length > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                  {errorConflicts.length} Errors
                </span>
              )}
              {warningConflicts.length > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                  {warningConflicts.length} Warnings
                </span>
              )}
              {infoConflicts.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {infoConflicts.length} Info
                </span>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {expanded && (
          <div className="px-6 pb-6 space-y-3">
            {/* Error Conflicts */}
            {errorConflicts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-900 mb-2">
                  Errors ({errorConflicts.length})
                </h4>
                {errorConflicts.map((conflict, index) => (
                  <div
                    key={conflict.id || index}
                    className={`p-3 rounded-lg border mb-2 ${getSeverityBg(conflict.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(conflict.severity)}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{conflict.type}</p>
                        <p className="text-sm text-gray-700 mt-1">{conflict.description}</p>
                        {conflict.affectedSections.length > 0 && (
                          <p className="text-xs text-gray-600 mt-2">
                            Affected sections: {conflict.affectedSections.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warning Conflicts */}
            {warningConflicts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                  Warnings ({warningConflicts.length})
                </h4>
                {warningConflicts.map((conflict, index) => (
                  <div
                    key={conflict.id || index}
                    className={`p-3 rounded-lg border mb-2 ${getSeverityBg(conflict.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(conflict.severity)}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{conflict.type}</p>
                        <p className="text-sm text-gray-700 mt-1">{conflict.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Conflicts */}
            {infoConflicts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Information ({infoConflicts.length})
                </h4>
                {infoConflicts.map((conflict, index) => (
                  <div
                    key={conflict.id || index}
                    className={`p-3 rounded-lg border mb-2 ${getSeverityBg(conflict.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(conflict.severity)}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{conflict.type}</p>
                        <p className="text-sm text-gray-700 mt-1">{conflict.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
