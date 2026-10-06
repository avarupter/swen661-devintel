import type { Menu, MenuItemConstructorOptions, nativeImage as NativeImageModule, Tray } from 'electron'
import { FakeMenu, FakeNativeImage, FakeTray, mockElectron, nativeImage } from '../../../tests/mocks/electron'
import { buildTrayMenuTemplate, createTray, trayTooltip } from '../tray'

function handlers() {
  return { show: jest.fn(), send: jest.fn(), quit: jest.fn() }
}

function click(item: MenuItemConstructorOptions): void {
  ;(item.click as unknown as () => void)()
}

beforeEach(() => {
  mockElectron.reset()
})

describe('buildTrayMenuTemplate', () => {
  it('lists Open, New patient, the inbox with its unread count, and Quit', () => {
    const template = buildTrayMenuTemplate({ unreadCount: 4, ...handlers() })
    expect(template.map((item) => item.label ?? item.type)).toEqual([
      'Open CareConnect',
      'New Patient…',
      'Open Inbox (4 unread)',
      'separator',
      'Quit CareConnect'
    ])
  })

  it('shows the window for Open, and shows it before sending New patient and Open inbox', () => {
    const calls = handlers()
    const template = buildTrayMenuTemplate({ unreadCount: 0, ...calls })

    click(template[0])
    expect(calls.show).toHaveBeenCalledTimes(1)
    expect(calls.send).not.toHaveBeenCalled()

    click(template[1])
    expect(calls.send).toHaveBeenLastCalledWith({ id: 'patient.new' })
    click(template[2])
    expect(calls.send).toHaveBeenLastCalledWith({ id: 'navigate.inbox' })
    expect(calls.show).toHaveBeenCalledTimes(3)
    expect(calls.show.mock.invocationCallOrder[1]).toBeLessThan(calls.send.mock.invocationCallOrder[0])
    expect(calls.quit).not.toHaveBeenCalled()
  })

  it('quits from Quit CareConnect', () => {
    const calls = handlers()
    click(buildTrayMenuTemplate({ unreadCount: 0, ...calls })[4])
    expect(calls.quit).toHaveBeenCalledTimes(1)
  })
})

describe('trayTooltip', () => {
  it('names the unread count, singular for one message', () => {
    expect(trayTooltip(0)).toBe('CareConnect — 0 unread messages')
    expect(trayTooltip(1)).toBe('CareConnect — 1 unread message')
    expect(trayTooltip(4)).toBe('CareConnect — 4 unread messages')
  })
})

describe('createTray', () => {
  function setup() {
    const calls = handlers()
    const result = createTray({
      Tray: FakeTray as unknown as typeof Tray,
      Menu: FakeMenu as unknown as typeof Menu,
      nativeImage: nativeImage as unknown as typeof NativeImageModule,
      iconPath: '/opt/careconnect/resources/icon.png',
      ...calls
    })
    const tray = result.tray as unknown as FakeTray
    return { ...calls, ...result, fake: tray }
  }

  function menuLabels(tray: FakeTray): string[] {
    return (tray.contextMenu as FakeMenu).items.map((item) => item.label)
  }

  it('creates one tray icon from the app icon, sized for the notification area', () => {
    const { fake } = setup()
    expect(FakeTray.instances).toEqual([fake])
    expect(nativeImage.createFromPath).toHaveBeenCalledWith('/opt/careconnect/resources/icon.png')
    const image = fake.image as FakeNativeImage
    expect(image.resize).toHaveBeenCalledWith({ width: 32, height: 32, quality: 'best' })
  })

  it('starts with no unread messages in the tooltip and the menu', () => {
    const { fake } = setup()
    expect(fake.toolTip).toBe('CareConnect — 0 unread messages')
    expect(menuLabels(fake)).toContain('Open Inbox (0 unread)')
  })

  it('updates the tooltip and the menu when the unread count changes', () => {
    const { fake, update } = setup()
    update(4)
    expect(fake.toolTip).toBe('CareConnect — 4 unread messages')
    expect(menuLabels(fake)).toContain('Open Inbox (4 unread)')
    update(1)
    expect(fake.toolTip).toBe('CareConnect — 1 unread message')
  })

  it('does not rebuild the menu when the count is unchanged', () => {
    const { fake, update } = setup()
    update(4)
    const built = FakeMenu.buildFromTemplate.mock.calls.length
    update(4)
    expect(FakeMenu.buildFromTemplate.mock.calls.length).toBe(built)
    expect(fake.setToolTip).toHaveBeenCalledTimes(2)
  })

  it('shows the window when the tray icon is clicked', () => {
    const { fake, show } = setup()
    fake.emit('click')
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('sends commands and quits from its menu', () => {
    const { fake, send, quit } = setup()
    const menu = fake.contextMenu as FakeMenu
    menu.items[1].click?.()
    expect(send).toHaveBeenCalledWith({ id: 'patient.new' })
    menu.items[4].click?.()
    expect(quit).toHaveBeenCalled()
  })
})
