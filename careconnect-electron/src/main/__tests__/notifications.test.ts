import type { Notification } from 'electron'
import { FakeNotification, mockElectron } from '../../../tests/mocks/electron'
import { activeNotificationCount, showNotification } from '../notifications'

const ICON = '/opt/careconnect/resources/icon.png'

function show(request: { title: string; body: string; patientId?: string }) {
  const onClick = jest.fn()
  const shown = showNotification({ Notification: FakeNotification as unknown as typeof Notification, iconPath: ICON, request, onClick })
  return { shown, onClick, notification: FakeNotification.instances.at(-1) }
}

beforeEach(() => {
  mockElectron.reset()
})

describe('showNotification', () => {
  it('returns false and shows nothing when the system has no notification support', () => {
    mockElectron.notificationsSupported = false
    const { shown } = show({ title: '2 follow-ups due today', body: 'Avery Park at 10:30' })
    expect(shown).toBe(false)
    expect(FakeNotification.instances).toHaveLength(0)
  })

  it('shows a notification with the title, body and app icon', () => {
    const { shown, notification } = show({ title: '2 follow-ups due today', body: 'Avery Park at 10:30 · Morgan Chen at 14:00' })
    expect(shown).toBe(true)
    expect(notification?.options).toEqual({ title: '2 follow-ups due today', body: 'Avery Park at 10:30 · Morgan Chen at 14:00', icon: ICON })
    expect(notification?.show).toHaveBeenCalledTimes(1)
  })

  it('routes a click to the patient the notification is about', () => {
    const { onClick, notification } = show({ title: '1 follow-up due today', body: 'Avery Park at 10:30', patientId: 'p-avery-park' })
    notification?.emit('click')
    expect(onClick).toHaveBeenCalledWith('p-avery-park')
  })

  it('reports a click without a patient as undefined', () => {
    const { onClick, notification } = show({ title: 'Workspace restored', body: 'Demo data was restored.' })
    notification?.emit('click')
    expect(onClick).toHaveBeenCalledWith(undefined)
  })

  it('keeps a reference until the notification is clicked, closed or fails, so its click is not lost', () => {
    const before = activeNotificationCount()
    const first = show({ title: 'One', body: '' }).notification
    const second = show({ title: 'Two', body: '' }).notification
    const third = show({ title: 'Three', body: '' }).notification
    expect(activeNotificationCount()).toBe(before + 3)
    first?.emit('click')
    second?.emit('close')
    third?.emit('failed', {}, 'toast failed')
    expect(activeNotificationCount()).toBe(before)
  })
})
