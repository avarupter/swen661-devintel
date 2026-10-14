/**
 * Stands in for the preload bridge when the renderer is opened in an ordinary
 * browser through the Vite dev server (`npm run dev:web`), so every screen can
 * be scanned with axe DevTools in Chrome. It is loaded only in development
 * builds, and only when `window.careconnect` is missing.
 *
 * The data is the synthetic seed workspace, kept in this browser's
 * localStorage. Desktop-only features answer the way a cancelled or
 * unavailable action does: native menus and file pickers resolve null, and
 * notifications resolve false.
 */
import type { AppInfo, CareConnectApi, LoadResult } from '../../../shared/api'
import { exportFileName, formatPatientExport } from '../../../shared/exportFormat'
import { isAllowedExternalUrl } from '../../../shared/links'
import { createSeedWorkspace } from '../../../shared/seed'
import { validateWorkspace } from '../../../shared/validate'

export const PREVIEW_STORAGE_KEY = 'careconnect.browser-preview.workspace'

type PreviewStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface BrowserPreviewOptions {
  now?: () => Date
  /** Where the workspace is kept; null keeps it in memory only. Defaults to localStorage. */
  storage?: PreviewStorage | null
  window?: Window
}

function defaultStorage(win: Window): PreviewStorage | null {
  try {
    return win.localStorage
  } catch {
    // Storage can be disabled (privacy settings); the preview then forgets edits on reload.
    return null
  }
}

export function createBrowserPreviewApi(options: BrowserPreviewOptions = {}): CareConnectApi {
  const win = options.window ?? window
  const now = options.now ?? (() => new Date())
  const storage = options.storage === undefined ? defaultStorage(win) : options.storage
  const forcedColors = (): MediaQueryList | null => win.matchMedia?.('(forced-colors: active)') ?? null

  return {
    async loadWorkspace(): Promise<LoadResult> {
      const saved = storage?.getItem(PREVIEW_STORAGE_KEY)
      if (saved) {
        try {
          return { workspace: validateWorkspace(JSON.parse(saved)), source: 'file' }
        } catch {
          // A damaged copy is replaced by fresh demo data, as the desktop store does.
          const workspace = createSeedWorkspace(now())
          storage?.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(workspace))
          return { workspace, source: 'recovered' }
        }
      }
      const workspace = createSeedWorkspace(now())
      storage?.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(workspace))
      return { workspace, source: 'seed' }
    },

    async saveWorkspace(workspace) {
      storage?.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(validateWorkspace(workspace)))
      return { savedAt: now().toISOString() }
    },

    async exportPatient({ patient, format }) {
      const blob = new Blob([formatPatientExport(patient, format, now())], {
        type: format === 'json' ? 'application/json' : 'text/plain'
      })
      const url = URL.createObjectURL(blob)
      const link = win.document.createElement('a')
      link.href = url
      link.download = exportFileName(patient, format)
      link.click()
      URL.revokeObjectURL(url)
      return { filePath: link.download }
    },

    importPatients: async () => null,
    pickAttachment: async () => null,
    showNotification: async () => false,
    // Native context menus exist only in the desktop app.
    showContextMenu: async () => null,

    async getAppInfo(): Promise<AppInfo> {
      return {
        platform: /mac/i.test(win.navigator.platform) ? 'darwin' : 'browser',
        version: 'browser preview',
        isPackaged: false,
        highContrast: forcedColors()?.matches ?? false
      }
    },

    async openExternal(url) {
      if (!isAllowedExternalUrl(url)) return false
      win.open(url, '_blank', 'noopener,noreferrer')
      return true
    },

    async copyText(text) {
      await win.navigator.clipboard.writeText(text)
    },

    async printPage() {
      win.print()
    },

    updateUiState: () => {},
    onCommand: () => () => {},

    onThemeChanged(listener) {
      const query = forcedColors()
      if (!query) return () => {}
      const onChange = (): void => listener({ highContrast: query.matches, dark: false })
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    }
  }
}
