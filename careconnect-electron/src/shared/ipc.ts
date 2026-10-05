/**
 * IPC channel names. The preload maps each CareConnectApi method onto exactly
 * one of these, and the main process registers exactly one handler per invoke
 * channel. Nothing else crosses the process boundary.
 */
export const IPC = {
  // renderer -> main, request/response (ipcRenderer.invoke / ipcMain.handle)
  workspaceLoad: 'workspace:load',
  workspaceSave: 'workspace:save',
  patientExport: 'patient:export',
  patientsImport: 'patients:import',
  attachmentPick: 'attachment:pick',
  notificationShow: 'notification:show',
  contextMenuShow: 'context-menu:show',
  appInfo: 'app:info',
  externalOpen: 'external:open',
  clipboardWrite: 'clipboard:write',
  windowPrint: 'window:print',
  // renderer -> main, fire-and-forget (ipcRenderer.send / ipcMain.on)
  uiState: 'ui:state',
  // main -> renderer (webContents.send / ipcRenderer.on)
  command: 'app:command',
  themeChanged: 'theme:changed'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]

export const INVOKE_CHANNELS = [
  IPC.workspaceLoad,
  IPC.workspaceSave,
  IPC.patientExport,
  IPC.patientsImport,
  IPC.attachmentPick,
  IPC.notificationShow,
  IPC.contextMenuShow,
  IPC.appInfo,
  IPC.externalOpen,
  IPC.clipboardWrite,
  IPC.windowPrint
] as const
