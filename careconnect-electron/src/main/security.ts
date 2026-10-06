/**
 * Origin checks and session hardening (Electron security checklist items 5,
 * 13, 15 and 18). The renderer is trusted only on app://careconnect, or on the
 * local Vite dev server in development; every IPC sender and every navigation
 * is checked against that list.
 */
import type { Session } from 'electron'
import { APP_ORIGIN } from './protocol'

/**
 * Scheme, host and port of a URL ("app://careconnect", "http://localhost:5173"),
 * or null when it has no host or carries credentials.
 *
 * WHATWG URL reports an opaque "null" origin for custom schemes such as app:,
 * so the origin is built from the protocol and host instead.
 */
export function originOf(value: string): string | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.username !== '' || url.password !== '') return null
  if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin
  return url.host === '' ? null : `${url.protocol}//${url.host}`
}

/** The origins the renderer may run on: the app origin, plus the dev server in development. */
export function allowedOrigins(devServerUrl?: string): string[] {
  const origins = [APP_ORIGIN]
  const devOrigin = devServerUrl ? originOf(devServerUrl) : null
  if (devOrigin && /^https?:\/\//.test(devOrigin)) origins.push(devOrigin)
  return origins
}

export function isTrustedUrl(url: string, origins: readonly string[]): boolean {
  const origin = originOf(url)
  return origin !== null && origins.includes(origin)
}

export interface IpcSenderLike {
  senderFrame: { url: string } | null
}

/** Whether an IPC message came from a frame on a trusted origin. */
export function isTrustedSender(event: IpcSenderLike, origins: readonly string[]): boolean {
  try {
    const frame = event.senderFrame
    return frame !== null && frame !== undefined && isTrustedUrl(frame.url, origins)
  } catch {
    // A disposed frame throws when its URL is read; it cannot be trusted.
    return false
  }
}

export type SecurableSession = Pick<Session, 'setPermissionRequestHandler' | 'setPermissionCheckHandler' | 'on'>

/**
 * CareConnect needs no web permissions: notifications, the clipboard and
 * external links all go through the main process. Every request and check is
 * denied, and downloads are cancelled.
 */
export function configureSessionSecurity(session: SecurableSession): void {
  session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  session.setPermissionCheckHandler(() => false)
  session.on('will-download', (event) => event.preventDefault())
}
