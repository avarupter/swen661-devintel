import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { createSeedWorkspace } from '../../../../../shared/seed'
import type { Patient } from '../../../../../shared/model'
import { patientContextMenuItems } from '../../../commands/patientContextMenu'
import { createMemoryApi, FIXED_NOW } from '../../../../../../tests/renderer/memoryApi'
import { renderApp } from '../../../../../../tests/renderer/renderApp'

/** The "Status" footer, where status messages stay visible (the live region repeats them for screen readers). */
function statusBar(): HTMLElement {
  return screen.getByRole('contentinfo', { name: 'Status' })
}

const seed = createSeedWorkspace(FIXED_NOW)
const avery = seed.patients.find((patient) => patient.name === 'Avery Park') as Patient

function detail(): HTMLElement {
  return document.querySelector('[data-region="detail"]') as HTMLElement
}

/** The stat card whose label is `label` ("Last contact"). */
function stat(label: string): HTMLElement {
  return within(detail()).getByText(label).closest('.patient-stat') as HTMLElement
}

/** The "Adult · they/them · Care ID CC-1048" line under the name. */
function metaLine(): HTMLElement {
  return detail().querySelector('.patient-detail__meta') as HTMLElement
}

/** The words a sighted user reads on a control: its text without aria-hidden key hints and icons, or visually hidden text. */
function visibleLabel(element: HTMLElement): string {
  const copy = element.cloneNode(true) as HTMLElement
  // What a sighted user reads: drop text only screen readers get, key hints and icons.
  copy.querySelectorAll('.visually-hidden, .key-hint, kbd, svg').forEach((node) => node.remove())
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim()
}

describe('PatientDetail', () => {
  it('shows the header: name heading, synthetic-record chip, meta line and a decorative avatar', async () => {
    await renderApp()
    const heading = within(detail()).getByRole('heading', { level: 2, name: 'Avery Park' })
    expect(heading).toHaveAttribute('id', 'patient-name-heading')
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(within(detail()).getByText('Synthetic demo record')).toHaveClass('chip', 'chip--neutral')
    expect(metaLine().textContent).toBe('Adult · they/them · Care ID CC-1048')
    // Each part is one unbreakable unit, so a narrow header wraps between parts, never inside "CC-1048".
    expect(Array.from(metaLine().querySelectorAll('.patient-detail__meta-part'), (part) => part.textContent)).toEqual(['Adult', 'they/them', 'Care ID CC-1048'])
    const avatar = within(detail()).getByText('AP')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveClass('avatar--large', 'avatar--brand')
  })

  it('shows last contact, next visit and care team stat cards', async () => {
    await renderApp()
    expect(stat('Last contact')).toHaveTextContent('Sep 30')
    expect(stat('Next visit')).toHaveTextContent('Today, 10:30')
    expect(stat('Care team')).toHaveTextContent('4 members')
  })

  it('says "Today" or "Yesterday" for a recent last contact, and "Not scheduled" without a next visit', async () => {
    const { user } = await renderApp()
    await user.click(screen.getByRole('option', { name: /^Riley Singh,/ }))
    expect(stat('Last contact')).toHaveTextContent('Yesterday')
    expect(stat('Next visit')).toHaveTextContent('Not scheduled')
  })

  it('the care team count is a disclosure that reveals the members', async () => {
    const { user } = await renderApp()
    const toggle = within(detail()).getByRole('button', { name: /^4 members/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const list = document.getElementById(toggle.getAttribute('aria-controls') ?? '') as HTMLElement
    expect(list).not.toBeVisible()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(list).toBeVisible()
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(avery.careTeam)

    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(list).not.toBeVisible()
  })

  it('shows the follow-up alert and the current plan in the care summary', async () => {
    await renderApp()
    const summary = within(detail()).getByRole('region', { name: 'Care summary' })
    expect(within(summary).getByRole('heading', { level: 3, name: 'Care summary' })).toBeInTheDocument()
    expect(within(summary).getByText('Follow-up due today')).toBeInTheDocument()
    expect(within(summary).getByText('Review home monitoring notes before the 10:30 check-in.')).toBeInTheDocument()
    expect(within(summary).getByRole('heading', { name: 'Current plan' })).toBeInTheDocument()
    const plan = within(summary).getByRole('list')
    expect(within(plan).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Confirm symptom trend and energy level',
      'Review adherence to hydration goals',
      'Coordinate next wellness follow-up'
    ])
  })

  it('lists recent activity, newest first, in a complementary landmark', async () => {
    await renderApp()
    const activity = screen.getByRole('complementary', { name: 'Recent activity' })
    expect(detail()).toContainElement(activity)
    const items = within(within(activity).getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Visit note updated')
    expect(within(items[0]).getByText('Today · 09:14')).toHaveAttribute('datetime', avery.activity[0].at)
    expect(items[1]).toHaveTextContent('Portal message')
    expect(items[1]).toHaveTextContent('Yesterday · 15:22')
    expect(items[2]).toHaveTextContent('Care task completed')
    expect(items[2]).toHaveTextContent('Sep 26 · 11:05')
  })

  it('names repeated controls with the patient and exposes their shortcuts (spec card 05)', async () => {
    await renderApp()
    const toolbar = within(detail()).getByRole('toolbar', { name: 'Actions for Avery Park' })
    const message = within(toolbar).getByRole('button', { name: 'Message Avery Park' })
    expect(message).toHaveAttribute('aria-keyshortcuts', 'M')
    const more = within(toolbar).getByRole('button', { name: 'More actions for Avery Park' })
    expect(more).toHaveAttribute('aria-haspopup', 'menu')
    expect(more).toHaveAttribute('aria-keyshortcuts', 'Shift+F10')
    expect(within(more).getByText('Shift+F10')).toHaveAttribute('aria-hidden', 'true')

    const edit = within(detail()).getByRole('button', { name: 'Edit care summary for Avery Park' })
    expect(edit).toHaveAttribute('aria-keyshortcuts', 'E')
    const addNote = within(detail()).getByRole('button', { name: 'Add note for Avery Park' })
    expect(addNote).toHaveAttribute('aria-keyshortcuts', 'N')
    expect(visibleLabel(addNote)).toBe('Add note')
  })

  it('starts every action’s accessible name with its visible label, so speech input can reach it (WCAG 2.5.3)', async () => {
    await renderApp()
    const actions = [
      within(detail()).getByRole('button', { name: 'Message Avery Park' }),
      within(detail()).getByRole('button', { name: 'More actions for Avery Park' }),
      within(detail()).getByRole('button', { name: 'Edit care summary for Avery Park' }),
      within(detail()).getByRole('button', { name: 'Add note for Avery Park' }),
      within(detail()).getByRole('button', { name: '4 members in the care team' })
    ]
    expect(actions.map(visibleLabel)).toEqual(['Message', 'More', 'Edit', 'Add note', '4 members'])
    for (const action of actions) {
      const name = (action.getAttribute('aria-label') ?? action.textContent ?? '').toLowerCase()
      expect(name.startsWith(visibleLabel(action).toLowerCase())).toBe(true)
    }
  })

  it('Message opens a message to the patient', async () => {
    const { user } = await renderApp()
    await user.click(within(detail()).getByRole('button', { name: 'Message Avery Park' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('Edit opens the care summary editor and Add note the note dialog, and focus returns to the button', async () => {
    const { user } = await renderApp()
    const edit = within(detail()).getByRole('button', { name: 'Edit care summary for Avery Park' })
    await user.click(edit)
    expect(await screen.findByRole('dialog', { name: 'Edit care summary' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(edit).toHaveFocus())

    const addNote = within(detail()).getByRole('button', { name: 'Add note for Avery Park' })
    await user.click(addNote)
    expect(await screen.findByRole('dialog', { name: 'Add clinical note' })).toBeInTheDocument()
  })

  it('More opens the patient menu below the button and runs the choice for this patient', async () => {
    const { api, user } = await renderApp()
    const more = within(detail()).getByRole('button', { name: 'More actions for Avery Park' })
    jest.spyOn(more, 'getBoundingClientRect').mockReturnValue({ left: 1180.6, bottom: 230, top: 186, right: 1290, width: 110, height: 44, x: 1180.6, y: 186, toJSON: () => ({}) })
    api.nextContextMenuChoice = 'patient.copyCareId'
    await user.click(more)
    expect(api.showContextMenu).toHaveBeenCalledWith({ items: patientContextMenuItems(avery), x: 1181, y: 230 })
    await waitFor(() => expect(api.copyText).toHaveBeenCalledWith('CC-1048'))
    expect(within(statusBar()).getByText('Care ID CC-1048 copied.')).toBeInTheDocument()
  })

  it('Shift+F10 or a right-click anywhere in the detail pane opens the same menu', async () => {
    const { api } = await renderApp()
    const plan = within(detail()).getByText('Review adherence to hydration goals')
    fireEvent.contextMenu(plan, { clientX: 900, clientY: 610 })
    expect(api.showContextMenu).toHaveBeenCalledWith({ items: patientContextMenuItems(avery), x: 900, y: 610 })

    const edit = within(detail()).getByRole('button', { name: 'Edit care summary for Avery Park' })
    act(() => edit.focus())
    fireEvent.contextMenu(edit)
    await waitFor(() => expect(api.showContextMenu).toHaveBeenLastCalledWith({ items: patientContextMenuItems(avery), x: 0, y: 0 }))
  })

  it('handles a patient with no plan, no alert and no activity', async () => {
    const api = createMemoryApi()
    api.workspace.patients[0] = { ...api.workspace.patients[0], plan: [], alert: null, activity: [], pronouns: '', nextVisit: null }
    await renderApp({ api })
    expect(within(detail()).getByText('No plan items yet.')).toBeInTheDocument()
    expect(within(detail()).queryByText('Follow-up due today')).not.toBeInTheDocument()
    expect(within(detail()).getByText('No activity yet.')).toBeInTheDocument()
    expect(metaLine().textContent).toBe('Adult · Care ID CC-1048')
    expect(stat('Next visit')).toHaveTextContent('Not scheduled')
  })

  it('shows "1 member" for a one-person care team', async () => {
    const api = createMemoryApi()
    api.workspace.patients[0] = { ...api.workspace.patients[0], careTeam: ['Jordan Lee, RN'] }
    await renderApp({ api })
    expect(stat('Care team')).toHaveTextContent('1 member')
  })

  it('shows an empty state when no patient is selected, with no patient menu', async () => {
    const { api } = await renderApp({ initialUi: { selectedPatientId: 'p-not-in-the-list' } })
    expect(within(detail()).getByText('Select a patient to see their care summary.')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Patient details' })).toBe(detail())
    expect(within(detail()).queryByRole('toolbar')).not.toBeInTheDocument()
    fireEvent.contextMenu(within(detail()).getByText('Select a patient to see their care summary.'))
    expect(api.showContextMenu).not.toHaveBeenCalled()
  })

  it('follows status changes made elsewhere', async () => {
    const { api } = await renderApp()
    act(() => api.emitCommand({ id: 'patient.markCompleted', patientId: avery.id }))
    await waitFor(() => expect(within(detail()).getByText('Status changed to Completed')).toBeInTheDocument())
  })
})
