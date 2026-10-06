/** Report figures. Pure functions over the workspace, so the tables are tested without rendering. */
import { STATUS_LABELS } from '../../../../shared/format'
import { PATIENT_STATUSES, type Patient, type PatientStatus } from '../../../../shared/model'
import { statusCounts } from '../../state/selectors'
import { scheduleDays } from '../schedule/scheduleModel'

export interface StatusRow {
  status: PatientStatus
  label: string
  count: number
  percent: number
}

export interface DayRow {
  key: string
  heading: string
  count: number
}

export interface ReasonRow {
  reason: string
  count: number
  percent: number
}

/** Whole-number percentage; 0 when there is nothing to divide by. */
export function percentOf(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100)
}

export function statusRows(patients: readonly Patient[]): { rows: StatusRow[]; total: number } {
  const counts = statusCounts(patients)
  const total = patients.length
  return {
    total,
    rows: PATIENT_STATUSES.map((status) => ({ status, label: STATUS_LABELS[status], count: counts[status], percent: percentOf(counts[status], total) }))
  }
}

/** Visits per day for the next `days` days, using the same days as the Schedule. */
export function visitRows(patients: readonly Patient[], now: Date, days = 7): DayRow[] {
  return scheduleDays(patients, now, days).map((day) => ({ key: day.key, heading: day.heading, count: day.visits.length }))
}

/** The most common reasons for care; ties are broken alphabetically so the order is stable. */
export function topReasons(patients: readonly Patient[], limit: number): ReasonRow[] {
  const counts = new Map<string, number>()
  for (const patient of patients) counts.set(patient.reason, (counts.get(patient.reason) ?? 0) + 1)
  return Array.from(counts, ([reason, count]) => ({ reason, count, percent: percentOf(count, patients.length) }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, limit)
}
