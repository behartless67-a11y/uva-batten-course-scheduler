/**
 * Convert 24-hour time to 12-hour format
 * @param time24 - Time in HH:MM format (e.g., "13:30")
 * @returns Time in 12-hour format (e.g., "1:30 PM")
 */
export function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return time24; // Return original if invalid
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a time range in 12-hour format
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Formatted time range (e.g., "8:30 AM - 9:50 AM")
 */
export function formatTimeRange12Hour(startTime: string, endTime: string): string {
  return `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;
}
