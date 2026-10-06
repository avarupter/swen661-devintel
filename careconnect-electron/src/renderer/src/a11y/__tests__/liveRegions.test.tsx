/**
 * Where status messages reach screen readers in the assembled app (spec cards
 * 03 and 08). The "Status" bar shows the latest message, but it sits inside
 * the app shell, which is `inert` (and so hidden from assistive technology)
 * while a dialog is open. The announcer's two live regions sit outside the
 * shell instead, so a message is still read while a dialog is open, and only
 * once, because the bar itself is not live. These tests pin that choice.
 */
import { act, screen, waitFor } from '@testing-library/react'
import { liveRegionText, renderApp } from '../../../../../tests/renderer/renderApp'

const LIVE = '[aria-live], [role="status"], [role="alert"], [role="log"]'

const shell = (): HTMLElement => document.querySelector('.app-shell') as HTMLElement

describe('live regions in the assembled app', () => {
  it('sit outside the app shell and the Status bar, so they are never inert', async () => {
    await renderApp()
    const polite = screen.getByTestId('live-polite')
    const assertive = screen.getByTestId('live-assertive')
    expect(polite).toHaveAttribute('role', 'status')
    expect(assertive).toHaveAttribute('role', 'alert')
    for (const region of [polite, assertive]) {
      expect(shell()).not.toContainElement(region)
      expect(region.closest('[inert]')).toBeNull()
    }
    const status = screen.getByRole('contentinfo', { name: 'Status' })
    expect(status).not.toHaveAttribute('aria-live')
    expect(status.querySelector(LIVE)).toBeNull()
  })

  it('still announce a status message while a dialog makes the shell inert, and only once', async () => {
    const { api } = await renderApp()
    act(() => api.emitCommand({ id: 'app.help' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(shell()).toHaveAttribute('inert')

    // A View menu toggle from the main process while the dialog is open.
    act(() => api.emitCommand({ id: 'view.toggleReduceMotion' }))
    await waitFor(() => expect(liveRegionText('polite')).toBe('Reduce motion on.'))
    const status = screen.getByRole('contentinfo', { name: 'Status', hidden: true })
    expect(status).toHaveTextContent('Reduce motion on.')
    const announcing = Array.from(document.querySelectorAll<HTMLElement>(LIVE)).filter((region) => region.textContent?.includes('Reduce motion on.'))
    expect(announcing).toEqual([screen.getByTestId('live-polite')])
  })
})
