/**
 * Desktop notifications come from the main process, never the web
 * Notification API (which the session refuses). On Windows they are toast
 * notifications attributed through the AppUserModelID set in platform.ts.
 */
import type { Notification } from 'electron'
import type { NotificationRequest } from '../shared/api'

export interface ShowNotificationOptions {
  Notification: typeof Notification
  iconPath: string
  request: NotificationRequest
  /** Called with the request's patient, if any, when the user clicks the notification. */
  onClick(patientId?: string): void
}

/**
 * Notifications are referenced until they are clicked, closed or fail. A
 * notification that is garbage-collected while still on screen loses its click
 * handler on Windows.
 */
const active = new Set<Notification>()

export function activeNotificationCount(): number {
  return active.size
}

export function showNotification({ Notification, iconPath, request, onClick }: ShowNotificationOptions): boolean {
  if (!Notification.isSupported()) return false
  const notification = new Notification({ title: request.title, body: request.body, icon: iconPath })
  const release = (): void => {
    active.delete(notification)
  }
  active.add(notification)
  notification.on('click', () => {
    release()
    onClick(request.patientId)
  })
  notification.on('close', release)
  notification.on('failed', release)
  notification.show()
  return true
}
