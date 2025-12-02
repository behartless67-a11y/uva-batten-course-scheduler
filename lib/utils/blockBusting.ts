import { TimeSlot, DayOfWeek } from '@/types/scheduling';

/**
 * Block Busting Rules - University of Virginia
 *
 * "Block busting" means scheduling outside the standard university scheduling blocks.
 *
 * Standard blocks (NOT block-busting):
 * - Monday/Wednesday/Friday: 50 minutes, starts before 3:00 PM
 * - Tuesday/Thursday: 75 minutes, starts before 2:30 PM
 *
 * Block-busting classes MUST use one of the 3 Batten rooms:
 * - Monroe 120 (capacity: 68)
 * - Rouss 403 (capacity: 48)
 * - Pavilion VIII (capacity: 18)
 *
 * These same rooms are also used for standard (non-block-busting) courses.
 */

/**
 * Convert time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate duration in minutes from start and end times
 */
function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Check if time slot is block-busting (violates standard university scheduling blocks)
 *
 * @param timeSlot The time slot to check
 * @param courseDuration The duration of the course in minutes (from Course.duration)
 * @returns true if the time slot is block-busting, false otherwise
 */
export function isBlockBusting(timeSlot: TimeSlot, courseDuration: number): boolean {
  const startMinutes = timeToMinutes(timeSlot.startTime);
  const slotDuration = calculateDuration(timeSlot.startTime, timeSlot.endTime);

  // Determine the day pattern
  const hasMondayWednesdayFriday = timeSlot.days.some(day =>
    day === 'Monday' || day === 'Wednesday' || day === 'Friday'
  );
  const hasTuesdayThursday = timeSlot.days.some(day =>
    day === 'Tuesday' || day === 'Thursday'
  );

  // Check Monday/Wednesday/Friday pattern
  if (hasMondayWednesdayFriday && !hasTuesdayThursday) {
    // Standard block: 50 minutes, starts before 3:00 PM (15:00 = 900 minutes)
    const isStandardDuration = courseDuration === 50 || slotDuration === 50;
    const startsBeforeCutoff = startMinutes < (15 * 60); // 3:00 PM

    // If it violates either rule, it's block-busting
    if (!isStandardDuration || !startsBeforeCutoff) {
      return true;
    }
  }

  // Check Tuesday/Thursday pattern
  if (hasTuesdayThursday && !hasMondayWednesdayFriday) {
    // Standard block: 75 minutes, starts before 2:30 PM (14:30 = 870 minutes)
    const isStandardDuration = courseDuration === 75 || slotDuration === 75;
    const startsBeforeCutoff = startMinutes < (14 * 60 + 30); // 2:30 PM

    // If it violates either rule, it's block-busting
    if (!isStandardDuration || !startsBeforeCutoff) {
      return true;
    }
  }

  // Mixed days (e.g., MWF + TR) or single-day patterns
  // Since user said "no they do not have different rules" for 1-day/week classes,
  // we apply the same logic based on which days are included

  // If it has both MWF and TR days, consider it block-busting (unusual pattern)
  if (hasMondayWednesdayFriday && hasTuesdayThursday) {
    return true;
  }

  // Single day or other patterns - check against the primary day type
  // If it doesn't fit standard patterns, it's block-busting
  if (timeSlot.days.length === 1) {
    const day = timeSlot.days[0];

    if (day === 'Monday' || day === 'Wednesday' || day === 'Friday') {
      const isStandardDuration = courseDuration === 50 || slotDuration === 50;
      const startsBeforeCutoff = startMinutes < (15 * 60);
      return !isStandardDuration || !startsBeforeCutoff;
    }

    if (day === 'Tuesday' || day === 'Thursday') {
      const isStandardDuration = courseDuration === 75 || slotDuration === 75;
      const startsBeforeCutoff = startMinutes < (14 * 60 + 30);
      return !isStandardDuration || !startsBeforeCutoff;
    }
  }

  // Default: not block-busting
  return false;
}

/**
 * Get human-readable reason why a time slot is block-busting
 */
export function getBlockBustingReason(timeSlot: TimeSlot, courseDuration: number): string {
  const startMinutes = timeToMinutes(timeSlot.startTime);
  const slotDuration = calculateDuration(timeSlot.startTime, timeSlot.endTime);

  const hasMondayWednesdayFriday = timeSlot.days.some(day =>
    day === 'Monday' || day === 'Wednesday' || day === 'Friday'
  );
  const hasTuesdayThursday = timeSlot.days.some(day =>
    day === 'Tuesday' || day === 'Thursday'
  );

  if (hasMondayWednesdayFriday && !hasTuesdayThursday) {
    const reasons: string[] = [];
    if (courseDuration !== 50 && slotDuration !== 50) {
      reasons.push(`duration is ${courseDuration} min (should be 50 min)`);
    }
    if (startMinutes >= (15 * 60)) {
      reasons.push(`starts at/after 3:00 PM (should start before 3:00 PM)`);
    }
    return reasons.join(' and ');
  }

  if (hasTuesdayThursday && !hasMondayWednesdayFriday) {
    const reasons: string[] = [];
    if (courseDuration !== 75 && slotDuration !== 75) {
      reasons.push(`duration is ${courseDuration} min (should be 75 min)`);
    }
    if (startMinutes >= (14 * 60 + 30)) {
      reasons.push(`starts at/after 2:30 PM (should start before 2:30 PM)`);
    }
    return reasons.join(' and ');
  }

  if (hasMondayWednesdayFriday && hasTuesdayThursday) {
    return 'mixed MWF and TR days (non-standard pattern)';
  }

  return 'does not fit standard university scheduling blocks';
}

/**
 * List of Batten room IDs (must use these rooms for block-busting courses)
 * These same rooms are also used for standard courses.
 */
export const BATTEN_ROOM_IDS = [
  'monroe-120',
  'rouss-403',
  'pavilion-viii',
];

/**
 * Check if a room is a Batten room (valid for block-busting)
 */
export function isBattenRoom(roomId: string): boolean {
  return BATTEN_ROOM_IDS.includes(roomId);
}
