/**
 * Every IPC handler the renderer can reach (design section 3). Each invoke
 * handler goes through one wrapper that rejects senders outside the trusted
 * origins (Electron security checklist item 15), validates the payload with
 * the shared validators (item 17), and hands only plain data back.
 */
import type { BrowserWindow, Clipboard, IpcMain, IpcMainEvent, IpcMainInvokeEvent, Shell } from 'electron'
import type { AppInfo, ContextMenuRequest, NotificationRequest, UiState } from '../shared/api'
import { IPC } from '../shared/ipc'
import {
  validateClipboardText,
  validateContextMenuRequest,
  validateExportRequest,
  validateExternalUrl,
  validateNotificationRequest,
  validateUiState,
  validateWorkspace,
  ValidationError
} from '../shared/validate'
import { scaleMenuPosition } from './contextMenu'
import type { FileOps } from './fileOps'
import { isTrustedSender } from './security'
import type { WorkspaceStore } from './store'

export const UNTRUSTED_SENDER_MESSAGE = 'Blocked IPC from an untrusted sender'

export interface IpcHandlerDeps {
  ipcMain: Pick<IpcMain, 'handle' | 'removeHandler' | 'on' | 'removeListener'>
  origins: readonly string[]
  getWindow(): BrowserWindow | null
  store: Pick<WorkspaceStore, 'load' | 'save'>
  fileOps: FileOps
  showContextMenu(win: BrowserWindow | null, request: ContextMenuRequest): Promise<string | null>
  showNotification(request: NotificationRequest): boolean
  shell: Pick<Shell, 'openExternal'>
  clipboard: Pick<Clipboard, 'writeText'>
  appInfo(): AppInfo
  onUiState(state: UiState): void
}

type Parse<T> = (args: unknown[]) => T

const noArguments: Parse<void> = () => undefined

function firstArgument<T>(validate: (value: unknown) => T): Parse<T> {
  return (args) => validate(args[0])
}

function print(win: BrowserWindow | null): Promise<void> {
  if (!win || win.isDestroyed()) return Promise.resolve()
  return new Promise((resolve) => {
    // The callback also fires when the user cancels the print dialog.
    win.webContents.print({ printBackground: true }, () => resolve())
  })
}

/** Registers every handler; the returned function removes them all again. */
export function registerIpcHandlers(deps: IpcHandlerDeps): () => void {
  const { ipcMain, origins } = deps
  const channels: string[] = []

  function handle<T>(channel: string, parse: Parse<T>, run: (input: T, event: IpcMainInvokeEvent) => unknown): void {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      if (!isTrustedSender(event, origins)) throw new Error(UNTRUSTED_SENDER_MESSAGE)
      let input: T
      try {
        input = parse(args)
      } catch (error) {
        // Only the message crosses the process boundary; keep it free of the class name.
        if (error instanceof ValidationError) throw new Error(error.message)
        throw error
      }
      return run(input, event)
    })
    channels.push(channel)
  }

  handle(IPC.workspaceLoad, noArguments, () => deps.store.load())
  handle(IPC.workspaceSave, firstArgument(validateWorkspace), (workspace) => deps.store.save(workspace))
  handle(IPC.patientExport, firstArgument(validateExportRequest), (request) => deps.fileOps.exportPatient(deps.getWindow(), request))
  handle(IPC.patientsImport, noArguments, () => deps.fileOps.importPatients(deps.getWindow()))
  handle(IPC.attachmentPick, noArguments, () => deps.fileOps.pickAttachment(deps.getWindow()))
  handle(IPC.notificationShow, firstArgument(validateNotificationRequest), (request) => deps.showNotification(request))
  // The sender measured the position in CSS pixels at its own zoom; the menu is placed in window DIPs.
  handle(IPC.contextMenuShow, firstArgument(validateContextMenuRequest), (request, event) =>
    deps.showContextMenu(deps.getWindow(), scaleMenuPosition(request, event.sender.getZoomFactor()))
  )
  handle(IPC.appInfo, noArguments, () => deps.appInfo())
  handle(IPC.externalOpen, firstArgument(validateExternalUrl), async (url) => {
    try {
      await deps.shell.openExternal(url)
      return true
    } catch {
      return false
    }
  })
  handle(IPC.clipboardWrite, firstArgument(validateClipboardText), (text) => {
    deps.clipboard.writeText(text)
  })
  handle(IPC.windowPrint, noArguments, () => print(deps.getWindow()))

  const onUiState = (event: IpcMainEvent, payload: unknown): void => {
    if (!isTrustedSender(event, origins)) return
    let state: UiState
    try {
      state = validateUiState(payload)
    } catch {
      return
    }
    deps.onUiState(state)
  }
  ipcMain.on(IPC.uiState, onUiState)

  return () => {
    for (const channel of channels) ipcMain.removeHandler(channel)
    ipcMain.removeListener(IPC.uiState, onUiState)
  }
}
