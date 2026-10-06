import { EventEmitter } from 'node:events'
import type { Session } from 'electron'
import { APP_ORIGIN } from '../protocol'
import { allowedOrigins, configureSessionSecurity, isTrustedSender, isTrustedUrl } from '../security'

const DEV_SERVER = 'http://localhost:5173'

describe('allowedOrigins', () => {
  it('trusts only app://careconnect in a packaged build', () => {
    expect(allowedOrigins()).toEqual([APP_ORIGIN])
    expect(APP_ORIGIN).toBe('app://careconnect')
  })

  it('adds the dev server origin, reduced to scheme, host and port', () => {
    expect(allowedOrigins(`${DEV_SERVER}/`)).toEqual([APP_ORIGIN, DEV_SERVER])
    expect(allowedOrigins(`${DEV_SERVER}/src/index.html?x=1#y`)).toEqual([APP_ORIGIN, DEV_SERVER])
  })

  it('ignores a dev server URL that is empty, malformed or not http(s)', () => {
    expect(allowedOrigins('')).toEqual([APP_ORIGIN])
    expect(allowedOrigins('not a url')).toEqual([APP_ORIGIN])
    expect(allowedOrigins('file:///etc/passwd')).toEqual([APP_ORIGIN])
    expect(allowedOrigins('http://user:pass@localhost:5173')).toEqual([APP_ORIGIN])
  })
})

describe('isTrustedUrl', () => {
  const packaged = allowedOrigins()
  const dev = allowedOrigins(DEV_SERVER)

  it.each(['app://careconnect/index.html', 'app://careconnect/', 'app://careconnect/assets/index-abc.js', 'app://careconnect'])(
    'trusts the app origin: %s',
    (url) => {
      expect(isTrustedUrl(url, packaged)).toBe(true)
      expect(isTrustedUrl(url, dev)).toBe(true)
    }
  )

  it.each([
    ['a lookalike host', 'app://careconnect.evil/index.html'],
    ['another app host', 'app://evil/index.html'],
    ['credentials in the URL', 'app://evil@careconnect/index.html'],
    ['an explicit port', 'app://careconnect:8080/index.html'],
    ['a web page', 'https://example.com/'],
    ['an http localhost that is not the dev server', 'http://localhost:3000/'],
    ['the dev server in a packaged build', `${DEV_SERVER}/`],
    ['a file URL', 'file:///opt/careconnect/out/renderer/index.html'],
    ['about:blank', 'about:blank'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a data: URL', 'data:text/html,<h1>hi</h1>'],
    ['an opaque app: URL', 'app:careconnect/index.html'],
    ['garbage', 'not a url'],
    ['an empty string', '']
  ])('rejects %s', (_label, url) => {
    expect(isTrustedUrl(url, packaged)).toBe(false)
  })

  it('trusts the dev server only on its exact scheme, host and port', () => {
    expect(isTrustedUrl(`${DEV_SERVER}/src/main.tsx`, dev)).toBe(true)
    expect(isTrustedUrl('http://LOCALHOST:5173/', dev)).toBe(true)
    expect(isTrustedUrl('http://localhost:5174/', dev)).toBe(false)
    expect(isTrustedUrl('https://localhost:5173/', dev)).toBe(false)
    expect(isTrustedUrl('http://127.0.0.1:5173/', dev)).toBe(false)
    expect(isTrustedUrl('http://localhost:3000/', dev)).toBe(false)
  })
})

describe('isTrustedSender', () => {
  const origins = allowedOrigins()

  it('accepts a frame on the app origin', () => {
    expect(isTrustedSender({ senderFrame: { url: 'app://careconnect/index.html' } }, origins)).toBe(true)
  })

  it('rejects a lookalike origin, a web page and an http localhost that is not the dev server', () => {
    expect(isTrustedSender({ senderFrame: { url: 'app://careconnect.evil/index.html' } }, origins)).toBe(false)
    expect(isTrustedSender({ senderFrame: { url: 'https://example.com/' } }, origins)).toBe(false)
    expect(isTrustedSender({ senderFrame: { url: 'http://localhost:3000/' } }, allowedOrigins(DEV_SERVER))).toBe(false)
  })

  it('rejects a missing frame (navigated away or destroyed)', () => {
    expect(isTrustedSender({ senderFrame: null }, origins)).toBe(false)
  })

  it('rejects a frame whose URL can no longer be read', () => {
    const disposed = {
      get url(): string {
        throw new Error('Render frame was disposed before WebFrameMain could be accessed')
      }
    }
    expect(isTrustedSender({ senderFrame: disposed }, origins)).toBe(false)
  })
})

describe('configureSessionSecurity', () => {
  function fakeSession() {
    const emitter = new EventEmitter()
    const session = Object.assign(emitter, {
      setPermissionRequestHandler: jest.fn(),
      setPermissionCheckHandler: jest.fn()
    })
    configureSessionSecurity(session as unknown as Session)
    return session
  }

  it('denies every permission request', () => {
    const session = fakeSession()
    expect(session.setPermissionRequestHandler).toHaveBeenCalledTimes(1)
    const handler = session.setPermissionRequestHandler.mock.calls[0][0] as (
      webContents: unknown,
      permission: string,
      callback: (granted: boolean) => void
    ) => void
    for (const permission of ['notifications', 'media', 'geolocation', 'clipboard-read', 'openExternal', 'fullscreen', 'unknown']) {
      const callback = jest.fn()
      handler({}, permission, callback)
      expect(callback).toHaveBeenCalledWith(false)
    }
  })

  it('answers every permission check with false', () => {
    const session = fakeSession()
    const check = session.setPermissionCheckHandler.mock.calls[0][0] as (webContents: unknown, permission: string, origin: string) => boolean
    expect(check({}, 'notifications', APP_ORIGIN)).toBe(false)
    expect(check(null, 'clipboard-sanitized-write', APP_ORIGIN)).toBe(false)
  })

  it('cancels downloads', () => {
    const session = fakeSession()
    const event = { preventDefault: jest.fn() }
    session.emit('will-download', event, {}, {})
    expect(event.preventDefault).toHaveBeenCalled()
  })
})
