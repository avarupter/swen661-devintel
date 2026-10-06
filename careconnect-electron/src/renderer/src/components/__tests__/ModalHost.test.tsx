/**
 * ModalHost (src/renderer/src/dialogs/ModalHost.tsx) in the assembled app:
 * every modal kind opens through its command as a single dialog over the
 * inert shell, and closing it returns focus to the control that had it
 * (spec card 01). Only the plan's contract is assumed: each dialog uses the
 * shared Dialog, so it has role="dialog" and closes on Esc.
 */
import { act, screen, waitFor, within } from '@testing-library/react'
import type { AppCommand } from '../../../../shared/commands'
import { renderApp } from '../../../../../tests/renderer/renderApp'

const OPENERS: [kind: string, command: AppCommand][] = [
  ['palette', { id: 'app.commandPalette' }],
  ['shortcuts', { id: 'app.shortcuts' }],
  ['help', { id: 'app.help' }],
  ['settings', { id: 'app.settings' }],
  ['newPatient', { id: 'patient.new' }],
  ['addNote', { id: 'patient.addNote', patientId: 'p-avery-park' }],
  ['editSummary', { id: 'patient.editSummary', patientId: 'p-avery-park' }],
  ['compose', { id: 'message.new' }]
]

describe('ModalHost', () => {
  it.each(OPENERS)('opens the %s modal as one dialog over an inert shell, and Esc returns focus to the opener', async (_kind, command) => {
    const { api, user } = await renderApp({ initialUi: { view: 'overview' } })
    const opener = within(screen.getByRole('navigation', { name: 'Workspace' })).getByRole('button', { name: 'Schedule' })
    opener.focus()

    act(() => api.emitCommand(command))
    const dialog = await screen.findByRole('dialog')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(document.querySelector('.app-shell')).toHaveAttribute('inert')
    expect(document.querySelector('.app-shell')).not.toContainElement(dialog)
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.querySelector('.app-shell')).not.toHaveAttribute('inert')
    expect(opener).toHaveFocus()
  })

  it('renders nothing while no modal is open', async () => {
    await renderApp()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.app-shell')).not.toHaveAttribute('inert')
  })
})
