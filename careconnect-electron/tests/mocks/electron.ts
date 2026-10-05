/**
 * In-memory stand-in for the `electron` module, mapped in by jest.config.cjs
 * for the "main" project. It models just enough behaviour for real main and
 * preload code to run unmodified under Node:
 *
 *  - ipcRenderer.invoke() is routed into handlers registered with
 *    ipcMain.handle(), and webContents.send() is delivered to
 *    ipcRenderer.on() listeners. Loading the real preload module and the real
 *    IPC handlers in one test therefore exercises the actual IPC contract.
 *  - BrowserWindow is an EventEmitter with tracked bounds and state, so window
 *    management code can be driven by emitting 'move', 'resize', 'close', etc.
 *  - contextBridge.exposeInMainWorld() records what the preload exposes.
 *
 * Tests reach the controls through `mockElectron` (import this file directly;
 * Jest resolves it to the same module instance as `electron`).
 */
import { EventEmitter } from 'node:events'

type Listener = (...args: unknown[]) => unknown

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface FakeDisplay {
  id: number
  bounds: Rectangle
  workArea: Rectangle
  scaleFactor: number
}

// ---------------------------------------------------------------------------
// app

class FakeApp extends EventEmitter {
  isPackaged = false
  name = 'CareConnect'
  commandLine = { appendSwitch: jest.fn(), hasSwitch: jest.fn(() => false) }
  dock = undefined
  whenReady = jest.fn(() => Promise.resolve())
  isReady = jest.fn(() => true)
  getPath = jest.fn((name: string) => mockElectron.paths[name] ?? `/tmp/careconnect-test/${name}`)
  getAppPath = jest.fn(() => '/tmp/careconnect-test/app')
  getVersion = jest.fn(() => '1.0.0')
  getName = jest.fn(() => this.name)
  getLocale = jest.fn(() => 'en-US')
  quit = jest.fn()
  exit = jest.fn()
  focus = jest.fn()
  relaunch = jest.fn()
  enableSandbox = jest.fn()
  requestSingleInstanceLock = jest.fn(() => mockElectron.singleInstanceLock)
  setAppUserModelId = jest.fn()
  setUserTasks = jest.fn(() => true)
  setBadgeCount = jest.fn(() => true)
  setAboutPanelOptions = jest.fn()
  showAboutPanel = jest.fn()
}

// ---------------------------------------------------------------------------
// webContents / BrowserWindow

let nextWebContentsId = 1
let nextWindowId = 1

export class FakeWebContents extends EventEmitter {
  id = nextWebContentsId++
  url = ''
  destroyed = false
  zoomLevel = 0
  windowOpenHandler: ((details: { url: string }) => { action: 'allow' | 'deny' }) | null = null
  /** Every message sent to this renderer: [channel, ...args]. */
  sent: unknown[][] = []

  send = jest.fn((channel: string, ...args: unknown[]) => {
    this.sent.push([channel, ...args])
    if (mockElectron.rendererBus.webContents === this) mockElectron.rendererBus.deliver(channel, args)
  })
  getURL = jest.fn(() => this.url)
  loadURL = jest.fn(async (url: string) => {
    this.url = url
  })
  isDestroyed = jest.fn(() => this.destroyed)
  setWindowOpenHandler = jest.fn((handler: FakeWebContents['windowOpenHandler']) => {
    this.windowOpenHandler = handler
  })
  openDevTools = jest.fn()
  closeDevTools = jest.fn()
  isDevToolsOpened = jest.fn(() => false)
  toggleDevTools = jest.fn()
  reload = jest.fn()
  focus = jest.fn()
  print = jest.fn()
  getZoomLevel = jest.fn(() => this.zoomLevel)
  setZoomLevel = jest.fn((level: number) => {
    this.zoomLevel = level
  })
  session = { setPermissionRequestHandler: jest.fn(), setPermissionCheckHandler: jest.fn() }
}

export class FakeBrowserWindow extends EventEmitter {
  static windows: FakeBrowserWindow[] = []
  static getAllWindows = jest.fn(() => FakeBrowserWindow.windows.filter((w) => !w.destroyed))
  static getFocusedWindow = jest.fn(() => FakeBrowserWindow.windows.find((w) => w.focused && !w.destroyed) ?? null)
  static fromWebContents = jest.fn(
    (wc: FakeWebContents) => FakeBrowserWindow.windows.find((w) => w.webContents === wc) ?? null
  )

  id = nextWindowId++
  options: Record<string, unknown>
  webContents = new FakeWebContents()
  bounds: Rectangle
  maximized = false
  minimized = false
  fullScreen = false
  visible = false
  focused = false
  destroyed = false
  title = ''
  menuBarVisible = true

  constructor(options: Record<string, unknown> = {}) {
    super()
    this.options = options
    this.bounds = {
      x: typeof options.x === 'number' ? options.x : 100,
      y: typeof options.y === 'number' ? options.y : 100,
      width: typeof options.width === 'number' ? options.width : 800,
      height: typeof options.height === 'number' ? options.height : 600
    }
    this.title = typeof options.title === 'string' ? options.title : ''
    this.visible = options.show !== false
    FakeBrowserWindow.windows.push(this)
  }

  getBounds = jest.fn(() => ({ ...this.bounds }))
  getNormalBounds = jest.fn(() => ({ ...this.bounds }))
  setBounds = jest.fn((rect: Partial<Rectangle>) => {
    this.bounds = { ...this.bounds, ...rect }
  })
  getContentBounds = jest.fn(() => ({ ...this.bounds }))
  isMaximized = jest.fn(() => this.maximized)
  isMinimized = jest.fn(() => this.minimized)
  isFullScreen = jest.fn(() => this.fullScreen)
  isVisible = jest.fn(() => this.visible)
  isFocused = jest.fn(() => this.focused)
  isDestroyed = jest.fn(() => this.destroyed)
  maximize = jest.fn(() => {
    this.maximized = true
    this.emit('maximize')
  })
  unmaximize = jest.fn(() => {
    this.maximized = false
    this.emit('unmaximize')
  })
  minimize = jest.fn(() => {
    this.minimized = true
    this.emit('minimize')
  })
  restore = jest.fn(() => {
    this.minimized = false
    this.emit('restore')
  })
  setFullScreen = jest.fn((flag: boolean) => {
    this.fullScreen = flag
    this.emit(flag ? 'enter-full-screen' : 'leave-full-screen')
  })
  show = jest.fn(() => {
    this.visible = true
    this.emit('show')
  })
  hide = jest.fn(() => {
    this.visible = false
    this.emit('hide')
  })
  focus = jest.fn(() => {
    this.focused = true
    this.emit('focus')
  })
  close = jest.fn(() => {
    let prevented = false
    this.emit('close', {
      preventDefault: () => {
        prevented = true
      }
    })
    if (!prevented) this.destroy()
  })
  destroy = jest.fn(() => {
    if (this.destroyed) return
    this.destroyed = true
    this.webContents.destroyed = true
    this.emit('closed')
  })
  loadURL = jest.fn(async (url: string) => this.webContents.loadURL(url))
  loadFile = jest.fn(async (file: string) => this.webContents.loadURL(`file://${file}`))
  setTitle = jest.fn((title: string) => {
    this.title = title
  })
  getTitle = jest.fn(() => this.title)
  setMenu = jest.fn()
  setMenuBarVisibility = jest.fn((visible: boolean) => {
    this.menuBarVisible = visible
  })
  setAutoHideMenuBar = jest.fn()
  setOverlayIcon = jest.fn()
  setProgressBar = jest.fn()
  flashFrame = jest.fn()
  setThumbarButtons = jest.fn(() => true)
  setMinimumSize = jest.fn()
}

// ---------------------------------------------------------------------------
// IPC: ipcMain handlers and the in-process renderer bus

interface FakeIpcMainEvent {
  sender: FakeWebContents
  senderFrame: { url: string } | null
  processId: number
  frameId: number
}

class FakeIpcMain extends EventEmitter {
  handlers = new Map<string, Listener>()
  handle = jest.fn((channel: string, handler: Listener) => {
    if (this.handlers.has(channel)) {
      throw new Error(`Attempted to register a second handler for '${channel}'`)
    }
    this.handlers.set(channel, handler)
  })
  handleOnce = jest.fn((channel: string, handler: Listener) => {
    this.handlers.set(channel, (...args: unknown[]) => {
      this.handlers.delete(channel)
      return handler(...args)
    })
  })
  removeHandler = jest.fn((channel: string) => {
    this.handlers.delete(channel)
  })
}

class RendererBus extends EventEmitter {
  /** The renderer whose messages the fake ipcRenderer sends and receives. */
  webContents: FakeWebContents | null = null
  senderUrl = 'app://careconnect/index.html'

  deliver(channel: string, args: unknown[]): void {
    this.emit(channel, { sender: null }, ...args)
  }
}

function makeMainEvent(): FakeIpcMainEvent {
  const sender = mockElectron.rendererBus.webContents ?? new FakeWebContents()
  return { sender, senderFrame: { url: mockElectron.rendererBus.senderUrl }, processId: 1, frameId: 1 }
}

const ipcRenderer = {
  invoke: jest.fn(async (channel: string, ...args: unknown[]) => {
    const handler = mockElectron.ipcMain.handlers.get(channel)
    if (!handler) throw new Error(`No handler registered for '${channel}'`)
    // Structured clone mirrors what crossing the process boundary does to payloads.
    const result = await handler(makeMainEvent(), ...structuredClone(args))
    return result === undefined ? undefined : structuredClone(result)
  }),
  send: jest.fn((channel: string, ...args: unknown[]) => {
    mockElectron.ipcMain.emit(channel, makeMainEvent(), ...structuredClone(args))
  }),
  on: jest.fn((channel: string, listener: Listener) => {
    mockElectron.rendererBus.on(channel, listener)
    return ipcRenderer
  }),
  once: jest.fn((channel: string, listener: Listener) => {
    mockElectron.rendererBus.once(channel, listener)
    return ipcRenderer
  }),
  removeListener: jest.fn((channel: string, listener: Listener) => {
    mockElectron.rendererBus.removeListener(channel, listener)
    return ipcRenderer
  }),
  off: jest.fn((channel: string, listener: Listener) => {
    mockElectron.rendererBus.removeListener(channel, listener)
    return ipcRenderer
  }),
  removeAllListeners: jest.fn((channel?: string) => {
    mockElectron.rendererBus.removeAllListeners(channel)
    return ipcRenderer
  })
}

const contextBridge = {
  exposeInMainWorld: jest.fn((key: string, api: unknown) => {
    mockElectron.exposed[key] = api
  })
}

// ---------------------------------------------------------------------------
// Menu, Tray, nativeImage, Notification

export interface FakeMenuItemOptions {
  id?: string
  label?: string
  role?: string
  type?: string
  accelerator?: string
  registerAccelerator?: boolean
  enabled?: boolean
  visible?: boolean
  checked?: boolean
  toolTip?: string
  click?: (...args: unknown[]) => unknown
  submenu?: FakeMenuItemOptions[] | FakeMenu
}

export class FakeMenuItem {
  id?: string
  label: string
  role?: string
  type: string
  accelerator?: string
  registerAccelerator: boolean
  enabled: boolean
  visible: boolean
  checked: boolean
  click?: (...args: unknown[]) => unknown
  submenu?: FakeMenu

  constructor(options: FakeMenuItemOptions) {
    this.id = options.id
    this.label = options.label ?? ''
    this.role = options.role
    this.type = options.type ?? (options.submenu ? 'submenu' : 'normal')
    this.accelerator = options.accelerator
    this.registerAccelerator = options.registerAccelerator ?? true
    this.enabled = options.enabled ?? true
    this.visible = options.visible ?? true
    this.checked = options.checked ?? false
    this.click = options.click
    if (options.submenu) {
      this.submenu = options.submenu instanceof FakeMenu ? options.submenu : FakeMenu.buildFromTemplate(options.submenu)
    }
  }
}

export class FakeMenu {
  static applicationMenu: FakeMenu | null = null
  static buildFromTemplate = jest.fn((template: FakeMenuItemOptions[]) => {
    const menu = new FakeMenu()
    menu.items = template.map((item) => new FakeMenuItem(item))
    return menu
  })
  static setApplicationMenu = jest.fn((menu: FakeMenu | null) => {
    FakeMenu.applicationMenu = menu
  })
  static getApplicationMenu = jest.fn(() => FakeMenu.applicationMenu)

  items: FakeMenuItem[] = []
  popup = jest.fn()
  closePopup = jest.fn()

  getMenuItemById(id: string): FakeMenuItem | null {
    for (const item of this.items) {
      if (item.id === id) return item
      const nested = item.submenu?.getMenuItemById(id)
      if (nested) return nested
    }
    return null
  }
}

export class FakeNativeImage {
  constructor(readonly path = '') {}
  isEmpty = jest.fn(() => this.path === '')
  resize = jest.fn(() => this)
  getSize = jest.fn(() => ({ width: 16, height: 16 }))
  toPNG = jest.fn(() => Buffer.from([]))
  setTemplateImage = jest.fn()
}

const nativeImage = {
  createFromPath: jest.fn((path: string) => new FakeNativeImage(path)),
  createEmpty: jest.fn(() => new FakeNativeImage())
}

export class FakeTray extends EventEmitter {
  static instances: FakeTray[] = []
  toolTip = ''
  contextMenu: FakeMenu | null = null
  destroyed = false

  constructor(readonly image: unknown) {
    super()
    FakeTray.instances.push(this)
  }

  setToolTip = jest.fn((tip: string) => {
    this.toolTip = tip
  })
  setContextMenu = jest.fn((menu: FakeMenu | null) => {
    this.contextMenu = menu
  })
  setImage = jest.fn()
  popUpContextMenu = jest.fn()
  displayBalloon = jest.fn()
  destroy = jest.fn(() => {
    this.destroyed = true
  })
  isDestroyed = jest.fn(() => this.destroyed)
}

export class FakeNotification extends EventEmitter {
  static instances: FakeNotification[] = []
  static isSupported = jest.fn(() => mockElectron.notificationsSupported)

  constructor(readonly options: { title?: string; body?: string; silent?: boolean; icon?: unknown } = {}) {
    super()
    FakeNotification.instances.push(this)
  }

  show = jest.fn()
  close = jest.fn()
}

// ---------------------------------------------------------------------------
// dialog, shell, clipboard, screen, nativeTheme, session, protocol, net

const dialog = {
  showSaveDialog: jest.fn(async () => ({ canceled: true, filePath: undefined as string | undefined })),
  showOpenDialog: jest.fn(async () => ({ canceled: true, filePaths: [] as string[] })),
  showMessageBox: jest.fn(async () => ({ response: 0, checkboxChecked: false })),
  showErrorBox: jest.fn()
}

const shell = {
  openExternal: jest.fn(async () => undefined),
  openPath: jest.fn(async () => ''),
  showItemInFolder: jest.fn()
}

const clipboard = {
  writeText: jest.fn(),
  readText: jest.fn(() => '')
}

function intersectionArea(a: Rectangle, b: Rectangle): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0 ? width * height : 0
}

const screen = Object.assign(new EventEmitter(), {
  getAllDisplays: jest.fn(() => mockElectron.displays),
  getPrimaryDisplay: jest.fn(() => mockElectron.displays[0]),
  getDisplayMatching: jest.fn((rect: Rectangle) => {
    let best = mockElectron.displays[0]
    let bestArea = -1
    for (const display of mockElectron.displays) {
      const area = intersectionArea(display.workArea, rect)
      if (area > bestArea) {
        best = display
        bestArea = area
      }
    }
    return best
  })
})

const nativeTheme = Object.assign(new EventEmitter(), {
  shouldUseHighContrastColors: false,
  shouldUseDarkColors: false,
  shouldUseInvertedColorScheme: false,
  prefersReducedTransparency: false,
  themeSource: 'system' as 'system' | 'light' | 'dark'
})

const defaultSession = {
  setPermissionRequestHandler: jest.fn(),
  setPermissionCheckHandler: jest.fn(),
  setDevicePermissionHandler: jest.fn(),
  webRequest: { onHeadersReceived: jest.fn(), onBeforeRequest: jest.fn() },
  on: jest.fn()
}

const session = { defaultSession }

const protocol = {
  registerSchemesAsPrivileged: jest.fn(),
  handle: jest.fn(),
  unhandle: jest.fn(),
  isProtocolHandled: jest.fn(() => false)
}

const net = {
  fetch: jest.fn(async () => new Response('', { status: 200 }))
}

// ---------------------------------------------------------------------------
// Test controls

const DEFAULT_DISPLAY: FakeDisplay = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  workArea: { x: 0, y: 0, width: 1920, height: 1040 },
  scaleFactor: 1
}

export const mockElectron = {
  app: new FakeApp(),
  ipcMain: new FakeIpcMain(),
  rendererBus: new RendererBus(),
  exposed: {} as Record<string, unknown>,
  displays: [DEFAULT_DISPLAY] as FakeDisplay[],
  paths: {} as Record<string, string>,
  singleInstanceLock: true,
  notificationsSupported: true,

  /** Points the fake ipcRenderer at a window's webContents (sender and receiver). */
  connectRenderer(webContents: FakeWebContents, senderUrl = 'app://careconnect/index.html'): void {
    this.rendererBus.webContents = webContents
    this.rendererBus.senderUrl = senderUrl
  },

  /** Restores every piece of module state. Call from beforeEach in files that need isolation. */
  reset(): void {
    this.app.removeAllListeners()
    this.ipcMain.removeAllListeners()
    this.ipcMain.handlers.clear()
    this.rendererBus.removeAllListeners()
    this.rendererBus.webContents = null
    this.rendererBus.senderUrl = 'app://careconnect/index.html'
    this.exposed = {}
    this.displays = [DEFAULT_DISPLAY]
    this.paths = {}
    this.singleInstanceLock = true
    this.notificationsSupported = true
    FakeBrowserWindow.windows = []
    FakeMenu.applicationMenu = null
    FakeTray.instances = []
    FakeNotification.instances = []
    nativeTheme.removeAllListeners()
    nativeTheme.shouldUseHighContrastColors = false
    nativeTheme.shouldUseDarkColors = false
    nativeTheme.themeSource = 'system'
    screen.removeAllListeners()
  }
}

export const app = mockElectron.app
export const ipcMain = mockElectron.ipcMain
export {
  FakeBrowserWindow as BrowserWindow,
  FakeMenu as Menu,
  FakeMenuItem as MenuItem,
  FakeTray as Tray,
  FakeNotification as Notification,
  ipcRenderer,
  contextBridge,
  nativeImage,
  dialog,
  shell,
  clipboard,
  screen,
  nativeTheme,
  session,
  protocol,
  net
}
