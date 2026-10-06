/**
 * The notification-area (system tray) icon: a tooltip with the unread count,
 * a click that brings the window back, and a short menu (design section 6,
 * "Tray"). Menu items that act on the app show the window first, so the
 * result is visible.
 */
import type { Menu, MenuItemConstructorOptions, nativeImage as NativeImageModule, Tray } from 'electron'
import type { AppCommand } from '../shared/commands'
import { pluralize } from '../shared/format'

export interface TrayActions {
  show(): void
  send(command: AppCommand): void
  quit(): void
}

export function trayTooltip(unreadCount: number): string {
  return `CareConnect — ${pluralize(unreadCount, 'unread message')}`
}

export function buildTrayMenuTemplate({ unreadCount, show, send, quit }: TrayActions & { unreadCount: number }): MenuItemConstructorOptions[] {
  const showThen = (command: AppCommand) => () => {
    show()
    send(command)
  }
  return [
    { label: 'Open CareConnect', click: () => show() },
    { label: 'New Patient…', click: showThen({ id: 'patient.new' }) },
    { label: `Open Inbox (${unreadCount} unread)`, click: showThen({ id: 'navigate.inbox' }) },
    { type: 'separator' },
    { label: 'Quit CareConnect', click: () => quit() }
  ]
}

export interface CreateTrayOptions extends TrayActions {
  Tray: typeof Tray
  Menu: Pick<typeof Menu, 'buildFromTemplate'>
  nativeImage: Pick<typeof NativeImageModule, 'createFromPath'>
  iconPath: string
}

export interface CareConnectTray {
  tray: Tray
  update(unreadCount: number): void
}

/** Notification-area icons are drawn at 16-24 px; a 32 px source scales down cleanly. */
const TRAY_ICON_SIZE = 32

export function createTray(options: CreateTrayOptions): CareConnectTray {
  const { show, send, quit } = options
  const image = options.nativeImage.createFromPath(options.iconPath).resize({ width: TRAY_ICON_SIZE, height: TRAY_ICON_SIZE, quality: 'best' })
  const tray = new options.Tray(image)
  let shownCount: number | null = null

  function update(unreadCount: number): void {
    if (unreadCount === shownCount) return
    shownCount = unreadCount
    tray.setToolTip(trayTooltip(unreadCount))
    tray.setContextMenu(options.Menu.buildFromTemplate(buildTrayMenuTemplate({ unreadCount, show, send, quit })))
  }

  tray.on('click', () => show())
  update(0)
  return { tray, update }
}
