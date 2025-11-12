/**
 * Auto-save hook for schedule versioning
 *
 * Automatically saves schedule to a special auto-save version every N minutes.
 * Per Heather's requirements: Auto-save functionality with 5-minute interval.
 */

import { useEffect, useRef, useState } from 'react';
import { Schedule, Course, Faculty } from '@/types/scheduling';
import { saveAutoSaveVersion } from '@/lib/storage/scheduleVersions';

interface UseAutoSaveOptions {
  schedule: Schedule;
  courses: Course[];
  faculty: Faculty[];
  enabled?: boolean;
  intervalMinutes?: number; // Default: 5 minutes
}

interface UseAutoSaveReturn {
  lastSaved: Date | null;
  isSaving: boolean;
  saveNow: () => Promise<void>;
}

/**
 * Auto-save hook that periodically saves schedule to special auto-save slot
 *
 * @param options - Configuration options
 * @returns Auto-save status and manual save function
 */
export function useAutoSave({
  schedule,
  courses,
  faculty,
  enabled = true,
  intervalMinutes = 5,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track if schedule has changed since last save
  const previousScheduleRef = useRef<string>(JSON.stringify(schedule));

  const saveNow = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for UX
      saveAutoSaveVersion(schedule, courses, faculty);
      setLastSaved(new Date());
      previousScheduleRef.current = JSON.stringify(schedule);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      // Clear interval if auto-save is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up periodic auto-save
    const intervalMs = intervalMinutes * 60 * 1000;

    intervalRef.current = setInterval(() => {
      // Only save if schedule has changed
      const currentSchedule = JSON.stringify(schedule);
      if (currentSchedule !== previousScheduleRef.current) {
        saveNow();
      }
    }, intervalMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMinutes, schedule, courses, faculty]);

  return {
    lastSaved,
    isSaving,
    saveNow,
  };
}
