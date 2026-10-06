import type { BaseWindow, MenuItemConstructorOptions, PopupOptions } from 'electron'
import type { ContextMenuItem } from '../../shared/api'
import { FakeMenu, type FakeMenuItemOptions } from '../../../tests/mocks/electron'
import { contextMenuTemplate, type MenuFactory, scaleMenuPosition, showNativeContextMenu } from '../contextMenu'

const WINDOW = { isDestroyed: () => false } as unknown as BaseWindow

const ITEMS: ContextMenuItem[] = [
  { id: 'patient.message', label: 'Message Avery Park…', accelerator: 'M' },
  { id: 'patient.editSummary', label: 'Edit care summary…', accelerator: 'E' },
  { id: 'separator-status', label: '', type: 'separator' },
  { id: 'patient.markNeedsReview', label: 'Needs review', type: 'radio', checked: true },
  { id: 'patient.markOpen', label: 'Open', type: 'radio', checked: false },
  { id: 'patient.markCompleted', label: 'Completed', type: 'radio' },
  { id: 'separator-file', label: '', type: 'separator' },
  { id: 'show-hints', label: 'Show hints', type: 'checkbox', checked: true },
  { id: 'patient.export', label: 'Export summary…', accelerator: 'CmdOrCtrl+Shift+E', enabled: false }
]

type Behaviour = (menu: FakeMenu, options: PopupOptions) => void

/** A Menu factory whose popups behave as scripted, recording the template and popup options. */
function scriptedMenu(behaviour: Behaviour) {
  const templates: FakeMenuItemOptions[][] = []
  const popups: PopupOptions[] = []
  const factory = {
    buildFromTemplate: jest.fn((template: FakeMenuItemOptions[]) => {
      templates.push(template)
      const menu = FakeMenu.buildFromTemplate(template)
      menu.popup.mockImplementation((options: PopupOptions) => {
        popups.push(options)
        behaviour(menu, options)
      })
      return menu
    })
  }
  return { factory: factory as unknown as MenuFactory, templates, popups, buildFromTemplate: factory.buildFromTemplate }
}

function clickItem(menu: FakeMenu, id: string): void {
  const item = menu.getMenuItemById(id)
  if (!item?.click) throw new Error(`No clickable item ${id}`)
  item.click()
}

describe('contextMenuTemplate', () => {
  const template = contextMenuTemplate(ITEMS, () => {}, 'win32')

  it('maps separators to bare separators', () => {
    expect(template[2]).toEqual({ type: 'separator' })
    expect(template[6]).toEqual({ type: 'separator' })
  })

  it('keeps the type and checked state of radio and checkbox items', () => {
    expect(template[3]).toMatchObject({ id: 'patient.markNeedsReview', type: 'radio', checked: true })
    expect(template[4]).toMatchObject({ id: 'patient.markOpen', type: 'radio', checked: false })
    expect(template[5]).toMatchObject({ id: 'patient.markCompleted', type: 'radio', checked: false })
    expect(template[7]).toMatchObject({ id: 'show-hints', type: 'checkbox', checked: true })
  })

  it('shows accelerators without registering them', () => {
    expect(template[0]).toMatchObject({ accelerator: 'M', registerAccelerator: false })
    expect(template[8]).toMatchObject({ accelerator: 'CmdOrCtrl+Shift+E', registerAccelerator: false, enabled: false })
    for (const item of template) {
      if (item.accelerator) expect(item.registerAccelerator).toBe(false)
    }
  })

  it('keeps plain items normal and enabled by default', () => {
    expect(template[1]).toEqual(
      expect.objectContaining({ id: 'patient.editSummary', label: 'Edit care summary…', type: 'normal' })
    )
    expect(template[1]).not.toHaveProperty('enabled')
    expect(template[1]).not.toHaveProperty('checked')
  })

  it('escapes & so a name like "Lee & Sons" is not read as an access key on Windows and Linux', () => {
    const [item] = contextMenuTemplate([{ id: 'x', label: 'Message Lee & Sons…' }], () => {}, 'win32')
    expect(item.label).toBe('Message Lee && Sons…')
    const [mac] = contextMenuTemplate([{ id: 'x', label: 'Message Lee & Sons…' }], () => {}, 'darwin')
    expect(mac.label).toBe('Message Lee & Sons…')
  })

  it('reports the chosen id through the click handler', () => {
    const choose = jest.fn()
    const items = contextMenuTemplate(ITEMS, choose, 'win32')
    ;(items[4] as MenuItemConstructorOptions & { click: () => void }).click()
    expect(choose).toHaveBeenCalledWith('patient.markOpen')
  })
})

describe('scaleMenuPosition', () => {
  // The renderer measures in CSS pixels; menu.popup() places the menu in window DIPs.
  it('multiplies the position by the page zoom factor, so the menu opens at its anchor at 200 %', () => {
    expect(scaleMenuPosition({ items: ITEMS, x: 240, y: 318 }, 2)).toEqual({ items: ITEMS, x: 480, y: 636 })
  })

  it('rounds to whole DIPs, which menu.popup() requires', () => {
    // Zoom level 1 is 120 %: 381.6 DIPs.
    expect(scaleMenuPosition({ items: ITEMS, x: 240, y: 318 }, 1.2)).toEqual({ items: ITEMS, x: 288, y: 382 })
    // One View > Zoom In step is zoom level 0.5, a factor of 1.2 ** 0.5: 262.9 and 348.4 DIPs.
    expect(scaleMenuPosition({ items: ITEMS, x: 240, y: 318 }, 1.2 ** 0.5)).toEqual({ items: ITEMS, x: 263, y: 348 })
    expect(scaleMenuPosition({ items: ITEMS, x: 3, y: 7 }, 0.5)).toEqual({ items: ITEMS, x: 2, y: 4 })
  })

  it('leaves the position unchanged at 100 %', () => {
    expect(scaleMenuPosition({ items: ITEMS, x: 240, y: 318 }, 1)).toEqual({ items: ITEMS, x: 240, y: 318 })
  })

  it('keeps an omitted position omitted, so the menu still opens at the pointer', () => {
    const scaled = scaleMenuPosition({ items: ITEMS }, 2)
    expect(scaled).toEqual({ items: ITEMS })
    expect(scaled).not.toHaveProperty('x')
    expect(scaled).not.toHaveProperty('y')
  })

  it('treats an unusable zoom factor as 100 %', () => {
    for (const factor of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(scaleMenuPosition({ items: ITEMS, x: 240, y: 318 }, factor)).toEqual({ items: ITEMS, x: 240, y: 318 })
    }
  })

  it('does not change the request it was given', () => {
    const request = { items: ITEMS, x: 240, y: 318 }
    scaleMenuPosition(request, 2)
    expect(request).toEqual({ items: ITEMS, x: 240, y: 318 })
  })
})

describe('showNativeContextMenu', () => {
  it('resolves the clicked item id (Windows and Linux: click, then close)', async () => {
    const { factory } = scriptedMenu((menu, options) => {
      clickItem(menu, 'patient.markOpen')
      options.callback?.()
    })
    await expect(showNativeContextMenu(WINDOW, { items: ITEMS }, factory)).resolves.toBe('patient.markOpen')
  })

  it('resolves the clicked item id when the menu reports closing before the click (macOS order)', async () => {
    const { factory } = scriptedMenu((menu, options) => {
      options.callback?.()
      clickItem(menu, 'patient.editSummary')
    })
    await expect(showNativeContextMenu(WINDOW, { items: ITEMS }, factory)).resolves.toBe('patient.editSummary')
  })

  it('resolves null when the menu is dismissed', async () => {
    const { factory } = scriptedMenu((_menu, options) => options.callback?.())
    await expect(showNativeContextMenu(WINDOW, { items: ITEMS }, factory)).resolves.toBeNull()
  })

  it('pops up over the window at the requested position', async () => {
    const { factory, popups } = scriptedMenu((_menu, options) => options.callback?.())
    await showNativeContextMenu(WINDOW, { items: ITEMS, x: 240, y: 318 }, factory)
    expect(popups[0]).toMatchObject({ window: WINDOW, x: 240, y: 318 })
  })

  it('pops up at the pointer when no position is given', async () => {
    const { factory, popups } = scriptedMenu((_menu, options) => options.callback?.())
    await showNativeContextMenu(WINDOW, { items: ITEMS }, factory)
    expect(popups[0]).not.toHaveProperty('x')
    expect(popups[0]).not.toHaveProperty('y')
    expect(popups[0].window).toBe(WINDOW)
  })

  it('builds the menu from the mapped template', async () => {
    const { factory, templates } = scriptedMenu((_menu, options) => options.callback?.())
    await showNativeContextMenu(WINDOW, { items: ITEMS }, factory)
    expect(templates[0].map((item) => item.type)).toEqual([
      'normal',
      'normal',
      'separator',
      'radio',
      'radio',
      'radio',
      'separator',
      'checkbox',
      'normal'
    ])
  })

  it('resolves null without showing a menu when there is no live window', async () => {
    const { factory, buildFromTemplate } = scriptedMenu(() => {})
    await expect(showNativeContextMenu(null, { items: ITEMS }, factory)).resolves.toBeNull()
    const closed = { isDestroyed: () => true } as unknown as BaseWindow
    await expect(showNativeContextMenu(closed, { items: ITEMS }, factory)).resolves.toBeNull()
    expect(buildFromTemplate).not.toHaveBeenCalled()
  })
})
