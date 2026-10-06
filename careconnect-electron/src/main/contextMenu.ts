/**
 * Native context menus for the renderer (right-click, Shift+F10, the Menu key
 * and "More" buttons). The renderer describes the items; the main process
 * shows a real OS menu, which screen readers announce as a menu, and answers
 * with the chosen item id.
 */
import type { BaseWindow, Menu, MenuItemConstructorOptions } from 'electron'
import type { ContextMenuItem, ContextMenuRequest } from '../shared/api'

export type MenuFactory = Pick<typeof Menu, 'buildFromTemplate'>

/**
 * On Windows and Linux a single & marks an access key; labels come from data
 * (patient names), so a literal & is doubled.
 */
function escapeLabel(label: string, platform: string): string {
  return platform === 'darwin' ? label : label.replace(/&/g, '&&')
}

export function contextMenuTemplate(
  items: readonly ContextMenuItem[],
  choose: (id: string) => void,
  platform: string = process.platform
): MenuItemConstructorOptions[] {
  return items.map((item): MenuItemConstructorOptions => {
    if (item.type === 'separator') return { type: 'separator' }
    const type = item.type ?? 'normal'
    const options: MenuItemConstructorOptions = {
      id: item.id,
      label: escapeLabel(item.label, platform),
      type,
      click: () => choose(item.id)
    }
    if (item.enabled !== undefined) options.enabled = item.enabled
    if (type === 'radio' || type === 'checkbox') options.checked = item.checked ?? false
    if (item.accelerator) {
      // Shown as a hint only: the renderer owns these keys, in context.
      options.accelerator = item.accelerator
      options.registerAccelerator = false
    }
    return options
  })
}

/**
 * Converts a request's position from the page's CSS pixels, which is what the
 * renderer measures (getBoundingClientRect, clientX/Y), to window DIPs, which
 * is what `menu.popup()` takes: it ignores page zoom. Unconverted, every menu
 * opened at View > Zoom In, or at the 200 % the accessibility spec commits to,
 * lands away from its anchor. The factor is the page zoom only, never
 * devicePixelRatio, which also includes the display's scaling (150 % on many
 * Windows laptops) that DIPs already account for. popup() needs integers.
 * An omitted position stays omitted: the menu then opens at the pointer.
 */
export function scaleMenuPosition(request: ContextMenuRequest, zoomFactor: number): ContextMenuRequest {
  const factor = Number.isFinite(zoomFactor) && zoomFactor > 0 ? zoomFactor : 1
  const scaled: ContextMenuRequest = { ...request }
  if (request.x !== undefined) scaled.x = Math.round(request.x * factor)
  if (request.y !== undefined) scaled.y = Math.round(request.y * factor)
  return scaled
}

/**
 * Shows the menu over `win` and resolves with the chosen item id, or null when
 * it is dismissed. Windows and Linux report the click before the menu closes;
 * macOS can report the close first, so a dismissal is settled one tick later.
 * `request.x`/`y` are window DIPs (see scaleMenuPosition).
 */
export function showNativeContextMenu(
  win: BaseWindow | null,
  request: ContextMenuRequest,
  Menu: MenuFactory,
  platform: string = process.platform
): Promise<string | null> {
  if (!win || win.isDestroyed()) return Promise.resolve(null)
  return new Promise((resolve) => {
    let settled = false
    const settle = (choice: string | null): void => {
      if (settled) return
      settled = true
      resolve(choice)
    }
    const menu = Menu.buildFromTemplate(contextMenuTemplate(request.items, settle, platform))
    const position = request.x !== undefined && request.y !== undefined ? { x: request.x, y: request.y } : {}
    menu.popup({
      window: win,
      ...position,
      callback: () => {
        setTimeout(() => settle(null), 0)
      }
    })
  })
}
