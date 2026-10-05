/**
 * In-memory CareConnectApi for renderer tests. Every method is a jest.fn, so
 * tests can assert calls; the `next*` fields script what the "main process"
 * answers, and emitCommand/emitTheme simulate messages from it.
 */
import type {
  AppInfo,
  CareConnectApi,
  ContextMenuRequest,
  ExportRequest,
  ExportResult,
  ImportResult,
  LoadResult,
  LoadSource,
  NotificationRequest,
  ThemeInfo,
  UiState
} from '../../src/shared/api'
import type { AppCommand } from '../../src/shared/commands'
import type { Attachment, Workspace } from '../../src/shared/model'
import { createSeedWorkspace } from '../../src/shared/seed'

/** Monday 5 October 2026, 09:42 local time: the moment every renderer test runs at. */
export const FIXED_NOW = new Date(2026, 9, 5, 9, 42, 0, 0)

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

type AsyncMock<Args extends unknown[], Result> = jest.Mock<Promise<Result>, Args>

export interface MemoryApi extends CareConnectApi {
  loadWorkspace: AsyncMock<[], LoadResult>
  saveWorkspace: AsyncMock<[Workspace], { savedAt: string }>
  exportPatient: AsyncMock<[ExportRequest], ExportResult | null>
  importPatients: AsyncMock<[], ImportResult | null>
  pickAttachment: AsyncMock<[], Attachment | null>
  showNotification: AsyncMock<[NotificationRequest], boolean>
  showContextMenu: AsyncMock<[ContextMenuRequest], string | null>
  getAppInfo: AsyncMock<[], AppInfo>
  openExternal: AsyncMock<[string], boolean>
  copyText: AsyncMock<[string], void>
  printPage: AsyncMock<[], void>
  updateUiState: jest.Mock<void, [UiState]>
  onCommand: jest.Mock<() => void, [(command: AppCommand) => void]>
  onThemeChanged: jest.Mock<() => void, [(theme: ThemeInfo) => void]>

  /** The seed (or given) workspace that loadWorkspace returns. */
  workspace: Workspace
  /** Every workspace passed to saveWorkspace, oldest first. */
  saved: Workspace[]
  /** Script the next answers. An Error makes the call reject. */
  nextLoad: LoadResult | Error | null
  nextSaveError: Error | null
  nextExport: ExportResult | null | Error
  nextImport: ImportResult | null | Error
  nextAttachment: Attachment | null
  nextContextMenuChoice: string | null
  appInfo: AppInfo
  emitCommand(command: AppCommand): void
  emitTheme(theme: ThemeInfo): void
}

export interface MemoryApiOptions {
  now?: Date
  workspace?: Workspace
  source?: LoadSource
  platform?: string
}

export function createMemoryApi(options: MemoryApiOptions = {}): MemoryApi {
  const now = options.now ?? FIXED_NOW
  const commandListeners = new Set<(command: AppCommand) => void>()
  const themeListeners = new Set<(theme: ThemeInfo) => void>()

  const api: MemoryApi = {
    workspace: options.workspace ?? createSeedWorkspace(now),
    saved: [],
    nextLoad: null,
    nextSaveError: null,
    nextExport: null,
    nextImport: null,
    nextAttachment: null,
    nextContextMenuChoice: null,
    appInfo: { platform: options.platform ?? 'win32', version: '1.0.0', isPackaged: false, highContrast: false },

    loadWorkspace: jest.fn(async () => {
      const scripted = api.nextLoad
      api.nextLoad = null
      if (scripted instanceof Error) throw scripted
      return scripted ?? { workspace: clone(api.workspace), source: options.source ?? 'file' }
    }),
    saveWorkspace: jest.fn(async (workspace: Workspace) => {
      if (api.nextSaveError) {
        const error = api.nextSaveError
        api.nextSaveError = null
        throw error
      }
      api.saved.push(clone(workspace))
      return { savedAt: new Date(now.getTime() + 60_000).toISOString() }
    }),
    exportPatient: jest.fn<Promise<ExportResult | null>, [ExportRequest]>(async () => {
      if (api.nextExport instanceof Error) throw api.nextExport
      return api.nextExport
    }),
    importPatients: jest.fn(async () => {
      if (api.nextImport instanceof Error) throw api.nextImport
      return api.nextImport
    }),
    pickAttachment: jest.fn(async () => api.nextAttachment),
    showNotification: jest.fn<Promise<boolean>, [NotificationRequest]>(async () => true),
    showContextMenu: jest.fn<Promise<string | null>, [ContextMenuRequest]>(async () => api.nextContextMenuChoice),
    getAppInfo: jest.fn(async () => api.appInfo),
    openExternal: jest.fn<Promise<boolean>, [string]>(async () => true),
    copyText: jest.fn<Promise<void>, [string]>(async () => undefined),
    printPage: jest.fn(async () => undefined),
    updateUiState: jest.fn(),
    onCommand: jest.fn((listener: (command: AppCommand) => void) => {
      commandListeners.add(listener)
      return () => {
        commandListeners.delete(listener)
      }
    }),
    onThemeChanged: jest.fn((listener: (theme: ThemeInfo) => void) => {
      themeListeners.add(listener)
      return () => {
        themeListeners.delete(listener)
      }
    }),
    emitCommand: (command) => commandListeners.forEach((listener) => listener(command)),
    emitTheme: (theme) => themeListeners.forEach((listener) => listener(theme))
  }
  return api
}
