import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import { renderHarness } from '../../state/__tests__/harness'
import { Sidebar } from '../Sidebar'

const nav = (): HTMLElement => screen.getByRole('navigation', { name: 'Workspace' })

describe('Sidebar', () => {
  it('is the "Workspace" navigation landmark and the first F6 region', async () => {
    await renderHarness(<Sidebar />)
    expect(nav()).toHaveAttribute('data-region', 'navigation')
  })

  it('lists the workspace destinations, then the tools, each with its G-key hint', async () => {
    await renderHarness(<Sidebar />)
    const [workspace, tools] = within(nav()).getAllByRole('list')
    expect(workspace).toHaveAccessibleName('Workspace')
    expect(tools).toHaveAccessibleName('Tools')
    expect(within(workspace).getAllByRole('button').map((button) => button.querySelector('.nav-item__label')?.textContent)).toEqual([
      'Overview',
      'Schedule',
      'Patients',
      'Inbox',
      'Tasks'
    ])
    expect(within(tools).getAllByRole('button').map((button) => button.querySelector('.nav-item__label')?.textContent)).toEqual(['Reports', 'Resources'])
    expect(within(workspace).getByRole('button', { name: 'Patients' }).querySelector('.key-hint')).toHaveTextContent('G P')
    expect(within(tools).getByRole('button', { name: 'Reports' }).querySelector('.key-hint')).toBeNull()
  })

  it('marks the current view with aria-current, and navigates on click', async () => {
    const h = await renderHarness(<Sidebar />)
    const current = (): string[] =>
      within(nav())
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-current') === 'page')
        .map((button) => button.id)
    expect(current()).toEqual(['nav-patients'])
    await h.user.click(within(nav()).getByRole('button', { name: 'Reports' }))
    expect(h.state().ui.view).toBe('reports')
    expect(current()).toEqual(['nav-reports'])
  })

  it('announces the unread count once, as part of the Inbox name', async () => {
    const h = await renderHarness(<Sidebar />)
    expect(within(nav()).getByRole('button', { name: 'Inbox, 4 unread' })).toBeInTheDocument()
    expect(within(nav()).getByRole('button', { name: 'Inbox, 4 unread' }).querySelector('.badge')).toHaveAttribute('aria-hidden', 'true')

    h.dispatch({ type: 'conversation/setUnread', conversationId: 'c-home-monitoring', unread: false })
    expect(within(nav()).getByRole('button', { name: 'Inbox, 3 unread' })).toBeInTheDocument()

    for (const id of ['c-care-plan-question', 'c-lab-results', 'c-refill']) h.dispatch({ type: 'conversation/setUnread', conversationId: id, unread: false })
    expect(within(nav()).getByRole('button', { name: 'Inbox' })).toBeInTheDocument()
    expect(nav().querySelector('.badge')).toBeNull()
  })

  it('shows the clinic, with switching disabled and the reason given', async () => {
    const h = await renderHarness(<Sidebar />)
    expect(within(nav()).getByText('North Coast Clinic')).toBeInTheDocument()
    expect(within(nav()).getByText('Clinical operations')).toBeInTheDocument()
    const switcher = within(nav()).getByRole('button', { name: 'Switch clinic', description: 'Only one clinic is available in this demo.' })
    expect(switcher).toHaveAttribute('aria-disabled', 'true')
    const before = h.state()
    await h.user.click(switcher)
    expect(h.state()).toBe(before)
  })

  it('toggles "Always show shortcut hints" as a pressed button', async () => {
    const h = await renderHarness(<Sidebar />)
    const toggle = within(nav()).getByRole('button', { name: 'Always show shortcut hints' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await h.user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(h.state().workspace?.preferences.showShortcutHints).toBe(false)
    expect(h.state().ui.status?.text).toBe('Shortcut hints hidden. Hold Alt to see them.')
    await h.user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('explains how to see access keys, with the platform’s key name', async () => {
    await renderHarness(<Sidebar />)
    expect(within(nav()).getByText('Alt', { selector: 'kbd' })).toBeInTheDocument()
  })

  it('uses ⌥ and ⌘ on a Mac', async () => {
    await renderHarness(<Sidebar />, { api: createMemoryApi({ platform: 'darwin' }) })
    expect(await within(nav()).findByText('⌥', { selector: 'kbd' })).toBeInTheDocument()
    expect(within(nav()).getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-keyshortcuts', 'Meta+,')
  })

  it('shows the signed-in user and opens Settings', async () => {
    const h = await renderHarness(<Sidebar />)
    expect(within(nav()).getByText('Jordan Lee, RN')).toBeInTheDocument()
    expect(within(nav()).getByText('Care coordinator')).toBeInTheDocument()
    const settings = within(nav()).getByRole('button', { name: 'Settings' })
    expect(settings).toHaveAttribute('aria-keyshortcuts', 'Control+,')
    await h.user.click(settings)
    expect(h.state().ui.modal).toEqual({ kind: 'settings' })
  })

  it('has no axe violations', async () => {
    const { container } = await renderHarness(<Sidebar />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
