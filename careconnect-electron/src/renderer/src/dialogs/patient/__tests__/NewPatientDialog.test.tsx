import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { validateWorkspace } from '../../../../../shared/validate'
import { renderApp } from '../../../../../../tests/renderer/renderApp'

/** The "Status" footer, where status messages stay visible (the live region repeats them for screen readers). */
function statusBar(): HTMLElement {
  return screen.getByRole('contentinfo', { name: 'Status' })
}

const NAME_ERROR = 'Enter the patient’s full name.'
const REASON_ERROR = 'Enter a reason for the visit.'
const DATE_ERROR = 'Visit date is required. Enter a date, or choose “Schedule later.”'

async function openDialog() {
  const rendered = await renderApp()
  const opener = screen.getByRole('button', { name: 'New patient' })
  await rendered.user.click(opener)
  const dialog = await screen.findByRole('dialog', { name: 'New patient' })
  return { ...rendered, dialog, opener }
}

function field(name: string | RegExp): HTMLElement {
  return within(screen.getByRole('dialog')).getByLabelText(name)
}

function submitButton(): HTMLElement {
  return within(screen.getByRole('dialog')).getByRole('button', { name: /^Add patient/ })
}

describe('NewPatientDialog', () => {
  it('opens with Ctrl+N with focus in Full name and the documented fields and defaults', async () => {
    const { user } = await renderApp()
    await user.keyboard('{Control>}n{/Control}')
    const dialog = await screen.findByRole('dialog', { name: 'New patient' })
    expect(field('Full name')).toHaveFocus()
    expect(field('Full name')).toBeRequired()
    expect(field('Reason for visit')).toBeRequired()
    expect(field('Visit date')).toHaveAttribute('type', 'date')
    expect(field('Visit date')).toBeRequired()
    expect(field('Visit date')).toHaveAttribute('min', '2026-10-05')
    expect(field('Visit time')).toHaveAttribute('type', 'time')
    expect(field('Visit time')).toHaveValue('09:00')
    expect(field('Schedule later')).not.toBeChecked()

    const pronouns = field('Pronouns')
    expect(within(pronouns).getAllByRole('option').map((option) => option.textContent)).toEqual(['they/them', 'she/her', 'he/him', 'Not recorded'])
    expect(pronouns).toHaveDisplayValue('Not recorded')
    const ageGroup = field('Age group')
    expect(within(ageGroup).getAllByRole('option').map((option) => option.textContent)).toEqual(['Adult', 'Older adult', 'Young adult'])
    expect(ageGroup).toHaveDisplayValue('Adult')

    const status = within(dialog).getByRole('group', { name: 'Status' })
    expect(within(status).getByRole('radio', { name: 'Open' })).toBeChecked()
    expect(within(status).getByRole('radio', { name: 'Needs review' })).not.toBeChecked()
    expect(dialog).toHaveAccessibleDescription(/synthetic/i)
  })

  it('submitting empty focuses an error summary that links to each invalid field', async () => {
    const { user } = await openDialog()
    await user.click(submitButton())

    const summary = screen.getByRole('alert', { name: 'There are 3 problems' })
    expect(summary).toHaveFocus()
    expect(summary).toHaveClass('error-summary')
    expect(summary).toHaveAttribute('tabindex', '-1')
    const links = within(summary).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([NAME_ERROR, REASON_ERROR, DATE_ERROR])

    for (const [label, message] of [
      ['Full name', NAME_ERROR],
      ['Reason for visit', REASON_ERROR],
      ['Visit date', DATE_ERROR]
    ]) {
      expect(field(label)).toHaveAttribute('aria-invalid', 'true')
      expect(field(label)).toHaveAccessibleDescription(`Error: ${message}`)
    }
    expect(field('Pronouns')).not.toHaveAttribute('aria-invalid')
  })

  it('each summary link moves focus to its field', async () => {
    const { user } = await openDialog()
    await user.click(submitButton())
    const summary = screen.getByRole('alert', { name: 'There are 3 problems' })

    await user.click(within(summary).getByRole('link', { name: REASON_ERROR }))
    expect(field('Reason for visit')).toHaveFocus()
    await user.click(within(summary).getByRole('link', { name: DATE_ERROR }))
    expect(field('Visit date')).toHaveFocus()
    // Keyboard activation works the same way.
    act(() => within(summary).getByRole('link', { name: NAME_ERROR }).focus())
    await user.keyboard('{Enter}')
    expect(field('Full name')).toHaveFocus()
  })

  it('keeps entered values after a failed submit and says "There is a problem" for one error', async () => {
    const { user } = await openDialog()
    await user.type(field('Full name'), 'Sam Rowe')
    await user.selectOptions(field('Pronouns'), 'she/her')
    await user.click(within(screen.getByRole('dialog')).getByRole('radio', { name: 'Needs review' }))
    await user.click(field('Schedule later'))
    await user.click(submitButton())

    const summary = screen.getByRole('alert', { name: 'There is a problem' })
    expect(within(summary).getAllByRole('link').map((link) => link.textContent)).toEqual([REASON_ERROR])
    expect(field('Full name')).toHaveValue('Sam Rowe')
    expect(field('Full name')).not.toHaveAttribute('aria-invalid')
    expect(field('Pronouns')).toHaveDisplayValue('she/her')
    expect(within(screen.getByRole('dialog')).getByRole('radio', { name: 'Needs review' })).toBeChecked()
    expect(field('Schedule later')).toBeChecked()
  })

  it('"Schedule later" removes the date error and disables the date and time', async () => {
    const { user } = await openDialog()
    await user.click(submitButton())
    expect(field('Visit date')).toHaveAttribute('aria-invalid', 'true')

    await user.click(field('Schedule later'))
    expect(field('Visit date')).not.toHaveAttribute('aria-invalid')
    expect(field('Visit date')).toBeDisabled()
    expect(field('Visit date')).not.toBeRequired()
    expect(field('Visit time')).toBeDisabled()
    const summary = screen.getByRole('alert', { name: 'There are 2 problems' })
    expect(within(summary).queryByRole('link', { name: DATE_ERROR })).not.toBeInTheDocument()
  })

  it('rejects a visit date in the past', async () => {
    const { user } = await openDialog()
    await user.type(field('Full name'), 'Sam Rowe')
    await user.type(field('Reason for visit'), 'Check-in')
    fireEvent.change(field('Visit date'), { target: { value: '2026-10-01' } })
    await user.click(submitButton())
    const summary = screen.getByRole('alert', { name: 'There is a problem' })
    expect(summary).toHaveTextContent('Enter a visit date that is today or later.')
    expect(field('Visit date')).toHaveAccessibleDescription('Error: Enter a visit date that is today or later.')
  })

  it('a valid submit adds the patient, focuses its option and reports the Care ID', async () => {
    const { user, api } = await openDialog()
    await user.type(field('Full name'), 'Sam Rowe')
    await user.selectOptions(field('Age group'), 'Older adult')
    await user.type(field('Reason for visit'), 'Mobility assessment')
    fireEvent.change(field('Visit date'), { target: { value: '2026-10-06' } })
    await user.clear(field('Visit time'))
    await user.type(field('Visit time'), '14:30')
    await user.click(within(screen.getByRole('dialog')).getByRole('radio', { name: 'Needs review' }))
    await user.click(submitButton())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const option = await screen.findByRole('option', { name: 'Sam Rowe, Mobility assessment · Today. Needs review' })
    await waitFor(() => expect(option).toHaveFocus())
    expect(option).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('option')[0]).toBe(option)
    expect(within(statusBar()).getByText('Sam Rowe added. Care ID CC-1137')).toBeInTheDocument()

    const detail = document.querySelector('[data-region="detail"]') as HTMLElement
    expect(within(detail).getByRole('heading', { level: 2, name: 'Sam Rowe' })).toBeInTheDocument()
    expect(detail.querySelector('.patient-detail__meta')?.textContent).toBe('Older adult · Care ID CC-1137')
    expect(within(detail).getByText('Tomorrow, 14:30')).toBeInTheDocument()
    expect(within(detail).getByText('Patient record created')).toBeInTheDocument()
    expect(within(detail).getByText('1 member')).toBeInTheDocument()

    // The autosaved workspace passes the main process's validator.
    await waitFor(() => expect(api.saved.length).toBeGreaterThan(0))
    const saved = api.saved[api.saved.length - 1]
    expect(() => validateWorkspace(saved)).not.toThrow()
    expect(saved.patients[0]).toMatchObject({ name: 'Sam Rowe', careId: 'CC-1137', careTeam: ['Jordan Lee, RN'], plan: [], alert: null })
  })

  it('clears a search or filter that would hide the new patient', async () => {
    const { user, api } = await renderApp()
    await user.type(screen.getByRole('searchbox', { name: 'Search list' }), 'riley')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await user.keyboard('{Control>}n{/Control}')
    await screen.findByRole('dialog', { name: 'New patient' })
    await user.type(field('Full name'), 'Sam Rowe')
    await user.type(field('Reason for visit'), 'Check-in')
    await user.click(field('Schedule later'))
    await user.click(submitButton())

    const option = await screen.findByRole('option', { name: /^Sam Rowe,/ })
    await waitFor(() => expect(option).toHaveFocus())
    expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveValue('')
    expect(api.saved).toBeDefined()
  })

  it('clears a status filter that would hide the new patient', async () => {
    const { user, api } = await renderApp()
    api.nextContextMenuChoice = 'completed'
    await act(async () => api.emitCommand({ id: 'patient.filter' }))
    await waitFor(() => expect(screen.getByText('Showing: Completed')).toBeInTheDocument())
    await user.keyboard('{Control>}n{/Control}')
    await screen.findByRole('dialog', { name: 'New patient' })
    await user.type(field('Full name'), 'Sam Rowe')
    await user.type(field('Reason for visit'), 'Check-in')
    await user.click(field('Schedule later'))
    await user.click(submitButton())
    await waitFor(() => expect(screen.getByRole('option', { name: 'Sam Rowe, Check-in · Today. Open' })).toHaveFocus())
    expect(screen.queryByText('Showing: Completed')).not.toBeInTheDocument()
  })

  it('unchecking "Schedule later" re-enables the date without restoring old errors', async () => {
    const { user } = await openDialog()
    await user.click(field('Schedule later'))
    await user.click(field('Schedule later'))
    expect(field('Visit date')).toBeEnabled()
    expect(field('Visit date')).not.toHaveAttribute('aria-invalid')
  })

  it('opens from another view and returns to Patients with the new record focused', async () => {
    const { user } = await renderApp({ initialUi: { view: 'reports' } })
    await user.keyboard('{Control>}n{/Control}')
    await screen.findByRole('dialog', { name: 'New patient' })
    await user.type(field('Full name'), 'Sam Rowe')
    await user.type(field('Reason for visit'), 'Check-in')
    await user.click(field('Schedule later'))
    await user.click(submitButton())
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('option', { name: /^Sam Rowe,/ })).toHaveFocus())
  })

  it('Escape closes without adding anything and returns focus to the opener', async () => {
    const { user, opener } = await openDialog()
    await user.type(field('Full name'), 'Sam Rowe')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
    expect(screen.queryByRole('option', { name: /^Sam Rowe,/ })).not.toBeInTheDocument()
  })

  it('Cancel closes too', async () => {
    const { user, opener } = await openDialog()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('has no axe violations, with and without errors', async () => {
    const { user, dialog } = await openDialog()
    expect(await axe(dialog, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
    await user.click(submitButton())
    expect(await axe(dialog, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
