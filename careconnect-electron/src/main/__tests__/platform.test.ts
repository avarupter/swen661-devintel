import type { App, BrowserWindow, NativeImage } from 'electron'
import { FakeBrowserWindow, FakeNativeImage, mockElectron } from '../../../tests/mocks/electron'
import {
  APP_USER_MODEL_ID,
  applyWindowsIntegration,
  jumpListTasks,
  parseCommandArgument,
  themeInfo,
  updateUnreadBadge
} from '../platform'

const EXEC = 'C:\\Program Files\\CareConnect\\CareConnect.exe'
const APP_PATH = 'C:\\src\\careconnect-electron'

beforeEach(() => {
  mockElectron.reset()
})

describe('parseCommandArgument', () => {
  it('reads a valid --command= argument among others', () => {
    expect(parseCommandArgument([EXEC, '--allow-file-access-from-files', '--command=patient.new'])).toEqual({ id: 'patient.new' })
    expect(parseCommandArgument([EXEC, APP_PATH, '--command=navigate.inbox'])).toEqual({ id: 'navigate.inbox' })
  })

  it.each([
    ['an unknown command', '--command=rm -rf /'],
    ['an empty command', '--command='],
    ['the wrong case', '--command=patient.NEW'],
    ['a command without the =', '--command']
  ])('ignores %s', (_label, argument) => {
    expect(parseCommandArgument([EXEC, argument])).toBeNull()
  })

  it('returns null when there is no --command argument', () => {
    expect(parseCommandArgument([EXEC])).toBeNull()
    expect(parseCommandArgument([])).toBeNull()
  })

  it('uses the first --command argument', () => {
    expect(parseCommandArgument([EXEC, '--command=navigate.inbox', '--command=patient.new'])).toEqual({ id: 'navigate.inbox' })
  })
})

describe('jumpListTasks', () => {
  it('relaunches the installed executable with a --command for each task', () => {
    const tasks = jumpListTasks({ execPath: EXEC, appPath: APP_PATH, isPackaged: true })
    expect(tasks).toEqual([
      expect.objectContaining({ title: 'New patient', program: EXEC, arguments: '--command=patient.new', iconPath: EXEC, iconIndex: 0 }),
      expect.objectContaining({ title: 'Open inbox', program: EXEC, arguments: '--command=navigate.inbox', iconPath: EXEC, iconIndex: 0 })
    ])
    for (const task of tasks) expect(task.description.length).toBeGreaterThan(0)
  })

  it('passes the quoted app path first when running unpackaged', () => {
    const electron = 'C:\\src\\careconnect-electron\\node_modules\\electron\\dist\\electron.exe'
    const tasks = jumpListTasks({ execPath: electron, appPath: APP_PATH, isPackaged: false })
    expect(tasks.map((task) => task.arguments)).toEqual([
      `"${APP_PATH}" --command=patient.new`,
      `"${APP_PATH}" --command=navigate.inbox`
    ])
    expect(tasks.every((task) => task.program === electron)).toBe(true)
  })
})

describe('applyWindowsIntegration', () => {
  const options = { execPath: EXEC, appPath: APP_PATH, isPackaged: true }

  it('sets the AppUserModelID and the Jump List on Windows', () => {
    const app = mockElectron.app
    expect(applyWindowsIntegration(app as unknown as App, { platform: 'win32', ...options })).toBe(true)
    expect(app.setAppUserModelId).toHaveBeenCalledWith('edu.umgc.swen661.careconnect')
    expect(APP_USER_MODEL_ID).toBe('edu.umgc.swen661.careconnect')
    expect(app.setUserTasks).toHaveBeenCalledWith(jumpListTasks(options))
  })

  it.each(['linux', 'darwin'])('does nothing on %s', (platform) => {
    const app = mockElectron.app
    expect(applyWindowsIntegration(app as unknown as App, { platform, ...options })).toBe(false)
    expect(app.setAppUserModelId).not.toHaveBeenCalled()
    expect(app.setUserTasks).not.toHaveBeenCalled()
  })
})

describe('updateUnreadBadge', () => {
  const badge = new FakeNativeImage('/opt/careconnect/resources/badge.png')

  function update(platform: string, count: number, win: FakeBrowserWindow | null = new FakeBrowserWindow()) {
    updateUnreadBadge({
      platform,
      app: mockElectron.app as unknown as App,
      win: win as unknown as BrowserWindow | null,
      badgeImage: badge as unknown as NativeImage,
      count
    })
    return win
  }

  it('shows a taskbar overlay with a spoken description on Windows', () => {
    const win = update('win32', 4)
    expect(win?.setOverlayIcon).toHaveBeenCalledWith(badge, '4 unread messages')
    expect(update('win32', 1)?.setOverlayIcon).toHaveBeenCalledWith(badge, '1 unread message')
    expect(mockElectron.app.setBadgeCount).not.toHaveBeenCalled()
  })

  it('clears the overlay on Windows when nothing is unread', () => {
    expect(update('win32', 0)?.setOverlayIcon).toHaveBeenCalledWith(null, '')
  })

  it('skips the overlay when the window is gone', () => {
    expect(() => update('win32', 3, null)).not.toThrow()
    const closed = new FakeBrowserWindow()
    closed.destroy()
    update('win32', 3, closed)
    expect(closed.setOverlayIcon).not.toHaveBeenCalled()
  })

  it.each(['linux', 'darwin'])('sets the app badge count on %s', (platform) => {
    const win = update(platform, 4)
    expect(mockElectron.app.setBadgeCount).toHaveBeenCalledWith(4)
    expect(win?.setOverlayIcon).not.toHaveBeenCalled()
  })
})

describe('themeInfo', () => {
  it('reports high contrast from either the high-contrast or forced-colors flag', () => {
    expect(themeInfo({ shouldUseHighContrastColors: false, shouldUseDarkColors: false })).toEqual({ highContrast: false, dark: false })
    expect(themeInfo({ shouldUseHighContrastColors: true, shouldUseDarkColors: true })).toEqual({ highContrast: true, dark: true })
    expect(themeInfo({ shouldUseHighContrastColors: false, inForcedColorsMode: true, shouldUseDarkColors: false })).toEqual({
      highContrast: true,
      dark: false
    })
  })
})
