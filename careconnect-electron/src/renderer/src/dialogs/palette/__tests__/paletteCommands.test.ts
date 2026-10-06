import type { CommandId } from '../../../../../shared/commands'
import { patientIdFor, createSeedWorkspace } from '../../../../../shared/seed'
import type { KeyPlatform } from '../../../../../shared/shortcuts'
import { FIXED_NOW } from '../../../../../../tests/renderer/memoryApi'
import { appReducer, createInitialState, type AppState, type UiSlice } from '../../../state/appState'
import {
  buildPaletteItems,
  filterPaletteItems,
  groupPaletteItems,
  PALETTE_GROUP_LIMIT,
  type PaletteItem
} from '../paletteCommands'

const AVERY = patientIdFor('Avery Park')
const RILEY = patientIdFor('Riley Singh')

/** The state right after the seed workspace loads: Patients view, Avery Park selected, two recent patients. */
function loadedState(ui: Partial<UiSlice> = {}): AppState {
  const loaded = appReducer(createInitialState(), {
    type: 'load/succeeded',
    workspace: createSeedWorkspace(FIXED_NOW),
    source: 'seed',
    at: FIXED_NOW.toISOString()
  })
  return { ...loaded, ui: { ...loaded.ui, ...ui } }
}

function search(query: string, state = loadedState(), platform: KeyPlatform = 'windows'): PaletteItem[] {
  return filterPaletteItems(buildPaletteItems(state, FIXED_NOW, platform), query)
}

function commandIds(items: PaletteItem[]): CommandId[] {
  return items.map((item) => item.command.id)
}

const PATIENT_SCOPED: CommandId[] = [
  'patient.editSummary',
  'patient.addNote',
  'patient.message',
  'patient.contextMenu',
  'patient.export',
  'patient.copyCareId',
  'patient.markCompleted',
  'patient.markNeedsReview',
  'patient.markOpen'
]

describe('buildPaletteItems + filterPaletteItems with an empty query', () => {
  it('lists exactly the design’s suggested, recent and global groups, in order', () => {
    const shown = search('').map(({ group, title, subtitle, keys, command }) => ({ group, title, subtitle, keys, command }))
    expect(shown).toEqual([
      { group: 'suggested', title: 'Open Patients', subtitle: 'Navigate to patient workspace', keys: ['G', 'P'], command: { id: 'navigate.patients' } },
      { group: 'suggested', title: 'Create new patient record', subtitle: 'Opens a blank synthetic record form', keys: ['Ctrl', 'N'], command: { id: 'patient.new' } },
      { group: 'suggested', title: 'Search patient directory', subtitle: 'Search across assigned care teams', keys: ['Ctrl', 'F'], command: { id: 'patient.search' } },
      { group: 'recent', title: 'Avery Park — Care summary', subtitle: 'Recent · 4 minutes ago', keys: undefined, command: { id: 'patient.open', patientId: AVERY } },
      {
        group: 'recent',
        title: 'Morgan Chen — Care summary',
        subtitle: 'Recent · 52 minutes ago',
        keys: undefined,
        command: { id: 'patient.open', patientId: patientIdFor('Morgan Chen') }
      },
      { group: 'recent', title: 'Team Inbox — Triage', subtitle: '4 unread conversations', keys: ['G', 'I'], command: { id: 'navigate.inbox' } },
      { group: 'global', title: 'Open keyboard shortcuts', subtitle: undefined, keys: ['Ctrl', '/'], command: { id: 'app.shortcuts' } },
      { group: 'global', title: 'CareConnect help center', subtitle: undefined, keys: ['F1'], command: { id: 'app.help' } }
    ])
  })

  it('uses macOS keycaps on a Mac', () => {
    const byTitle = new Map(search('', loadedState(), 'mac').map((item) => [item.title, item.keys]))
    expect(byTitle.get('Create new patient record')).toEqual(['⌘', 'N'])
    expect(byTitle.get('Open keyboard shortcuts')).toEqual(['⌘', '/'])
    expect(byTitle.get('CareConnect help center')).toEqual(['Fn', 'F1'])
    expect(byTitle.get('Open Patients')).toEqual(['G', 'P'])
  })

  it('follows the session’s recent patients, newest first, and skips patients that are gone', () => {
    const state = loadedState({
      recentPatients: [
        { patientId: RILEY, at: FIXED_NOW.toISOString() },
        { patientId: 'p-removed', at: FIXED_NOW.toISOString() },
        { patientId: AVERY, at: new Date(FIXED_NOW.getTime() - 3 * 3_600_000).toISOString() }
      ]
    })
    const recent = search('', state).filter((item) => item.group === 'recent')
    expect(recent.map((item) => [item.title, item.subtitle])).toEqual([
      ['Riley Singh — Care summary', 'Recent · just now'],
      ['Avery Park — Care summary', 'Recent · 3 hours ago'],
      ['Team Inbox — Triage', '4 unread conversations']
    ])
  })

  it('counts unread conversations in the singular', () => {
    const state = loadedState()
    const workspace = state.workspace!
    const oneUnread = { ...state, workspace: { ...workspace, conversations: workspace.conversations.map((c, i) => ({ ...c, unread: i === 0 })) } }
    expect(search('', oneUnread).find((item) => item.title === 'Team Inbox — Triage')?.subtitle).toBe('1 unread conversation')
  })

  it('returns nothing before the workspace has loaded', () => {
    expect(buildPaletteItems(createInitialState(), FIXED_NOW, 'windows')).toEqual([])
  })
})

describe('filterPaletteItems with a query', () => {
  it('matches patients by name and by Care ID, opening the patient', () => {
    for (const query of ['riley', 'RILEY SINGH', 'CC-1057', '1057', 'cc 1057']) {
      const patients = search(query).filter((item) => item.group === 'patients')
      expect(patients.map((item) => item.command)).toEqual([{ id: 'patient.open', patientId: RILEY }])
    }
  })

  it('does not match patients on their reason for care', () => {
    // Riley Singh's reason is "Lab results"; listing patients by reason belongs to the patient list search.
    expect(search('lab results').filter((item) => item.group === 'patients')).toEqual([])
  })

  it('matches commands case-insensitively on title, subtitle or keywords', () => {
    expect(commandIds(search('EXPORT PATIENT'))).toContain('patient.export')
    expect(commandIds(search('json'))).toContain('patient.import')
    expect(commandIds(search('hotkeys'))).toContain('app.shortcuts')
    expect(commandIds(search('contrast'))).toContain('view.toggleHighContrast')
  })

  it('matches destinations, and lists each one only once', () => {
    const inbox = search('inbox')
    expect(inbox.map(({ group, title, command }) => ({ group, title, command }))).toEqual([
      { group: 'destinations', title: 'Open Inbox', command: { id: 'navigate.inbox' } }
    ])
    expect(commandIds(search('schedule'))).toEqual(['navigate.schedule'])
  })

  it('puts the group with the best match first', () => {
    // Avery is selected, so patient commands mention her too, but her record is the best match.
    const results = search('avery')
    expect(results[0]).toMatchObject({ group: 'patients', title: 'Avery Park', command: { id: 'patient.open', patientId: AVERY } })
    expect(results.some((item) => item.group === 'commands')).toBe(true)
  })

  it('caps every group at eight results', () => {
    const results = search('a')
    const counts = new Map<string, number>()
    for (const item of results) counts.set(item.group, (counts.get(item.group) ?? 0) + 1)
    expect(counts.get('patients')).toBe(PALETTE_GROUP_LIMIT)
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(PALETTE_GROUP_LIMIT)
  })

  it('returns no results when nothing matches', () => {
    expect(search('zzzz')).toEqual([])
  })
})

describe('context filtering', () => {
  const every = (state: AppState): CommandId[] => commandIds(buildPaletteItems(state, FIXED_NOW, 'windows'))

  it('offers patient commands only while a patient is selected', () => {
    const withSelection = every(loadedState())
    expect(withSelection).toEqual(expect.arrayContaining(['patient.editSummary', 'patient.addNote', 'patient.message', 'patient.export']))
    const without = every(loadedState({ selectedPatientId: null }))
    for (const id of PATIENT_SCOPED) expect(without).not.toContain(id)
  })

  it('names the selected patient on patient commands', () => {
    const edit = search('edit care summary').find((item) => item.command.id === 'patient.editSummary')
    expect(edit?.subtitle).toBe('Avery Park · CC-1048')
  })

  it('leaves out the status the patient already has', () => {
    const ids = every(loadedState())
    // Avery Park needs review.
    expect(ids).not.toContain('patient.markNeedsReview')
    expect(ids).toEqual(expect.arrayContaining(['patient.markOpen', 'patient.markCompleted']))
  })

  it('offers filter and sort only in the Patients view', () => {
    expect(every(loadedState({ view: 'patients' }))).toEqual(expect.arrayContaining(['patient.filter', 'patient.sort']))
    const overview = every(loadedState({ view: 'overview' }))
    expect(overview).not.toContain('patient.filter')
    expect(overview).not.toContain('patient.sort')
  })

  it('never offers send, save draft or attach', () => {
    const states = [
      loadedState(),
      loadedState({ view: 'inbox', selectedConversationId: 'c-home-monitoring' }),
      loadedState({ view: 'overview', selectedPatientId: null }),
      loadedState({ modal: { kind: 'palette' } })
    ]
    for (const state of states) {
      for (const query of ['', 'send', 'draft', 'attach', 'message']) {
        const ids = commandIds(filterPaletteItems(buildPaletteItems(state, FIXED_NOW, 'windows'), query))
        expect(ids).not.toContain('message.send')
        expect(ids).not.toContain('message.saveDraft')
        expect(ids).not.toContain('message.attach')
      }
    }
  })

  it('offers Reply only in the Inbox with a conversation selected', () => {
    expect(every(loadedState({ view: 'inbox', selectedConversationId: 'c-home-monitoring' }))).toContain('message.reply')
    expect(every(loadedState({ view: 'inbox', selectedConversationId: null }))).not.toContain('message.reply')
    expect(every(loadedState({ view: 'patients', selectedConversationId: 'c-home-monitoring' }))).not.toContain('message.reply')
  })

  it('leaves out commands that make no sense from a dialog', () => {
    const ids = every(loadedState())
    for (const id of ['app.commandPalette', 'region.next', 'region.previous', 'patient.contextMenu'] as const) expect(ids).not.toContain(id)
  })

  it('shows single-key shortcuts only where they work', () => {
    const keysOf = (state: AppState) =>
      buildPaletteItems(state, FIXED_NOW, 'windows').find((item) => item.group === 'commands' && item.command.id === 'patient.editSummary')?.keys
    expect(keysOf(loadedState({ view: 'patients' }))).toEqual(['E'])
    expect(keysOf(loadedState({ view: 'overview' }))).toBeUndefined()
  })

  it('gives every item a unique id', () => {
    const ids = buildPaletteItems(loadedState({ view: 'inbox', selectedConversationId: 'c-home-monitoring' }), FIXED_NOW, 'windows').map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('groupPaletteItems', () => {
  it('splits results into titled groups and keeps each item’s overall position', () => {
    const groups = groupPaletteItems(search(''))
    expect(groups.map((group) => [group.title, group.items.length])).toEqual([
      ['Suggested commands', 3],
      ['Recent destinations', 3],
      ['Global commands', 2]
    ])
    expect(groups.flatMap((group) => group.items.map((entry) => entry.index))).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('titles the search groups', () => {
    const titles = groupPaletteItems(search('patient')).map((group) => group.title)
    expect(titles).toEqual(expect.arrayContaining(['Commands', 'Destinations']))
  })
})
