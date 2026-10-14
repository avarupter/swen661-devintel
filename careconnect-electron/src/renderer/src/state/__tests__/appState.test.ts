import type { Activity, Draft, Message, Patient, Workspace } from '../../../../shared/model'
import { RECENT_PATIENT_LIMIT } from '../../../../shared/model'
import { createSeedWorkspace } from '../../../../shared/seed'
import {
  appReducer,
  blocksNewModal,
  createInitialState,
  initialUi,
  modalCategory,
  workspaceForSave,
  type AppAction,
  type AppState,
  type Modal,
  type UiAction,
  type WorkspaceAction
} from '../appState'

const NOW = new Date(2026, 9, 5, 9, 42)
const AT = NOW.toISOString()
const LATER = new Date(NOW.getTime() + 5 * 60_000).toISOString()

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}

/** Reduces with both inputs frozen, so any mutation inside the reducer throws. */
function reduce(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce((current, action) => appReducer(deepFreeze(current), deepFreeze(action)), state)
}

function loaded(workspace: Workspace = createSeedWorkspace(NOW), ui: Parameters<typeof createInitialState>[0] = {}): AppState {
  return reduce(createInitialState(ui), { type: 'load/succeeded', workspace, source: 'file', at: AT })
}

function ws(state: AppState): Workspace {
  if (!state.workspace) throw new Error('no workspace')
  return state.workspace
}

function patient(state: AppState, id: string): Patient {
  const found = ws(state).patients.find((entry) => entry.id === id)
  if (!found) throw new Error(`no patient ${id}`)
  return found
}

const note: Activity = { id: 'a-new', kind: 'note', title: 'Visit note added', detail: 'Feeling better.', at: LATER, author: 'Jordan Lee, RN' }

function newPatient(id = 'p-new', careId = 'CC-2001'): Patient {
  return {
    id,
    name: 'Robin Example',
    pronouns: 'they/them',
    ageGroup: 'Adult',
    careId,
    status: 'open',
    reason: 'New referral',
    lastContact: AT,
    nextVisit: null,
    careTeam: ['Jordan Lee, RN'],
    alert: null,
    plan: [],
    activity: []
  }
}

describe('createInitialState', () => {
  it('starts loading, on the Patients view, with nothing selected or saved', () => {
    expect(createInitialState()).toEqual({
      load: { status: 'loading' },
      workspace: null,
      ui: initialUi,
      revision: 0,
      savedRevision: 0,
      lastSavedAt: null,
      saveError: null,
      saveRequest: 0
    })
    expect(initialUi).toMatchObject({ view: 'patients', selectedPatientId: null, modal: null, statusFilter: 'all', sortOrder: 'recent', platform: 'windows' })
  })

  it('applies UI overrides', () => {
    expect(createInitialState({ view: 'inbox', platform: 'mac' }).ui).toEqual({ ...initialUi, view: 'inbox', platform: 'mac' })
  })
})

describe('loading', () => {
  it('selects the most recently viewed patient that still exists', () => {
    const workspace = createSeedWorkspace(NOW)
    workspace.recentPatients = [
      { patientId: 'p-deleted', at: AT },
      { patientId: 'p-morgan-chen', at: AT }
    ]
    const state = loaded(workspace)
    expect(state.ui.selectedPatientId).toBe('p-morgan-chen')
    expect(state.ui.recentPatients).toEqual(workspace.recentPatients)
  })

  it('falls back to the first patient, then to no selection', () => {
    const noRecent = { ...createSeedWorkspace(NOW), recentPatients: [] }
    expect(loaded(noRecent).ui.selectedPatientId).toBe('p-avery-park')
    expect(loaded({ ...noRecent, patients: [] }).ui.selectedPatientId).toBeNull()
  })

  it('keeps a selection made before the load finished', () => {
    expect(loaded(createSeedWorkspace(NOW), { selectedPatientId: 'p-riley-singh' }).ui.selectedPatientId).toBe('p-riley-singh')
  })

  it('marks the workspace ready and synced as of the load', () => {
    const state = reduce(
      { ...createInitialState(), revision: 3, savedRevision: 1, saveError: 'old failure' },
      { type: 'load/succeeded', workspace: createSeedWorkspace(NOW), source: 'recovered', backupPath: 'C:\\backup.json', at: AT }
    )
    expect(state.load).toEqual({ status: 'ready', source: 'recovered', backupPath: 'C:\\backup.json' })
    expect(state).toMatchObject({ revision: 0, savedRevision: 0, lastSavedAt: AT, saveError: null })
    expect(loaded().load).toEqual({ status: 'ready', source: 'file' })
  })

  it('records a failure, and a retry goes back to loading', () => {
    const failed = reduce(createInitialState(), { type: 'load/failed', message: 'disk unavailable' })
    expect(failed.load).toEqual({ status: 'error', message: 'disk unavailable' })
    expect(reduce(failed, { type: 'load/retry' }).load).toEqual({ status: 'loading' })
  })

  it('ignores workspace actions until a workspace has loaded', () => {
    const state = createInitialState()
    expect(appReducer(state, { type: 'task/toggled', taskId: 't-1' })).toBe(state)
  })
})

describe('workspace actions', () => {
  it('patient/added puts the new patient first', () => {
    const state = reduce(loaded(), { type: 'patient/added', patient: newPatient() })
    expect(ws(state).patients).toHaveLength(29)
    expect(ws(state).patients[0]).toEqual(newPatient())
  })

  it('patient/updated merges the changes and prepends an activity when given', () => {
    const plan = ['Book a follow-up call']
    const before = loaded()
    const updated = reduce(before, {
      type: 'patient/updated',
      patientId: 'p-avery-park',
      changes: { status: 'completed', plan, alert: null },
      activity: { ...note, kind: 'record', title: 'Care summary updated' }
    })
    const avery = patient(updated, 'p-avery-park')
    expect(avery).toMatchObject({ status: 'completed', plan, alert: null })
    expect(avery.activity[0].title).toBe('Care summary updated')
    expect(avery.activity).toHaveLength(4)
    // Other records keep their identity, so memoised rows do not re-render.
    expect(patient(updated, 'p-morgan-chen')).toBe(patient(before, 'p-morgan-chen'))

    const quiet = reduce(loaded(), { type: 'patient/updated', patientId: 'p-avery-park', changes: { reason: 'Annual review' } })
    expect(patient(quiet, 'p-avery-park').reason).toBe('Annual review')
    expect(patient(quiet, 'p-avery-park').activity).toHaveLength(3)
  })

  it('patient/noteAdded prepends the note and updates the last contact', () => {
    const state = reduce(loaded(), { type: 'patient/noteAdded', patientId: 'p-avery-park', activity: note })
    expect(patient(state, 'p-avery-park').activity[0]).toEqual(note)
    expect(patient(state, 'p-avery-park').lastContact).toBe(LATER)
  })

  it('patients/imported appends the records in order', () => {
    const imported = [newPatient('p-x', 'CC-3001'), newPatient('p-y', 'CC-3002')]
    const state = reduce(loaded(), { type: 'patients/imported', patients: imported })
    expect(ws(state).patients.slice(-2)).toEqual(imported)
    expect(ws(state).patients[0].id).toBe('p-avery-park')
  })

  describe('message/sent', () => {
    const message: Message = { id: 'm-new', author: 'Jordan Lee, RN', body: 'See you at 10:30.', at: LATER, outgoing: true, attachments: [] }

    it('adds a reply to the existing conversation, marks it read and logs it on the patient', () => {
      const withDraft = reduce(loaded(), {
        type: 'draft/saved',
        draft: { id: 'd-1', conversationId: 'c-home-monitoring', patientId: 'p-avery-park', to: 'Avery Park', subject: 'Re: Home monitoring readings', body: 'See', attachments: [], updatedAt: AT }
      })
      const state = reduce(withDraft, {
        type: 'message/sent',
        sent: { conversationId: 'c-home-monitoring', patientId: 'p-avery-park', with: 'Avery Park', subject: 'Re: Home monitoring readings', message },
        draftId: 'd-1'
      })
      const conversation = ws(state).conversations.find((entry) => entry.id === 'c-home-monitoring')
      expect(conversation?.unread).toBe(false)
      expect(conversation?.messages.map((entry) => entry.id)).toEqual(['m-1', 'm-new'])
      expect(ws(state).conversations[0].id).toBe('c-home-monitoring')
      expect(ws(state).drafts).toEqual([])
      expect(patient(state, 'p-avery-park').activity[0]).toEqual({
        id: 'm-new-activity',
        kind: 'message',
        title: 'Message sent',
        detail: 'Re: Home monitoring readings',
        at: LATER,
        author: 'Jordan Lee, RN'
      })
      expect(patient(state, 'p-avery-park').lastContact).toBe(LATER)
    })

    it('starts a new conversation at the top of the list', () => {
      const state = reduce(loaded(), {
        type: 'message/sent',
        sent: { conversationId: 'c-new', patientId: 'p-riley-singh', with: 'Riley Singh', subject: 'Your lab results', message },
        draftId: null
      })
      expect(ws(state).conversations[0]).toEqual({
        id: 'c-new',
        patientId: 'p-riley-singh',
        subject: 'Your lab results',
        with: 'Riley Singh',
        unread: false,
        messages: [message]
      })
      expect(ws(state).conversations).toHaveLength(7)
    })

    it('leaves patients alone for a conversation with no patient, and keeps unrelated drafts', () => {
      const draft: Draft = { id: 'd-keep', conversationId: null, patientId: null, to: '', subject: '', body: 'Later', attachments: [], updatedAt: AT }
      const before = reduce(loaded(), { type: 'draft/saved', draft })
      const state = reduce(before, {
        type: 'message/sent',
        sent: { conversationId: 'c-schedule-change', patientId: null, with: 'Front desk', subject: 'Re: Schedule change for Friday', message },
        draftId: null
      })
      expect(ws(state).patients).toBe(ws(before).patients)
      expect(ws(state).drafts).toEqual([draft])
    })
  })

  it('draft/saved adds new drafts first and replaces existing ones in place', () => {
    const first: Draft = { id: 'd-1', conversationId: null, patientId: null, to: '', subject: 'One', body: 'a', attachments: [], updatedAt: AT }
    const second: Draft = { ...first, id: 'd-2', subject: 'Two' }
    const both = reduce(loaded(), { type: 'draft/saved', draft: first }, { type: 'draft/saved', draft: second })
    expect(ws(both).drafts.map((draft) => draft.id)).toEqual(['d-2', 'd-1'])
    const edited = reduce(both, { type: 'draft/saved', draft: { ...first, body: 'edited', updatedAt: LATER } })
    expect(ws(edited).drafts.map((draft) => [draft.id, draft.body])).toEqual([
      ['d-2', 'a'],
      ['d-1', 'edited']
    ])
    expect(ws(reduce(edited, { type: 'draft/deleted', draftId: 'd-2' })).drafts.map((draft) => draft.id)).toEqual(['d-1'])
  })

  it('conversation/setUnread marks one conversation', () => {
    const state = reduce(loaded(), { type: 'conversation/setUnread', conversationId: 'c-referral', unread: true })
    expect(ws(state).conversations.filter((conversation) => conversation.unread)).toHaveLength(5)
    const read = reduce(state, { type: 'conversation/setUnread', conversationId: 'c-referral', unread: false })
    expect(ws(read).conversations.find((conversation) => conversation.id === 'c-referral')?.unread).toBe(false)
  })

  it('task/toggled flips one task', () => {
    const once = reduce(loaded(), { type: 'task/toggled', taskId: 't-1' })
    expect(ws(once).tasks.find((task) => task.id === 't-1')?.done).toBe(true)
    expect(ws(once).tasks.find((task) => task.id === 't-2')?.done).toBe(false)
    const twice = reduce(once, { type: 'task/toggled', taskId: 't-1' })
    expect(ws(twice).tasks.find((task) => task.id === 't-1')?.done).toBe(false)
  })

  it('preferences/changed merges partial changes', () => {
    const state = reduce(loaded(), { type: 'preferences/changed', changes: { highContrast: true } })
    expect(ws(state).preferences).toEqual({ showShortcutHints: true, singleKeyShortcuts: true, reduceMotion: false, highContrast: true, notifications: true })
  })
})

describe('UI actions', () => {
  it('ui/navigate changes view and abandons a half-typed G-sequence', () => {
    const state = reduce(loaded(), { type: 'ui/setPendingSequence', key: 'g' }, { type: 'ui/navigate', view: 'tasks' })
    expect(state.ui).toMatchObject({ view: 'tasks', pendingSequence: null })
  })

  describe('ui/selectPatient', () => {
    it('remembers the patient as most recent when given a time', () => {
      const state = reduce(loaded(), { type: 'ui/selectPatient', patientId: 'p-riley-singh', at: LATER })
      expect(state.ui.selectedPatientId).toBe('p-riley-singh')
      expect(state.ui.recentPatients.map((entry) => entry.patientId)).toEqual(['p-riley-singh', 'p-avery-park', 'p-morgan-chen'])
      expect(state.ui.recentPatients[0].at).toBe(LATER)
    })

    it('moves a patient already in the list to the front instead of repeating them', () => {
      const state = reduce(loaded(), { type: 'ui/selectPatient', patientId: 'p-morgan-chen', at: LATER })
      expect(state.ui.recentPatients).toEqual([
        { patientId: 'p-morgan-chen', at: LATER },
        { patientId: 'p-avery-park', at: ws(loaded()).recentPatients[0].at }
      ])
    })

    it('keeps at most RECENT_PATIENT_LIMIT patients', () => {
      const ids = ['p-riley-singh', 'p-taylor-lane', 'p-jamie-wu', 'p-alex-rivera', 'p-casey-morgan', 'p-drew-patel']
      const state = reduce(loaded(), ...ids.map((patientId): AppAction => ({ type: 'ui/selectPatient', patientId, at: LATER })))
      expect(state.ui.recentPatients.map((entry) => entry.patientId)).toEqual([...ids].reverse().slice(0, RECENT_PATIENT_LIMIT))
    })

    it('only changes the selection without a time, or when clearing it', () => {
      const base = loaded()
      const quiet = reduce(base, { type: 'ui/selectPatient', patientId: 'p-riley-singh' })
      expect(quiet.ui.selectedPatientId).toBe('p-riley-singh')
      expect(quiet.ui.recentPatients).toBe(base.ui.recentPatients)
      const cleared = reduce(base, { type: 'ui/selectPatient', patientId: null, at: LATER })
      expect(cleared.ui.selectedPatientId).toBeNull()
      expect(cleared.ui.recentPatients).toBe(base.ui.recentPatients)
    })
  })

  it('ui/openModal resets transient keyboard state; ui/closeModal clears the modal', () => {
    const modal: Modal = { kind: 'addNote', patientId: 'p-avery-park' }
    const open = reduce(loaded(), { type: 'ui/setRevealHints', reveal: true }, { type: 'ui/setPendingSequence', key: 'g' }, { type: 'ui/openModal', modal })
    expect(open.ui).toMatchObject({ modal, revealHints: false, pendingSequence: null })
    expect(reduce(open, { type: 'ui/closeModal' }).ui.modal).toBeNull()
  })

  it('ui/setStatus numbers each message so a repeat is still a new message; ui/dismissStatus clears it', () => {
    const first = reduce(loaded(), { type: 'ui/setStatus', tone: 'success', text: 'Draft saved.' })
    expect(first.ui.status).toEqual({ id: 1, tone: 'success', text: 'Draft saved.' })
    const second = reduce(first, { type: 'ui/setStatus', tone: 'success', text: 'Draft saved.' })
    expect(second.ui.status).toEqual({ id: 2, tone: 'success', text: 'Draft saved.' })
    expect(reduce(second, { type: 'ui/dismissStatus' }).ui.status).toBeNull()
  })

  it('ui/setRevealHints returns the same state when nothing changes, to avoid re-rendering on key repeat', () => {
    const state = loaded()
    expect(appReducer(state, { type: 'ui/setRevealHints', reveal: false })).toBe(state)
    const revealed = reduce(state, { type: 'ui/setRevealHints', reveal: true })
    expect(revealed.ui.revealHints).toBe(true)
    expect(appReducer(revealed, { type: 'ui/setRevealHints', reveal: true })).toBe(revealed)
  })

  it.each<[UiAction, Partial<AppState['ui']>]>([
    [{ type: 'ui/selectConversation', conversationId: 'c-lab-results' }, { selectedConversationId: 'c-lab-results' }],
    [{ type: 'ui/setPatientQuery', query: 'riley' }, { patientQuery: 'riley' }],
    [{ type: 'ui/setStatusFilter', filter: 'needs-review' }, { statusFilter: 'needs-review' }],
    [{ type: 'ui/setSortOrder', sortOrder: 'name' }, { sortOrder: 'name' }],
    [{ type: 'ui/setShowCompletedTasks', show: true }, { showCompletedTasks: true }],
    [{ type: 'ui/setPendingSequence', key: 'g' }, { pendingSequence: 'g' }],
    [{ type: 'ui/setSystemHighContrast', value: true }, { systemHighContrast: true }],
    [{ type: 'ui/setPlatform', platform: 'mac' }, { platform: 'mac' }]
  ])('%j sets the UI slice', (action, expected) => {
    const before = loaded()
    const after = reduce(before, action)
    expect(after.ui).toEqual({ ...before.ui, ...expected })
    expect(after.workspace).toBe(before.workspace)
  })
})

describe('revision counting ("N unsaved changes")', () => {
  const workspaceActions: WorkspaceAction[] = [
    { type: 'patient/added', patient: newPatient() },
    { type: 'patient/updated', patientId: 'p-avery-park', changes: { status: 'open' } },
    { type: 'patient/noteAdded', patientId: 'p-avery-park', activity: note },
    { type: 'patients/imported', patients: [newPatient('p-z', 'CC-4001')] },
    {
      type: 'message/sent',
      sent: { conversationId: 'c-new', patientId: null, with: 'Front desk', subject: 'Hi', message: { id: 'm-x', author: 'Jordan Lee, RN', body: 'Hi', at: LATER, outgoing: true, attachments: [] } },
      draftId: null
    },
    { type: 'draft/saved', draft: { id: 'd-1', conversationId: null, patientId: null, to: '', subject: '', body: 'x', attachments: [], updatedAt: AT } },
    { type: 'draft/deleted', draftId: 'd-1' },
    { type: 'conversation/setUnread', conversationId: 'c-home-monitoring', unread: false },
    { type: 'task/toggled', taskId: 't-1' },
    { type: 'preferences/changed', changes: { reduceMotion: true } }
  ]

  const uiActions: UiAction[] = [
    { type: 'ui/navigate', view: 'inbox' },
    { type: 'ui/selectPatient', patientId: 'p-riley-singh', at: LATER },
    { type: 'ui/selectConversation', conversationId: 'c-referral' },
    { type: 'ui/setPatientQuery', query: 'a' },
    { type: 'ui/setStatusFilter', filter: 'open' },
    { type: 'ui/setSortOrder', sortOrder: 'status' },
    { type: 'ui/setShowCompletedTasks', show: true },
    { type: 'ui/openModal', modal: { kind: 'palette' } },
    { type: 'ui/closeModal' },
    { type: 'ui/setStatus', tone: 'info', text: 'Hello' },
    { type: 'ui/dismissStatus' },
    { type: 'ui/setRevealHints', reveal: true },
    { type: 'ui/setPendingSequence', key: 'g' },
    { type: 'ui/setSystemHighContrast', value: true },
    { type: 'ui/setPlatform', platform: 'mac' }
  ]

  it.each(workspaceActions)('$type counts as one change', (action) => {
    expect(reduce(loaded(), action).revision).toBe(1)
  })

  it.each(uiActions)('$type does not count', (action) => {
    const before = loaded()
    const after = reduce(before, action)
    expect(after.revision).toBe(0)
    expect(after.workspace).toBe(before.workspace)
  })

  it('counts every change, and a successful save catches up to the revision it wrote', () => {
    const changed = reduce(loaded(), ...workspaceActions)
    expect(changed.revision).toBe(workspaceActions.length)
    const saved = reduce(changed, { type: 'save/succeeded', revision: 4, savedAt: LATER })
    expect(saved).toMatchObject({ savedRevision: 4, lastSavedAt: LATER, saveError: null })
    expect(saved.revision - saved.savedRevision).toBe(workspaceActions.length - 4)
  })

  it('never moves savedRevision backwards when saves finish out of order', () => {
    const state = reduce(
      { ...loaded(), revision: 6 },
      { type: 'save/succeeded', revision: 6, savedAt: LATER },
      { type: 'save/succeeded', revision: 3, savedAt: AT }
    )
    expect(state.savedRevision).toBe(6)
  })

  it('records a failed save without losing the unsaved count, and a retry requests another save', () => {
    const failed = reduce({ ...loaded(), revision: 2 }, { type: 'save/failed', message: 'disk full' })
    expect(failed).toMatchObject({ saveError: 'disk full', revision: 2, savedRevision: 0, saveRequest: 0 })
    const retried = reduce(failed, { type: 'save/retry' })
    expect(retried).toMatchObject({ saveError: null, saveRequest: 1, revision: 2 })
    expect(reduce({ ...retried, saveError: 'again' }, { type: 'save/succeeded', revision: 2, savedAt: LATER }).saveError).toBeNull()
  })
})

describe('workspaceForSave', () => {
  it('is null before loading', () => {
    expect(workspaceForSave(createInitialState())).toBeNull()
  })

  it('writes the session’s recent patients into the saved workspace', () => {
    const state = reduce(loaded(), { type: 'ui/selectPatient', patientId: 'p-jamie-wu', at: LATER })
    const payload = workspaceForSave(state)
    expect(payload?.recentPatients.map((entry) => entry.patientId)).toEqual(['p-jamie-wu', 'p-avery-park', 'p-morgan-chen'])
    expect(payload?.patients).toBe(ws(state).patients)
    expect(ws(state).recentPatients.map((entry) => entry.patientId)).toEqual(['p-avery-park', 'p-morgan-chen'])
  })
})

describe('blocksNewModal', () => {
  it('lets the command palette give way but protects every other dialog', () => {
    expect(blocksNewModal(null)).toBe(false)
    expect(blocksNewModal({ kind: 'palette' })).toBe(false)
    expect(blocksNewModal({ kind: 'help' })).toBe(true)
    expect(blocksNewModal({ kind: 'addNote', patientId: 'p-avery-park' })).toBe(true)
    expect(blocksNewModal({ kind: 'compose', patientId: null, conversationId: null, draftId: null })).toBe(true)
  })
})

describe('modalCategory', () => {
  it.each<[Modal | null, ReturnType<typeof modalCategory>]>([
    [null, null],
    [{ kind: 'palette' }, 'palette'],
    [{ kind: 'compose', patientId: null, conversationId: null, draftId: null }, 'compose'],
    [{ kind: 'shortcuts' }, 'dialog'],
    [{ kind: 'help' }, 'dialog'],
    [{ kind: 'settings' }, 'dialog'],
    [{ kind: 'newPatient' }, 'dialog'],
    [{ kind: 'addNote', patientId: 'p-avery-park' }, 'dialog'],
    [{ kind: 'editSummary', patientId: 'p-avery-park' }, 'dialog']
  ])('%j is %s', (modal, category) => {
    expect(modalCategory(modal)).toBe(category)
  })
})
