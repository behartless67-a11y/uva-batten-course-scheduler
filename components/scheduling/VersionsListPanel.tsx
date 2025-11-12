'use client';

import React, { useState, useEffect } from 'react';
import {
  listVersions,
  deleteVersion,
  loadVersion,
  updateVersion,
  getCurrentVersionId,
  getAcademicYears,
  deleteVersionsByYear,
  exportVersion,
  SavedScheduleVersion,
} from '@/lib/storage/scheduleVersions';
import { Schedule, Course, Faculty } from '@/types/scheduling';

interface VersionsListPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadVersion: (schedule: Schedule, courses: Course[], faculty: Faculty[], versionId: string) => void;
  onExportVersion: (versionId: string) => void;
}

export default function VersionsListPanel({
  isOpen,
  onClose,
  onLoadVersion,
  onExportVersion,
}: VersionsListPanelProps) {
  const [versions, setVersions] = useState<SavedScheduleVersion[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load versions and academic years
  const refreshVersions = () => {
    const allVersions = selectedYear === 'all' ? listVersions() : listVersions(selectedYear);
    setVersions(allVersions);
    setAcademicYears(getAcademicYears());
    setCurrentVersionId(getCurrentVersionId());
  };

  useEffect(() => {
    if (isOpen) {
      refreshVersions();
    }
  }, [isOpen, selectedYear]);

  // Filter versions by search query
  const filteredVersions = versions.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle load version
  const handleLoad = (version: SavedScheduleVersion) => {
    onLoadVersion(version.schedule, version.courses, version.faculty, version.id);
    onClose();
  };

  // Handle delete version
  const handleDelete = (versionId: string) => {
    if (deleteVersion(versionId)) {
      refreshVersions();
      setShowDeleteConfirm(null);
    }
  };

  // Handle rename version
  const handleRename = (versionId: string) => {
    if (renameName.trim()) {
      updateVersion(versionId, { name: renameName.trim() });
      refreshVersions();
      setRenameId(null);
      setRenameName('');
    }
  };

  // Start rename
  const startRename = (version: SavedScheduleVersion) => {
    setRenameId(version.id);
    setRenameName(version.name);
  };

  // Cancel rename
  const cancelRename = () => {
    setRenameId(null);
    setRenameName('');
  };

  // Handle delete all versions for a year
  const handleDeleteYear = (year: string) => {
    if (confirm(`Delete all ${year} schedule versions? This cannot be undone.`)) {
      const count = deleteVersionsByYear(year);
      alert(`Deleted ${count} version(s)`);
      refreshVersions();
    }
  };

  // Handle export
  const handleExport = (versionId: string) => {
    const json = exportVersion(versionId);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-version-${versionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Format date
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-end z-50">
      <div className="bg-white w-full sm:w-96 h-full sm:h-[90vh] sm:rounded-l-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Saved Versions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-4 py-3 border-b border-gray-200 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search versions..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => (
                <option key={year} value={year}>
                  {year} Academic Year
                </option>
              ))}
            </select>
          </div>

          {/* Delete Year Button */}
          {selectedYear !== 'all' && (
            <button
              onClick={() => handleDeleteYear(selectedYear)}
              className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none"
            >
              Delete All {selectedYear} Versions
            </button>
          )}
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {filteredVersions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No saved versions found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVersions.map(version => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-3 ${
                    version.id === currentVersionId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Version Name */}
                  {renameId === version.id ? (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={renameName}
                        onChange={e => setRenameName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(version.id);
                          if (e.key === 'Escape') cancelRename();
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleRename(version.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelRename}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 flex-1">
                        {version.id === currentVersionId && '● '}
                        {version.name}
                      </h3>
                    </div>
                  )}

                  {/* Version Info */}
                  <p className="text-xs text-gray-500 mb-2">{formatDate(version.createdAt)}</p>

                  {/* Description */}
                  {version.description && (
                    <p className="text-xs text-gray-600 mb-2 italic">{version.description}</p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                    <span>📚 {version.metadata.totalSections} sections</span>
                    {version.metadata.errorCount > 0 && (
                      <span className="text-red-600">
                        ❌ {version.metadata.errorCount}
                      </span>
                    )}
                    {version.metadata.warningCount > 0 && (
                      <span className="text-amber-600">
                        ⚠️ {version.metadata.warningCount}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {version.id !== currentVersionId && (
                      <button
                        onClick={() => handleLoad(version)}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                      >
                        Load
                      </button>
                    )}
                    <button
                      onClick={() => startRename(version)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleExport(version.id)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none"
                    >
                      Export
                    </button>
                    {version.id !== currentVersionId && (
                      <>
                        {showDeleteConfirm === version.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(version.id)}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(version.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            {versions.length} version{versions.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>
    </div>
  );
}
