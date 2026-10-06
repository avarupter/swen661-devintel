import { act, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { validateWorkspace } from '../../../../../shared/validate'
import { createMemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderApp } from '../../../../../../tests/renderer/renderApp'

/** The "Status" footer, where status messages stay visible (the live region repeats them for screen readers). */
function statusBar(): HTMLElement {
  return screen.getByRole('contentinfo', { name: 'Status' })
}

function detail(): HTMLElement {
  return document.querySelector('[data-region="detail"]') as HTMLElement
}

function dialog(): HTMLElement {
  return screen.getByRole('dialog', { name: 'Add clinical note' })
}

async function openFromButton(patientName = 'Avery Park') {
  const rendered = await renderApp()
  if (patientName !== 'Avery Park') await rendered.user.click(screen.getByRole('option', { name: new RegExp(`^${patientName},`) }))
  const opener = within(detail()).getByRole('button', { name: `Add note for ${patientName}` })
  await rendered.user.click(opener)
  await screen.findByRole('dialog', { name: 'Add clinical note' })
  return { ...rendered, opener }
}

describe('AddNoteDialog', () => {
  it('opens with N for the selected patient and names the patient in its description', async () => {
    const { user } = await renderApp()
    act(() => screen.getAllByRole('option')[0].focus())
    await user.keyboard('n')
    const opened = await screen.findByRole('dialog', { name: 'Add clinical note' })
    expect(opened).toHaveAccessibleDescription('For Avery Park · Care ID CC-1048')
    const type = within(opened).getByLabelText('Note type')
    expect(type).toHaveFocus()
    expect(within(type).getAllByRole('option').map((option) => option.textContent)).toEqual(['Visit note', 'Phone call', 'Care coordination'])
    expect(type).toHaveDisplayValue('Visit note')
    expect(within(opened).getByLabelText('Note')).toBeRequired()
    const clear = within(opened).getByRole('checkbox', { name: 'Clear the follow-up alert' })
    expect(clear).not.toBeChecked()
    expect(clear).toHaveAccessibleDescription('Current alert: Follow-up due today')
  })

  it('offers "Clear the follow-up alert" only when the patient has one', async () => {
    await openFromButton('Morgan Chen')
    expect(dialog()).toHaveAccessibleDescription('For Morgan Chen · Care ID CC-1052')
    expect(within(dialog()).queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('an empty submit focuses the error summary, which links to the note field', async () => {
    const { user } = await openFromButton()
    await user.click(within(dialog()).getByRole('button', { name: /^Add note/ }))
    const summary = screen.getByRole('alert', { name: 'There is a problem' })
    expect(summary).toHaveFocus()
    const note = within(dialog()).getByLabelText('Note')
    expect(note).toHaveAttribute('aria-invalid', 'true')
    expect(note).toHaveAccessibleDescription('Error: Enter the note text.')
    await user.click(within(summary).getByRole('link', { name: 'Enter the note text.' }))
    expect(note).toHaveFocus()
  })

  it('adds the note at the top of Recent activity and announces it', async () => {
    const { user, api, opener } = await openFromButton()
    await user.selectOptions(within(dialog()).getByLabelText('Note type'), 'Phone call')
    await user.type(within(dialog()).getByLabelText('Note'), 'Discussed evening readings.  ')
    await user.click(within(dialog()).getByRole('button', { name: /^Add note/ }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const activity = within(screen.getByRole('complementary', { name: 'Recent activity' })).getAllByRole('listitem')
    expect(activity).toHaveLength(4)
    expect(activity[0]).toHaveTextContent('Phone call added')
    expect(activity[0]).toHaveTextContent('Today · 09:42')
    await waitFor(() => expect(liveRegionText()).toBe('Note added for Avery Park.'))
    expect(within(statusBar()).getByText('Note added for Avery Park.')).toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
    // The follow-up alert stays unless the box is checked.
    expect(within(detail()).getByText('Follow-up due today')).toBeInTheDocument()

    await waitFor(() => expect(api.saved.length).toBeGreaterThan(0))
    const saved = api.saved[api.saved.length - 1]
    expect(() => validateWorkspace(saved)).not.toThrow()
    expect(saved.patients[0].activity[0]).toMatchObject({ kind: 'note', title: 'Phone call added', detail: 'Discussed evening readings.', author: 'Jordan Lee, RN' })
  })

  it('clears the follow-up alert when asked', async () => {
    const { user } = await openFromButton()
    await user.type(within(dialog()).getByLabelText('Note'), 'Reviewed home monitoring notes.')
    await user.click(within(dialog()).getByRole('checkbox', { name: 'Clear the follow-up alert' }))
    await user.click(within(dialog()).getByRole('button', { name: /^Add note/ }))
    await waitFor(() => expect(within(detail()).queryByText('Follow-up due today')).not.toBeInTheDocument())
    expect(within(detail()).getByText('Visit note added')).toBeInTheDocument()
  })

  it('Ctrl+Enter adds the note from the text area', async () => {
    const { user } = await openFromButton()
    await user.type(within(dialog()).getByLabelText('Note'), 'Called to confirm the visit.')
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(detail()).getByText('Visit note added')).toBeInTheDocument()
  })

  it('⌘Return adds the note on a Mac, and the button advertises it', async () => {
    const { user } = await renderApp({ api: createMemoryApi({ platform: 'darwin' }) })
    await waitFor(() => expect(within(detail()).getByRole('button', { name: 'Add note for Avery Park' })).toHaveAttribute('aria-keyshortcuts', 'N'))
    await user.click(within(detail()).getByRole('button', { name: 'Add note for Avery Park' }))
    await screen.findByRole('dialog', { name: 'Add clinical note' })
    expect(within(dialog()).getByRole('button', { name: /^Add note/ })).toHaveAttribute('aria-keyshortcuts', 'Meta+Enter')
    await user.type(within(dialog()).getByLabelText('Note'), 'Mac note.')
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(screen.getByRole('dialog', { name: 'Add clinical note' })).toBeInTheDocument()
    await user.keyboard('{Meta>}{Enter}{/Meta}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(detail()).getByText('Visit note added')).toBeInTheDocument()
  })

  it('explains when the patient no longer exists', async () => {
    const { user } = await renderApp({ initialUi: { modal: { kind: 'addNote', patientId: 'p-not-in-the-list' } } })
    const opened = screen.getByRole('dialog', { name: 'Add clinical note' })
    expect(opened).toHaveTextContent('That patient is no longer in the list.')
    await user.click(within(opened).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape closes without adding a note and returns focus to the opener', async () => {
    const { user, opener } = await openFromButton()
    await user.type(within(dialog()).getByLabelText('Note'), 'Draft text')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
    expect(within(screen.getByRole('complementary', { name: 'Recent activity' })).getAllByRole('listitem')).toHaveLength(3)
  })

  it('has no axe violations, with and without errors', async () => {
    const { user } = await openFromButton()
    expect(await axe(dialog(), { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
    await user.click(within(dialog()).getByRole('button', { name: /^Add note/ }))
    expect(await axe(dialog(), { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
