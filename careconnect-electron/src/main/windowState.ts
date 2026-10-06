/**
 * Remembers the main window's size, position, maximized and full-screen state
 * between launches (design section 6, "Window state"), and makes sure a saved
 * position is still on a connected display before it is reused.
 */
import fs from 'node:fs'
import type { Rectangle } from 'electron'

export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
  isFullScreen: boolean
}

export const DEFAULT_WINDOW_STATE: Readonly<WindowState> = Object.freeze({
  width: 1440,
  height: 900,
  isMaximized: false,
  isFullScreen: false
})

export const MIN_WINDOW_SIZE = Object.freeze({ width: 960, height: 640 })

/** A saved position is kept only if at least this share of the window is on a display. */
export const MIN_VISIBLE_FRACTION = 0.25

export type ReadFile = (filePath: string, encoding: 'utf8') => string
export type WriteFile = (filePath: string, data: string) => void

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPositiveSize(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0
}

/** The saved state, or the defaults when the file is missing, corrupt or invalid. */
export function loadWindowState(filePath: string, readFile: ReadFile = fs.readFileSync): WindowState {
  let data: unknown
  try {
    data = JSON.parse(readFile(filePath, 'utf8'))
  } catch {
    return { ...DEFAULT_WINDOW_STATE }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ...DEFAULT_WINDOW_STATE }
  const saved = data as Record<string, unknown>
  if (!isPositiveSize(saved.width) || !isPositiveSize(saved.height)) return { ...DEFAULT_WINDOW_STATE }

  const state: WindowState = {
    width: saved.width,
    height: saved.height,
    isMaximized: saved.isMaximized === true,
    isFullScreen: saved.isFullScreen === true
  }
  if (isFiniteNumber(saved.x) && isFiniteNumber(saved.y)) {
    state.x = saved.x
    state.y = saved.y
  }
  return state
}

function overlapArea(a: Rectangle, b: Rectangle): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0 ? width * height : 0
}

/** At least the minimum window size, at most what the work area can show. */
function fit(size: number, minimum: number, available: number): number {
  return Math.min(Math.max(size, minimum), available)
}

/**
 * Makes a saved state safe to open on the current displays. The position is
 * kept only when at least a quarter of the window overlaps a display's work
 * area; otherwise it is dropped (Electron then centres the window) and the
 * size is fitted to the primary display, which is `displays[0]`.
 */
export function ensureVisible(state: WindowState, displays: readonly { workArea: Rectangle }[]): WindowState {
  const width = Math.round(isPositiveSize(state.width) ? state.width : DEFAULT_WINDOW_STATE.width)
  const height = Math.round(isPositiveSize(state.height) ? state.height : DEFAULT_WINDOW_STATE.height)
  const flags = { isMaximized: state.isMaximized === true, isFullScreen: state.isFullScreen === true }
  if (displays.length === 0) return { width, height, ...flags }

  if (isFiniteNumber(state.x) && isFiniteNumber(state.y)) {
    const rect = { x: Math.round(state.x), y: Math.round(state.y), width, height }
    let best: Rectangle | null = null
    let bestArea = 0
    for (const { workArea } of displays) {
      const area = overlapArea(rect, workArea)
      if (area > bestArea) {
        best = workArea
        bestArea = area
      }
    }
    if (best && bestArea >= MIN_VISIBLE_FRACTION * width * height) {
      return {
        x: rect.x,
        y: rect.y,
        width: fit(width, MIN_WINDOW_SIZE.width, best.width),
        height: fit(height, MIN_WINDOW_SIZE.height, best.height),
        ...flags
      }
    }
  }

  const primary = displays[0].workArea
  return {
    width: fit(width, MIN_WINDOW_SIZE.width, primary.width),
    height: fit(height, MIN_WINDOW_SIZE.height, primary.height),
    ...flags
  }
}

export interface DisplayLike {
  id: number
  workArea: Rectangle
}

export interface ScreenLike {
  getAllDisplays(): DisplayLike[]
  getPrimaryDisplay(): DisplayLike
}

/** The window events and queries the keeper relies on (a BrowserWindow satisfies it). */
export interface TrackedWindow {
  on(
    event: 'resize' | 'move' | 'maximize' | 'unmaximize' | 'enter-full-screen' | 'leave-full-screen' | 'close' | 'closed',
    listener: () => void
  ): unknown
  getBounds(): Rectangle
  isMaximized(): boolean
  isMinimized(): boolean
  isFullScreen(): boolean
  isDestroyed(): boolean
}

export interface WindowStateKeeperOptions {
  filePath: string
  screen: ScreenLike
  debounceMs?: number
  writeFile?: WriteFile
  readFile?: ReadFile
}

export interface WindowStateKeeper {
  /** The state to open the window with; it follows the tracked window afterwards. */
  readonly state: WindowState
  track(win: TrackedWindow): void
  saveNow(): void
}

function displaysPrimaryFirst(screen: ScreenLike): DisplayLike[] {
  const all = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  return primary ? [primary, ...all.filter((display) => display.id !== primary.id)] : all
}

export function createWindowStateKeeper({
  filePath,
  screen,
  debounceMs = 400,
  writeFile = fs.writeFileSync,
  readFile = fs.readFileSync
}: WindowStateKeeperOptions): WindowStateKeeper {
  const current = ensureVisible(loadWindowState(filePath, readFile), displaysPrimaryFirst(screen))
  let tracked: TrackedWindow | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancelPendingSave(): void {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function isNormal(win: TrackedWindow): boolean {
    return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen()
  }

  /** Normal bounds only: a maximized, minimized or full-screen size is not the size to reopen at. */
  function captureBounds(): void {
    if (!tracked || tracked.isDestroyed() || !isNormal(tracked)) return
    const { x, y, width, height } = tracked.getBounds()
    Object.assign(current, { x, y, width, height })
  }

  /** A minimized window reports itself as not maximized on Windows, so its flags are left as they were. */
  function captureFlags(): void {
    if (!tracked || tracked.isDestroyed() || tracked.isMinimized()) return
    current.isMaximized = tracked.isMaximized()
    current.isFullScreen = tracked.isFullScreen()
  }

  function write(): void {
    try {
      writeFile(filePath, `${JSON.stringify(current, null, 2)}\n`)
    } catch {
      // Window placement is a convenience: a read-only profile must not stop the app or its shutdown.
    }
  }

  function saveNow(): void {
    cancelPendingSave()
    captureFlags()
    captureBounds()
    write()
  }

  function track(win: TrackedWindow): void {
    tracked = win
    const onBoundsChanged = (): void => {
      if (win.isDestroyed() || !isNormal(win)) return
      cancelPendingSave()
      timer = setTimeout(() => {
        timer = null
        captureBounds()
        write()
      }, debounceMs)
    }
    const onStateChanged = (): void => {
      captureFlags()
      write()
    }
    win.on('resize', onBoundsChanged)
    win.on('move', onBoundsChanged)
    win.on('maximize', onStateChanged)
    win.on('unmaximize', onStateChanged)
    win.on('enter-full-screen', onStateChanged)
    win.on('leave-full-screen', onStateChanged)
    win.on('close', saveNow)
    win.on('closed', () => {
      cancelPendingSave()
      if (tracked === win) tracked = null
    })
  }

  return {
    get state() {
      return { ...current }
    },
    track,
    saveNow
  }
}
