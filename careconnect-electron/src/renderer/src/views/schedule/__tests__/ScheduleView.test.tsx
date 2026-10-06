import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useEffect } from 'react'
import { createMemoryApi, FIXED_NOW, type MemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import { calendarDayOffset } from '../../../../../shared/format'
import { createSeedWorkspace, patientIdFor } from '../../../../../shared/seed'
import { AppHeader } from '../../../components/AppHeader'
import type { AppState } from '../../../state/appState'
import { useAppState } from '../../../state/AppStateProvider'
import { ScheduleView } from '../ScheduleView'

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
        <ScheduleView />
      </main>
    </>
  )
}

function renderSchedule(api?: MemoryApi) {
  return renderWithProviders(<Shell />, { keyboard: true, api, initialUi: { view: 'schedule', selectedPatientId: patientIdFor('Morgan Chen') } })
}

beforeEach(() => {
  probe.state = null
})

describe('ScheduleView', () => {
  it('lists the next seven days in order, each headed with its day', async () => {
    await renderSchedule()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Today · Mon, Oct 5',
      'Tomorrow · Tue, Oct 6',
      'Wed, Oct 7',
      'Thu, Oct 8',
      'Fri, Oct 9',
      'Sat, Oct 10',
      'Sun, Oct 11'
    ])
  })

  it('lists Avery Park at 10:30 first today, with the reason and status, and visits in time order', async () => {
    await renderSchedule()
    const today = screen.getByRole('region', { name: 'Today · Mon, Oct 5' })
    expect(within(today).getByText('3 visits')).toBeInTheDocument()
    const rows = within(within(today).getByRole('list', { name: 'Today · Mon, Oct 5' })).getAllByRole('listitem')
    expect(rows.map((row) => row.querySelector('time')?.textContent)).toEqual(['10:30', '13:00', '15:45'])
    expect(rows[0]).toHaveTextContent('Avery Park')
    expect(rows[0]).toHaveTextContent('Wellness follow-up')
    expect(rows[0]).toHaveTextContent('Needs review')
    expect(within(rows[0]).getByRole('button', { name: 'Avery Park, visit at 10:30' })).toBeInTheDocument()
  })

  it('opens a patient from their visit', async () => {
    const { user } = await renderSchedule()
    await user.click(screen.getByRole('button', { name: 'Taylor Lane, visit at 13:30' }))
    expect(current().ui.selectedPatientId).toBe(patientIdFor('Taylor Lane'))
    expect(current().ui.view).toBe('patients')
    expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
  })

  it('says when a day has no visits', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.patients = workspace.patients.map((patient) =>
      patient.nextVisit && calendarDayOffset(patient.nextVisit, FIXED_NOW) === 2 ? { ...patient, nextVisit: null } : patient
    )
    await renderSchedule(createMemoryApi({ workspace }))
    const empty = screen.getByRole('region', { name: 'Wed, Oct 7' })
    expect(within(empty).getByText('No visits scheduled.')).toBeInTheDocument()
    expect(within(empty).getByText('0 visits')).toBeInTheDocument()
    expect(within(empty).queryByRole('list')).not.toBeInTheDocument()
  })

  it('is the main F6 region and has no axe violations', async () => {
    const { container } = await renderSchedule()
    expect(container.querySelector('main > [data-region="main"]')).not.toBeNull()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
