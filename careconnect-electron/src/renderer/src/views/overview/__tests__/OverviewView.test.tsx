import { screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useEffect } from 'react'
import { createMemoryApi, FIXED_NOW, type MemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import { createSeedWorkspace, patientIdFor } from '../../../../../shared/seed'
import { AppHeader } from '../../../components/AppHeader'
import type { AppState, UiSlice } from '../../../state/appState'
import { useAppState } from '../../../state/AppStateProvider'
import { statusCounts, tasksDueToday, unreadCount } from '../../../state/selectors'
import { OverviewView } from '../OverviewView'

const probe: { state: AppState | null } = { state: null }

function StateProbe(): null {
  const state = useAppState()
  useEffect(() => {
    probe.state = state
  })
  return null
}

function current(): AppState {
  if (!probe.state) throw new Error('The state probe has not rendered')
  return probe.state
}

function Shell(): React.JSX.Element {
  return (
    <>
      <StateProbe />
      <AppHeader />
      <main id="main" aria-labelledby="view-title">
        <OverviewView />
      </main>
    </>
  )
}

function renderOverview(options: { api?: MemoryApi; initialUi?: Partial<UiSlice> } = {}) {
  return renderWithProviders(<Shell />, {
    keyboard: true,
    api: options.api,
    initialUi: { view: 'overview', selectedPatientId: patientIdFor('Morgan Chen'), ...options.initialUi }
  })
}

beforeEach(() => {
  probe.state = null
})

describe('OverviewView', () => {
  it('shows stat cards whose counts match the workspace, each named with its count', async () => {
    await renderOverview()
    const seed = createSeedWorkspace(FIXED_NOW)
    const counts = statusCounts(seed.patients)
    const cards = within(screen.getByRole('region', { name: 'At a glance' })).getAllByRole('button')
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual([
      `Needs review: ${counts['needs-review']} patients`,
      `Open: ${counts.open} patients`,
      `Completed: ${counts.completed} patients`,
      `Unread messages: ${unreadCount(seed.conversations)}`,
      `Tasks due today: ${tasksDueToday(seed.tasks, FIXED_NOW).length}`
    ])
    expect(cards[0]).toHaveAccessibleName('Needs review: 8 patients')
    expect(cards[0]).toHaveTextContent(/Needs review\s*8\s*patients/)
  })

  it('Needs review opens Patients filtered to Needs review, clearing any search, and announces it', async () => {
    const { user } = await renderOverview({ initialUi: { patientQuery: 'riley' } })
    await user.click(screen.getByRole('button', { name: 'Needs review: 8 patients' }))

    expect(current().ui).toMatchObject({ view: 'patients', statusFilter: 'needs-review', patientQuery: '' })
    expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter patient list, showing Needs review' })).toBeInTheDocument()
    await waitFor(() => expect(liveRegionText()).toBe('Showing Needs review patients, 8 results.'))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
  })

  it('the other cards open their filter, the Inbox and Tasks', async () => {
    const { user } = await renderOverview()
    await user.click(screen.getByRole('button', { name: 'Completed: 8 patients' }))
    expect(current().ui).toMatchObject({ view: 'patients', statusFilter: 'completed' })
  })

  it('Unread messages opens the Inbox', async () => {
    const { user } = await renderOverview()
    await user.click(screen.getByRole('button', { name: 'Unread messages: 4' }))
    expect(current().ui.view).toBe('inbox')
    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument()
  })

  it('Tasks due today opens Tasks', async () => {
    const { user } = await renderOverview()
    await user.click(screen.getByRole('button', { name: 'Tasks due today: 4' }))
    expect(current().ui.view).toBe('tasks')
  })

  it('lists today’s visits with time, reason and status; a name opens that patient', async () => {
    const { user } = await renderOverview()
    const visits = screen.getByRole('region', { name: 'Today’s visits' })
    const rows = within(within(visits).getByRole('list')).getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('10:30')
    expect(rows[0]).toHaveTextContent('Wellness follow-up')
    expect(rows[0]).toHaveTextContent('Needs review')

    await user.click(within(visits).getByRole('button', { name: 'Avery Park, visit at 10:30' }))
    expect(current().ui.selectedPatientId).toBe(patientIdFor('Avery Park'))
    expect(current().ui.view).toBe('patients')
  })

  it('lists patients with a follow-up alert under Needs attention, soonest visit first', async () => {
    const { user } = await renderOverview()
    const attention = screen.getByRole('region', { name: 'Needs attention' })
    const buttons = within(attention).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Avery Park',
      'Casey Morgan',
      'Kai Thompson',
      'Blake Murphy',
      'Quinn Foster',
      'Marlowe Ito',
      'Dakota Shah',
      'Rory Okoye'
    ])
    const avery = within(attention).getByRole('button', { name: 'Avery Park, Follow-up due today' })
    const row = avery.closest('li') as HTMLElement
    expect(row).toHaveTextContent('Review home monitoring notes before the 10:30 check-in.')
    expect(row).toHaveTextContent('Next visit Today, 10:30')

    await user.click(within(attention).getByRole('button', { name: 'Kai Thompson, Review needed' }))
    expect(current().ui.selectedPatientId).toBe(patientIdFor('Kai Thompson'))
  })

  it('explains empty sections', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.patients = workspace.patients.map((patient) => ({ ...patient, nextVisit: null, alert: null }))
    await renderOverview({ api: createMemoryApi({ workspace }) })
    expect(within(screen.getByRole('region', { name: 'Today’s visits' })).getByText('No visits today.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Needs attention' })).getByText('No follow-up alerts. Every patient is up to date.')).toBeInTheDocument()
  })

  it('shows "No visit scheduled" for an alert without a visit', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.patients = workspace.patients.map((patient) => (patient.name === 'Avery Park' ? { ...patient, nextVisit: null } : patient))
    await renderOverview({ api: createMemoryApi({ workspace }) })
    const attention = screen.getByRole('region', { name: 'Needs attention' })
    const rows = within(within(attention).getByRole('list')).getAllByRole('listitem')
    expect(rows.at(-1)).toHaveTextContent('Avery Park')
    expect(rows.at(-1)).toHaveTextContent('No visit scheduled')
  })

  it('is the main F6 region and has no axe violations', async () => {
    const { container } = await renderOverview()
    expect(container.querySelector('main > [data-region="main"]')).not.toBeNull()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
