/** Visits for the coming days, grouped by calendar day. Pure, so the date rules are unit tested. */
import { calendarDayOffset, formatRelativeDay, formatWeekdayDate } from '../../../../shared/format'
import type { Patient } from '../../../../shared/model'
import { upcomingVisits } from '../../state/selectors'

export interface ScheduleDay {
  /** "2026-10-05": stable React key and id fragment. */
  key: string
  heading: string
  /** Patients with their next visit on this day, in time order. */
  visits: Patient[]
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * "Today · Mon, Oct 5" and "Tomorrow · Tue, Oct 6"; later days are just
 * "Wed, Oct 7", because "Oct 7 · Wed, Oct 7" would say the date twice.
 */
export function dayHeading(day: Date, now: Date): string {
  const weekday = formatWeekdayDate(day, now)
  const offset = calendarDayOffset(day, now)
  return offset === 0 || offset === 1 ? `${formatRelativeDay(day, now)} · ${weekday}` : weekday
}

/** `days` consecutive days from today, including days with no visits. */
export function scheduleDays(patients: readonly Patient[], now: Date, days: number): ScheduleDay[] {
  const visits = upcomingVisits(patients, now, days)
  return Array.from({ length: days }, (_, offset) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    return {
      key: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`,
      heading: dayHeading(day, now),
      visits: visits.filter((patient) => patient.nextVisit !== null && calendarDayOffset(patient.nextVisit, now) === offset)
    }
  })
}
