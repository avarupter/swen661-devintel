import { act, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { validateWorkspace } from '../../../../../shared/validate'
import { liveRegionText, renderApp } from '../../../../../../tests/renderer/renderApp'

/** The "Status" footer, where status messages stay visible (the live region repeats them for screen readers). */
function statusBar(): HTMLElement {
  return screen.getByRole('contentinfo', { name: 'Status' })
}

const AVERY_PLAN = ['Confirm symptom trend and energy level', 'Review adherence to hydration goals', 'Coordinate next wellness follow-up']

function detail(): HTMLElement {
  return document.querySelector('[data-region="detail"]') as HTMLElement
}

function dialog(): HTMLElement {
  return screen.getByRole('dialog', { name: 'Edit care summary' })
}

function planInputs(): HTMLInputElement[] {
  return within(dialog()).getAllByRole('textbox', { name: /^Plan item \d+$/ }) as HTMLInputElement[]
}

function detailPlan(): string[] {
  const summary = within(detail()).getByRole('region', { name: 'Care summary' })
  const list = within(summary).queryByRole('list')
  return list ? within(list).getAllByRole('listitem').map((item) => item.textContent ?? '') : []
}

function saveButton(): HTMLElement {
  return within(dialog()).getByRole('button', { name: 'Save' })
}

async function openFromButton(patientName = 'Avery Park') {
  const rendered = await renderApp()
  if (patientName !== 'Avery Park') await rendered.user.click(screen.getByRole('option', { name: new RegExp(`^${patientName},`) }))
  const opener = within(detail()).getByRole('button', { name: `Edit care summary for ${patientName}` })
  await rendered.user.click(opener)
  await screen.findByRole('dialog', { name: 'Edit care summary' })
  return { ...rendered, opener }
}

describe('EditSummaryDialog', () => {
  it('opens with E and shows the plan and the follow-up alert for editing', async () => {
    const { user } = await renderApp()
    act(() => screen.getAllByRole('option')[0].focus())
    await user.keyboard('e')
    const opened = await screen.findByRole('dialog', { name: 'Edit care summary' })
    expect(opened).toHaveAccessibleDescription('For Avery Park · Care ID CC-1048')
    expect(planInputs().map((input) => input.value)).toEqual(AVERY_PLAN)
    expect(planInputs()[0]).toHaveFocus()
    for (const number of [1, 2, 3]) expect(within(opened).getByRole('button', { name: `Remove plan item ${number}` })).toBeInTheDocument()
    expect(within(opened).getByRole('checkbox', { name: 'Show follow-up alert' })).toBeChecked()
    expect(within(opened).getByLabelText('Title')).toHaveValue('Follow-up due today')
    expect(within(opened).getByLabelText('Title')).toBeRequired()
    expect(within(opened).getByLabelText(/^Details/)).toHaveValue('Review home monitoring notes before the 10:30 check-in.')
  })

  it('adds a plan item, focusing the new input, and saves it', async () => {
    const { user, api, opener } = await openFromButton()
    await user.click(within(dialog()).getByRole('button', { name: 'Add plan item' }))
    expect(planInputs()).toHaveLength(4)
    expect(planInputs()[3]).toHaveFocus()
    expect(planInputs()[3]).toHaveAccessibleName('Plan item 4')
    await user.keyboard('Book a nutrition consult')
    await user.click(saveButton())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(detailPlan()).toEqual([...AVERY_PLAN, 'Book a nutrition consult'])
    expect(within(detail()).getByText('Care summary updated')).toBeInTheDocument()
    expect(within(statusBar()).getByText('Care summary updated for Avery Park.')).toBeInTheDocument()
    await waitFor(() => expect(liveRegionText()).toBe('Care summary updated for Avery Park.'))
    await waitFor(() => expect(opener).toHaveFocus())

    await waitFor(() => expect(api.saved.length).toBeGreaterThan(0))
    expect(() => validateWorkspace(api.saved[api.saved.length - 1])).not.toThrow()
  })

  it('removes a plan item, moving focus to the row that takes its place', async () => {
    const { user } = await openFromButton()
    await user.click(within(dialog()).getByRole('button', { name: 'Remove plan item 2' }))
    expect(planInputs().map((input) => input.value)).toEqual([AVERY_PLAN[0], AVERY_PLAN[2]])
    expect(planInputs()[1]).toHaveFocus()
    expect(planInputs()[1]).toHaveAccessibleName('Plan item 2')
    await waitFor(() => expect(liveRegionText()).toBe('Plan item 2 removed.'))

    // Removing the last row moves focus up; removing every row lands on "Add plan item".
    await user.click(within(dialog()).getByRole('button', { name: 'Remove plan item 2' }))
    expect(planInputs()[0]).toHaveFocus()
    await user.click(within(dialog()).getByRole('button', { name: 'Remove plan item 1' }))
    expect(within(dialog()).queryAllByRole('textbox', { name: /^Plan item/ })).toHaveLength(0)
    expect(within(dialog()).getByRole('button', { name: 'Add plan item' })).toHaveFocus()
    expect(within(dialog()).getByText('No plan items. Use “Add plan item” to add one.')).toBeInTheDocument()

    await user.click(saveButton())
    expect(detailPlan()).toEqual([])
    expect(within(detail()).getByText('No plan items yet.')).toBeInTheDocument()
  })

  it('drops empty plan rows and trims the rest on save', async () => {
    const { user, api } = await openFromButton()
    await user.click(within(dialog()).getByRole('button', { name: 'Add plan item' }))
    await user.click(within(dialog()).getByRole('button', { name: 'Add plan item' }))
    await user.type(planInputs()[4], '   ')
    await user.clear(planInputs()[0])
    await user.type(planInputs()[0], '  Recheck blood pressure  ')
    await user.click(saveButton())
    expect(detailPlan()).toEqual(['Recheck blood pressure', AVERY_PLAN[1], AVERY_PLAN[2]])
    await waitFor(() => expect(api.saved.length).toBeGreaterThan(0))
    expect(() => validateWorkspace(api.saved[api.saved.length - 1])).not.toThrow()
  })

  it('clearing "Show follow-up alert" removes the callout from the care summary', async () => {
    const { user } = await openFromButton()
    expect(within(detail()).getByText('Follow-up due today')).toBeInTheDocument()
    await user.click(within(dialog()).getByRole('checkbox', { name: 'Show follow-up alert' }))
    expect(within(dialog()).queryByLabelText('Title')).not.toBeInTheDocument()
    await user.click(saveButton())
    expect(within(detail()).queryByText('Follow-up due today')).not.toBeInTheDocument()
    expect(within(detail()).getByText('Care summary updated')).toBeInTheDocument()
  })

  it('adds an alert to a patient without one, and requires its title', async () => {
    const { user } = await openFromButton('Morgan Chen')
    const show = within(dialog()).getByRole('checkbox', { name: 'Show follow-up alert' })
    expect(show).not.toBeChecked()
    await user.click(show)
    const title = within(dialog()).getByLabelText('Title')
    expect(title).toHaveValue('')
    await user.click(saveButton())

    const summary = screen.getByRole('alert', { name: 'There is a problem' })
    expect(summary).toHaveFocus()
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription('Error: Enter a title for the follow-up alert.')
    await user.click(within(summary).getByRole('link', { name: 'Enter a title for the follow-up alert.' }))
    expect(title).toHaveFocus()

    await user.type(title, 'Call after exercise review')
    await user.type(within(dialog()).getByLabelText(/^Details/), 'Check how the new goals feel.')
    await user.click(saveButton())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(detail()).getByText('Call after exercise review')).toBeInTheDocument()
    expect(within(detail()).getByText('Check how the new goals feel.')).toBeInTheDocument()
  })

  it('saving without changes closes without logging an update', async () => {
    const { user } = await openFromButton()
    await user.click(saveButton())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(detail()).queryByText('Care summary updated')).not.toBeInTheDocument()
    expect(within(statusBar()).getByText('No changes to the care summary.')).toBeInTheDocument()
  })

  it('explains when the patient no longer exists', async () => {
    const { user } = await renderApp({ initialUi: { modal: { kind: 'editSummary', patientId: 'p-not-in-the-list' } } })
    const opened = screen.getByRole('dialog', { name: 'Edit care summary' })
    expect(opened).toHaveTextContent('That patient is no longer in the list.')
    await user.click(within(opened).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape discards edits and returns focus to the opener', async () => {
    const { user, opener } = await openFromButton()
    await user.click(within(dialog()).getByRole('button', { name: 'Remove plan item 1' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
    expect(detailPlan()).toEqual(AVERY_PLAN)
  })

  it('has no axe violations, with and without errors', async () => {
    const { user } = await openFromButton('Morgan Chen')
    expect(await axe(dialog(), { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
    await user.click(within(dialog()).getByRole('checkbox', { name: 'Show follow-up alert' }))
    await user.click(saveButton())
    expect(await axe(dialog(), { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
