/** The Overview's numbers and lists, derived with the shared selectors so they agree with every other view. */
import { pluralize, STATUS_LABELS } from '../../../../shared/format'
import type { Patient, PatientStatus, Workspace } from '../../../../shared/model'
import { statusCounts, tasksDueToday, unreadCount } from '../../state/selectors'

export type StatCardId = PatientStatus | 'unread' | 'tasks'

export interface StatCard {
  id: StatCardId
  label: string
  count: number
  /** "patients" under the number, or null when the label already says what is counted. */
  unit: string | null
}

const STATUS_CARD_ORDER: readonly PatientStatus[] = ['needs-review', 'open', 'completed']

export function statCards(workspace: Workspace, now: Date): StatCard[] {
  const counts = statusCounts(workspace.patients)
  return [
    ...STATUS_CARD_ORDER.map((status) => ({
      id: status,
      label: STATUS_LABELS[status],
      count: counts[status],
      unit: counts[status] === 1 ? 'patient' : 'patients'
    })),
    { id: 'unread', label: 'Unread messages', count: unreadCount(workspace.conversations), unit: null },
    { id: 'tasks', label: 'Tasks due today', count: tasksDueToday(workspace.tasks, now).length, unit: null }
  ]
}

/** The card button's accessible name: "Needs review: 8 patients", "Unread messages: 4". */
export function statCardName(card: StatCard): string {
  return card.unit ? `${card.label}: ${pluralize(card.count, 'patient')}` : `${card.label}: ${card.count}`
}

/** Patients with a follow-up alert: soonest visit first, then those with no visit, by name. */
export function needsAttention(patients: readonly Patient[]): Patient[] {
  return patients
    .filter((patient) => patient.alert !== null)
    .sort((a, b) => {
      if (a.nextVisit && b.nextVisit && a.nextVisit !== b.nextVisit) return a.nextVisit.localeCompare(b.nextVisit)
      if (a.nextVisit && !b.nextVisit) return -1
      if (!a.nextVisit && b.nextVisit) return 1
      return a.name.localeCompare(b.name)
    })
}
