import type { CareConnectApi, ThemeInfo, UiState } from '../../shared/api'
import type { AppCommand } from '../../shared/commands'
import { IPC } from '../../shared/ipc'
import { createSeedWorkspace } from '../../shared/seed'
import { contextBridge, ipcRenderer, mockElectron } from '../../../tests/mocks/electron'
// Loading the preload runs its contextBridge.exposeInMainWorld call against the mocked electron module.
import { createCareConnectApi, type IpcRendererLike } from '../index'

// Captured before Jest's clearMocks empties the call log ahead of each test.
const exposeCalls = contextBridge.exposeInMainWorld.mock.calls.map((call) => [...call])

const API_KEYS: (keyof CareConnectApi)[] = [
  'copyText',
  'exportPatient',
  'getAppInfo',
  'importPatients',
  'loadWorkspace',
  'onCommand',
  'onThemeChanged',
  'openExternal',
  'pickAttachment',
  'printPage',
  'saveWorkspace',
  'showContextMenu',
  'showNotification',
  'updateUiState'
]

const NOW = new Date(2026, 9, 5, 9, 42, 0, 0)

const UI_STATE: UiState = {
  view: 'patients',
  hasSelection: true,
  modal: null,
  unreadCount: 4,
  unsavedChanges: 0,
  showShortcutHints: true,
  highContrast: false,
  reduceMotion: false
}

function recordingIpc() {
  const ipc = {
    invoke: jest.fn(async (channel: string, ...args: unknown[]) => ({ channel, args })),
    send: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
  }
  return { ipc, api: createCareConnectApi(ipc as unknown as IpcRendererLike) }
}

describe('contextBridge exposure', () => {
  it('exposes window.careconnect exactly once, with exactly the CareConnectApi methods', () => {
    expect(exposeCalls).toHaveLength(1)
    const [key, api] = exposeCalls[0] as [string, Record<string, unknown>]
    expect(key).toBe('careconnect')
    expect(Object.keys(api).sort()).toEqual(API_KEYS)
    for (const value of Object.values(api)) expect(typeof value).toBe('function')
  })

  it('never leaks ipcRenderer or a generic send/invoke', () => {
    const api = mockElectron.exposed.careconnect as Record<string, unknown>
    expect(Object.values(api)).not.toContain(ipcRenderer)
    expect(api).not.toHaveProperty('invoke')
    expect(api).not.toHaveProperty('send')
    expect(api).not.toHaveProperty('on')
  })
})

describe('createCareConnectApi', () => {
  const workspace = createSeedWorkspace(NOW)
  const patient = workspace.patients[0]

  it.each([
    ['loadWorkspace', [], IPC.workspaceLoad],
    ['saveWorkspace', [workspace], IPC.workspaceSave],
    ['exportPatient', [{ patient, format: 'txt' }], IPC.patientExport],
    ['importPatients', [], IPC.patientsImport],
    ['pickAttachment', [], IPC.attachmentPick],
    ['showNotification', [{ title: '1 follow-up due today', body: 'Avery Park at 10:30', patientId: patient.id }], IPC.notificationShow],
    ['showContextMenu', [{ items: [{ id: 'patient.addNote', label: 'Add clinical note…' }], x: 4, y: 8 }], IPC.contextMenuShow],
    ['getAppInfo', [], IPC.appInfo],
    ['openExternal', ['https://www.w3.org/WAI/WCAG22/quickref/'], IPC.externalOpen],
    ['copyText', ['CC-1048'], IPC.clipboardWrite],
    ['printPage', [], IPC.windowPrint]
  ] as [keyof CareConnectApi, unknown[], string][])('%s invokes %s with its arguments and returns the reply', async (method, args, channel) => {
    const { ipc, api } = recordingIpc()
    const call = api[method] as (...input: unknown[]) => Promise<unknown>
    await expect(call(...args)).resolves.toEqual({ channel, args })
    expect(ipc.invoke).toHaveBeenCalledTimes(1)
    expect(ipc.invoke).toHaveBeenCalledWith(channel, ...args)
    expect(ipc.send).not.toHaveBeenCalled()
  })

  it('updateUiState sends ui:state without waiting for a reply', () => {
    const { ipc, api } = recordingIpc()
    expect(api.updateUiState(UI_STATE)).toBeUndefined()
    expect(ipc.send).toHaveBeenCalledWith(IPC.uiState, UI_STATE)
    expect(ipc.invoke).not.toHaveBeenCalled()
  })

  it('onCommand delivers the payload without the event object, and unsubscribing removes the listener', () => {
    const { ipc, api } = recordingIpc()
    const listener = jest.fn()
    const unsubscribe = api.onCommand(listener)
    expect(ipc.on).toHaveBeenCalledWith(IPC.command, expect.any(Function))
    const handler = ipc.on.mock.calls[0][1] as (event: unknown, payload: AppCommand) => void

    const event = { sender: { send: jest.fn() }, ports: [] }
    handler(event, { id: 'patient.open', patientId: 'p-avery-park' })
    expect(listener).toHaveBeenCalledWith({ id: 'patient.open', patientId: 'p-avery-park' })
    expect(listener.mock.calls[0]).toHaveLength(1)

    unsubscribe()
    expect(ipc.removeListener).toHaveBeenCalledWith(IPC.command, handler)
  })

  it('onThemeChanged delivers the theme without the event object', () => {
    const { ipc, api } = recordingIpc()
    const listener = jest.fn()
    const unsubscribe = api.onThemeChanged(listener)
    const handler = ipc.on.mock.calls[0][1] as (event: unknown, payload: ThemeInfo) => void
    expect(ipc.on.mock.calls[0][0]).toBe(IPC.themeChanged)
    handler({ sender: {} }, { highContrast: true, dark: false })
    expect(listener).toHaveBeenCalledWith({ highContrast: true, dark: false })
    expect(listener.mock.calls[0]).toHaveLength(1)
    unsubscribe()
    expect(ipc.removeListener).toHaveBeenCalledWith(IPC.themeChanged, handler)
  })
})

describe('the exposed bridge over the mocked IPC bus', () => {
  beforeEach(() => {
    mockElectron.rendererBus.removeAllListeners()
  })

  it('delivers main-process commands to subscribers until they unsubscribe', () => {
    const api = mockElectron.exposed.careconnect as CareConnectApi
    const listener = jest.fn()
    const unsubscribe = api.onCommand(listener)
    mockElectron.rendererBus.deliver(IPC.command, [{ id: 'navigate.inbox' }])
    expect(listener).toHaveBeenCalledWith({ id: 'navigate.inbox' })

    unsubscribe()
    mockElectron.rendererBus.deliver(IPC.command, [{ id: 'patient.new' }])
    expect(listener).toHaveBeenCalledTimes(1)
    expect(mockElectron.rendererBus.listenerCount(IPC.command)).toBe(0)
  })

  it('keeps separate subscriptions independent', () => {
    const api = mockElectron.exposed.careconnect as CareConnectApi
    const first = jest.fn()
    const second = jest.fn()
    const stopFirst = api.onCommand(first)
    api.onCommand(second)
    stopFirst()
    mockElectron.rendererBus.deliver(IPC.command, [{ id: 'app.help' }])
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith({ id: 'app.help' })
  })
})
