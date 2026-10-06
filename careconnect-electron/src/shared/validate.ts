/**
 * Runtime validation for everything that crosses a trust boundary: IPC
 * payloads from the renderer, the workspace file on disk, and imported
 * files. Validators return a fresh object containing only known fields, so
 * unexpected properties never travel further.
 */
import type { ContextMenuItem, ContextMenuRequest, ExportRequest, NotificationRequest, UiState } from './api'
import { VIEW_IDS } from './commands'
import { isAllowedExternalUrl } from './links'
import type {
  Activity,
  Attachment,
  CareTask,
  Conversation,
  Draft,
  FollowUpAlert,
  Message,
  Patient,
  Preferences,
  RecentPatient,
  Workspace
} from './model'
import { ACTIVITY_KINDS, PATIENT_STATUSES, RECENT_PATIENT_LIMIT } from './model'

export class ValidationError extends Error {
  constructor(
    readonly path: string,
    readonly reason: string
  ) {
    super(`${path}: ${reason}`)
    this.name = 'ValidationError'
  }
}

export const LIMITS = {
  shortText: 200,
  longText: 10_000,
  isoDate: 40,
  patients: 2_000,
  listItems: 500,
  careTeam: 20,
  attachments: 20,
  attachmentBytes: 1024 ** 4,
  contextMenuItems: 40,
  url: 2_048
} as const

type UnknownRecord = Record<string, unknown>

function record(value: unknown, path: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(path, 'expected an object')
  }
  return value as UnknownRecord
}

function text(value: unknown, path: string, max: number = LIMITS.shortText, allowEmpty = false): string {
  if (typeof value !== 'string') throw new ValidationError(path, 'expected text')
  if (!allowEmpty && value.trim() === '') throw new ValidationError(path, 'must not be empty')
  if (value.length > max) throw new ValidationError(path, `must be at most ${max} characters`)
  return value
}

/**
 * An ISO 8601 date and time with an explicit offset: "2026-10-05T10:30:00.000Z",
 * "2026-10-05T10:30+05:00". The first group is the calendar day.
 */
const ISO_DATE_TIME =
  /^(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/

/** Whether "2026-02-31" is a real day. Date.parse quietly rolls it on to 3 March. */
function isRealDay(day: string): boolean {
  return new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day
}

/**
 * Accepts only real ISO 8601 date-times (Date.parse alone would take "1" or
 * "Oct 5") and returns them in UTC, as toISOString writes them, so the
 * selectors can compare dates as strings.
 */
function isoDate(value: unknown, path: string): string {
  const raw = text(value, path, LIMITS.isoDate)
  const day = ISO_DATE_TIME.exec(raw)?.[1]
  const time = day && isRealDay(day) ? Date.parse(raw) : Number.NaN
  const utc = Number.isNaN(time) ? '' : new Date(time).toISOString()
  // An offset can carry 9999-12-31 past year 9999, which toISOString writes as "+010000-…".
  if (!ISO_DATE_TIME.test(utc)) throw new ValidationError(path, 'expected an ISO 8601 date')
  return utc
}

function bool(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new ValidationError(path, 'expected true or false')
  return value
}

function count(value: unknown, path: string, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
    throw new ValidationError(path, `expected a whole number from 0 to ${max}`)
  }
  return value
}

function oneOf<T extends string>(value: unknown, path: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new ValidationError(path, `expected one of ${allowed.join(', ')}`)
  }
  return value as T
}

function list<T>(value: unknown, path: string, max: number, item: (entry: unknown, path: string) => T): T[] {
  if (!Array.isArray(value)) throw new ValidationError(path, 'expected a list')
  if (value.length > max) throw new ValidationError(path, `must have at most ${max} entries`)
  return value.map((entry, index) => item(entry, `${path}[${index}]`))
}

function nullable<T>(value: unknown, path: string, item: (entry: unknown, path: string) => T): T | null {
  return value === null ? null : item(value, path)
}

// ---------------------------------------------------------------------------
// Domain records

export function validateActivity(value: unknown, path = 'activity'): Activity {
  const source = record(value, path)
  const activity: Activity = {
    id: text(source.id, `${path}.id`),
    kind: oneOf(source.kind, `${path}.kind`, ACTIVITY_KINDS),
    title: text(source.title, `${path}.title`),
    at: isoDate(source.at, `${path}.at`)
  }
  if (source.detail !== undefined) activity.detail = text(source.detail, `${path}.detail`, LIMITS.longText, true)
  if (source.author !== undefined) activity.author = text(source.author, `${path}.author`)
  return activity
}

function validateAlert(value: unknown, path: string): FollowUpAlert {
  const source = record(value, path)
  return {
    title: text(source.title, `${path}.title`),
    detail: text(source.detail, `${path}.detail`, LIMITS.longText, true)
  }
}

export function validatePatient(value: unknown, path = 'patient'): Patient {
  const source = record(value, path)
  return {
    id: text(source.id, `${path}.id`),
    name: text(source.name, `${path}.name`),
    pronouns: text(source.pronouns, `${path}.pronouns`, LIMITS.shortText, true),
    ageGroup: text(source.ageGroup, `${path}.ageGroup`, LIMITS.shortText, true),
    careId: text(source.careId, `${path}.careId`),
    status: oneOf(source.status, `${path}.status`, PATIENT_STATUSES),
    reason: text(source.reason, `${path}.reason`),
    lastContact: isoDate(source.lastContact, `${path}.lastContact`),
    nextVisit: nullable(source.nextVisit, `${path}.nextVisit`, isoDate),
    careTeam: list(source.careTeam, `${path}.careTeam`, LIMITS.careTeam, (entry, p) => text(entry, p)),
    alert: nullable(source.alert, `${path}.alert`, validateAlert),
    plan: list(source.plan, `${path}.plan`, LIMITS.listItems, (entry, p) => text(entry, p, LIMITS.longText)),
    activity: list(source.activity, `${path}.activity`, LIMITS.listItems, validateActivity)
  }
}

export function validateAttachment(value: unknown, path = 'attachment'): Attachment {
  const source = record(value, path)
  return {
    name: text(source.name, `${path}.name`, 255),
    size: count(source.size, `${path}.size`, LIMITS.attachmentBytes)
  }
}

function validateMessage(value: unknown, path: string): Message {
  const source = record(value, path)
  return {
    id: text(source.id, `${path}.id`),
    author: text(source.author, `${path}.author`),
    body: text(source.body, `${path}.body`, LIMITS.longText),
    at: isoDate(source.at, `${path}.at`),
    outgoing: bool(source.outgoing, `${path}.outgoing`),
    attachments: list(source.attachments, `${path}.attachments`, LIMITS.attachments, validateAttachment)
  }
}

function validateConversation(value: unknown, path: string): Conversation {
  const source = record(value, path)
  return {
    id: text(source.id, `${path}.id`),
    patientId: nullable(source.patientId, `${path}.patientId`, (v, p) => text(v, p)),
    subject: text(source.subject, `${path}.subject`),
    with: text(source.with, `${path}.with`),
    messages: list(source.messages, `${path}.messages`, LIMITS.listItems, validateMessage),
    unread: bool(source.unread, `${path}.unread`)
  }
}

function validateDraft(value: unknown, path: string): Draft {
  const source = record(value, path)
  return {
    id: text(source.id, `${path}.id`),
    conversationId: nullable(source.conversationId, `${path}.conversationId`, (v, p) => text(v, p)),
    patientId: nullable(source.patientId, `${path}.patientId`, (v, p) => text(v, p)),
    to: text(source.to, `${path}.to`, LIMITS.shortText, true),
    subject: text(source.subject, `${path}.subject`, LIMITS.shortText, true),
    body: text(source.body, `${path}.body`, LIMITS.longText, true),
    attachments: list(source.attachments, `${path}.attachments`, LIMITS.attachments, validateAttachment),
    updatedAt: isoDate(source.updatedAt, `${path}.updatedAt`)
  }
}

function validateTask(value: unknown, path: string): CareTask {
  const source = record(value, path)
  return {
    id: text(source.id, `${path}.id`),
    title: text(source.title, `${path}.title`),
    patientId: nullable(source.patientId, `${path}.patientId`, (v, p) => text(v, p)),
    due: isoDate(source.due, `${path}.due`),
    done: bool(source.done, `${path}.done`),
    priority: oneOf(source.priority, `${path}.priority`, ['routine', 'urgent'] as const)
  }
}

function validatePreferences(value: unknown, path: string): Preferences {
  const source = record(value, path)
  return {
    showShortcutHints: bool(source.showShortcutHints, `${path}.showShortcutHints`),
    reduceMotion: bool(source.reduceMotion, `${path}.reduceMotion`),
    highContrast: bool(source.highContrast, `${path}.highContrast`),
    notifications: bool(source.notifications, `${path}.notifications`)
  }
}

function validateRecentPatient(value: unknown, path: string): RecentPatient {
  const source = record(value, path)
  return { patientId: text(source.patientId, `${path}.patientId`), at: isoDate(source.at, `${path}.at`) }
}

export function validateWorkspace(value: unknown, path = 'workspace'): Workspace {
  const source = record(value, path)
  if (source.version !== 1) throw new ValidationError(`${path}.version`, 'unsupported workspace version')
  const clinic = record(source.clinic, `${path}.clinic`)
  const user = record(source.user, `${path}.user`)
  return {
    version: 1,
    clinic: { name: text(clinic.name, `${path}.clinic.name`), subtitle: text(clinic.subtitle, `${path}.clinic.subtitle`, LIMITS.shortText, true) },
    user: { name: text(user.name, `${path}.user.name`), role: text(user.role, `${path}.user.role`, LIMITS.shortText, true) },
    patients: list(source.patients, `${path}.patients`, LIMITS.patients, validatePatient),
    conversations: list(source.conversations, `${path}.conversations`, LIMITS.listItems, validateConversation),
    drafts: list(source.drafts, `${path}.drafts`, LIMITS.listItems, validateDraft),
    tasks: list(source.tasks, `${path}.tasks`, LIMITS.listItems, validateTask),
    preferences: validatePreferences(source.preferences, `${path}.preferences`),
    recentPatients: list(source.recentPatients, `${path}.recentPatients`, RECENT_PATIENT_LIMIT, validateRecentPatient)
  }
}

// ---------------------------------------------------------------------------
// IPC payloads

export function validateUiState(value: unknown, path = 'uiState'): UiState {
  const source = record(value, path)
  return {
    view: oneOf(source.view, `${path}.view`, VIEW_IDS),
    hasSelection: bool(source.hasSelection, `${path}.hasSelection`),
    modal: nullable(source.modal, `${path}.modal`, (v, p) => oneOf(v, p, ['palette', 'compose', 'dialog'] as const)),
    unreadCount: count(source.unreadCount, `${path}.unreadCount`, 100_000),
    unsavedChanges: count(source.unsavedChanges, `${path}.unsavedChanges`, 1_000_000),
    showShortcutHints: bool(source.showShortcutHints, `${path}.showShortcutHints`),
    highContrast: bool(source.highContrast, `${path}.highContrast`),
    reduceMotion: bool(source.reduceMotion, `${path}.reduceMotion`)
  }
}

export function validateExportRequest(value: unknown, path = 'exportRequest'): ExportRequest {
  const source = record(value, path)
  return {
    patient: validatePatient(source.patient, `${path}.patient`),
    format: oneOf(source.format, `${path}.format`, ['txt', 'json'] as const)
  }
}

export function validateNotificationRequest(value: unknown, path = 'notification'): NotificationRequest {
  const source = record(value, path)
  const request: NotificationRequest = {
    title: text(source.title, `${path}.title`),
    body: text(source.body, `${path}.body`, 1_000, true)
  }
  if (source.patientId !== undefined) request.patientId = text(source.patientId, `${path}.patientId`)
  return request
}

function validateContextMenuItem(value: unknown, path: string): ContextMenuItem {
  const source = record(value, path)
  const type = source.type === undefined ? 'normal' : oneOf(source.type, `${path}.type`, ['normal', 'separator', 'checkbox', 'radio'] as const)
  const item: ContextMenuItem = {
    id: text(source.id, `${path}.id`),
    label: type === 'separator' ? '' : text(source.label, `${path}.label`),
    type
  }
  if (source.enabled !== undefined) item.enabled = bool(source.enabled, `${path}.enabled`)
  if (source.checked !== undefined) item.checked = bool(source.checked, `${path}.checked`)
  if (source.accelerator !== undefined) item.accelerator = text(source.accelerator, `${path}.accelerator`, 40)
  return item
}

function coordinate(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100_000) {
    throw new ValidationError(path, 'expected a window coordinate')
  }
  return Math.round(value)
}

export function validateContextMenuRequest(value: unknown, path = 'contextMenu'): ContextMenuRequest {
  const source = record(value, path)
  const request: ContextMenuRequest = {
    items: list(source.items, `${path}.items`, LIMITS.contextMenuItems, validateContextMenuItem)
  }
  if (request.items.length === 0) throw new ValidationError(`${path}.items`, 'must not be empty')
  if (source.x !== undefined) request.x = coordinate(source.x, `${path}.x`)
  if (source.y !== undefined) request.y = coordinate(source.y, `${path}.y`)
  return request
}

export function validateExternalUrl(value: unknown, path = 'url'): string {
  const url = text(value, path, LIMITS.url)
  if (!isAllowedExternalUrl(url)) throw new ValidationError(path, 'only allow-listed https links can be opened')
  return url
}

export function validateClipboardText(value: unknown, path = 'text'): string {
  return text(value, path, LIMITS.longText)
}

// ---------------------------------------------------------------------------
// Import files

export interface ParsedImport {
  patients: Patient[]
  skipped: number
}

/**
 * Accepts the three shapes CareConnect can produce or a team might hand over:
 * an array of patients, `{ patients: [...] }` (a workspace or bulk export),
 * or a single-patient export `{ format: 'careconnect.patient.v1', patient }`.
 * Records that fail validation are skipped and counted, not fatal.
 */
export function parsePatientImport(json: string): ParsedImport {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new ValidationError('file', 'is not valid JSON')
  }

  let candidates: unknown[]
  if (Array.isArray(data)) candidates = data
  else if (typeof data === 'object' && data !== null && Array.isArray((data as UnknownRecord).patients)) {
    candidates = (data as UnknownRecord).patients as unknown[]
  } else if (typeof data === 'object' && data !== null && (data as UnknownRecord).patient !== undefined) {
    candidates = [(data as UnknownRecord).patient]
  } else {
    throw new ValidationError('file', 'contains no patients')
  }
  if (candidates.length > LIMITS.patients) throw new ValidationError('file', `has more than ${LIMITS.patients} patients`)

  const patients: Patient[] = []
  let skipped = 0
  candidates.forEach((candidate, index) => {
    try {
      patients.push(validatePatient(candidate, `patients[${index}]`))
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error
      skipped += 1
    }
  })
  return { patients, skipped }
}
