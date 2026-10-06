import { screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useEffect } from 'react'
import { createMemoryApi, FIXED_NOW, type MemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import { createSeedWorkspace, patientIdFor } from '../../../../../shared/seed'
import { AppHeader } from '../../../components/AppHeader'
import type { AppState, UiSlice } from '../../../state/appState'
import { useAppState } from '../../../state/AppStateProvider'
import { TasksView } from '../TasksView'

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
        <TasksView />
      </main>
    </>
  )
}

function renderTasks(options: { api?: MemoryApi; now?: Date; initialUi?: Partial<UiSlice> } = {}) {
  return renderWithProviders(<Shell />, { keyboard: true, api: options.api, now: options.now, initialUi: { view: 'tasks', ...options.initialUi } })
}

function group(title: string): HTMLElement {
  return screen.getByRole('region', { name: title })
}

function checkboxNames(title: string): string[] {
  return within(group(title))
    .queryAllByRole('checkbox')
    .map((checkbox) => checkbox.getAttribute('id') ?? '')
}

beforeEach(() => {
  probe.state = null
})

describe('TasksView', () => {
  it('groups the tasks into Overdue, Due today and Upcoming, with Completed hidden by default', async () => {
    await renderTasks()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['Overdue', 'Due today', 'Upcoming'])
    expect(within(group('Overdue')).getByText('Nothing is overdue.')).toBeInTheDocument()
    expect(checkboxNames('Due today')).toEqual(['task-t-1', 'task-t-2', 'task-t-3', 'task-t-4'])
    expect(checkboxNames('Upcoming')).toEqual(['task-t-5', 'task-t-6', 'task-t-7'])
    expect(within(group('Due today')).getByText('4 tasks')).toBeInTheDocument()
    expect(screen.getByText(/1 completed task is hidden/)).toBeInTheDocument()
  })

  it('labels each checkbox with its task and describes when it is due and whether it is urgent', async () => {
    await renderTasks()
    const checkbox = screen.getByRole('checkbox', { name: 'Review home monitoring notes for Avery Park' })
    expect(checkbox).not.toBeChecked()
    expect(checkbox).toHaveAccessibleDescription('Due today at 10:00 Urgent')
    expect(screen.getByRole('checkbox', { name: 'Call Riley Singh with lab results' })).toHaveAccessibleDescription('Due today at 12:00')
  })

  it('marks urgent tasks with an icon and the word "Urgent", never colour alone', async () => {
    await renderTasks()
    const chips = screen.getAllByText('Urgent')
    expect(chips).toHaveLength(2)
    for (const chip of chips) {
      expect(chip).toHaveClass('chip')
      expect(chip.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('lists tasks whose time has passed as Overdue', async () => {
    await renderTasks({ now: new Date(2026, 9, 5, 10, 30) })
    expect(checkboxNames('Overdue')).toEqual(['task-t-1'])
    expect(screen.getByRole('checkbox', { name: 'Review home monitoring notes for Avery Park' })).toHaveAccessibleDescription(
      'Overdue: was due today at 10:00 Urgent'
    )
  })

  it('ticking a task marks it done, says so, and keeps focus on the next task in the list', async () => {
    const { user } = await renderTasks()
    await user.click(screen.getByRole('checkbox', { name: 'Review home monitoring notes for Avery Park' }))

    expect(current().workspace?.tasks.find((task) => task.id === 't-1')?.done).toBe(true)
    expect(checkboxNames('Due today')).toEqual(['task-t-2', 'task-t-3', 'task-t-4'])
    expect(screen.getByRole('checkbox', { name: 'Authorize refill for Jamie Wu' })).toHaveFocus()
    expect(current().ui.status?.text).toBe('Task marked done.')
    await waitFor(() => expect(liveRegionText()).toBe('Task marked done.'))
    expect(screen.getByText('3 tasks due today')).toBeInTheDocument()
  })

  it('works from the keyboard: Space toggles and focus falls back to the previous task, then the group heading', async () => {
    const { user } = await renderTasks()
    screen.getByRole('checkbox', { name: 'Update the hydration goals handout' }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('checkbox', { name: 'Schedule mobility assessment for Rowan Hughes' })).toHaveFocus()
    await user.keyboard(' ')
    await user.keyboard(' ')
    expect(checkboxNames('Upcoming')).toEqual([])
    expect(within(group('Upcoming')).getByRole('heading', { name: 'Upcoming' })).toHaveFocus()
    expect(within(group('Upcoming')).getByText('No upcoming tasks.')).toBeInTheDocument()
  })

  it('moves a finished task to Completed when shown, and reopening it says so', async () => {
    const { user } = await renderTasks({ initialUi: { showCompletedTasks: true } })
    expect(checkboxNames('Completed')).toEqual(['task-t-8'])
    expect(screen.queryByText(/completed task is hidden/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Call Riley Singh with lab results' }))
    expect(checkboxNames('Completed')).toEqual(['task-t-3', 'task-t-8'])
    expect(within(group('Completed')).getByRole('checkbox', { name: 'Call Riley Singh with lab results' })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Medication reconciliation for Avery Park' }))
    expect(current().ui.status?.text).toBe('Task reopened.')
    // Reopened after its due date, so it is overdue.
    expect(checkboxNames('Overdue')).toEqual(['task-t-8'])
  })

  it('the toolbar toggle and the hidden-tasks button both reveal Completed', async () => {
    const { user } = await renderTasks()
    await user.click(screen.getByRole('button', { name: 'Show 1 completed task' }))
    expect(group('Completed')).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'Show completed tasks' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(screen.queryByRole('region', { name: 'Completed' })).not.toBeInTheDocument()
  })

  it('the hidden-tasks button disappears once used, so focus moves to the Completed heading it revealed', async () => {
    const { user } = await renderTasks()
    screen.getByRole('button', { name: 'Show 1 completed task' }).focus()
    await user.keyboard('{Enter}')

    expect(screen.queryByRole('button', { name: 'Show 1 completed task' })).not.toBeInTheDocument()
    expect(within(group('Completed')).getByRole('heading', { level: 2, name: 'Completed' })).toHaveFocus()
    expect(checkboxNames('Completed')).toEqual(['task-t-8'])
  })

  it('a patient name opens that patient', async () => {
    const { user } = await renderTasks()
    const row = screen.getByRole('checkbox', { name: 'Authorize refill for Jamie Wu' }).closest('li') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Jamie Wu, Authorize refill for Jamie Wu' }))
    expect(current().ui.selectedPatientId).toBe(patientIdFor('Jamie Wu'))
    expect(current().ui.view).toBe('patients')
    expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
  })

  it('names each patient button after its task as well, so one patient’s two tasks never give two identical buttons', async () => {
    await renderTasks({ initialUi: { showCompletedTasks: true } })
    const averyButtons = screen.getAllByRole('button', { name: /^Avery Park, / })
    expect(averyButtons.map((button) => button.textContent)).toEqual(['Avery Park', 'Avery Park'])
    expect(averyButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Avery Park, Review home monitoring notes for Avery Park',
      'Avery Park, Medication reconciliation for Avery Park'
    ])
  })

  it('shows a task without a patient without a patient link', async () => {
    await renderTasks()
    const row = screen.getByRole('checkbox', { name: 'Update the hydration goals handout' }).closest('li') as HTMLElement
    expect(within(row).queryByRole('button')).not.toBeInTheDocument()
  })

  it('explains an empty task list', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.tasks = []
    await renderTasks({ api: createMemoryApi({ workspace }) })
    expect(within(group('Due today')).getByText('Nothing else is due today.')).toBeInTheDocument()
    expect(screen.queryByText(/completed tasks? (is|are) hidden/)).not.toBeInTheDocument()
  })

  it('is the main F6 region and has no axe violations', async () => {
    const { container } = await renderTasks({ initialUi: { showCompletedTasks: true } })
    expect(container.querySelector('main > [data-region="main"]')).not.toBeNull()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
