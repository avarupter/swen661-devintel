/**
 * The keyboard model in the assembled app: App mounts the window key handler,
 * mirrors hint visibility onto <html>, and ModalHost returns focus when a
 * layer closes. These tests rely only on the shell contract in the plan
 * (region names, view titles, the palette's dialog title).
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import { renderApp } from '../../../../../tests/renderer/renderApp'
import { regionOf } from '../regions'

const regionOfFocus = (): string | undefined => regionOf(document.activeElement)?.dataset.region

function pressF6(times: number, shiftKey = false): (string | undefined)[] {
  return Array.from({ length: times }, () => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'F6', shiftKey })
    return regionOfFocus()
  })
}

describe('keyboard in the assembled app', () => {
  it('reveals shortcut hints on <html> only while Alt is held, when hints are turned off', async () => {
    const api = createMemoryApi()
    api.workspace.preferences.showShortcutHints = false
    await renderApp({ api })
    expect(document.documentElement.dataset.hints).toBe('off')
    fireEvent.keyDown(document.body, { key: 'Alt', altKey: true })
    expect(document.documentElement.dataset.hints).toBe('on')
    fireEvent.keyUp(document.body, { key: 'Alt' })
    expect(document.documentElement.dataset.hints).toBe('off')
  })

  it('keeps hints on when "Show shortcut hints" is on, whatever Alt does', async () => {
    await renderApp()
    expect(document.documentElement.dataset.hints).toBe('on')
    fireEvent.keyDown(document.body, { key: 'Alt', altKey: true })
    fireEvent.keyUp(document.body, { key: 'Alt' })
    expect(document.documentElement.dataset.hints).toBe('on')
  })

  it('Ctrl+K opens the command palette over an inert shell, and Esc returns focus to where it was', async () => {
    const { user } = await renderApp({ initialUi: { view: 'overview' } })
    const opener = within(screen.getByRole('navigation', { name: 'Workspace' })).getByRole('button', { name: 'Schedule' })
    opener.focus()
    await user.keyboard('{Control>}k{/Control}')
    const dialog = await screen.findByRole('dialog', { name: 'Command palette' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    expect(document.querySelector('.app-shell')).toHaveAttribute('inert')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.querySelector('.app-shell')).not.toHaveAttribute('inert')
    expect(opener).toHaveFocus()
  })

  it('F6 and Shift+F6 move through the regions of a single-pane view', async () => {
    await renderApp({ initialUi: { view: 'overview' } })
    expect(pressF6(5)).toEqual(['navigation', 'toolbar', 'main', 'status', 'navigation'])
    expect(pressF6(4, true)).toEqual(['status', 'main', 'toolbar', 'navigation'])
  })

  it('F6 visits the patient list and the detail pane in the Patients view', async () => {
    await renderApp({ initialUi: { view: 'patients' } })
    expect(pressF6(6)).toEqual(['navigation', 'toolbar', 'list', 'detail', 'status', 'navigation'])
  })

  it('G then I opens the Inbox and moves focus to its title', async () => {
    const { user } = await renderApp({ initialUi: { view: 'patients' } })
    await user.keyboard('gi')
    expect(await screen.findByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toHaveFocus())
  })

  it('after G then I, F6 goes on from the view title to the toolbar, and Shift+F6 back to the navigation', async () => {
    const { user } = await renderApp({ initialUi: { view: 'patients' } })
    await user.keyboard('gi')
    const title = await screen.findByRole('heading', { level: 1, name: 'Inbox' })
    await waitFor(() => expect(title).toHaveFocus())
    expect(regionOfFocus()).toBeUndefined()

    await user.keyboard('{F6}')
    expect(regionOfFocus()).toBe('toolbar')
    expect(screen.getByRole('toolbar', { name: 'Inbox tools' })).toContainElement(document.activeElement as HTMLElement)

    title.focus()
    await user.keyboard('{Shift>}{F6}{/Shift}')
    expect(regionOfFocus()).toBe('navigation')
  })

  it.each([
    ['overview', 'main'],
    ['patients', 'list']
  ] as const)('after "Skip to main workspace" in %s, F6 enters the view’s first region (%s)', async (view, region) => {
    const { user } = await renderApp({ initialUi: { view } })
    await user.click(screen.getByText('Skip to main workspace'))
    expect(document.getElementById('main')).toHaveFocus()
    await user.keyboard('{F6}')
    expect(regionOfFocus()).toBe(region)
  })
})
