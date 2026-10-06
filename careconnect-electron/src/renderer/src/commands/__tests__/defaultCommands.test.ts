import { createMemoryApi, FIXED_NOW, type MemoryApi } from '../../../../../tests/renderer/memoryApi'
import { COMMAND_IDS, type AppCommand, type CommandId, type ViewId } from '../../../../shared/commands'
import type { Patient, Workspace } from '../../../../shared/model'
import { appReducer, createInitialState, type AppAction, type AppState, type Modal, type StatusTone, type UiSlice } from '../../state/appState'
import { describeFailure, runDefaultCommand, type CommandContext } from '../defaultCommands'
import { patientContextMenuItems } from '../patientContextMenu'

interface FakeContext extends CommandContext {
  api: MemoryApi
  dispatch: jest.Mock<void, [AppAction]>
  setStatus: jest.Mock<void, [string, StatusTone?]>
  openModal: jest.Mock<void, [Modal]>
  focusAfterRender: jest.Mock<void, [string]>
  focusSearch: jest.Mock<boolean, []>
  moveRegion: jest.Mock<void, [1 | -1]>
  run: jest.Mock<void, [AppCommand]>
}

/**
 * A CommandContext over a real reducer: dispatch and openModal update the
 * state that getState returns, as the provider's would after a render.
 */
function fakeContext(options: { ui?: Partial<UiSlice>; loaded?: boolean; api?: MemoryApi } = {}): FakeContext {
  const api = options.api ?? createMemoryApi()
  let state: AppState = createInitialState()
  if (options.loaded !== false) {
    state = appReducer(state, { type: 'load/succeeded', workspace: JSON.parse(JSON.stringify(api.workspace)) as Workspace, source: 'file', at: FIXED_NOW.toISOString() })
  }
  state = { ...state, ui: { ...state.ui, ...options.ui } }
  const apply = (action: AppAction): void => {
    state = appReducer(state, action)
  }
  return {
    getState: () => state,
    dispatch: jest.fn(apply),
    api,
    now: () => FIXED_NOW,
    setStatus: jest.fn(),
    openModal: jest.fn((modal: Modal) => apply({ type: 'ui/openModal', modal })),
    focusAfterRender: jest.fn(),
    focusSearch: jest.fn(() => false),
    moveRegion: jest.fn(),
    run: jest.fn()
  }
}

function patientIn(ctx: CommandContext, id: string): Patient {
  const patient = ctx.getState().workspace?.patients.find((entry) => entry.id === id)
  if (!patient) throw new Error(`no patient ${id}`)
  return patient
}

const AVERY = 'p-avery-park'
const EXPORT_PATH = 'C:\\Users\\demo\\Documents\\CC-1048-avery-park.txt'

function navigates(view: ViewId): () => Promise<void> {
  return async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id: `navigate.${view}` as CommandId }, ctx)
    expect(ctx.dispatch.mock.calls).toEqual([[{ type: 'ui/navigate', view }]])
    expect(ctx.focusAfterRender).toHaveBeenCalledWith('view-title')
    expect(ctx.setStatus).not.toHaveBeenCalled()
  }
}

function opensModal(id: CommandId, modal: Modal): () => Promise<void> {
  return async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id }, ctx)
    expect(ctx.openModal.mock.calls).toEqual([[modal]])
    expect(ctx.getState().ui.modal).toEqual(modal)
    expect(ctx.setStatus).not.toHaveBeenCalled()
  }
}

function asksToOpenAMessage(id: CommandId): () => Promise<void> {
  return async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id }, ctx)
    expect(ctx.setStatus).toHaveBeenCalledWith('Open a message first (Ctrl+Shift+M for a new one).', 'info')
    expect(ctx.dispatch).not.toHaveBeenCalled()
    expect(ctx.openModal).not.toHaveBeenCalled()
  }
}

function marks(id: CommandId, status: Patient['status'], label: string): () => Promise<void> {
  return async () => {
    const ctx = fakeContext({ ui: { selectedPatientId: 'p-riley-singh' } })
    const riley = patientIn(ctx, 'p-riley-singh')
    const target = riley.status === status ? 'p-taylor-lane' : 'p-riley-singh'
    await runDefaultCommand({ id, patientId: target }, ctx)
    const patient = patientIn(ctx, target)
    expect(patient.status).toBe(status)
    expect(patient.activity[0]).toMatchObject({ kind: 'record', title: `Status changed to ${label}`, at: FIXED_NOW.toISOString(), author: 'Jordan Lee, RN' })
    expect(patient.activity[0].id).toMatch(/^a-/)
    expect(ctx.setStatus).toHaveBeenCalledWith(`${patient.name} marked as ${label.toLowerCase()}.`, 'success')
  }
}

function toggles(id: CommandId, key: 'showShortcutHints' | 'highContrast' | 'reduceMotion', first: string, second: string): () => Promise<void> {
  return async () => {
    const ctx = fakeContext()
    const initial = ctx.getState().workspace?.preferences[key]
    await runDefaultCommand({ id }, ctx)
    expect(ctx.dispatch).toHaveBeenLastCalledWith({ type: 'preferences/changed', changes: { [key]: !initial } })
    expect(ctx.setStatus).toHaveBeenLastCalledWith(first, 'info')
    await runDefaultCommand({ id }, ctx)
    expect(ctx.getState().workspace?.preferences[key]).toBe(initial)
    expect(ctx.setStatus).toHaveBeenLastCalledWith(second, 'info')
  }
}

/** One case per command: a new command id is a type error here until it has a test. */
const CASES: Record<CommandId, () => Promise<void>> = {
  'navigate.overview': navigates('overview'),
  'navigate.schedule': navigates('schedule'),
  'navigate.patients': navigates('patients'),
  'navigate.inbox': navigates('inbox'),
  'navigate.tasks': navigates('tasks'),
  'navigate.reports': navigates('reports'),
  'navigate.resources': navigates('resources'),
  'region.next': async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id: 'region.next' }, ctx)
    expect(ctx.moveRegion.mock.calls).toEqual([[1]])
  },
  'region.previous': async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id: 'region.previous' }, ctx)
    expect(ctx.moveRegion.mock.calls).toEqual([[-1]])
  },
  'patient.new': opensModal('patient.new', { kind: 'newPatient' }),
  'patient.search': async () => {
    const ctx = fakeContext()
    ctx.focusSearch.mockReturnValue(true)
    await runDefaultCommand({ id: 'patient.search' }, ctx)
    expect(ctx.focusSearch).toHaveBeenCalled()
    expect(ctx.dispatch).not.toHaveBeenCalled()
  },
  'patient.filter': async () => {
    const ctx = fakeContext({ ui: { view: 'overview' } })
    await runDefaultCommand({ id: 'patient.filter' }, ctx)
    expect(ctx.dispatch.mock.calls).toEqual([[{ type: 'ui/navigate', view: 'patients' }]])
    expect(ctx.focusAfterRender).toHaveBeenCalledWith('toolbar-patient.filter')
  },
  'patient.sort': async () => {
    const ctx = fakeContext({ ui: { view: 'schedule' } })
    await runDefaultCommand({ id: 'patient.sort' }, ctx)
    expect(ctx.dispatch.mock.calls).toEqual([[{ type: 'ui/navigate', view: 'patients' }]])
    expect(ctx.focusAfterRender).toHaveBeenCalledWith('toolbar-patient.sort')
  },
  'patient.open': async () => {
    const ctx = fakeContext({ ui: { view: 'inbox' } })
    await runDefaultCommand({ id: 'patient.open', patientId: 'p-riley-singh' }, ctx)
    expect(ctx.dispatch.mock.calls).toEqual([
      [{ type: 'ui/selectPatient', patientId: 'p-riley-singh', at: FIXED_NOW.toISOString() }],
      [{ type: 'ui/navigate', view: 'patients' }]
    ])
    expect(ctx.focusAfterRender).toHaveBeenCalledWith('patient-option-p-riley-singh')
    expect(ctx.getState().ui.recentPatients[0].patientId).toBe('p-riley-singh')
  },
  'patient.editSummary': opensModal('patient.editSummary', { kind: 'editSummary', patientId: AVERY }),
  'patient.addNote': opensModal('patient.addNote', { kind: 'addNote', patientId: AVERY }),
  'patient.message': opensModal('patient.message', { kind: 'compose', patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null }),
  'patient.contextMenu': async () => {
    const ctx = fakeContext()
    ctx.api.nextContextMenuChoice = 'patient.addNote'
    await runDefaultCommand({ id: 'patient.contextMenu' }, ctx)
    expect(ctx.api.showContextMenu).toHaveBeenCalledWith({ items: patientContextMenuItems(patientIn(ctx, AVERY)) })
    expect(ctx.run.mock.calls).toEqual([[{ id: 'patient.addNote', patientId: AVERY }]])
  },
  'patient.export': async () => {
    const ctx = fakeContext()
    ctx.api.nextExport = { filePath: EXPORT_PATH }
    await runDefaultCommand({ id: 'patient.export' }, ctx)
    expect(ctx.api.exportPatient).toHaveBeenCalledWith({ patient: patientIn(ctx, AVERY), format: 'txt' })
    expect(ctx.setStatus).toHaveBeenCalledWith(`Summary for Avery Park exported to ${EXPORT_PATH}.`, 'success')
  },
  'patient.import': async () => {
    const ctx = fakeContext()
    const incoming: Patient = { ...patientIn(ctx, AVERY), id: 'p-robin-example', name: 'Robin Example', careId: 'CC-2001' }
    ctx.api.nextImport = { patients: [incoming], skipped: 0, filePath: 'C:\\import.json' }
    await runDefaultCommand({ id: 'patient.import' }, ctx)
    expect(ctx.dispatch).toHaveBeenCalledWith({ type: 'patients/imported', patients: [incoming] })
    expect(ctx.getState().workspace?.patients).toHaveLength(29)
    expect(ctx.setStatus).toHaveBeenCalledWith('Imported 1 patient.', 'success')
  },
  'patient.copyCareId': async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id: 'patient.copyCareId' }, ctx)
    expect(ctx.api.copyText).toHaveBeenCalledWith('CC-1048')
    expect(ctx.setStatus).toHaveBeenCalledWith('Care ID CC-1048 copied.', 'success')
  },
  'patient.markCompleted': marks('patient.markCompleted', 'completed', 'Completed'),
  'patient.markNeedsReview': marks('patient.markNeedsReview', 'needs-review', 'Needs review'),
  'patient.markOpen': marks('patient.markOpen', 'open', 'Open'),
  'message.new': opensModal('message.new', { kind: 'compose', patientId: null, conversationId: null, draftId: null }),
  'message.reply': async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id: 'message.reply' }, ctx)
    expect(ctx.dispatch.mock.calls).toEqual([[{ type: 'ui/navigate', view: 'inbox' }]])
    expect(ctx.setStatus).toHaveBeenCalledWith('Choose a conversation, then press R to reply.', 'info')
  },
  'message.send': asksToOpenAMessage('message.send'),
  'message.saveDraft': asksToOpenAMessage('message.saveDraft'),
  'message.attach': asksToOpenAMessage('message.attach'),
  'app.commandPalette': opensModal('app.commandPalette', { kind: 'palette' }),
  'app.shortcuts': opensModal('app.shortcuts', { kind: 'shortcuts' }),
  'app.help': opensModal('app.help', { kind: 'help' }),
  'app.settings': opensModal('app.settings', { kind: 'settings' }),
  'view.toggleShortcutHints': toggles('view.toggleShortcutHints', 'showShortcutHints', 'Shortcut hints hidden. Hold Alt to see them.', 'Shortcut hints shown.'),
  'view.toggleHighContrast': toggles('view.toggleHighContrast', 'highContrast', 'High contrast theme on.', 'High contrast theme off.'),
  'view.toggleReduceMotion': toggles('view.toggleReduceMotion', 'reduceMotion', 'Reduce motion on.', 'Reduce motion off.')
}

describe('runDefaultCommand, one case per command', () => {
  it('has a case for every command id', () => {
    expect(Object.keys(CASES).sort()).toEqual([...COMMAND_IDS].sort())
  })

  it.each(COMMAND_IDS)('%s', async (id) => {
    await CASES[id]()
  })
})

const PATIENT_COMMANDS: CommandId[] = [
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

const MODAL_COMMANDS: CommandId[] = [
  'patient.new',
  'patient.editSummary',
  'patient.addNote',
  'patient.message',
  'message.new',
  'app.commandPalette',
  'app.shortcuts',
  'app.help',
  'app.settings'
]

describe('patient commands', () => {
  it.each(PATIENT_COMMANDS)('%s asks for a selection when no patient is selected', async (id) => {
    const ctx = fakeContext({ ui: { selectedPatientId: null } })
    await runDefaultCommand({ id }, ctx)
    expect(ctx.setStatus.mock.calls).toEqual([['Select a patient first.', 'warning']])
    expect(ctx.openModal).not.toHaveBeenCalled()
    expect(ctx.dispatch).not.toHaveBeenCalled()
    for (const method of [ctx.api.showContextMenu, ctx.api.exportPatient, ctx.api.copyText]) expect(method).not.toHaveBeenCalled()
  })

  it.each(PATIENT_COMMANDS)('%s treats an unknown patient id as no selection', async (id) => {
    const ctx = fakeContext()
    await runDefaultCommand({ id, patientId: 'p-removed' }, ctx)
    expect(ctx.setStatus).toHaveBeenCalledWith('Select a patient first.', 'warning')
  })

  it('acts on the patient named in the command rather than the selection', async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id: 'patient.addNote', patientId: 'p-riley-singh' }, ctx)
    expect(ctx.openModal).toHaveBeenCalledWith({ kind: 'addNote', patientId: 'p-riley-singh' })
  })

  it('composes a new conversation for a patient who has none', async () => {
    const ctx = fakeContext()
    await runDefaultCommand({ id: 'patient.message', patientId: 'p-alex-rivera' }, ctx)
    expect(ctx.openModal).toHaveBeenCalledWith({ kind: 'compose', patientId: 'p-alex-rivera', conversationId: null, draftId: null })
  })

  it.each<[CommandId, Patient['status']]>([
    ['patient.markNeedsReview', 'needs-review'],
    ['patient.markOpen', 'open'],
    ['patient.markCompleted', 'completed']
  ])('%s says so instead of changing a patient already %s', async (id, status) => {
    const ctx = fakeContext()
    const target = ctx.getState().workspace?.patients.find((patient) => patient.status === status) as Patient
    await runDefaultCommand({ id, patientId: target.id }, ctx)
    expect(ctx.dispatch).not.toHaveBeenCalled()
    expect(ctx.setStatus).toHaveBeenCalledWith(`${target.name} is already marked ${status.replace('-', ' ')}.`, 'info')
  })

  it('patient.open warns when the patient is gone or missing', async () => {
    for (const command of [{ id: 'patient.open', patientId: 'p-removed' }, { id: 'patient.open' }] as AppCommand[]) {
      const ctx = fakeContext()
      await runDefaultCommand(command, ctx)
      expect(ctx.setStatus).toHaveBeenCalledWith('That patient is no longer in the list.', 'warning')
      expect(ctx.dispatch).not.toHaveBeenCalled()
    }
  })

  it('patient.search takes the user to the Patients search when the view has no search field', async () => {
    const ctx = fakeContext({ ui: { view: 'tasks' } })
    await runDefaultCommand({ id: 'patient.search' }, ctx)
    expect(ctx.dispatch.mock.calls).toEqual([[{ type: 'ui/navigate', view: 'patients' }]])
    expect(ctx.focusAfterRender).toHaveBeenCalledWith('patient-search')
  })

  describe('context menu', () => {
    it.each([null, 'separator-status', 'not-a-command'])('does nothing when the menu returns %j', async (choice) => {
      const ctx = fakeContext()
      ctx.api.nextContextMenuChoice = choice
      await runDefaultCommand({ id: 'patient.contextMenu' }, ctx)
      expect(ctx.api.showContextMenu).toHaveBeenCalled()
      expect(ctx.run).not.toHaveBeenCalled()
    })

    it('lets a menu failure reach the dispatcher, which reports it', async () => {
      const ctx = fakeContext()
      ctx.api.showContextMenu.mockRejectedValueOnce(new Error('menu failed'))
      await expect(runDefaultCommand({ id: 'patient.contextMenu' }, ctx)).rejects.toThrow('menu failed')
    })
  })

  describe('export', () => {
    it('says nothing when the save dialog is cancelled', async () => {
      const ctx = fakeContext()
      ctx.api.nextExport = null
      await runDefaultCommand({ id: 'patient.export' }, ctx)
      expect(ctx.api.exportPatient).toHaveBeenCalled()
      expect(ctx.setStatus).not.toHaveBeenCalled()
    })

    it('reports a failure without the IPC prefix', async () => {
      const ctx = fakeContext()
      ctx.api.nextExport = new Error("Error invoking remote method 'patient:export': Error: The disk is full")
      await runDefaultCommand({ id: 'patient.export' }, ctx)
      expect(ctx.setStatus).toHaveBeenCalledWith("Couldn't export the summary: The disk is full", 'error')
    })
  })

  describe('import', () => {
    function incoming(ctx: CommandContext, overrides: Partial<Patient>): Patient {
      return { ...patientIn(ctx, AVERY), ...overrides }
    }

    it('does nothing when the open dialog is cancelled', async () => {
      const ctx = fakeContext()
      ctx.api.nextImport = null
      await runDefaultCommand({ id: 'patient.import' }, ctx)
      expect(ctx.dispatch).not.toHaveBeenCalled()
      expect(ctx.setStatus).not.toHaveBeenCalled()
    })

    it('adds new patients and reports duplicates and skipped records', async () => {
      const ctx = fakeContext()
      const fresh = [incoming(ctx, { id: 'p-one', careId: 'CC-2001', name: 'One' }), incoming(ctx, { id: 'p-two', careId: 'CC-2002', name: 'Two' })]
      ctx.api.nextImport = { patients: [...fresh, patientIn(ctx, AVERY)], skipped: 1, filePath: 'C:\\import.json' }
      await runDefaultCommand({ id: 'patient.import' }, ctx)
      expect(ctx.dispatch).toHaveBeenCalledWith({ type: 'patients/imported', patients: fresh })
      expect(ctx.setStatus).toHaveBeenCalledWith('Imported 2 patients. 1 already in your list. 1 invalid record skipped.', 'success')
    })

    it('warns when nothing new was imported', async () => {
      const ctx = fakeContext()
      ctx.api.nextImport = { patients: [patientIn(ctx, AVERY), patientIn(ctx, 'p-riley-singh')], skipped: 3, filePath: 'C:\\import.json' }
      await runDefaultCommand({ id: 'patient.import' }, ctx)
      expect(ctx.dispatch).not.toHaveBeenCalled()
      expect(ctx.setStatus).toHaveBeenCalledWith('Imported 0 patients. 2 already in your list. 3 invalid records skipped.', 'warning')
    })

    it('gives a record whose id is taken a new id', async () => {
      const ctx = fakeContext()
      ctx.api.nextImport = { patients: [incoming(ctx, { careId: 'CC-2001' })], skipped: 0, filePath: 'C:\\import.json' }
      await runDefaultCommand({ id: 'patient.import' }, ctx)
      const added = ctx.getState().workspace?.patients.at(-1) as Patient
      expect(added.careId).toBe('CC-2001')
      expect(added.id).not.toBe(AVERY)
      expect(added.id).toMatch(/^p-/)
    })

    it('reports a failure', async () => {
      const ctx = fakeContext()
      ctx.api.nextImport = new Error("Error invoking remote method 'patients:import': ValidationError: file: is not valid JSON")
      await runDefaultCommand({ id: 'patient.import' }, ctx)
      expect(ctx.setStatus).toHaveBeenCalledWith("Couldn't import patients: ValidationError: file: is not valid JSON", 'error')
    })

    it('ignores a result that arrives without a workspace', async () => {
      const ctx = fakeContext({ loaded: false })
      ctx.api.nextImport = { patients: [], skipped: 0, filePath: 'C:\\import.json' }
      await runDefaultCommand({ id: 'patient.import' }, ctx)
      expect(ctx.setStatus).not.toHaveBeenCalled()
    })
  })

  it('reports a clipboard failure', async () => {
    const ctx = fakeContext()
    ctx.api.copyText.mockRejectedValueOnce(new Error('Clipboard unavailable'))
    await runDefaultCommand({ id: 'patient.copyCareId' }, ctx)
    expect(ctx.setStatus).toHaveBeenCalledWith("Couldn't copy the Care ID: Clipboard unavailable", 'error')
  })
})

describe('modals', () => {
  it.each(MODAL_COMMANDS)('%s will not stack on top of another dialog', async (id) => {
    const ctx = fakeContext({ ui: { modal: { kind: 'settings' } } })
    await runDefaultCommand({ id }, ctx)
    expect(ctx.openModal).not.toHaveBeenCalled()
    expect(ctx.setStatus).toHaveBeenCalledWith('Close the open dialog first.', 'info')
    expect(ctx.getState().ui.modal).toEqual({ kind: 'settings' })
  })

  it.each(MODAL_COMMANDS)('%s may replace the command palette', async (id) => {
    const ctx = fakeContext({ ui: { modal: { kind: 'palette' } } })
    await runDefaultCommand({ id }, ctx)
    expect(ctx.openModal).toHaveBeenCalledTimes(1)
    expect(ctx.setStatus).not.toHaveBeenCalled()
  })
})

describe('key names in status messages', () => {
  it.each<CommandId>(['message.send', 'message.saveDraft', 'message.attach'])('%s names the macOS New message keys on a Mac', async (id) => {
    const ctx = fakeContext({ ui: { platform: 'mac' } })
    await runDefaultCommand({ id }, ctx)
    expect(ctx.setStatus).toHaveBeenCalledWith('Open a message first (⌘+⇧+M for a new one).', 'info')
  })

  it('names the macOS Option key when hints are hidden on a Mac', async () => {
    const ctx = fakeContext({ ui: { platform: 'mac' } })
    await runDefaultCommand({ id: 'view.toggleShortcutHints' }, ctx)
    expect(ctx.setStatus).toHaveBeenCalledWith('Shortcut hints hidden. Hold ⌥ to see them.', 'info')
  })
})

describe('preferences without a workspace', () => {
  it.each<CommandId>(['view.toggleShortcutHints', 'view.toggleHighContrast', 'view.toggleReduceMotion'])('%s does nothing before loading', async (id) => {
    const ctx = fakeContext({ loaded: false })
    await runDefaultCommand({ id }, ctx)
    expect(ctx.dispatch).not.toHaveBeenCalled()
    expect(ctx.setStatus).not.toHaveBeenCalled()
  })
})

describe('describeFailure', () => {
  it('strips the IPC wrapper and stringifies non-errors', () => {
    expect(describeFailure(new Error("Error invoking remote method 'clipboard:write': Error: denied"))).toBe('denied')
    expect(describeFailure(new Error('plain'))).toBe('plain')
    expect(describeFailure('text')).toBe('text')
    expect(describeFailure(undefined)).toBe('undefined')
  })
})
