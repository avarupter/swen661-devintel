/**
 * Derived data. Views call these instead of computing status, dates or
 * counts inline, so the rules are tested once.
 */
import { calendarDayOffset, formatRelativeDay, formatTime, isSameDay } from '../../../shared/format'
import type { CareTask, Conversation, Patient, PatientStatus, Workspace } from '../../../shared/model'
import type { SortOrder, StatusFilter } from './appState'

export function patientById(workspace: Workspace | null, patientId: string | null | undefined): Patient | null {
  if (!workspace || !patientId) return null
  return workspace.patients.find((patient) => patient.id === patientId) ?? null
}

/** The newest activity time, falling back to the last contact. */
export function latestActivityAt(patient: Patient): string {
  let latest = patient.lastContact
  for (const activity of patient.activity) if (activity.at > latest) latest = activity.at
  return latest
}

/**
 * The second line of a patient row, as in the design:
 * "Wellness follow-up · 10:30" when there is a visit today,
 * otherwise the day of the latest activity ("Care plan update · Today").
 */
export function patientSecondaryText(patient: Patient, now: Date): string {
  const when =
    patient.nextVisit && isSameDay(patient.nextVisit, now) ? formatTime(patient.nextVisit) : formatRelativeDay(latestActivityAt(patient), now)
  return `${patient.reason} · ${when}`
}

const STATUS_ORDER: Record<PatientStatus, number> = { 'needs-review': 0, open: 1, completed: 2 }

export interface PatientListOptions {
  query: string
  filter: StatusFilter
  sortOrder: SortOrder
}

export function matchesPatientQuery(patient: Patient, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [patient.name, patient.careId, patient.reason].some((field) => field.toLowerCase().includes(needle))
}

export function visiblePatients(patients: readonly Patient[], options: PatientListOptions): Patient[] {
  const filtered = patients.filter(
    (patient) => (options.filter === 'all' || patient.status === options.filter) && matchesPatientQuery(patient, options.query)
  )
  const byRecent = (a: Patient, b: Patient) => latestActivityAt(b).localeCompare(latestActivityAt(a))
  switch (options.sortOrder) {
    case 'name':
      return filtered.sort((a, b) => a.name.localeCompare(b.name))
    case 'nextVisit':
      return filtered.sort((a, b) => {
        if (a.nextVisit === b.nextVisit) return byRecent(a, b)
        if (a.nextVisit === null) return 1
        if (b.nextVisit === null) return -1
        return a.nextVisit.localeCompare(b.nextVisit)
      })
    case 'status':
      return filtered.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || byRecent(a, b))
    case 'recent':
      return filtered.sort(byRecent)
  }
}

export function statusCounts(patients: readonly Patient[]): Record<PatientStatus, number> {
  const counts: Record<PatientStatus, number> = { 'needs-review': 0, open: 0, completed: 0 }
  for (const patient of patients) counts[patient.status] += 1
  return counts
}

export function unreadCount(conversations: readonly Conversation[]): number {
  return conversations.filter((conversation) => conversation.unread).length
}

/** Patients with a visit from today through `days` days ahead, soonest first. */
export function upcomingVisits(patients: readonly Patient[], now: Date, days: number): Patient[] {
  return patients
    .filter((patient) => {
      if (!patient.nextVisit) return false
      const offset = calendarDayOffset(patient.nextVisit, now)
      return offset >= 0 && offset < days
    })
    .sort((a, b) => (a.nextVisit as string).localeCompare(b.nextVisit as string))
}

/** Patients seen today who still need attention: the launch notification lists these. */
export function followUpsDueToday(patients: readonly Patient[], now: Date): Patient[] {
  return upcomingVisits(patients, now, 1).filter((patient) => patient.status !== 'completed')
}

export function tasksDueToday(tasks: readonly CareTask[], now: Date): CareTask[] {
  return tasks.filter((task) => !task.done && calendarDayOffset(task.due, now) <= 0).sort((a, b) => a.due.localeCompare(b.due))
}

export function isOverdue(task: CareTask, now: Date): boolean {
  return !task.done && new Date(task.due).getTime() < now.getTime()
}

export function conversationById(workspace: Workspace | null, conversationId: string | null | undefined): Conversation | null {
  if (!workspace || !conversationId) return null
  return workspace.conversations.find((conversation) => conversation.id === conversationId) ?? null
}

/** Conversations newest first by their latest message. */
export function sortedConversations(conversations: readonly Conversation[]): Conversation[] {
  const latest = (conversation: Conversation) => conversation.messages[conversation.messages.length - 1]?.at ?? ''
  return [...conversations].sort((a, b) => latest(b).localeCompare(latest(a)))
}

/**
 * Imported records whose Care ID is already in the list are skipped, and
 * colliding ids are re-keyed, so an import can never overwrite existing work.
 */
export function mergeImportedPatients(
  existing: readonly Patient[],
  incoming: readonly Patient[],
  makeId: (prefix: string) => string
): { added: Patient[]; duplicates: number } {
  const careIds = new Set(existing.map((patient) => patient.careId))
  const ids = new Set(existing.map((patient) => patient.id))
  const added: Patient[] = []
  let duplicates = 0
  for (const patient of incoming) {
    if (careIds.has(patient.careId)) {
      duplicates += 1
      continue
    }
    const id = ids.has(patient.id) ? makeId('p') : patient.id
    careIds.add(patient.careId)
    ids.add(id)
    added.push({ ...patient, id })
  }
  return { added, duplicates }
}
