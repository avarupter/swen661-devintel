import { act, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import { SAVE_DEBOUNCE_MS } from '../../state/AppStateProvider'
import { liveText, renderHarness } from '../../state/__tests__/harness'
import { StatusBar } from '../StatusBar'

const bar = (): HTMLElement => screen.getByRole('contentinfo', { name: 'Status' })

afterEach(() => {
  jest.useRealTimers()
})

describe('StatusBar', () => {
  it('is the "Status" contentinfo landmark, a skip-link target and the last F6 region', async () => {
    await renderHarness(<StatusBar />)
    expect(bar()).toHaveAttribute('id', 'status-bar')
    expect(bar()).toHaveAttribute('data-region', 'status')
    expect(bar()).toHaveAttribute('tabindex', '-1')
  })

  it('is not itself a live region: the announcer reads each status message once, from outside the bar', async () => {
    const h = await renderHarness(<StatusBar />)
    act(() => h.commands().run({ id: 'view.toggleReduceMotion' }))
    expect(within(bar()).getByText('Reduce motion on.')).toBeInTheDocument()
    expect(bar()).not.toHaveAttribute('aria-live')
    expect(bar().querySelector('[aria-live], [role="status"], [role="alert"], [role="log"]')).toBeNull()

    await waitFor(() => expect(liveText('polite')).toBe('Reduce motion on.'))
    const polite = screen.getByTestId('live-polite')
    expect(polite).toHaveAttribute('role', 'status')
    expect(bar()).not.toContainElement(polite)
  })

  it('shows health and the unsaved-change count', async () => {
    const h = await renderHarness(<StatusBar />)
    expect(bar()).toHaveTextContent('All systems operational · 0 unsaved changes')
    h.dispatch({ type: 'task/toggled', taskId: 't-1' })
    expect(bar()).toHaveTextContent('All systems operational · 1 unsaved change')
    h.dispatch({ type: 'task/toggled', taskId: 't-2' })
    expect(bar()).toHaveTextContent('2 unsaved changes')
  })

  it('shows when the workspace was last synced', async () => {
    jest.useFakeTimers()
    const h = await renderHarness(<StatusBar />)
    expect(within(bar()).getByText('Synced 09:42')).toBeInTheDocument()
    h.dispatch({ type: 'task/toggled', taskId: 't-1' })
    await act(async () => {
      jest.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    })
    expect(within(bar()).getByText('Synced 09:43')).toBeInTheDocument()
    expect(bar()).toHaveTextContent('0 unsaved changes')
  })

  it('says it has not synced before the workspace has loaded', async () => {
    const api = createMemoryApi()
    api.loadWorkspace.mockImplementation(() => new Promise(() => {}))
    await renderHarness(<StatusBar />, { api, waitForLoad: false })
    expect(within(bar()).getByText('Not synced yet')).toBeInTheDocument()
  })

  it('keeps the latest status message until it is dismissed', async () => {
    const h = await renderHarness(<StatusBar />)
    expect(bar().querySelector('.status-message')).toBeNull()
    h.dispatch({ type: 'ui/setStatus', tone: 'success', text: 'Note added for Avery Park.' })
    expect(within(bar()).getByText('Note added for Avery Park.')).toBeInTheDocument()
    expect(bar().querySelector('.status-message')).toHaveClass('status-message--success')
    h.dispatch({ type: 'ui/setStatus', tone: 'warning', text: 'That link can’t be opened.' })
    expect(within(bar()).queryByText('Note added for Avery Park.')).toBeNull()
    expect(bar().querySelector('.status-message')).toHaveClass('status-message--warning')
    await h.user.click(within(bar()).getByRole('button', { name: 'Dismiss message' }))
    expect(within(bar()).queryByText('That link can’t be opened.')).toBeNull()
    expect(h.state().ui.status).toBeNull()
  })

  it('pairs every tone with an icon, never colour alone', async () => {
    const h = await renderHarness(<StatusBar />)
    for (const tone of ['info', 'success', 'warning', 'error'] as const) {
      h.dispatch({ type: 'ui/setStatus', tone, text: `A ${tone} message` })
      const message = bar().querySelector('.status-message') as HTMLElement
      expect(message).toHaveClass(`status-message--${tone}`)
      expect(message.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(message).toHaveTextContent(`A ${tone} message`)
    }
  })

  it('offers Retry save after a failed save, and retrying saves again', async () => {
    jest.useFakeTimers()
    const h = await renderHarness(<StatusBar />, { user: { advanceTimers: jest.advanceTimersByTime } })
    h.api.nextSaveError = new Error('The disk is full')
    h.dispatch({ type: 'task/toggled', taskId: 't-1' })
    await act(async () => {
      jest.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    })
    expect(bar()).toHaveTextContent('Changes not saved · 1 unsaved change')
    await h.user.click(within(bar()).getByRole('button', { name: 'Retry save' }))
    await act(async () => {
      jest.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    })
    expect(h.api.saveWorkspace).toHaveBeenCalledTimes(2)
    expect(bar()).toHaveTextContent('All systems operational · 0 unsaved changes')
    expect(within(bar()).queryByRole('button', { name: 'Retry save' })).toBeNull()
  })

  it('opens help from the Keyboard help button, which names F1', async () => {
    const h = await renderHarness(<StatusBar />)
    const help = within(bar()).getByRole('button', { name: 'Keyboard help' })
    expect(help).toHaveAttribute('aria-keyshortcuts', 'F1')
    expect(help.querySelector('.key-hint')).toHaveTextContent('F1')
    await h.user.click(help)
    expect(h.state().ui.modal).toEqual({ kind: 'help' })
  })

  it('shows the keys that can finish a pending G-sequence', async () => {
    const h = await renderHarness(<StatusBar />)
    expect(bar().querySelector('.status-bar__sequence')).toBeNull()
    h.dispatch({ type: 'ui/setPendingSequence', key: 'g' })
    const hint = bar().querySelector('.status-bar__sequence') as HTMLElement
    expect(hint).toHaveTextContent('G then O, S, P, I or T')
    expect(hint).toHaveAttribute('aria-hidden', 'true')
  })

  it('has no axe violations, with a message and a failed save showing', async () => {
    jest.useFakeTimers()
    const h = await renderHarness(<StatusBar />)
    h.api.nextSaveError = new Error('locked')
    h.dispatch({ type: 'task/toggled', taskId: 't-1' })
    await act(async () => {
      jest.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    })
    jest.useRealTimers()
    expect(await axe(h.container)).toHaveNoViolations()
  })
})
