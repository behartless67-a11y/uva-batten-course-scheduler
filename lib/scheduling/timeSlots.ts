import { TimeSlot, DayOfWeek } from '@/types/scheduling';

// Pre-defined common time slots
// CONSTRAINT: No classes start before 9:30 AM
export const TIME_SLOTS: TimeSlot[] = [
  // Morning slots (earliest: 9:30 AM)
  {
    id: 'mon-wed-930-1050',
    startTime: '09:30',
    endTime: '10:50',
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    isPreferredMorning: true,
  },
  {
    id: 'tue-thu-930-1050',
    startTime: '09:30',
    endTime: '10:50',
    days: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
    isPreferredMorning: true,
  },
  {
    id: 'mon-wed-1000-1120',
    startTime: '10:00',
    endTime: '11:20',
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    isPreferredMorning: true,
  },
  {
    id: 'tue-thu-1100-1220',
    startTime: '11:00',
    endTime: '12:20',
    days: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
    isPreferredMorning: true,
  },

  // Afternoon slots (avoiding Batten Hour Mon 12:30-1:30)
  {
    id: 'tue-thu-1230-150',
    startTime: '12:30',
    endTime: '13:50',
    days: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
    isPreferredAfternoon: true,
  },
  {
    id: 'mon-wed-200-320',
    startTime: '14:00',
    endTime: '15:20',
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    isPreferredAfternoon: true,
  },
  {
    id: 'tue-thu-200-320',
    startTime: '14:00',
    endTime: '15:20',
    days: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
    isPreferredAfternoon: true,
  },
  {
    id: 'mon-wed-330-450',
    startTime: '15:30',
    endTime: '16:50',
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    isPreferredAfternoon: true,
  },
  {
    id: 'tue-thu-330-450',
    startTime: '15:30',
    endTime: '16:50',
    days: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
    isPreferredAfternoon: true,
  },

  // 2.5 hour slots for capstones and behavioral science
  {
    id: 'mon-330-600',
    startTime: '15:30',
    endTime: '18:00',
    days: [DayOfWeek.MONDAY],
  },
  {
    id: 'tue-330-600',
    startTime: '15:30',
    endTime: '18:00',
    days: [DayOfWeek.TUESDAY],
  },
  {
    id: 'wed-330-600',
    startTime: '15:30',
    endTime: '18:00',
    days: [DayOfWeek.WEDNESDAY],
  },
  {
    id: 'thu-330-600',
    startTime: '15:30',
    endTime: '18:00',
    days: [DayOfWeek.THURSDAY],
  },

  // Friday slots (for specific courses like APP 2)
  {
    id: 'fri-930-1200',
    startTime: '09:30',
    endTime: '12:00',
    days: [DayOfWeek.FRIDAY],
  },
  {
    id: 'fri-200-430',
    startTime: '14:00',
    endTime: '16:30',
    days: [DayOfWeek.FRIDAY],
  },

  // Lead From Anywhere specific slots (Wed 9:30-12 and 2:00-4:30)
  {
    id: 'wed-930-1200',
    startTime: '09:30',
    endTime: '12:00',
    days: [DayOfWeek.WEDNESDAY],
  },
  {
    id: 'wed-200-430',
    startTime: '14:00',
    endTime: '16:30',
    days: [DayOfWeek.WEDNESDAY],
  },
];

// Batten Hour constraint
export const BATTEN_HOUR = {
  day: DayOfWeek.MONDAY,
  startTime: '12:30',
  endTime: '13:30',
};

// Helper functions
export function isTimeDuringBattenHour(timeSlot: TimeSlot): boolean {
  if (!timeSlot.days.includes(DayOfWeek.MONDAY)) return false;

  const slotStart = timeToMinutes(timeSlot.startTime);
  const slotEnd = timeToMinutes(timeSlot.endTime);
  const battenStart = timeToMinutes(BATTEN_HOUR.startTime);
  const battenEnd = timeToMinutes(BATTEN_HOUR.endTime);

  return !(slotEnd <= battenStart || slotStart >= battenEnd);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // Check if they share any days
  const sharedDays = slot1.days.filter(day => slot2.days.includes(day));
  if (sharedDays.length === 0) return false;

  // Check if times overlap
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  return !(end1 <= start2 || start1 >= end2);
}

export function getTimeSlotDuration(timeSlot: TimeSlot): number {
  return timeToMinutes(timeSlot.endTime) - timeToMinutes(timeSlot.startTime);
}

export function findSuitableTimeSlots(
  requiredDuration: number,
  sessionsPerWeek: number,
  allowFriday: boolean = false
): TimeSlot[] {
  return TIME_SLOTS.filter(slot => {
    const duration = getTimeSlotDuration(slot);
    const hasFriday = slot.days.includes(DayOfWeek.FRIDAY);

    // Filter by duration (allow 10 minute tolerance)
    if (Math.abs(duration - requiredDuration) > 10) return false;

    // Filter by Friday restriction
    if (!allowFriday && hasFriday) return false;

    // Filter by sessions per week
    if (slot.days.length !== sessionsPerWeek) return false;

    return true;
  });
}
