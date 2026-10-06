import type { BrowserWindow, IpcMain } from 'electron'
import type { AppInfo, UiState } from '../../shared/api'
import { INVOKE_CHANNELS, IPC } from '../../shared/ipc'
import { createSeedWorkspace } from '../../shared/seed'
import { FakeBrowserWindow, mockElectron } from '../../../tests/mocks/electron'
import type { FileOps } from '../fileOps'
import { type IpcHandlerDeps, registerIpcHandlers, UNTRUSTED_SENDER_MESSAGE } from '../ipcHandlers'
import { allowedOrigins } from '../security'

const NOW = new Date(2026, 9, 5, 9, 42, 0, 0)
const TRUSTED = { senderFrame: { url: 'app://careconnect/index.html' } }
const UNTRUSTED = { senderFrame: { url: 'https://evil.example/' } }

const UI_STATE: UiState = {
  view: 'inbox',
  hasSelection: true,
  modal: null,
  unreadCount: 3,
  unsavedChanges: 1,
  showShortcutHints: true,
  highContrast: false,
  reduceMotion: true
}

const APP_INFO: AppInfo = { platform: 'win32', version: '1.0.0', isPackaged: true, highContrast: false }

function setup() {
  mockElectron.reset()
  const win = new FakeBrowserWindow()
  const avery = createSeedWorkspace(NOW).patients[0]
  const deps = {
    ipcMain: mockElectron.ipcMain as unknown as IpcMain,
    origins: allowedOrigins(),
    getWindow: jest.fn(() => win as unknown as BrowserWindow | null),
    store: {
      load: jest.fn(async () => ({ workspace: createSeedWorkspace(NOW), source: 'seed' as const })),
      save: jest.fn(async () => ({ savedAt: NOW.toISOString() }))
    },
    fileOps: {
      exportPatient: jest.fn(async () => ({ filePath: '/exports/CC-1048-avery-park.txt' })),
      importPatients: jest.fn(async () => ({ patients: [avery], skipped: 1, filePath: '/imports/patients.json' })),
      pickAttachment: jest.fn(async () => ({ name: 'labs.pdf', size: 2048 }))
    } satisfies FileOps,
    showContextMenu: jest.fn(async () => 'patient.addNote'),
    showNotification: jest.fn(() => true),
    shell: { openExternal: jest.fn(async () => undefined) },
    clipboard: { writeText: jest.fn() },
    appInfo: jest.fn(() => APP_INFO),
    onUiState: jest.fn()
  }
  const dispose = registerIpcHandlers(deps as IpcHandlerDeps)
  /** Electron gives every IPC event the sending webContents; here it is the main window's. */
  const invoke = (channel: string, event: object = TRUSTED, ...args: unknown[]): Promise<unknown> => {
    const handler = mockElectron.ipcMain.handlers.get(channel)
    if (!handler) throw new Error(`No handler for ${channel}`)
    return Promise.resolve(handler({ sender: win.webContents, ...event }, ...args))
  }
  return { deps, dispose, invoke, win, avery }
}

describe('registerIpcHandlers', () => {
  it('registers every invoke channel once, and listens for ui:state', () => {
    setup()
    const handled = mockElectron.ipcMain.handle.mock.calls.map(([channel]) => channel)
    expect(handled.sort()).toEqual([...INVOKE_CHANNELS].sort())
    expect(new Set(handled).size).toBe(handled.length)
    expect(mockElectron.ipcMain.listenerCount(IPC.uiState)).toBe(1)
  })

  describe('trusted requests', () => {
    it('workspace:load returns the store’s result', async () => {
      const { invoke, deps } = setup()
      await expect(invoke(IPC.workspaceLoad)).resolves.toMatchObject({ source: 'seed' })
      expect(deps.store.load).toHaveBeenCalledTimes(1)
    })

    it('workspace:save passes the validated workspace, without unknown fields, to the store', async () => {
      const { invoke, deps } = setup()
      const workspace = createSeedWorkspace(NOW)
      await expect(invoke(IPC.workspaceSave, TRUSTED, { ...workspace, injected: true })).resolves.toEqual({ savedAt: NOW.toISOString() })
      expect(deps.store.save).toHaveBeenCalledWith(workspace)
    })

    it('patient:export validates the request and exports from the main window', async () => {
      const { invoke, deps, win, avery } = setup()
      await expect(invoke(IPC.patientExport, TRUSTED, { patient: avery, format: 'json' })).resolves.toEqual({
        filePath: '/exports/CC-1048-avery-park.txt'
      })
      expect(deps.fileOps.exportPatient).toHaveBeenCalledWith(win, { patient: avery, format: 'json' })
    })

    it('patients:import and attachment:pick open their dialogs over the main window', async () => {
      const { invoke, deps, win, avery } = setup()
      await expect(invoke(IPC.patientsImport)).resolves.toEqual({ patients: [avery], skipped: 1, filePath: '/imports/patients.json' })
      expect(deps.fileOps.importPatients).toHaveBeenCalledWith(win)
      await expect(invoke(IPC.attachmentPick)).resolves.toEqual({ name: 'labs.pdf', size: 2048 })
      expect(deps.fileOps.pickAttachment).toHaveBeenCalledWith(win)
    })

    it('notification:show shows the validated notification', async () => {
      const { invoke, deps } = setup()
      const request = { title: '1 follow-up due today', body: 'Avery Park at 10:30', patientId: 'p-avery-park' }
      await expect(invoke(IPC.notificationShow, TRUSTED, request)).resolves.toBe(true)
      expect(deps.showNotification).toHaveBeenCalledWith(request)
    })

    it('context-menu:show shows the menu over the main window and returns the choice', async () => {
      const { invoke, deps, win } = setup()
      const request = { items: [{ id: 'patient.addNote', label: 'Add clinical note…' }], x: 10.4, y: 20 }
      await expect(invoke(IPC.contextMenuShow, TRUSTED, request)).resolves.toBe('patient.addNote')
      expect(deps.showContextMenu).toHaveBeenCalledWith(win, {
        items: [{ id: 'patient.addNote', label: 'Add clinical note…', type: 'normal' }],
        x: 10,
        y: 20
      })
    })

    describe('context-menu:show at a page zoom other than 100 %', () => {
      const ITEMS = [{ id: 'patient.addNote', label: 'Add clinical note…', type: 'normal' as const }]

      it('converts the renderer’s CSS pixels to window DIPs with the sending page’s zoom factor', async () => {
        const { invoke, deps, win } = setup()
        win.webContents.setZoomFactor(2)
        await invoke(IPC.contextMenuShow, TRUSTED, { items: ITEMS, x: 240, y: 318 })
        expect(win.webContents.getZoomFactor).toHaveBeenCalled()
        expect(deps.showContextMenu).toHaveBeenLastCalledWith(win, { items: ITEMS, x: 480, y: 636 })
      })

      it('rounds the converted position to whole DIPs (one View > Zoom In step, zoom level 0.5)', async () => {
        const { invoke, deps, win } = setup()
        win.webContents.setZoomLevel(0.5)
        await invoke(IPC.contextMenuShow, TRUSTED, { items: ITEMS, x: 240, y: 318 })
        // 1.2 ** 0.5 ≈ 1.0954: 262.9 and 348.4 DIPs.
        expect(deps.showContextMenu).toHaveBeenLastCalledWith(win, { items: ITEMS, x: 263, y: 348 })
      })

      it('keeps an omitted position omitted, so the menu still opens at the pointer', async () => {
        const { invoke, deps, win } = setup()
        win.webContents.setZoomFactor(2)
        await invoke(IPC.contextMenuShow, TRUSTED, { items: ITEMS })
        expect(deps.showContextMenu).toHaveBeenLastCalledWith(win, { items: ITEMS })
      })
    })

    it('app:info returns the app info', async () => {
      const { invoke } = setup()
      await expect(invoke(IPC.appInfo)).resolves.toEqual(APP_INFO)
    })

    it('external:open opens an allow-listed https link and resolves true', async () => {
      const { invoke, deps } = setup()
      await expect(invoke(IPC.externalOpen, TRUSTED, 'https://www.w3.org/WAI/WCAG22/quickref/')).resolves.toBe(true)
      expect(deps.shell.openExternal).toHaveBeenCalledWith('https://www.w3.org/WAI/WCAG22/quickref/')
    })

    it('external:open resolves false when the system cannot open the link', async () => {
      const { invoke, deps } = setup()
      deps.shell.openExternal.mockRejectedValueOnce(new Error('No application is associated'))
      await expect(invoke(IPC.externalOpen, TRUSTED, 'https://medlineplus.gov/healthtopics.html')).resolves.toBe(false)
    })

    it('clipboard:write writes plain text', async () => {
      const { invoke, deps } = setup()
      await expect(invoke(IPC.clipboardWrite, TRUSTED, 'CC-1048')).resolves.toBeUndefined()
      expect(deps.clipboard.writeText).toHaveBeenCalledWith('CC-1048')
    })

    it('window:print prints with backgrounds and resolves when printing finishes', async () => {
      const { invoke, win } = setup()
      let finish: ((success: boolean, reason: string) => void) | undefined
      win.webContents.print.mockImplementation((_options: unknown, callback: (success: boolean, reason: string) => void) => {
        finish = callback
      })
      let settled = false
      const printing = invoke(IPC.windowPrint).then(() => {
        settled = true
      })
      await Promise.resolve()
      expect(win.webContents.print).toHaveBeenCalledWith({ printBackground: true }, expect.any(Function))
      expect(settled).toBe(false)
      finish?.(false, 'cancelled')
      await printing
      expect(settled).toBe(true)
    })

    it('window:print resolves at once when there is no window', async () => {
      const { invoke, deps } = setup()
      deps.getWindow.mockReturnValueOnce(null)
      await expect(invoke(IPC.windowPrint)).resolves.toBeUndefined()
    })
  })

  describe('untrusted senders', () => {
    const PAYLOADS: Record<string, unknown[]> = {
      [IPC.workspaceSave]: [createSeedWorkspace(NOW)],
      [IPC.externalOpen]: ['https://www.w3.org/'],
      [IPC.clipboardWrite]: ['CC-1048'],
      [IPC.notificationShow]: [{ title: 'Hi', body: '' }],
      [IPC.contextMenuShow]: [{ items: [{ id: 'a', label: 'A' }] }]
    }

    it.each([...INVOKE_CHANNELS])('%s rejects a sender on another origin', async (channel) => {
      const { invoke, deps } = setup()
      await expect(invoke(channel, UNTRUSTED, ...(PAYLOADS[channel] ?? []))).rejects.toThrow(UNTRUSTED_SENDER_MESSAGE)
      expect(UNTRUSTED_SENDER_MESSAGE).toBe('Blocked IPC from an untrusted sender')
      expect(deps.store.load).not.toHaveBeenCalled()
      expect(deps.store.save).not.toHaveBeenCalled()
      expect(deps.shell.openExternal).not.toHaveBeenCalled()
      expect(deps.clipboard.writeText).not.toHaveBeenCalled()
      expect(deps.showNotification).not.toHaveBeenCalled()
      expect(deps.showContextMenu).not.toHaveBeenCalled()
    })

    it('rejects a lookalike origin and a sender whose frame is gone', async () => {
      const { invoke } = setup()
      await expect(invoke(IPC.workspaceLoad, { senderFrame: { url: 'app://careconnect.evil/index.html' } })).rejects.toThrow(
        UNTRUSTED_SENDER_MESSAGE
      )
      await expect(invoke(IPC.workspaceLoad, { senderFrame: null })).rejects.toThrow(UNTRUSTED_SENDER_MESSAGE)
    })
  })

  describe('invalid payloads', () => {
    it('rejects a malformed workspace without touching the store', async () => {
      const { invoke, deps } = setup()
      const broken = createSeedWorkspace(NOW)
      broken.patients[0].status = 'deleted' as never
      await expect(invoke(IPC.workspaceSave, TRUSTED, broken)).rejects.toThrow(
        'workspace.patients[0].status: expected one of needs-review, open, completed'
      )
      await expect(invoke(IPC.workspaceSave, TRUSTED)).rejects.toThrow('workspace: expected an object')
      expect(deps.store.save).not.toHaveBeenCalled()
    })

    it.each([
      ['http', 'http://www.w3.org/'],
      ['an unknown host', 'https://example.com/'],
      ['a javascript: URL', 'javascript:alert(1)'],
      ['a file URL', 'file:///C:/Windows/System32/calc.exe'],
      ['not text', 42]
    ])('rejects external:open with %s', async (_label, url) => {
      const { invoke, deps } = setup()
      await expect(invoke(IPC.externalOpen, TRUSTED, url)).rejects.toThrow(/^url: /)
      expect(deps.shell.openExternal).not.toHaveBeenCalled()
    })

    it('rejects oversized or empty clipboard text', async () => {
      const { invoke, deps } = setup()
      await expect(invoke(IPC.clipboardWrite, TRUSTED, 'x'.repeat(10_001))).rejects.toThrow('text: must be at most 10000 characters')
      await expect(invoke(IPC.clipboardWrite, TRUSTED, '')).rejects.toThrow('text: must not be empty')
      expect(deps.clipboard.writeText).not.toHaveBeenCalled()
    })

    it('rejects malformed export, notification and context-menu requests', async () => {
      const { invoke, deps, avery } = setup()
      await expect(invoke(IPC.patientExport, TRUSTED, { patient: avery, format: 'exe' })).rejects.toThrow('exportRequest.format')
      await expect(invoke(IPC.notificationShow, TRUSTED, { body: 'no title' })).rejects.toThrow('notification.title')
      await expect(invoke(IPC.contextMenuShow, TRUSTED, { items: [] })).rejects.toThrow('contextMenu.items: must not be empty')
      expect(deps.fileOps.exportPatient).not.toHaveBeenCalled()
      expect(deps.showNotification).not.toHaveBeenCalled()
      expect(deps.showContextMenu).not.toHaveBeenCalled()
    })

    it('reports validation failures as plain errors, without the ValidationError type name', async () => {
      const { invoke } = setup()
      const error = (await invoke(IPC.clipboardWrite, TRUSTED, '').catch((reason: unknown) => reason)) as Error
      expect(error.name).toBe('Error')
    })

    it('passes through failures that are not validation errors', async () => {
      const { invoke, deps } = setup()
      deps.store.load.mockRejectedValueOnce(new Error('disk on fire'))
      await expect(invoke(IPC.workspaceLoad)).rejects.toThrow('disk on fire')
    })
  })

  describe('ui:state', () => {
    it('forwards a valid state, without unknown fields', () => {
      const { deps } = setup()
      mockElectron.ipcMain.emit(IPC.uiState, TRUSTED, { ...UI_STATE, extra: 'ignored' })
      expect(deps.onUiState).toHaveBeenCalledWith(UI_STATE)
    })

    it('ignores an invalid state', () => {
      const { deps } = setup()
      mockElectron.ipcMain.emit(IPC.uiState, TRUSTED, { ...UI_STATE, view: 'settings' })
      mockElectron.ipcMain.emit(IPC.uiState, TRUSTED, { ...UI_STATE, unreadCount: -1 })
      mockElectron.ipcMain.emit(IPC.uiState, TRUSTED, 'patients')
      mockElectron.ipcMain.emit(IPC.uiState, TRUSTED)
      expect(deps.onUiState).not.toHaveBeenCalled()
    })

    it('ignores a state from an untrusted sender', () => {
      const { deps } = setup()
      mockElectron.ipcMain.emit(IPC.uiState, UNTRUSTED, UI_STATE)
      mockElectron.ipcMain.emit(IPC.uiState, { senderFrame: null }, UI_STATE)
      expect(deps.onUiState).not.toHaveBeenCalled()
    })
  })

  it('removes every handler and listener when disposed, so they can be registered again', () => {
    const { dispose, deps } = setup()
    dispose()
    expect(mockElectron.ipcMain.handlers.size).toBe(0)
    expect(mockElectron.ipcMain.listenerCount(IPC.uiState)).toBe(0)
    expect(mockElectron.ipcMain.removeHandler.mock.calls.map(([channel]) => channel).sort()).toEqual([...INVOKE_CHANNELS].sort())
    expect(() => registerIpcHandlers(deps as IpcHandlerDeps)).not.toThrow()
  })
})
