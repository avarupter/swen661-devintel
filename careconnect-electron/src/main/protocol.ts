import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { PRODUCTION_CSP } from '../shared/csp'

/**
 * The packaged renderer is served from app://careconnect/ instead of file://
 * (Electron security checklist item 18). That gives the page a real origin to
 * check IPC senders and navigations against, lets the Content-Security-Policy
 * travel as a header, and lets the grantFileProtocolExtraPrivileges fuse be
 * switched off.
 */
export const APP_SCHEME = 'app'
export const APP_HOST = 'careconnect'
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`
export const APP_ENTRY_URL = `${APP_ORIGIN}/index.html`

/** Must run before the app's `ready` event. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

/**
 * Maps an app:// URL onto a file inside `rendererRoot`, or returns null for a
 * foreign host or any path that would escape the root (e.g. `/../../secret`).
 */
export function resolveAppPath(rendererRoot: string, requestUrl: string): string | null {
  let url: URL
  try {
    url = new URL(requestUrl)
  } catch {
    return null
  }
  if (url.protocol !== `${APP_SCHEME}:` || url.host !== APP_HOST) return null

  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return null
  }
  if (pathname.includes('\0')) return null

  const root = path.resolve(rendererRoot)
  const resolved = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null
  return resolved
}

/** Must run after the app's `ready` event. */
export function handleAppProtocol(rendererRoot: string): void {
  protocol.handle(APP_SCHEME, async (request) => {
    const filePath = resolveAppPath(rendererRoot, request.url)
    if (!filePath) return new Response('Not found', { status: 404 })

    const response = await net.fetch(pathToFileURL(filePath).toString())
    const headers = new Headers(response.headers)
    headers.set('Content-Security-Policy', PRODUCTION_CSP)
    headers.set('X-Content-Type-Options', 'nosniff')
    return new Response(response.body, { status: response.status, headers })
  })
}
