/**
 * The contract between the renderer and the main process. The preload
 * implements CareConnectApi on top of the channels in ./ipc.ts and exposes it
 * as `window.careconnect`. The renderer only ever sees this interface.
 */
import type { AppCommand, ViewId } from './commands'
import type { Attachment, Patient, Workspace } from './model'

export type LoadSource = 'file' | 'seed' | 'recovered'

export interface LoadResult {
  workspace: Workspace
  /** 'recovered' means the saved file was unreadable and was set aside at `backupPath`. */
  source: LoadSource
  backupPath?: string
}

export interface SaveResult {
  savedAt: string
}

export type ExportFormat = 'txt' | 'json'

export interface ExportRequest {
  patient: Patient
  format: ExportFormat
}

export interface ExportResult {
  filePath: string
}

export interface ImportResult {
  patients: Patient[]
  /** Records in the file that failed validation. */
  skipped: number
  filePath: string
}

export interface NotificationRequest {
  title: string
  body: string
  /** Clicking the notification opens this patient. */
  patientId?: string
}

export interface ContextMenuItem {
  id: string
  label: string
  type?: 'normal' | 'separator' | 'checkbox' | 'radio'
  enabled?: boolean
  checked?: boolean
  /** Shown beside the label; never registered as a global accelerator. */
  accelerator?: string
}

export interface ContextMenuRequest {
  items: ContextMenuItem[]
  /** Window-relative position; omitted means "at the mouse pointer". */
  x?: number
  y?: number
}

export interface AppInfo {
  platform: string
  version: string
  isPackaged: boolean
  highContrast: boolean
}

export interface ThemeInfo {
  highContrast: boolean
  dark: boolean
}

export type ModalKind = 'palette' | 'compose' | 'dialog'

/** Renderer state the main process mirrors in menus, the tray and the taskbar. */
export interface UiState {
  view: ViewId
  hasSelection: boolean
  modal: ModalKind | null
  unreadCount: number
  unsavedChanges: number
  showShortcutHints: boolean
  highContrast: boolean
  reduceMotion: boolean
}

export interface CareConnectApi {
  loadWorkspace(): Promise<LoadResult>
  saveWorkspace(workspace: Workspace): Promise<SaveResult>
  /** Resolves null when the user cancels the save dialog. */
  exportPatient(request: ExportRequest): Promise<ExportResult | null>
  /** Resolves null when the user cancels the open dialog. */
  importPatients(): Promise<ImportResult | null>
  /** Resolves null when the user cancels the open dialog. */
  pickAttachment(): Promise<Attachment | null>
  showNotification(request: NotificationRequest): Promise<boolean>
  /** Shows a native context menu; resolves the chosen item id, or null if dismissed. */
  showContextMenu(request: ContextMenuRequest): Promise<string | null>
  getAppInfo(): Promise<AppInfo>
  openExternal(url: string): Promise<boolean>
  copyText(text: string): Promise<void>
  printPage(): Promise<void>
  updateUiState(state: UiState): void
  /** Subscribes to commands from the menu, tray, Jump List or notifications. Returns an unsubscribe function. */
  onCommand(listener: (command: AppCommand) => void): () => void
  onThemeChanged(listener: (theme: ThemeInfo) => void): () => void
}
