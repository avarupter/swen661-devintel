/**
 * The preload runs sandboxed with context isolation. It exposes exactly one
 * object, `window.careconnect`, with one method per IPC channel. The renderer
 * never sees `ipcRenderer`, raw channel names or Electron event objects
 * (Electron security checklist item 20).
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { CareConnectApi, ThemeInfo } from '../shared/api'
import type { AppCommand } from '../shared/commands'
import { IPC } from '../shared/ipc'

export type IpcRendererLike = Pick<typeof ipcRenderer, 'invoke' | 'send' | 'on' | 'removeListener'>

export function createCareConnectApi(ipc: IpcRendererLike): CareConnectApi {
  function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
    const handler = (_event: IpcRendererEvent, payload: T): void => listener(payload)
    ipc.on(channel, handler)
    return () => {
      ipc.removeListener(channel, handler)
    }
  }

  return {
    loadWorkspace: () => ipc.invoke(IPC.workspaceLoad),
    saveWorkspace: (workspace) => ipc.invoke(IPC.workspaceSave, workspace),
    exportPatient: (request) => ipc.invoke(IPC.patientExport, request),
    importPatients: () => ipc.invoke(IPC.patientsImport),
    pickAttachment: () => ipc.invoke(IPC.attachmentPick),
    showNotification: (request) => ipc.invoke(IPC.notificationShow, request),
    showContextMenu: (request) => ipc.invoke(IPC.contextMenuShow, request),
    getAppInfo: () => ipc.invoke(IPC.appInfo),
    openExternal: (url) => ipc.invoke(IPC.externalOpen, url),
    copyText: (text) => ipc.invoke(IPC.clipboardWrite, text),
    printPage: () => ipc.invoke(IPC.windowPrint),
    updateUiState: (state) => ipc.send(IPC.uiState, state),
    onCommand: (listener) => subscribe<AppCommand>(IPC.command, listener),
    onThemeChanged: (listener) => subscribe<ThemeInfo>(IPC.themeChanged, listener)
  }
}

contextBridge.exposeInMainWorld('careconnect', createCareConnectApi(ipcRenderer))
