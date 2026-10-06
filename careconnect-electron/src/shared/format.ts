/**
 * Date, time and label formatting. Every function takes `now` explicitly so
 * nothing here reads the system clock and every rule is testable.
 *
 * Times use the 24-hour clock, as in the design ("09:14", "15:22"). Month names
 * are fixed English abbreviations so output does not vary by machine locale.
 */
import type { PatientStatus } from './model'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Whole calendar days from `now` to `value`: 0 today, -1 yesterday, 1 tomorrow. */
export function calendarDayOffset(value: string | Date, now: Date): number {
  return Math.round((startOfDay(toDate(value)) - startOfDay(now)) / MS_PER_DAY)
}

export function isSameDay(value: string | Date, now: Date): boolean {
  return calendarDayOffset(value, now) === 0
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** "09:14" */
export function formatTime(value: string | Date): string {
  const date = toDate(value)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** "Sep 28", or "Sep 28, 2025" outside the current year. */
export function formatShortDate(value: string | Date, now: Date): string {
  const date = toDate(value)
  const base = `${MONTHS[date.getMonth()]} ${date.getDate()}`
  return date.getFullYear() === now.getFullYear() ? base : `${base}, ${date.getFullYear()}`
}

/** "Tue, Sep 29" */
export function formatWeekdayDate(value: string | Date, now: Date): string {
  const date = toDate(value)
  return `${WEEKDAYS[date.getDay()]}, ${formatShortDate(date, now)}`
}

/** "Mon, Oct 5, 2026, 10:30" — unambiguous, for exported files that outlive "today". */
export function formatLongDateTime(value: string | Date): string {
  const date = toDate(value)
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${formatTime(date)}`
}

/** "Today", "Yesterday", "Tomorrow", otherwise "Sep 28". */
export function formatRelativeDay(value: string | Date, now: Date): string {
  const offset = calendarDayOffset(value, now)
  if (offset === 0) return 'Today'
  if (offset === -1) return 'Yesterday'
  if (offset === 1) return 'Tomorrow'
  return formatShortDate(value, now)
}

/** "Today, 10:30" — the stat-card form. */
export function formatDayTime(value: string | Date, now: Date): string {
  return `${formatRelativeDay(value, now)}, ${formatTime(value)}`
}

/** "Today · 09:14" — the activity-feed form. */
export function formatActivityTime(value: string | Date, now: Date): string {
  return `${formatRelativeDay(value, now)} · ${formatTime(value)}`
}

/** "just now", "4 minutes ago", "2 hours ago", "Yesterday", "Sep 26". */
export function formatTimeAgo(value: string | Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - toDate(value).getTime()) / MS_PER_MINUTE)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24 && isSameDay(value, now)) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  return formatRelativeDay(value, now)
}

/** "AP" for "Avery Park"; at most two letters. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export const STATUS_LABELS: Record<PatientStatus, string> = {
  'needs-review': 'Needs review',
  open: 'Open',
  completed: 'Completed'
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** "512 bytes", "12 KB", "3.4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`
  // Sizes that would round to "1024 KB" are shown as "1.0 MB" instead.
  if (bytes < 1023.5 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
