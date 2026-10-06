import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PRODUCTION_CSP } from '../../shared/csp'
import { mockElectron, net, protocol } from '../../../tests/mocks/electron'
import { APP_ENTRY_URL, handleAppProtocol, registerAppScheme, resolveAppPath } from '../protocol'

const root = path.resolve('/opt/careconnect/out/renderer')

describe('registerAppScheme', () => {
  it('registers app: as a standard, secure scheme with fetch support', () => {
    registerAppScheme()
    expect(protocol.registerSchemesAsPrivileged).toHaveBeenCalledWith([
      { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
    ])
  })
})

describe('handleAppProtocol', () => {
  type Handler = (request: Request) => Promise<Response>

  function register(): Handler {
    mockElectron.reset()
    handleAppProtocol(root)
    expect(protocol.handle).toHaveBeenCalledWith('app', expect.any(Function))
    return protocol.handle.mock.calls[0][1] as Handler
  }

  it('serves files from the renderer folder with the Content-Security-Policy header', async () => {
    const handler = register()
    net.fetch.mockResolvedValueOnce(new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } }))

    const response = await handler(new Request(APP_ENTRY_URL))
    expect(net.fetch).toHaveBeenCalledWith(pathToFileURL(path.join(root, 'index.html')).toString())
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Security-Policy')).toBe(PRODUCTION_CSP)
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Content-Type')).toBe('text/html')
    await expect(response.text()).resolves.toBe('<!doctype html>')
  })

  it('keeps the status of a missing file', async () => {
    const handler = register()
    net.fetch.mockResolvedValueOnce(new Response('', { status: 404 }))
    const response = await handler(new Request('app://careconnect/assets/missing.js'))
    expect(response.status).toBe(404)
    expect(response.headers.get('Content-Security-Policy')).toBe(PRODUCTION_CSP)
  })

  it('answers 404 without touching the disk for another host or an escaping path', async () => {
    const handler = register()
    for (const url of ['app://evil/index.html', 'app://careconnect/..%2f..%2fsecret']) {
      const response = await handler(new Request(url))
      expect(response.status).toBe(404)
    }
    expect(net.fetch).not.toHaveBeenCalled()
  })
})

describe('resolveAppPath', () => {
  it('serves index.html for the entry URL and for the bare origin', () => {
    expect(resolveAppPath(root, APP_ENTRY_URL)).toBe(path.join(root, 'index.html'))
    expect(resolveAppPath(root, 'app://careconnect/')).toBe(path.join(root, 'index.html'))
  })

  it('maps nested asset paths inside the renderer root', () => {
    expect(resolveAppPath(root, 'app://careconnect/assets/index-abc.js')).toBe(path.join(root, 'assets', 'index-abc.js'))
  })

  it('keeps dot segments inside the root, because the URL parser folds them first', () => {
    expect(resolveAppPath(root, 'app://careconnect/../../etc/passwd')).toBe(path.join(root, 'etc', 'passwd'))
    expect(resolveAppPath(root, 'app://careconnect/%2e%2e/%2e%2e/etc/passwd')).toBe(path.join(root, 'etc', 'passwd'))
  })

  it('refuses encoded slashes that would escape the root once decoded', () => {
    expect(resolveAppPath(root, 'app://careconnect/..%2f..%2fsecret')).toBeNull()
    expect(resolveAppPath(root, 'app://careconnect/..%5c..%5csecret')).toBe(
      path.sep === '\\' ? null : path.join(root, '..\\..\\secret')
    )
  })

  it('refuses other hosts, other schemes, NUL bytes and malformed URLs', () => {
    expect(resolveAppPath(root, 'app://evil/index.html')).toBeNull()
    expect(resolveAppPath(root, 'file:///etc/passwd')).toBeNull()
    expect(resolveAppPath(root, 'app://careconnect/index.html%00.png')).toBeNull()
    expect(resolveAppPath(root, 'not a url')).toBeNull()
    expect(resolveAppPath(root, 'app://careconnect/%E0%A4%A')).toBeNull()
  })
})
