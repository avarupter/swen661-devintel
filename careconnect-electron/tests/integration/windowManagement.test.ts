/**
 * Window management integration: the real window-state keeper and the real
 * createMainWindow, over several simulated launches. The state file lives in
 * a temp folder; windows and displays come from tests/mocks/electron.ts.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { APP_ENTRY_URL } from '../../src/main/protocol'
import { allowedOrigins } from '../../src/main/security'
import { createMainWindow } from '../../src/main/window'
import { createWindowStateKeeper, type WindowState } from '../../src/main/windowState'
import { FakeBrowserWindow, mockElectron, screen, type FakeDisplay } from '../mocks/electron'

const PRIMARY: FakeDisplay = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  workArea: { x: 0, y: 0, width: 1920, height: 1040 },
  scaleFactor: 1
}
const SECONDARY: FakeDisplay = {
  id: 2,
  bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
  workArea: { x: 1920, y: 0, width: 2560, height: 1400 },
  scaleFactor: 1
}

let dir: string
let stateFile: string

beforeEach(() => {
  mockElectron.reset()
  jest.useFakeTimers()
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-window-'))
  stateFile = path.join(dir, 'window-state.json')
})

afterEach(() => {
  jest.useRealTimers()
  fs.rmSync(dir, { recursive: true, force: true })
})

/** One app launch: restore the saved state, create the window, track it, and let it show. */
function launch() {
  const keeper = createWindowStateKeeper({ filePath: stateFile, screen })
  const win = createMainWindow({
    preloadPath: '/opt/careconnect/out/preload/index.js',
    entryUrl: APP_ENTRY_URL,
    iconPath: '/opt/careconnect/resources/icon.png',
    state: keeper.state,
    isDev: false,
    origins: allowedOrigins(),
    openExternal: jest.fn(async () => undefined)
  }) as unknown as FakeBrowserWindow
  keeper.track(win)
  win.emit('ready-to-show')
  return { keeper, win }
}

function saved(): WindowState {
  return JSON.parse(fs.readFileSync(stateFile, 'utf8')) as WindowState
}

describe('window management across launches', () => {
  it('opens at the default 1440×900, centred, on first launch', () => {
    const { win } = launch()
    expect(win.options).toMatchObject({ width: 1440, height: 900, minWidth: 960, minHeight: 640 })
    expect(win.options).not.toHaveProperty('x')
    expect(win.options).not.toHaveProperty('y')
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.visible).toBe(true)
    expect(fs.existsSync(stateFile)).toBe(false)
  })

  it('creates the window with secure web preferences', () => {
    const { win } = launch()
    expect(win.options.webPreferences).toMatchObject({
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
      webSecurity: true,
      devTools: false
    })
    expect(win.loadURL).toHaveBeenCalledWith('app://careconnect/index.html')
  })

  it('saves a move and resize after the debounce, saves again on close, and restores the bounds next launch', () => {
    const first = launch()
    first.win.setBounds({ x: 200, y: 120, width: 1300, height: 820 })
    first.win.emit('move')
    first.win.emit('resize')
    expect(fs.existsSync(stateFile)).toBe(false)
    jest.advanceTimersByTime(400)
    expect(saved()).toEqual({ x: 200, y: 120, width: 1300, height: 820, isMaximized: false, isFullScreen: false })

    first.win.setBounds({ x: 260, y: 140, width: 1280, height: 800 })
    first.win.emit('move')
    first.win.close()
    expect(saved()).toMatchObject({ x: 260, y: 140, width: 1280, height: 800 })

    const second = launch()
    expect(second.win.options).toMatchObject({ x: 260, y: 140, width: 1280, height: 800 })
    expect(second.win.maximize).not.toHaveBeenCalled()
  })

  it('remembers a maximized window and maximizes the next one on ready-to-show, keeping its normal size', () => {
    const first = launch()
    first.win.setBounds({ x: 100, y: 80, width: 1200, height: 760 })
    first.win.emit('resize')
    jest.advanceTimersByTime(400)
    first.win.maximize()
    first.win.setBounds({ x: 0, y: 0, width: 1920, height: 1040 })
    first.win.emit('resize')
    jest.advanceTimersByTime(400)
    first.win.close()
    expect(saved()).toEqual({ x: 100, y: 80, width: 1200, height: 760, isMaximized: true, isFullScreen: false })

    const second = launch()
    expect(second.win.options).toMatchObject({ x: 100, y: 80, width: 1200, height: 760 })
    expect(second.win.maximize).toHaveBeenCalledTimes(1)
    expect(second.win.maximized).toBe(true)

    // Un-maximizing and closing is remembered too.
    second.win.unmaximize()
    second.win.close()
    const third = launch()
    expect(third.win.maximize).not.toHaveBeenCalled()
  })

  it('remembers full screen', () => {
    const first = launch()
    first.win.setFullScreen(true)
    first.win.close()
    const second = launch()
    expect(second.win.setFullScreen).toHaveBeenCalledWith(true)
    expect(second.win.fullScreen).toBe(true)
  })

  it('keeps a window on a second display while that display is connected', () => {
    mockElectron.displays = [PRIMARY, SECONDARY]
    const first = launch()
    first.win.setBounds({ x: 2300, y: 200, width: 1600, height: 1000 })
    first.win.close()

    const second = launch()
    expect(second.win.options).toMatchObject({ x: 2300, y: 200, width: 1600, height: 1000 })
  })

  it('re-centres the window on the primary display when its display has been unplugged', () => {
    mockElectron.displays = [PRIMARY, SECONDARY]
    const first = launch()
    first.win.setBounds({ x: 2300, y: 200, width: 2400, height: 1300 })
    first.win.close()

    mockElectron.displays = [PRIMARY]
    const second = launch()
    expect(second.win.options).not.toHaveProperty('x')
    expect(second.win.options).not.toHaveProperty('y')
    expect(second.win.options).toMatchObject({ width: 1920, height: 1040 })
  })

  it('falls back to the defaults when the state file is corrupt', () => {
    fs.writeFileSync(stateFile, '{"x": 10, "y":')
    const { win } = launch()
    expect(win.options).toMatchObject({ width: 1440, height: 900 })
    expect(win.options).not.toHaveProperty('x')
  })

  it('does not save a minimized window’s placement', () => {
    const first = launch()
    first.win.setBounds({ x: 300, y: 200, width: 1100, height: 700 })
    first.win.emit('resize')
    jest.advanceTimersByTime(400)
    first.win.minimize()
    first.win.setBounds({ x: -32000, y: -32000, width: 160, height: 28 })
    first.win.emit('move')
    jest.advanceTimersByTime(400)
    first.win.close()

    const second = launch()
    expect(second.win.options).toMatchObject({ x: 300, y: 200, width: 1100, height: 700 })
  })
})
