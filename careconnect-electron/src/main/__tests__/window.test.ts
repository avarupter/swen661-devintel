import type { BrowserWindow, WebContents } from 'electron'
import { FakeBrowserWindow, FakeWebContents, mockElectron } from '../../../tests/mocks/electron'
import { APP_ENTRY_URL } from '../protocol'
import { allowedOrigins } from '../security'
import { createMainWindow, hardenWebContents, WINDOW_TITLE } from '../window'
import { DEFAULT_WINDOW_STATE, MIN_WINDOW_SIZE, type WindowState } from '../windowState'

const PRELOAD = '/opt/careconnect/out/preload/index.js'
const ICON = '/opt/careconnect/resources/icon.png'

function open(state: WindowState = { ...DEFAULT_WINDOW_STATE }, overrides: { isDev?: boolean; entryUrl?: string } = {}) {
  const openExternal = jest.fn(async () => undefined)
  const win = createMainWindow({
    preloadPath: PRELOAD,
    entryUrl: overrides.entryUrl ?? APP_ENTRY_URL,
    iconPath: ICON,
    state,
    isDev: overrides.isDev ?? false,
    origins: allowedOrigins(),
    openExternal
  }) as unknown as FakeBrowserWindow
  return { win, openExternal }
}

function navigationEvent(url: string) {
  return { url, preventDefault: jest.fn() }
}

beforeEach(() => {
  mockElectron.reset()
})

describe('createMainWindow', () => {
  it('creates a hidden, titled window with the minimum size and the page background', () => {
    const { win } = open()
    expect(win.options).toMatchObject({
      title: 'CareConnect — Clinical workspace',
      backgroundColor: '#f4f6f9',
      show: false,
      width: 1440,
      height: 900,
      minWidth: MIN_WINDOW_SIZE.width,
      minHeight: MIN_WINDOW_SIZE.height,
      icon: ICON
    })
    expect(WINDOW_TITLE).toBe('CareConnect — Clinical workspace')
    expect(win.visible).toBe(false)
  })

  it('locks the renderer down: isolated, sandboxed, no Node, no webview, DevTools only in development', () => {
    const { win } = open()
    expect(win.options.webPreferences).toEqual({
      preload: PRELOAD,
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
      devTools: false
    })
    const { win: devWin } = open(undefined, { isDev: true })
    expect((devWin.options.webPreferences as { devTools: boolean }).devTools).toBe(true)
  })

  it('opens at the saved position, or lets Electron centre it when there is none', () => {
    const { win: placed } = open({ x: 120, y: 80, width: 1280, height: 800, isMaximized: false, isFullScreen: false })
    expect(placed.options).toMatchObject({ x: 120, y: 80, width: 1280, height: 800 })
    const { win: centred } = open()
    expect(centred.options).not.toHaveProperty('x')
    expect(centred.options).not.toHaveProperty('y')
  })

  it('shows the window on ready-to-show without maximizing a normal window', () => {
    const { win } = open()
    win.emit('ready-to-show')
    expect(win.show).toHaveBeenCalledTimes(1)
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.setFullScreen).not.toHaveBeenCalled()
  })

  it('maximizes before showing when the saved state was maximized', () => {
    const { win } = open({ ...DEFAULT_WINDOW_STATE, isMaximized: true })
    win.emit('ready-to-show')
    expect(win.maximize).toHaveBeenCalledTimes(1)
    expect(win.show).toHaveBeenCalledTimes(1)
    expect(win.maximize.mock.invocationCallOrder[0]).toBeLessThan(win.show.mock.invocationCallOrder[0])
    expect(win.maximized).toBe(true)
  })

  it('returns to full screen when the saved state was full screen', () => {
    const { win } = open({ ...DEFAULT_WINDOW_STATE, isFullScreen: true })
    win.emit('ready-to-show')
    expect(win.setFullScreen).toHaveBeenCalledWith(true)
    expect(win.show).toHaveBeenCalled()
  })

  it('loads the entry URL', () => {
    const { win } = open()
    expect(win.loadURL).toHaveBeenCalledWith('app://careconnect/index.html')
    const { win: dev } = open(undefined, { isDev: true, entryUrl: 'http://localhost:5173' })
    expect(dev.loadURL).toHaveBeenCalledWith('http://localhost:5173')
  })

  it('reports a failed load instead of leaving an unhandled rejection', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('ERR_CONNECTION_REFUSED (-102) loading http://localhost:5173/')
    class UnreachableWindow extends FakeBrowserWindow {
      loadURL = jest.fn(async (_url: string): Promise<void> => {
        throw failure
      })
    }
    const win = createMainWindow({
      preloadPath: PRELOAD,
      entryUrl: 'http://localhost:5173/',
      iconPath: ICON,
      state: { ...DEFAULT_WINDOW_STATE },
      isDev: true,
      origins: allowedOrigins('http://localhost:5173'),
      openExternal: jest.fn(async () => undefined),
      BrowserWindow: UnreachableWindow as unknown as typeof BrowserWindow
    }) as unknown as UnreachableWindow
    expect(win).toBeInstanceOf(UnreachableWindow)
    await new Promise((resolve) => setImmediate(resolve))
    expect(error).toHaveBeenCalledWith('CareConnect could not load http://localhost:5173/:', failure)
    error.mockRestore()
  })

  it('applies the navigation guards to the window contents', () => {
    const { win } = open()
    const event = navigationEvent('https://example.com/')
    win.webContents.emit('will-navigate', event, event.url)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(win.webContents.setWindowOpenHandler).toHaveBeenCalled()
  })
})

describe('hardenWebContents', () => {
  function harden(origins = allowedOrigins()) {
    const contents = new FakeWebContents()
    const openExternal = jest.fn(async () => undefined)
    hardenWebContents(contents as unknown as WebContents, origins, openExternal)
    return { contents, openExternal }
  }

  it.each(['will-navigate', 'will-redirect'])('%s: blocks a page on another origin', (eventName) => {
    const { contents, openExternal } = harden()
    for (const url of ['https://example.com/', 'app://careconnect.evil/index.html', 'file:///etc/passwd', 'http://localhost:3000/']) {
      const event = navigationEvent(url)
      contents.emit(eventName, event, url)
      expect(event.preventDefault).toHaveBeenCalled()
    }
    expect(openExternal).not.toHaveBeenCalled()
  })

  it.each(['will-navigate', 'will-redirect'])('%s: allows navigation within the app origin', (eventName) => {
    const { contents } = harden()
    const event = navigationEvent('app://careconnect/index.html')
    contents.emit(eventName, event, event.url)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('allows the dev server only when it is a trusted origin', () => {
    const { contents } = harden(allowedOrigins('http://localhost:5173'))
    const event = navigationEvent('http://localhost:5173/')
    contents.emit('will-navigate', event, event.url)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('hands an allow-listed link to the browser instead of navigating the app window', () => {
    const { contents, openExternal } = harden()
    const url = 'https://www.w3.org/WAI/WCAG22/quickref/'
    const event = navigationEvent(url)
    contents.emit('will-navigate', event, url)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(openExternal).toHaveBeenCalledWith(url)
  })

  it('denies every new window and opens only allow-listed https links externally', () => {
    const { contents, openExternal } = harden()
    const handler = contents.windowOpenHandler
    expect(handler).not.toBeNull()
    const open = handler as (details: { url: string }) => { action: string }

    expect(open({ url: 'https://www.nvaccess.org/files/nvda/documentation/userGuide.html' })).toEqual({ action: 'deny' })
    expect(openExternal).toHaveBeenCalledWith('https://www.nvaccess.org/files/nvda/documentation/userGuide.html')

    openExternal.mockClear()
    for (const url of ['https://example.com/', 'http://www.w3.org/', 'javascript:alert(1)', 'app://careconnect/index.html', 'file:///C:/Windows/System32/calc.exe']) {
      expect(open({ url })).toEqual({ action: 'deny' })
    }
    expect(openExternal).not.toHaveBeenCalled()
  })

  it('does not throw when the browser cannot be opened', async () => {
    const contents = new FakeWebContents()
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    const openExternal = jest.fn(async () => {
      throw new Error('No application is associated with the specified file')
    })
    hardenWebContents(contents as unknown as WebContents, allowedOrigins(), openExternal)
    const open = contents.windowOpenHandler as (details: { url: string }) => { action: string }
    expect(open({ url: 'https://www.w3.org/WAI/WCAG22/quickref/' })).toEqual({ action: 'deny' })
    await Promise.resolve()
    await Promise.resolve()
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('prevents <webview> from attaching', () => {
    const { contents } = harden()
    const event = { preventDefault: jest.fn() }
    contents.emit('will-attach-webview', event, {}, { src: 'https://example.com/' })
    expect(event.preventDefault).toHaveBeenCalled()
  })
})
