/**
 * The main window and the guards on its web contents (Electron security
 * checklist items 2-4, 10, 11 and 12): no Node in the renderer, context
 * isolation, the sandbox, no <webview>, no navigation off the app origin, and
 * no new windows; allow-listed https links open in the user's browser instead.
 */
import { BrowserWindow, type BrowserWindowConstructorOptions, type WebContents, type WebPreferences } from 'electron'
import { isAllowedExternalUrl } from '../shared/links'
import { isTrustedUrl } from './security'
import { MIN_WINDOW_SIZE, type WindowState } from './windowState'

export const WINDOW_TITLE = 'CareConnect — Clinical workspace'

/** The page background (--color-page), so no white flash shows before the first paint. */
export const WINDOW_BACKGROUND = '#f4f6f9'

export type OpenExternal = (url: string) => Promise<unknown>

export interface MainWindowOptions {
  preloadPath: string
  entryUrl: string
  iconPath: string
  state: WindowState
  isDev: boolean
  origins: readonly string[]
  openExternal: OpenExternal
  /** Injected in tests; defaults to Electron's BrowserWindow. */
  BrowserWindow?: typeof BrowserWindow
}

export function secureWebPreferences(preloadPath: string, isDev: boolean): WebPreferences {
  return {
    preload: preloadPath,
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    webviewTag: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    navigateOnDragDrop: false,
    spellcheck: true,
    devTools: isDev
  }
}

function openInBrowser(openExternal: OpenExternal, url: string): void {
  openExternal(url).catch((error: unknown) => {
    console.error(`CareConnect could not open ${url} in the browser:`, error)
  })
}

export type HardenableContents = Pick<WebContents, 'on' | 'setWindowOpenHandler'>

export function hardenWebContents(contents: HardenableContents, origins: readonly string[], openExternal: OpenExternal): void {
  const guardNavigation = (event: { url: string; preventDefault(): void }): void => {
    if (isTrustedUrl(event.url, origins)) return
    event.preventDefault()
    if (isAllowedExternalUrl(event.url)) openInBrowser(openExternal, event.url)
  }
  contents.on('will-navigate', guardNavigation)
  contents.on('will-redirect', guardNavigation)
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) openInBrowser(openExternal, url)
    return { action: 'deny' }
  })
  contents.on('will-attach-webview', (event) => event.preventDefault())
}

export function createMainWindow(options: MainWindowOptions): BrowserWindow {
  const { state } = options
  const Window = options.BrowserWindow ?? BrowserWindow
  const position = state.x !== undefined && state.y !== undefined ? { x: state.x, y: state.y } : {}
  const windowOptions: BrowserWindowConstructorOptions = {
    ...position,
    width: state.width,
    height: state.height,
    minWidth: MIN_WINDOW_SIZE.width,
    minHeight: MIN_WINDOW_SIZE.height,
    show: false,
    title: WINDOW_TITLE,
    backgroundColor: WINDOW_BACKGROUND,
    icon: options.iconPath,
    webPreferences: secureWebPreferences(options.preloadPath, options.isDev)
  }
  const win = new Window(windowOptions)

  win.once('ready-to-show', () => {
    if (state.isMaximized) win.maximize()
    if (state.isFullScreen) win.setFullScreen(true)
    win.show()
  })
  hardenWebContents(win.webContents, options.origins, options.openExternal)
  win.loadURL(options.entryUrl).catch((error: unknown) => {
    console.error(`CareConnect could not load ${options.entryUrl}:`, error)
  })
  return win
}
