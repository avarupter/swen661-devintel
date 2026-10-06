/**
 * App mirrors accessibility preferences onto <html> so CSS can react
 * (design section 9): the in-app high contrast theme, reduce motion, and
 * shortcut hints; and keeps the window title in step with the view.
 */
import { act, render, screen } from '@testing-library/react'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import { renderApp } from '../../../../../tests/renderer/renderApp'
import { navigateCommand, VIEW_IDS, VIEW_LABELS } from '../../../../shared/commands'
import { App } from '../../App'

const root = document.documentElement

describe('document attributes', () => {
  it('start from the defaults', async () => {
    await renderApp()
    expect(root.dataset.theme).toBe('default')
    expect(root.dataset.motion).toBe('system')
    expect(root.dataset.hints).toBe('on')
  })

  it('follow saved preferences', async () => {
    const api = createMemoryApi()
    api.workspace.preferences = { showShortcutHints: false, reduceMotion: true, highContrast: true, notifications: false }
    await renderApp({ api })
    expect(root.dataset.theme).toBe('high-contrast')
    expect(root.dataset.motion).toBe('reduce')
    expect(root.dataset.hints).toBe('off')
  })

  it('follow View menu toggles from the main process', async () => {
    const { api } = await renderApp()
    act(() => api.emitCommand({ id: 'view.toggleHighContrast' }))
    expect(root.dataset.theme).toBe('high-contrast')
    act(() => api.emitCommand({ id: 'view.toggleReduceMotion' }))
    expect(root.dataset.motion).toBe('reduce')
    act(() => api.emitCommand({ id: 'view.toggleShortcutHints' }))
    expect(root.dataset.hints).toBe('off')
    act(() => api.emitCommand({ id: 'view.toggleHighContrast' }))
    expect(root.dataset.theme).toBe('default')
  })

  it('name the window after the current view', async () => {
    const { api } = await renderApp()
    expect(document.title).toBe('Patients · CareConnect — Clinical workspace')
    for (const view of VIEW_IDS) {
      act(() => api.emitCommand({ id: navigateCommand(view) }))
      expect(await screen.findByRole('heading', { level: 1, name: VIEW_LABELS[view] })).toBeInTheDocument()
      expect(document.title).toBe(`${VIEW_LABELS[view]} · CareConnect — Clinical workspace`)
    }
  })

  it('show a status message while loading', () => {
    const api = createMemoryApi()
    api.loadWorkspace.mockImplementation(() => new Promise(() => {}))
    render(<App api={api} />)
    expect(screen.getByText('Loading CareConnect…')).toHaveAttribute('role', 'status')
  })
})
