/**
 * Schedule Versioning Storage Service
 *
 * Manages saving, loading, and deleting schedule versions using browser LocalStorage.
 * Per Heather's requirements:
 * - Date-based naming: "Schedule YYYY-MM-DD"
 * - One academic year retention
 * - Must have delete functionality
 * - No approval workflow
 */

import { Schedule, Course, Faculty } from '@/types/scheduling';

const STORAGE_KEY = 'uva_batten_schedule_versions';
const MAX_STORAGE_MB = 5; // LocalStorage typically 5-10MB limit

export interface SavedScheduleVersion {
  id: string;
  name: string;
  description?: string;
  schedule: Schedule;
  courses: Course[];
  faculty: Faculty[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  metadata: {
    totalSections: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  academicYear: string; // e.g., "2024-2025"
}

export interface ScheduleVersionStore {
  versions: SavedScheduleVersion[];
  currentVersionId?: string;
  lastAutoSaveId?: string;
}

/**
 * Get academic year for a date
 * Academic year runs from July 1 - June 30
 * Example: July 2024 - June 2025 = "2024-2025"
 */
function getAcademicYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  // If before July (month 6), academic year started last year
  if (month < 6) {
    return `${year - 1}-${year}`;
  }
  // July or later, academic year ends next year
  return `${year}-${year + 1}`;
}

/**
 * Generate date-based version name per Heather's preference
 * Format: "Schedule YYYY-MM-DD"
 */
export function generateVersionName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `Schedule ${year}-${month}-${day}`;
}

/**
 * Load all versions from LocalStorage
 */
function loadStore(): ScheduleVersionStore {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { versions: [] };
    }
    return JSON.parse(data) as ScheduleVersionStore;
  } catch (error) {
    console.error('Failed to load schedule versions:', error);
    return { versions: [] };
  }
}

/**
 * Save store to LocalStorage
 */
function saveStore(store: ScheduleVersionStore): void {
  try {
    const json = JSON.stringify(store);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete old versions to free up space.');
    }
    throw error;
  }
}

/**
 * Calculate storage usage in MB
 */
export function getStorageUsage(): { usedMB: number; percentUsed: number } {
  const store = loadStore();
  const json = JSON.stringify(store);
  const bytes = new Blob([json]).size;
  const usedMB = bytes / (1024 * 1024);
  const percentUsed = (usedMB / MAX_STORAGE_MB) * 100;

  return { usedMB, percentUsed };
}

/**
 * Count conflicts in a schedule
 */
function countConflicts(schedule: Schedule): { errorCount: number; warningCount: number; infoCount: number } {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  schedule.sections.forEach(section => {
    section.conflicts.forEach(conflict => {
      if (conflict.severity === 'error') errorCount++;
      else if (conflict.severity === 'warning') warningCount++;
      else if (conflict.severity === 'info') infoCount++;
    });
  });

  return { errorCount, warningCount, infoCount };
}

/**
 * Save a new schedule version
 * @param name - Version name (if empty, generates date-based name)
 * @param schedule - The schedule to save
 * @param courses - Course data
 * @param faculty - Faculty data
 * @param description - Optional description
 * @returns The saved version
 */
export function saveVersion(
  name: string | undefined,
  schedule: Schedule,
  courses: Course[],
  faculty: Faculty[],
  description?: string
): SavedScheduleVersion {
  const store = loadStore();
  const now = new Date();
  const versionName = name || generateVersionName();

  const conflicts = countConflicts(schedule);

  const newVersion: SavedScheduleVersion = {
    id: crypto.randomUUID(),
    name: versionName,
    description,
    schedule,
    courses,
    faculty,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    metadata: {
      totalSections: schedule.sections.length,
      ...conflicts,
    },
    academicYear: getAcademicYear(now),
  };

  store.versions.push(newVersion);
  store.currentVersionId = newVersion.id;

  saveStore(store);

  return newVersion;
}

/**
 * Load a specific version by ID
 */
export function loadVersion(versionId: string): SavedScheduleVersion | null {
  const store = loadStore();
  const version = store.versions.find(v => v.id === versionId);

  if (version) {
    store.currentVersionId = versionId;
    saveStore(store);
  }

  return version || null;
}

/**
 * List all saved versions
 * @param academicYear - Optional filter by academic year (e.g., "2024-2025")
 * @returns Array of versions sorted by date (newest first)
 */
export function listVersions(academicYear?: string): SavedScheduleVersion[] {
  const store = loadStore();
  let versions = store.versions;

  // Filter by academic year if specified
  if (academicYear) {
    versions = versions.filter(v => v.academicYear === academicYear);
  }

  // Sort by creation date, newest first
  versions.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return versions;
}

/**
 * Delete a version by ID
 */
export function deleteVersion(versionId: string): boolean {
  const store = loadStore();
  const index = store.versions.findIndex(v => v.id === versionId);

  if (index === -1) {
    return false;
  }

  store.versions.splice(index, 1);

  // Clear currentVersionId if deleting current version
  if (store.currentVersionId === versionId) {
    store.currentVersionId = undefined;
  }

  // Clear lastAutoSaveId if deleting auto-save version
  if (store.lastAutoSaveId === versionId) {
    store.lastAutoSaveId = undefined;
  }

  saveStore(store);
  return true;
}

/**
 * Update an existing version
 * @param versionId - Version to update
 * @param updates - Fields to update (name, description, schedule, etc.)
 */
export function updateVersion(
  versionId: string,
  updates: Partial<Pick<SavedScheduleVersion, 'name' | 'description' | 'schedule' | 'courses' | 'faculty'>>
): SavedScheduleVersion | null {
  const store = loadStore();
  const version = store.versions.find(v => v.id === versionId);

  if (!version) {
    return null;
  }

  // Apply updates
  if (updates.name !== undefined) version.name = updates.name;
  if (updates.description !== undefined) version.description = updates.description;
  if (updates.schedule !== undefined) version.schedule = updates.schedule;
  if (updates.courses !== undefined) version.courses = updates.courses;
  if (updates.faculty !== undefined) version.faculty = updates.faculty;

  // Update metadata if schedule changed
  if (updates.schedule) {
    const conflicts = countConflicts(updates.schedule);
    version.metadata = {
      totalSections: updates.schedule.sections.length,
      ...conflicts,
    };
  }

  version.updatedAt = new Date().toISOString();

  saveStore(store);
  return version;
}

/**
 * Get the currently loaded version ID
 */
export function getCurrentVersionId(): string | undefined {
  const store = loadStore();
  return store.currentVersionId;
}

/**
 * Save an auto-save version (overwrites previous auto-save)
 */
export function saveAutoSaveVersion(
  schedule: Schedule,
  courses: Course[],
  faculty: Faculty[]
): SavedScheduleVersion {
  const store = loadStore();

  // Delete previous auto-save if exists
  if (store.lastAutoSaveId) {
    const index = store.versions.findIndex(v => v.id === store.lastAutoSaveId);
    if (index !== -1) {
      store.versions.splice(index, 1);
    }
  }

  // Create new auto-save
  const now = new Date();
  const conflicts = countConflicts(schedule);

  const autoSaveVersion: SavedScheduleVersion = {
    id: crypto.randomUUID(),
    name: '💾 Auto-save',
    description: `Auto-saved at ${now.toLocaleTimeString()}`,
    schedule,
    courses,
    faculty,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    metadata: {
      totalSections: schedule.sections.length,
      ...conflicts,
    },
    academicYear: getAcademicYear(now),
  };

  store.versions.push(autoSaveVersion);
  store.lastAutoSaveId = autoSaveVersion.id;

  saveStore(store);

  return autoSaveVersion;
}

/**
 * Delete all versions from a specific academic year
 * Used for cleanup at end of year
 */
export function deleteVersionsByYear(academicYear: string): number {
  const store = loadStore();
  const beforeCount = store.versions.length;

  store.versions = store.versions.filter(v => v.academicYear !== academicYear);

  const deletedCount = beforeCount - store.versions.length;

  if (deletedCount > 0) {
    saveStore(store);
  }

  return deletedCount;
}

/**
 * Get unique academic years from saved versions
 */
export function getAcademicYears(): string[] {
  const store = loadStore();
  const years = new Set<string>();

  store.versions.forEach(v => {
    years.add(v.academicYear);
  });

  return Array.from(years).sort().reverse(); // Newest first
}

/**
 * Export a version as JSON file (for sharing/backup)
 */
export function exportVersion(versionId: string): string | null {
  const version = loadVersion(versionId);
  if (!version) return null;

  return JSON.stringify(version, null, 2);
}

/**
 * Import a version from JSON string
 */
export function importVersion(jsonString: string): SavedScheduleVersion {
  try {
    const version = JSON.parse(jsonString) as SavedScheduleVersion;

    // Generate new ID to avoid conflicts
    version.id = crypto.randomUUID();
    version.createdAt = new Date().toISOString();
    version.updatedAt = new Date().toISOString();

    const store = loadStore();
    store.versions.push(version);
    saveStore(store);

    return version;
  } catch (error) {
    throw new Error('Invalid version file format');
  }
}
