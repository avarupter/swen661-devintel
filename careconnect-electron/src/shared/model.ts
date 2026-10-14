/**
 * Domain model shared by the main process (persistence, export, validation)
 * and the renderer (state, views). Plain data only: everything here must
 * survive JSON and the structured clone that IPC applies.
 *
 * Every date is an ISO 8601 string. All records are synthetic demo data.
 */

export type PatientStatus = 'needs-review' | 'open' | 'completed'

export const PATIENT_STATUSES: readonly PatientStatus[] = ['needs-review', 'open', 'completed']

export type ActivityKind = 'note' | 'message' | 'task' | 'visit' | 'record'

export const ACTIVITY_KINDS: readonly ActivityKind[] = ['note', 'message', 'task', 'visit', 'record']

export interface Activity {
  id: string
  kind: ActivityKind
  /** "Visit note updated", "Portal message", "Care task completed" */
  title: string
  /** Free text, e.g. the body of a clinical note. */
  detail?: string
  at: string
  author?: string
}

/** The highlighted call-out on the care summary ("Follow-up due today"). */
export interface FollowUpAlert {
  title: string
  detail: string
}

export interface Patient {
  id: string
  name: string
  pronouns: string
  /** "Adult", "Older adult", "Young adult" */
  ageGroup: string
  /** "CC-1048" */
  careId: string
  status: PatientStatus
  /** Reason for the current episode of care: "Wellness follow-up". */
  reason: string
  lastContact: string
  nextVisit: string | null
  careTeam: string[]
  alert: FollowUpAlert | null
  plan: string[]
  /** Newest first. */
  activity: Activity[]
}

export interface Attachment {
  name: string
  size: number
}

export interface Message {
  id: string
  author: string
  body: string
  at: string
  outgoing: boolean
  attachments: Attachment[]
}

export interface Conversation {
  id: string
  patientId: string | null
  subject: string
  /** Who the conversation is with: a patient, a colleague or a team. */
  with: string
  /** Oldest first. */
  messages: Message[]
  unread: boolean
}

export interface Draft {
  id: string
  conversationId: string | null
  patientId: string | null
  to: string
  subject: string
  body: string
  attachments: Attachment[]
  updatedAt: string
}

export type TaskPriority = 'routine' | 'urgent'

export interface CareTask {
  id: string
  title: string
  patientId: string | null
  due: string
  done: boolean
  priority: TaskPriority
}

export interface Preferences {
  showShortcutHints: boolean
  /**
   * Single-character shortcuts (E, N, M, R, /, G-sequences). WCAG 2.1.4 needs a way
   * to turn them off: speech-input users can trigger them by speaking a word.
   */
  singleKeyShortcuts: boolean
  reduceMotion: boolean
  highContrast: boolean
  notifications: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  showShortcutHints: true,
  singleKeyShortcuts: true,
  reduceMotion: false,
  highContrast: false,
  notifications: true
}

export interface RecentPatient {
  patientId: string
  at: string
}

export interface Workspace {
  version: 1
  clinic: { name: string; subtitle: string }
  user: { name: string; role: string }
  patients: Patient[]
  conversations: Conversation[]
  drafts: Draft[]
  tasks: CareTask[]
  preferences: Preferences
  /** Most recent first, at most RECENT_PATIENT_LIMIT entries. */
  recentPatients: RecentPatient[]
}

export const RECENT_PATIENT_LIMIT = 5
