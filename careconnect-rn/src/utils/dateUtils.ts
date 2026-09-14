// src/utils/dateUtils.ts

/**
 * Returns a friendly date like "Monday, September 14"
 */
export function formatFriendlyDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns true if the date is today
 */
export function isToday(date: Date, now: Date = new Date()): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Returns a relative day label: "Today", "Tomorrow", "Yesterday",
 * or "In X days" for the near future
 */
export function relativeDayLabel(date: Date, now: Date = new Date()): string {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - start.getTime()) / oneDay);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  return formatFriendlyDate(date);
}

/**
 * Returns a greeting based on the hour of the day
 */
export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}