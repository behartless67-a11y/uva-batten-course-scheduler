'use client';

import React, { useState } from 'react';
import {
  generateVersionName,
  saveVersion,
  updateVersion,
  getCurrentVersionId,
  getStorageUsage,
} from '@/lib/storage/scheduleVersions';
import { Schedule, Course, Faculty } from '@/types/scheduling';

interface SaveScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  courses: Course[];
  faculty: Faculty[];
  onSaved?: (versionId: string) => void;
  mode?: 'new' | 'update'; // New version or update current
}

export default function SaveScheduleDialog({
  isOpen,
  onClose,
  schedule,
  courses,
  faculty,
  onSaved,
  mode = 'new',
}: SaveScheduleDialogProps) {
  const [name, setName] = useState(generateVersionName());
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { usedMB, percentUsed } = getStorageUsage();
  const storageWarning = percentUsed > 80;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (mode === 'update') {
        const currentId = getCurrentVersionId();
        if (!currentId) {
          throw new Error('No current version to update');
        }

        const updated = updateVersion(currentId, {
          name,
          description: description || undefined,
          schedule,
          courses,
          faculty,
        });

        if (!updated) {
          throw new Error('Failed to update version');
        }

        onSaved?.(updated.id);
      } else {
        const newVersion = saveVersion(name, schedule, courses, faculty, description || undefined);
        onSaved?.(newVersion.id);
      }

      // Reset form
      setName(generateVersionName());
      setDescription('');
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save schedule version');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(generateVersionName());
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'update' ? 'Update Schedule Version' : 'Save Schedule Version'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'update'
              ? 'Update the current version with your latest changes'
              : 'Save your schedule to compare different versions'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Storage Warning */}
          {storageWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-start">
                <span className="text-amber-600 mr-2">⚠️</span>
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Storage nearly full</p>
                  <p>
                    Using {usedMB.toFixed(2)} MB ({percentUsed.toFixed(0)}%). Consider deleting old
                    versions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start">
                <span className="text-red-600 mr-2">❌</span>
                <div className="text-sm text-red-800">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Schedule Summary</p>
              <ul className="space-y-1">
                <li>📚 {schedule.sections.length} sections</li>
                <li>
                  ⚠️{' '}
                  {schedule.sections.reduce(
                    (sum, s) => sum + s.conflicts.filter(c => c.severity === 'error').length,
                    0
                  )}{' '}
                  errors,{' '}
                  {schedule.sections.reduce(
                    (sum, s) => sum + s.conflicts.filter(c => c.severity === 'warning').length,
                    0
                  )}{' '}
                  warnings
                </li>
              </ul>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="version-name" className="block text-sm font-medium text-gray-700 mb-1">
              Version Name
            </label>
            <input
              id="version-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Schedule YYYY-MM-DD"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default format: Schedule YYYY-MM-DD (per Heather's preference)
            </p>
          </div>

          {/* Description Input */}
          <div>
            <label
              htmlFor="version-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="version-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Notes about this version (e.g., 'More morning classes', 'Reduced Friday schedule')..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : mode === 'update' ? 'Update Version' : 'Save Version'}
          </button>
        </div>
      </div>
    </div>
  );
}
