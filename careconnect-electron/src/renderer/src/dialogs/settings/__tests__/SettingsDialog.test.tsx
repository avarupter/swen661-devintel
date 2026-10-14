import { act, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { Preferences } from '../../../../../shared/model'
import { createMemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderApp, renderWithProviders } from '../../../../../../tests/renderer/renderApp'

const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } }

async function openSettings(options: Parameters<typeof renderWithProviders>[1] = {}) {
  const rendered = await renderWithProviders(<button type="button">Somewhere else</button>, { keyboard: true, ...options })
  screen.getByRole('button', { name: 'Somewhere else' }).focus()
  await rendered.user.keyboard('{Control>},{/Control}')
  const dialog = await screen.findByRole('dialog', { name: 'Settings' })
  return { ...rendered, dialog }
}

const SWITCHES: { name: string; key: keyof Preferences; spoken: string; initially: boolean }[] = [
  { name: 'Show shortcut hints', key: 'showShortcutHints', spoken: 'Shortcut hints', initially: true },
  { name: 'High contrast theme', key: 'highContrast', spoken: 'High contrast theme', initially: false },
  { name: 'Reduce motion', key: 'reduceMotion', spoken: 'Reduce motion', initially: false },
  { name: 'Single-key shortcuts', key: 'singleKeyShortcuts', spoken: 'Single-key shortcuts', initially: true },
  { name: 'Desktop notifications for follow-ups due today', key: 'notifications', spoken: 'Desktop notifications', initially: true }
]

describe('SettingsDialog', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme
  })

  it('opens with Ctrl+, showing Display, Keyboard and Notifications switches', async () => {
    await openSettings()
    const display = screen.getByRole('group', { name: 'Display' })
    const switches = within(display).getAllByRole('switch')
    expect(switches).toHaveLength(3)
    ;['Show shortcut hints', 'High contrast theme', 'Reduce motion'].forEach((name, index) => expect(switches[index]).toHaveAccessibleName(name))
    const keyboard = screen.getByRole('group', { name: 'Keyboard' })
    expect(within(keyboard).getByRole('switch', { name: 'Single-key shortcuts' })).toBeInTheDocument()
    const notifications = screen.getByRole('group', { name: 'Notifications' })
    expect(within(notifications).getByRole('switch', { name: 'Desktop notifications for follow-ups due today' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Show shortcut hints' })).toHaveFocus()
  })

  it('reflects the saved preferences', async () => {
    await openSettings()
    for (const entry of SWITCHES) {
      const control = screen.getByRole('switch', { name: entry.name })
      expect(control).toHaveAttribute('type', 'checkbox')
      if (entry.initially) expect(control).toBeChecked()
      else expect(control).not.toBeChecked()
    }
  })

  it.each(SWITCHES)('$name changes its preference at once and announces it', async ({ name, spoken, initially }) => {
    const { user } = await openSettings()
    const control = screen.getByRole('switch', { name })
    await user.click(control)
    if (initially) expect(control).not.toBeChecked()
    else expect(control).toBeChecked()
    await waitFor(() => expect(liveRegionText('polite')).toBe(`${spoken} ${initially ? 'off' : 'on'}`))
    await user.click(control)
    if (initially) expect(control).toBeChecked()
    else expect(control).not.toBeChecked()
    await waitFor(() => expect(liveRegionText('polite')).toBe(`${spoken} ${initially ? 'on' : 'off'}`))
  })

  it('describes what each switch does', async () => {
    await openSettings()
    for (const entry of SWITCHES) expect(screen.getByRole('switch', { name: entry.name }).getAttribute('aria-describedby')).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Reduce motion' })).toHaveAccessibleDescription('Turns off animations and transitions.')
  })

  it('says where shortcut hints appear (not in the menus, which always show their keys) and names Alt', async () => {
    await openSettings()
    expect(screen.getByRole('switch', { name: 'Show shortcut hints' })).toHaveAccessibleDescription(
      'Shows shortcut keys beside buttons and the search field. Hold Alt to see them at any time.'
    )
  })

  it('explains single-key shortcuts, who should turn them off (WCAG 2.1.4), and what keeps working', async () => {
    await openSettings()
    expect(screen.getByRole('switch', { name: 'Single-key shortcuts' })).toHaveAccessibleDescription(
      'E, N, M, R, / and G-key sequences. Turn off if you use speech recognition, so spoken words never trigger commands. Ctrl shortcuts and function keys always work.'
    )
  })

  it('names the Option key on a Mac', async () => {
    await renderWithProviders(<button type="button">Somewhere else</button>, {
      keyboard: true,
      api: createMemoryApi({ platform: 'darwin' }),
      initialUi: { modal: { kind: 'settings' } }
    })
    const hints = await screen.findByRole('switch', { name: 'Show shortcut hints' })
    await waitFor(() =>
      expect(hints).toHaveAccessibleDescription('Shows shortcut keys beside buttons and the search field. Hold ⌥ to see them at any time.')
    )
  })

  it('works from the keyboard: Space toggles, Tab moves on', async () => {
    const { user } = await openSettings()
    await user.keyboard(' ')
    expect(screen.getByRole('switch', { name: 'Show shortcut hints' })).not.toBeChecked()
    await user.tab()
    expect(screen.getByRole('switch', { name: 'High contrast theme' })).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('switch', { name: 'High contrast theme' })).toBeChecked()
  })

  it('saves the change with the workspace', async () => {
    const { user, api } = await openSettings()
    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }))
    await waitFor(() => expect(api.saved.length).toBeGreaterThan(0))
    expect(api.saved[api.saved.length - 1].preferences.reduceMotion).toBe(true)
  })

  it('switches the whole app to the high contrast theme', async () => {
    const { user } = await renderApp()
    await user.keyboard('{Control>},{/Control}')
    await screen.findByRole('dialog', { name: 'Settings' })
    expect(document.documentElement.dataset.theme).toBe('default')
    await user.click(screen.getByRole('switch', { name: 'High contrast theme' }))
    expect(document.documentElement.dataset.theme).toBe('high-contrast')
    await user.click(screen.getByRole('switch', { name: 'High contrast theme' }))
    expect(document.documentElement.dataset.theme).toBe('default')
  })

  it('shows whether Windows High Contrast is on, and follows it', async () => {
    const { api } = await openSettings()
    expect(screen.getByText('Windows High Contrast: Off')).toBeInTheDocument()
    act(() => api.emitTheme({ highContrast: true, dark: false }))
    expect(screen.getByText('Windows High Contrast: On')).toBeInTheDocument()
  })

  it('reads Windows High Contrast from the app at start-up', async () => {
    const api = createMemoryApi()
    api.appInfo.highContrast = true
    await openSettings({ api })
    expect(await screen.findByText('Windows High Contrast: On')).toBeInTheDocument()
  })

  it('closes with Done and returns focus to the opener', async () => {
    const { user } = await openSettings()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Somewhere else' })).toHaveFocus()
  })

  it('closes with Escape', async () => {
    const { user } = await openSettings()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { dialog } = await openSettings()
    expect(await axe(dialog, AXE_OPTIONS)).toHaveNoViolations()
  })
})
