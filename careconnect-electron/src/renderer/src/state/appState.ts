/**
 * Renderer state: the persisted workspace plus UI state, changed only by
 * `appReducer`. The reducer is pure; ids and timestamps come in on actions.
 *
 * `revision` counts changes to the workspace since it loaded and
 * `savedRevision` is the newest one the main process has confirmed writing,
 * so "N unsaved changes" is simply their difference.
 */
import type { LoadSource } from '../../../shared/api'
import type { ViewId } from '../../../shared/commands'
import type { KeyPlatform } from '../../../shared/shortcuts'
import type { Activity, Draft, Message, Patient, PatientStatus, Preferences, RecentPatient, Workspace } from '../../../shared/model'
import { RECENT_PATIENT_LIMIT } from '../../../shared/model'

export type SortOrder = 'recent' | 'name' | 'nextVisit' | 'status'
export type StatusFilter = PatientStatus | 'all'

export type Modal =
  | { kind: 'palette' }
  | { kind: 'shortcuts' }
  | { kind: 'help' }
  | { kind: 'settings' }
  | { kind: 'newPatient' }
  | { kind: 'addNote'; patientId: string }
  | { kind: 'editSummary'; patientId: string }
  | { kind: 'compose'; patientId: string | null; conversationId: string | null; draftId: string | null }

export type ModalKindName = Modal['kind']

export type StatusTone = 'info' | 'success' | 'warning' | 'error'

export interface StatusMessage {
  id: number
  tone: StatusTone
  text: string
}

export interface UiSlice {
  view: ViewId
  selectedPatientId: string | null
  selectedConversationId: string | null
  patientQuery: string
  statusFilter: StatusFilter
  sortOrder: SortOrder
  showCompletedTasks: boolean
  modal: Modal | null
  /** The persistent message in the status bar; stays until replaced or dismissed. */
  status: StatusMessage | null
  /** Shortcut hints are revealed while Alt is held. */
  revealHints: boolean
  /** First key of a G-sequence, while waiting for the second. */
  pendingSequence: string | null
  /** Windows High Contrast (or another forced-colours mode) is on. */
  systemHighContrast: boolean
  /** Which column of the shortcut reference applies (Linux uses the Windows keys). */
  platform: KeyPlatform
  /** Session copy of recently viewed patients; written back with each save. */
  recentPatients: RecentPatient[]
}

export type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; source: LoadSource; backupPath?: string }
  | { status: 'error'; message: string }

export interface AppState {
  load: LoadState
  workspace: Workspace | null
  ui: UiSlice
  revision: number
  savedRevision: number
  lastSavedAt: string | null
  saveError: string | null
  /** Bumped by "Retry save" to re-run the autosave after a failure. */
  saveRequest: number
}

export const initialUi: UiSlice = {
  view: 'patients',
  selectedPatientId: null,
  selectedConversationId: null,
  patientQuery: '',
  statusFilter: 'all',
  sortOrder: 'recent',
  showCompletedTasks: false,
  modal: null,
  status: null,
  revealHints: false,
  pendingSequence: null,
  systemHighContrast: false,
  platform: 'windows',
  recentPatients: []
}

export function createInitialState(ui: Partial<UiSlice> = {}): AppState {
  return {
    load: { status: 'loading' },
    workspace: null,
    ui: { ...initialUi, ...ui },
    revision: 0,
    savedRevision: 0,
    lastSavedAt: null,
    saveError: null,
    saveRequest: 0
  }
}

export type PatientChanges = Partial<Pick<Patient, 'status' | 'plan' | 'alert' | 'nextVisit' | 'reason' | 'lastContact'>>

export interface SentMessage {
  conversationId: string
  patientId: string | null
  /** Who the conversation is with (used when it is new). */
  with: string
  subject: string
  message: Message
}

export type WorkspaceAction =
  | { type: 'patient/added'; patient: Patient }
  | { type: 'patient/updated'; patientId: string; changes: PatientChanges; activity?: Activity }
  | { type: 'patient/noteAdded'; patientId: string; activity: Activity }
  | { type: 'patients/imported'; patients: Patient[] }
  | { type: 'message/sent'; sent: SentMessage; draftId: string | null }
  | { type: 'draft/saved'; draft: Draft }
  | { type: 'draft/deleted'; draftId: string }
  | { type: 'conversation/setUnread'; conversationId: string; unread: boolean }
  | { type: 'task/toggled'; taskId: string }
  | { type: 'preferences/changed'; changes: Partial<Preferences> }

export type UiAction =
  | { type: 'ui/navigate'; view: ViewId }
  | { type: 'ui/selectPatient'; patientId: string | null; at?: string }
  | { type: 'ui/selectConversation'; conversationId: string | null }
  | { type: 'ui/setPatientQuery'; query: string }
  | { type: 'ui/setStatusFilter'; filter: StatusFilter }
  | { type: 'ui/setSortOrder'; sortOrder: SortOrder }
  | { type: 'ui/setShowCompletedTasks'; show: boolean }
  | { type: 'ui/openModal'; modal: Modal }
  | { type: 'ui/closeModal' }
  | { type: 'ui/setStatus'; tone: StatusTone; text: string }
  | { type: 'ui/dismissStatus' }
  | { type: 'ui/setRevealHints'; reveal: boolean }
  | { type: 'ui/setPendingSequence'; key: string | null }
  | { type: 'ui/setSystemHighContrast'; value: boolean }
  | { type: 'ui/setPlatform'; platform: KeyPlatform }

export type LoadAction =
  | { type: 'load/succeeded'; workspace: Workspace; source: LoadSource; backupPath?: string; at: string }
  | { type: 'load/failed'; message: string }
  | { type: 'load/retry' }

export type SaveAction =
  | { type: 'save/succeeded'; revision: number; savedAt: string }
  | { type: 'save/failed'; message: string }
  | { type: 'save/retry' }

export type AppAction = WorkspaceAction | UiAction | LoadAction | SaveAction

function updatePatient(workspace: Workspace, patientId: string, update: (patient: Patient) => Patient): Workspace {
  return { ...workspace, patients: workspace.patients.map((patient) => (patient.id === patientId ? update(patient) : patient)) }
}

function reduceWorkspace(workspace: Workspace, action: WorkspaceAction): Workspace {
  switch (action.type) {
    case 'patient/added':
      return { ...workspace, patients: [action.patient, ...workspace.patients] }
    case 'patient/updated':
      return updatePatient(workspace, action.patientId, (patient) => ({
        ...patient,
        ...action.changes,
        activity: action.activity ? [action.activity, ...patient.activity] : patient.activity
      }))
    case 'patient/noteAdded':
      return updatePatient(workspace, action.patientId, (patient) => ({
        ...patient,
        lastContact: action.activity.at,
        activity: [action.activity, ...patient.activity]
      }))
    case 'patients/imported':
      return { ...workspace, patients: [...workspace.patients, ...action.patients] }
    case 'message/sent': {
      const { sent } = action
      const existing = workspace.conversations.find((conversation) => conversation.id === sent.conversationId)
      const conversations = existing
        ? workspace.conversations.map((conversation) =>
            conversation.id === sent.conversationId
              ? { ...conversation, unread: false, messages: [...conversation.messages, sent.message] }
              : conversation
          )
        : [
            { id: sent.conversationId, patientId: sent.patientId, subject: sent.subject, with: sent.with, unread: false, messages: [sent.message] },
            ...workspace.conversations
          ]
      let next: Workspace = {
        ...workspace,
        conversations,
        drafts: action.draftId ? workspace.drafts.filter((draft) => draft.id !== action.draftId) : workspace.drafts
      }
      if (sent.patientId) {
        const activity: Activity = {
          id: `${sent.message.id}-activity`,
          kind: 'message',
          title: 'Message sent',
          detail: sent.subject,
          at: sent.message.at,
          author: sent.message.author
        }
        next = updatePatient(next, sent.patientId, (patient) => ({
          ...patient,
          lastContact: sent.message.at,
          activity: [activity, ...patient.activity]
        }))
      }
      return next
    }
    case 'draft/saved': {
      const exists = workspace.drafts.some((draft) => draft.id === action.draft.id)
      return {
        ...workspace,
        drafts: exists
          ? workspace.drafts.map((draft) => (draft.id === action.draft.id ? action.draft : draft))
          : [action.draft, ...workspace.drafts]
      }
    }
    case 'draft/deleted':
      return { ...workspace, drafts: workspace.drafts.filter((draft) => draft.id !== action.draftId) }
    case 'conversation/setUnread':
      return {
        ...workspace,
        conversations: workspace.conversations.map((conversation) =>
          conversation.id === action.conversationId ? { ...conversation, unread: action.unread } : conversation
        )
      }
    case 'task/toggled':
      return { ...workspace, tasks: workspace.tasks.map((task) => (task.id === action.taskId ? { ...task, done: !task.done } : task)) }
    case 'preferences/changed':
      return { ...workspace, preferences: { ...workspace.preferences, ...action.changes } }
  }
}

function rememberPatient(recent: RecentPatient[], patientId: string, at: string): RecentPatient[] {
  return [{ patientId, at }, ...recent.filter((entry) => entry.patientId !== patientId)].slice(0, RECENT_PATIENT_LIMIT)
}

function reduceUi(ui: UiSlice, action: UiAction): UiSlice {
  switch (action.type) {
    case 'ui/navigate':
      return { ...ui, view: action.view, pendingSequence: null }
    case 'ui/selectPatient':
      return {
        ...ui,
        selectedPatientId: action.patientId,
        recentPatients: action.patientId && action.at ? rememberPatient(ui.recentPatients, action.patientId, action.at) : ui.recentPatients
      }
    case 'ui/selectConversation':
      return { ...ui, selectedConversationId: action.conversationId }
    case 'ui/setPatientQuery':
      return { ...ui, patientQuery: action.query }
    case 'ui/setStatusFilter':
      return { ...ui, statusFilter: action.filter }
    case 'ui/setSortOrder':
      return { ...ui, sortOrder: action.sortOrder }
    case 'ui/setShowCompletedTasks':
      return { ...ui, showCompletedTasks: action.show }
    case 'ui/openModal':
      return { ...ui, modal: action.modal, pendingSequence: null, revealHints: false }
    case 'ui/closeModal':
      return { ...ui, modal: null }
    case 'ui/setStatus':
      return { ...ui, status: { id: (ui.status?.id ?? 0) + 1, tone: action.tone, text: action.text } }
    case 'ui/dismissStatus':
      return { ...ui, status: null }
    case 'ui/setRevealHints':
      return ui.revealHints === action.reveal ? ui : { ...ui, revealHints: action.reveal }
    case 'ui/setPendingSequence':
      return { ...ui, pendingSequence: action.key }
    case 'ui/setSystemHighContrast':
      return { ...ui, systemHighContrast: action.value }
    case 'ui/setPlatform':
      return { ...ui, platform: action.platform }
  }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type.startsWith('ui/')) {
    const ui = reduceUi(state.ui, action as UiAction)
    return ui === state.ui ? state : { ...state, ui }
  }

  switch (action.type) {
    case 'load/succeeded': {
      const { workspace } = action
      const selectedPatientId =
        state.ui.selectedPatientId ??
        workspace.recentPatients.find((entry) => workspace.patients.some((patient) => patient.id === entry.patientId))?.patientId ??
        workspace.patients[0]?.id ??
        null
      return {
        ...state,
        load: { status: 'ready', source: action.source, ...(action.backupPath ? { backupPath: action.backupPath } : {}) },
        workspace,
        ui: { ...state.ui, selectedPatientId, recentPatients: workspace.recentPatients },
        revision: 0,
        savedRevision: 0,
        // What is on disk matches what was just loaded, so the workspace starts "synced".
        lastSavedAt: action.at,
        saveError: null
      }
    }
    case 'load/failed':
      return { ...state, load: { status: 'error', message: action.message } }
    case 'load/retry':
      return { ...state, load: { status: 'loading' } }
    case 'save/succeeded':
      return {
        ...state,
        savedRevision: Math.max(state.savedRevision, action.revision),
        lastSavedAt: action.savedAt,
        saveError: null
      }
    case 'save/failed':
      return { ...state, saveError: action.message }
    case 'save/retry':
      return { ...state, saveError: null, saveRequest: state.saveRequest + 1 }
    default: {
      if (!state.workspace) return state
      const workspace = reduceWorkspace(state.workspace, action as WorkspaceAction)
      return workspace === state.workspace ? state : { ...state, workspace, revision: state.revision + 1 }
    }
  }
}

/** The payload for `saveWorkspace`: the workspace plus the session's recent patients. */
export function workspaceForSave(state: AppState): Workspace | null {
  return state.workspace ? { ...state.workspace, recentPatients: state.ui.recentPatients } : null
}

/** How the main process should treat the open modal (menus, accelerators). */
export function modalCategory(modal: Modal | null): 'palette' | 'compose' | 'dialog' | null {
  if (!modal) return null
  if (modal.kind === 'palette') return 'palette'
  if (modal.kind === 'compose') return 'compose'
  return 'dialog'
}
