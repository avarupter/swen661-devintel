/**
 * Operating-system integration (design section 6, "Windows-specific"): the
 * AppUserModelID that toasts and taskbar grouping use, Jump List tasks that
 * relaunch with --command=<id>, the taskbar overlay badge, and the system
 * high-contrast state. Platform checks take the platform as an argument so
 * every branch is testable on any OS.
 */
import type { App, BrowserWindow, NativeImage, NativeTheme, Task } from 'electron'
import type { ThemeInfo } from '../shared/api'
import { type AppCommand, isCommandId } from '../shared/commands'
import { pluralize } from '../shared/format'

/** Matches `appId` in electron-builder.yml, so toasts are attributed to the installed app. */
export const APP_USER_MODEL_ID = 'edu.umgc.swen661.careconnect'

const COMMAND_PREFIX = '--command='

/** The command in the first `--command=<id>` argument, or null if there is none or it is unknown. */
export function parseCommandArgument(argv: readonly string[]): AppCommand | null {
  const argument = argv.find((arg) => arg.startsWith(COMMAND_PREFIX))
  if (argument === undefined) return null
  const id = argument.slice(COMMAND_PREFIX.length)
  return isCommandId(id) ? { id } : null
}

export interface JumpListOptions {
  execPath: string
  appPath: string
  isPackaged: boolean
}

export function jumpListTasks({ execPath, appPath, isPackaged }: JumpListOptions): Task[] {
  // Unpackaged, the executable is electron itself and needs the app folder first.
  const prefix = isPackaged ? '' : `"${appPath}" `
  const task = (title: string, description: string, commandId: string): Task => ({
    title,
    description,
    program: execPath,
    arguments: `${prefix}${COMMAND_PREFIX}${commandId}`,
    iconPath: execPath,
    iconIndex: 0
  })
  return [
    task('New patient', 'Create a synthetic patient record in CareConnect', 'patient.new'),
    task('Open inbox', 'Open the CareConnect inbox', 'navigate.inbox')
  ]
}

export interface WindowsIntegrationOptions extends JumpListOptions {
  platform: string
}

/** Sets the AppUserModelID and Jump List tasks. Returns whether anything applied (Windows only). */
export function applyWindowsIntegration(app: Pick<App, 'setAppUserModelId' | 'setUserTasks'>, options: WindowsIntegrationOptions): boolean {
  if (options.platform !== 'win32') return false
  app.setAppUserModelId(APP_USER_MODEL_ID)
  app.setUserTasks(jumpListTasks(options))
  return true
}

export interface UnreadBadgeOptions {
  platform: string
  app: Pick<App, 'setBadgeCount'>
  win: Pick<BrowserWindow, 'setOverlayIcon' | 'isDestroyed'> | null
  badgeImage: NativeImage
  count: number
}

/**
 * Windows: a taskbar overlay icon whose description screen readers announce
 * ("4 unread messages"). Elsewhere: the launcher badge count, where supported.
 */
export function updateUnreadBadge({ platform, app, win, badgeImage, count }: UnreadBadgeOptions): void {
  if (platform !== 'win32') {
    app.setBadgeCount(count)
    return
  }
  if (!win || win.isDestroyed()) return
  win.setOverlayIcon(count > 0 ? badgeImage : null, count > 0 ? pluralize(count, 'unread message') : '')
}

export type ThemeSource = Pick<NativeTheme, 'shouldUseHighContrastColors' | 'shouldUseDarkColors'> & { inForcedColorsMode?: boolean }

/** What the renderer needs to follow Windows High Contrast (forced colors) and dark mode. */
export function themeInfo(theme: ThemeSource): ThemeInfo {
  return { highContrast: Boolean(theme.shouldUseHighContrastColors || theme.inForcedColorsMode), dark: theme.shouldUseDarkColors }
}
