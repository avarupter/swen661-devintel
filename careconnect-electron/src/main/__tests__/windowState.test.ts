import { FakeBrowserWindow, mockElectron, screen, type FakeDisplay } from '../../../tests/mocks/electron'
import {
  createWindowStateKeeper,
  DEFAULT_WINDOW_STATE,
  ensureVisible,
  loadWindowState,
  MIN_WINDOW_SIZE,
  type WindowState
} from '../windowState'

const FILE = '/userData/window-state.json'

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

/** An in-memory file system for the keeper's injected readFile/writeFile. */
function memoryFiles(initial: Record<string, string> = {}) {
  const files = new Map(Object.entries(initial))
  const readFile = jest.fn((filePath: string) => {
    const content = files.get(filePath)
    if (content === undefined) throw Object.assign(new Error(`ENOENT: no such file, open '${filePath}'`), { code: 'ENOENT' })
    return content
  })
  const writeFile = jest.fn((filePath: string, data: string) => {
    files.set(filePath, data)
  })
  const saved = (): WindowState => JSON.parse(files.get(FILE) ?? 'null') as WindowState
  return { files, readFile, writeFile, saved }
}

beforeEach(() => {
  mockElectron.reset()
})

describe('loadWindowState', () => {
  it('returns the defaults when the file is missing', () => {
    const { readFile } = memoryFiles()
    expect(loadWindowState(FILE, readFile)).toEqual(DEFAULT_WINDOW_STATE)
    expect(DEFAULT_WINDOW_STATE).toEqual({ width: 1440, height: 900, isMaximized: false, isFullScreen: false })
  })

  it('returns the defaults when the file is not JSON', () => {
    const { readFile } = memoryFiles({ [FILE]: '{"width": 1200, "hei' })
    expect(loadWindowState(FILE, readFile)).toEqual(DEFAULT_WINDOW_STATE)
  })

  it.each([
    ['an array', '[1, 2]'],
    ['a string', '"maximized"'],
    ['null', 'null'],
    ['a missing width', '{"height": 700}'],
    ['a text width', '{"width": "wide", "height": 700}'],
    ['a zero height', '{"width": 1200, "height": 0}'],
    ['a negative width', '{"width": -5, "height": 700}']
  ])('returns the defaults for %s', (_label, content) => {
    const { readFile } = memoryFiles({ [FILE]: content })
    expect(loadWindowState(FILE, readFile)).toEqual(DEFAULT_WINDOW_STATE)
  })

  it('restores a valid saved state', () => {
    const state = { x: 120, y: 80, width: 1280, height: 800, isMaximized: true, isFullScreen: false }
    const { readFile } = memoryFiles({ [FILE]: JSON.stringify(state) })
    expect(loadWindowState(FILE, readFile)).toEqual(state)
    expect(readFile).toHaveBeenCalledWith(FILE, 'utf8')
  })

  it('drops a position that is not a pair of numbers, and treats non-boolean flags as false', () => {
    const { readFile } = memoryFiles({ [FILE]: '{"x": "10", "y": 20, "width": 1200, "height": 700, "isMaximized": "yes"}' })
    expect(loadWindowState(FILE, readFile)).toEqual({ width: 1200, height: 700, isMaximized: false, isFullScreen: false })
  })

  it('reads the real file system by default', () => {
    expect(loadWindowState('/definitely/not/here/window-state.json')).toEqual(DEFAULT_WINDOW_STATE)
  })
})

describe('ensureVisible', () => {
  const displays = [PRIMARY, SECONDARY]
  const base = { isMaximized: false, isFullScreen: false }

  it('keeps a position that is fully on a display', () => {
    const state = { ...base, x: 100, y: 50, width: 1280, height: 800 }
    expect(ensureVisible(state, displays)).toEqual(state)
  })

  it('keeps a position on a secondary display that is still connected', () => {
    const state = { ...base, x: 2200, y: 100, width: 1600, height: 1000 }
    expect(ensureVisible(state, displays)).toEqual(state)
  })

  it('drops the position of a window on a display that has been removed, and fits it to the primary display', () => {
    const state = { ...base, x: 2200, y: 100, width: 2400, height: 1300 }
    expect(ensureVisible(state, [PRIMARY])).toEqual({ ...base, width: 1920, height: 1040 })
  })

  it('keeps a window that shows at least a quarter of its area', () => {
    // 1000×800 at x=1670: 250 px of 1000 px wide are on the primary display = exactly 25 %.
    const quarter = { ...base, x: 1670, y: 100, width: 1000, height: 800 }
    expect(ensureVisible(quarter, [PRIMARY])).toEqual(quarter)
    const less = { ...quarter, x: 1671 }
    expect(ensureVisible(less, [PRIMARY])).toEqual({ ...base, width: 1000, height: 800 })
  })

  it('clamps a size larger than the work area and re-centres it when most of it is off screen', () => {
    const huge = { ...base, x: 0, y: 0, width: 4000, height: 3000 }
    expect(ensureVisible(huge, [PRIMARY])).toEqual({ ...base, width: 1920, height: 1040 })
  })

  it('clamps an oversized window to the display it mostly sits on, keeping its position', () => {
    // 2400×1300 at the origin covers 64 % of its own area on the primary display.
    const big = { ...base, x: 0, y: 0, width: 2400, height: 1300 }
    expect(ensureVisible(big, [PRIMARY])).toEqual({ ...base, x: 0, y: 0, width: 1920, height: 1040 })
  })

  it('clamps the default size on a small screen', () => {
    const laptop = { workArea: { x: 0, y: 0, width: 1366, height: 728 } }
    expect(ensureVisible(DEFAULT_WINDOW_STATE, [laptop])).toEqual({ ...base, width: 1366, height: 728 })
  })

  it.each([
    ['NaN', Number.NaN],
    ['zero', 0],
    ['negative', -400],
    ['infinite', Number.POSITIVE_INFINITY]
  ])('falls back to the default size for a %s width or height', (_label, bad) => {
    expect(ensureVisible({ ...base, width: bad, height: 700 }, displays)).toEqual({ ...base, width: 1440, height: 700 })
    expect(ensureVisible({ ...base, width: 1200, height: bad }, displays)).toEqual({ ...base, width: 1200, height: 900 })
  })

  it('raises a size below the minimum window size', () => {
    expect(ensureVisible({ ...base, x: 10, y: 10, width: 300, height: 200 }, displays)).toEqual({
      ...base,
      x: 10,
      y: 10,
      width: MIN_WINDOW_SIZE.width,
      height: MIN_WINDOW_SIZE.height
    })
  })

  it('rounds fractional bounds and keeps the maximized and full-screen flags', () => {
    const state = { x: 10.6, y: 20.2, width: 1200.4, height: 700.5, isMaximized: true, isFullScreen: true }
    expect(ensureVisible(state, displays)).toEqual({ x: 11, y: 20, width: 1200, height: 701, isMaximized: true, isFullScreen: true })
  })

  it('drops the position when no display is known', () => {
    expect(ensureVisible({ ...base, x: 10, y: 10, width: 1200, height: 700 }, [])).toEqual({ ...base, width: 1200, height: 700 })
  })
})

describe('createWindowStateKeeper', () => {
  function setup(initial?: WindowState) {
    const fs = memoryFiles(initial ? { [FILE]: JSON.stringify(initial) } : {})
    const keeper = createWindowStateKeeper({ filePath: FILE, screen, readFile: fs.readFile, writeFile: fs.writeFile })
    const win = new FakeBrowserWindow({ ...keeper.state, show: false })
    keeper.track(win)
    return { ...fs, keeper, win }
  }

  beforeEach(() => {
    jest.useFakeTimers()
    mockElectron.displays = [PRIMARY, SECONDARY]
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('starts from the saved state, made visible on the current displays', () => {
    mockElectron.displays = [PRIMARY]
    const fs = memoryFiles({ [FILE]: JSON.stringify({ x: 2500, y: 200, width: 1600, height: 900, isMaximized: false, isFullScreen: false }) })
    const keeper = createWindowStateKeeper({ filePath: FILE, screen, readFile: fs.readFile, writeFile: fs.writeFile })
    expect(keeper.state).toEqual({ width: 1600, height: 900, isMaximized: false, isFullScreen: false })
  })

  it('treats the primary display as the fallback even when it is not listed first', () => {
    mockElectron.displays = [SECONDARY, PRIMARY]
    screen.getPrimaryDisplay.mockReturnValueOnce(PRIMARY)
    const fs = memoryFiles({ [FILE]: JSON.stringify({ x: -5000, y: 0, width: 4000, height: 2000, isMaximized: false, isFullScreen: false }) })
    const keeper = createWindowStateKeeper({ filePath: FILE, screen, readFile: fs.readFile, writeFile: fs.writeFile })
    expect(keeper.state).toEqual({ width: 1920, height: 1040, isMaximized: false, isFullScreen: false })
  })

  it('saves the bounds once, 400 ms after the last move or resize', () => {
    const { win, writeFile, saved } = setup()
    win.setBounds({ x: 200, y: 120, width: 1300, height: 820 })
    win.emit('move')
    jest.advanceTimersByTime(300)
    win.emit('resize')
    jest.advanceTimersByTime(399)
    expect(writeFile).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(saved()).toEqual({ x: 200, y: 120, width: 1300, height: 820, isMaximized: false, isFullScreen: false })
  })

  it('honours a custom debounce interval', () => {
    const fs = memoryFiles()
    const keeper = createWindowStateKeeper({ filePath: FILE, screen, debounceMs: 50, readFile: fs.readFile, writeFile: fs.writeFile })
    const win = new FakeBrowserWindow({ show: false })
    keeper.track(win)
    win.emit('resize')
    jest.advanceTimersByTime(50)
    expect(fs.writeFile).toHaveBeenCalledTimes(1)
  })

  it('does not record bounds while the window is maximized', () => {
    const { win, saved } = setup({ x: 100, y: 100, width: 1200, height: 700, isMaximized: false, isFullScreen: false })
    win.maximize()
    expect(saved()).toEqual({ x: 100, y: 100, width: 1200, height: 700, isMaximized: true, isFullScreen: false })
    // The maximized window fills the screen; that size must not become the normal size.
    win.setBounds({ x: 0, y: 0, width: 1920, height: 1040 })
    win.emit('resize')
    jest.advanceTimersByTime(1000)
    expect(saved()).toMatchObject({ x: 100, y: 100, width: 1200, height: 700 })
  })

  it('does not record bounds that change during the debounce because the window was maximized', () => {
    const { win, saved } = setup({ x: 100, y: 100, width: 1200, height: 700, isMaximized: false, isFullScreen: false })
    win.emit('resize')
    win.setBounds({ x: 0, y: 0, width: 1920, height: 1040 })
    win.maximize()
    jest.advanceTimersByTime(400)
    expect(saved()).toEqual({ x: 100, y: 100, width: 1200, height: 700, isMaximized: true, isFullScreen: false })
  })

  it('does not record bounds while the window is minimized or full screen', () => {
    const { win, writeFile, saved } = setup({ x: 100, y: 100, width: 1200, height: 700, isMaximized: false, isFullScreen: false })
    win.minimize()
    win.setBounds({ x: -32000, y: -32000, width: 160, height: 28 })
    win.emit('move')
    jest.advanceTimersByTime(1000)
    expect(writeFile).not.toHaveBeenCalled()

    win.restore()
    win.setBounds({ x: 100, y: 100, width: 1200, height: 700 })
    win.setFullScreen(true)
    expect(saved()).toEqual({ x: 100, y: 100, width: 1200, height: 700, isMaximized: false, isFullScreen: true })
    win.setBounds({ x: 0, y: 0, width: 1920, height: 1080 })
    win.emit('resize')
    jest.advanceTimersByTime(1000)
    expect(saved()).toMatchObject({ width: 1200, height: 700, isFullScreen: true })
  })

  it('persists the maximized and full-screen flags as they change', () => {
    const { win, saved } = setup()
    win.maximize()
    expect(saved().isMaximized).toBe(true)
    win.unmaximize()
    expect(saved().isMaximized).toBe(false)
    win.setFullScreen(true)
    expect(saved().isFullScreen).toBe(true)
    win.setFullScreen(false)
    expect(saved().isFullScreen).toBe(false)
  })

  it('saves synchronously on close, replacing any pending debounced save', () => {
    const { win, writeFile, saved } = setup()
    win.setBounds({ x: 300, y: 200, width: 1100, height: 700 })
    win.emit('resize')
    win.close()
    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(saved()).toEqual({ x: 300, y: 200, width: 1100, height: 700, isMaximized: false, isFullScreen: false })
    jest.advanceTimersByTime(1000)
    expect(writeFile).toHaveBeenCalledTimes(1)
  })

  it('keeps the last normal bounds and the maximized flag when closed while maximized', () => {
    const { win, saved } = setup({ x: 150, y: 90, width: 1250, height: 760, isMaximized: false, isFullScreen: false })
    win.maximize()
    win.setBounds({ x: 0, y: 0, width: 1920, height: 1040 })
    win.close()
    expect(saved()).toEqual({ x: 150, y: 90, width: 1250, height: 760, isMaximized: true, isFullScreen: false })
  })

  it('keeps the maximized flag when closed while minimized from a maximized state', () => {
    const { win, saved } = setup()
    win.maximize()
    win.maximized = false // Windows reports a minimized window as not maximized.
    win.minimize()
    win.close()
    expect(saved().isMaximized).toBe(true)
  })

  it('stops saving after the window is destroyed', () => {
    const { win, writeFile } = setup()
    win.close()
    writeFile.mockClear()
    win.emit('resize')
    jest.advanceTimersByTime(1000)
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('saves on demand with saveNow', () => {
    const { win, keeper, saved } = setup()
    win.setBounds({ x: 40, y: 30, width: 1000, height: 650 })
    keeper.saveNow()
    expect(saved()).toEqual({ x: 40, y: 30, width: 1000, height: 650, isMaximized: false, isFullScreen: false })
    expect(keeper.state).toEqual(saved())
  })

  it('writes the saved state before any window is tracked', () => {
    const fs = memoryFiles()
    const keeper = createWindowStateKeeper({ filePath: FILE, screen, readFile: fs.readFile, writeFile: fs.writeFile })
    keeper.saveNow()
    expect(fs.saved()).toEqual(DEFAULT_WINDOW_STATE)
  })

  it('ignores a failed write: the window state is a convenience, never fatal', () => {
    const { win, writeFile } = setup()
    writeFile.mockImplementation(() => {
      throw new Error('EROFS: read-only file system')
    })
    expect(() => win.close()).not.toThrow()
    expect(writeFile).toHaveBeenCalled()
  })
})
