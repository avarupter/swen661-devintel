/**
 * Main-process entry point. Wiring only: every behaviour lives in a module
 * beside this one and is unit-tested there (design section 2).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
  Notification,
  screen,
  session,
  shell,
  Tray,
  type MessageBoxOptions
} from 'electron'
// `asarUnpack` resolves to app.asar.unpacked in the packaged app, where the OS can read the files.
import iconPath from '../../resources/icon.png?asset&asarUnpack'
import badgePath from '../../resources/badge.png?asset&asarUnpack'
import type { UiState } from '../shared/api'
import { IPC } from '../shared/ipc'
import { isAllowedExternalUrl } from '../shared/links'
import { guardUnsavedChanges, type UnsavedChangesGuard } from './closeGuard'
import { createCommandChannel } from './commandChannel'
import { showNativeContextMenu } from './contextMenu'
import { createFileOps } from './fileOps'
import { registerIpcHandlers } from './ipcHandlers'
import { applyMenuState, buildMenuTemplate } from './menu'
import { showNotification } from './notifications'
import { applyWindowsIntegration, parseCommandArgument, themeInfo, updateUnreadBadge } from './platform'
import { APP_ENTRY_URL, handleAppProtocol, registerAppScheme } from './protocol'
import { allowedOrigins, configureSessionSecurity } from './security'
import { createWorkspaceStore } from './store'
import { type CareConnectTray, createTray } from './tray'
import { createMainWindow } from './window'
import { createWindowStateKeeper } from './windowState'

registerAppScheme()
app.enableSandbox()

const isDev = !app.isPackaged
// A packaged build never loads a URL from the environment.
const devServerUrl = isDev ? process.env.ELECTRON_RENDERER_URL : undefined
const origins = allowedOrigins(devServerUrl)
const now = (): Date => new Date()
const commands = createCommandChannel()

let mainWindow: BrowserWindow | null = null
let appMenu: Menu | null = null
let tray: CareConnectTray | null = null
let badgeImage: Electron.NativeImage | null = null
let unsavedChangesGuard: UnsavedChangesGuard | null = null
let quitRequested = false
let lastUiState: UiState | null = null

/** The UiState fields the native menu depends on. */
function menuStateChanged(previous: UiState | null, next: UiState): boolean {
  return (
    previous === null ||
    previous.view !== next.view ||
    previous.hasSelection !== next.hasSelection ||
    previous.modal !== next.modal ||
    previous.showShortcutHints !== next.showShortcutHints ||
    previous.highContrast !== next.highContrast ||
    previous.reduceMotion !== next.reduceMotion
  )
}

function openMainWindow(): void {
  const keeper = createWindowStateKeeper({ filePath: path.join(app.getPath('userData'), 'window-state.json'), screen })
  const win = createMainWindow({
    preloadPath: path.join(__dirname, '../preload/index.js'),
    entryUrl: devServerUrl ?? APP_ENTRY_URL,
    iconPath,
    state: keeper.state,
    isDev,
    origins,
    openExternal: (url) => shell.openExternal(url)
  })
  keeper.track(win)
  unsavedChangesGuard = guardUnsavedChanges(win)
  commands.attach(win.webContents)
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
  mainWindow = win
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    if (app.isReady()) openMainWindow()
    return
  }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function openExternal(url: string): void {
  if (!isAllowedExternalUrl(url)) return
  shell.openExternal(url).catch((error: unknown) => console.error(`CareConnect could not open ${url}:`, error))
}

function showAbout(): void {
  const options: MessageBoxOptions = {
    type: 'info',
    title: 'About CareConnect',
    message: `CareConnect ${app.getVersion()}`,
    detail: 'Clinical workspace for SWEN 661, Team DevIntel.\nAll patient data is synthetic.',
    buttons: ['OK']
  }
  void (mainWindow ? dialog.showMessageBox(mainWindow, options) : dialog.showMessageBox(options))
}

function onUiState(state: UiState): void {
  commands.markReady()
  unsavedChangesGuard?.update(state.unsavedChanges)
  // Typing in a dialog reports state on every keystroke; only touch the menu and taskbar on a real change.
  const previous = lastUiState
  lastUiState = state
  if (appMenu && menuStateChanged(previous, state)) applyMenuState(appMenu, state)
  if (previous === null || previous.unreadCount !== state.unreadCount) {
    tray?.update(state.unreadCount)
    if (badgeImage) updateUnreadBadge({ platform: process.platform, app, win: mainWindow, badgeImage, count: state.unreadCount })
  }
}

function start(): void {
  handleAppProtocol(path.join(__dirname, '../renderer'))
  configureSessionSecurity(session.defaultSession)
  applyWindowsIntegration(app, {
    platform: process.platform,
    execPath: process.execPath,
    appPath: app.getAppPath(),
    isPackaged: app.isPackaged
  })
  badgeImage = nativeImage.createFromPath(badgePath)

  appMenu = Menu.buildFromTemplate(
    buildMenuTemplate({
      platform: process.platform,
      isDev,
      appName: app.name,
      state: null,
      send: (command) => commands.send(command),
      showAbout,
      openExternal,
      print: () => mainWindow?.webContents.print({ printBackground: true })
    })
  )
  Menu.setApplicationMenu(appMenu)
  tray = createTray({ Tray, Menu, nativeImage, iconPath, show: showMainWindow, send: (command) => commands.send(command), quit: () => app.quit() })

  registerIpcHandlers({
    ipcMain,
    origins,
    getWindow: () => mainWindow,
    store: createWorkspaceStore({ dir: app.getPath('userData'), now }),
    fileOps: createFileOps({ dialog, fs, now }),
    showContextMenu: (win, request) => showNativeContextMenu(win, request, Menu),
    showNotification: (request) =>
      showNotification({
        Notification,
        iconPath,
        request,
        onClick: (patientId) => {
          showMainWindow()
          if (patientId) commands.send({ id: 'patient.open', patientId })
        }
      }),
    shell,
    clipboard,
    appInfo: () => ({ platform: process.platform, version: app.getVersion(), isPackaged: app.isPackaged, highContrast: themeInfo(nativeTheme).highContrast }),
    onUiState
  })

  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(IPC.themeChanged, themeInfo(nativeTheme))
  })

  openMainWindow()
  // A Jump List task launches with --command=<id>; it runs once the workspace has loaded.
  const launchCommand = parseCommandArgument(process.argv)
  if (launchCommand) commands.send(launchCommand)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    showMainWindow()
    const command = parseCommandArgument(argv)
    if (command) commands.send(command)
  })
  app.on('before-quit', () => {
    quitRequested = true
  })
  // A close held back for the autosave also holds back Quit; finish quitting once the window has closed.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' || quitRequested) app.quit()
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openMainWindow()
  })
  void app.whenReady().then(start)
}
