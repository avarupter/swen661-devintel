import path from 'node:path'
import { APP_ENTRY_URL, resolveAppPath } from '../protocol'

const root = path.resolve('/opt/careconnect/out/renderer')

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
