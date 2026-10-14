import { computeAccessibleName } from 'dom-accessibility-api'
import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import { VIEW_IDS, VIEW_LABELS, type ViewId } from '../../../../shared/commands'
import { renderHarness } from '../../state/__tests__/harness'
import { AppHeader } from '../AppHeader'

const toolbarNames = (view: ViewId): string[] =>
  within(screen.getByRole('toolbar', { name: `${VIEW_LABELS[view]} tools` }))
    .getAllByRole('button')
    .map((button) => computeAccessibleName(button))

const EXPECTED: Record<ViewId, { chip: string; tools: string[] }> = {
  overview: { chip: 'Mon, Oct 5', tools: ['Command palette', 'New patient'] },
  schedule: { chip: 'Next 7 days', tools: ['Command palette', 'New patient'] },
  patients: { chip: 'Care team · 28', tools: ['Search', 'Filter patient list', 'Sort patient list, by Recent activity', 'New patient'] },
  inbox: { chip: '4 unread', tools: ['Reply', 'New message'] },
  tasks: { chip: '4 tasks due today', tools: ['Show completed tasks', 'Command palette'] },
  reports: { chip: 'Synthetic demo data', tools: ['Command palette', 'New patient'] },
  resources: { chip: 'Opens in your browser', tools: ['Command palette', 'New patient'] }
}

describe('AppHeader', () => {
  it.each(VIEW_IDS)('in %s shows the title, the subtitle chip and the view’s tools', async (view) => {
    const { container } = await renderHarness(<AppHeader />, { initialUi: { view } })
    const heading = screen.getByRole('heading', { level: 1, name: VIEW_LABELS[view] })
    expect(heading).toHaveAttribute('id', 'view-title')
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(container.querySelector('.app-header__title .chip')).toHaveTextContent(EXPECTED[view].chip)
    expect(toolbarNames(view)).toEqual(EXPECTED[view].tools)
    expect(screen.getByRole('toolbar')).toHaveAttribute('data-region', 'toolbar')
    expect(screen.getByRole('banner')).toContainElement(heading)
  })

  it('names the active filter and sort order, keeping each visible label inside the name', async () => {
    const h = await renderHarness(<AppHeader />, { initialUi: { view: 'patients' } })
    h.dispatch({ type: 'ui/setStatusFilter', filter: 'needs-review' })
    h.dispatch({ type: 'ui/setSortOrder', sortOrder: 'name' })
    // The Patients list shows the active filter ("Showing: Needs review"); the
    // button keeps the short label, so the name can say which filter is on.
    const filter = screen.getByRole('button', { name: 'Filter patient list, showing Needs review' })
    const sort = screen.getByRole('button', { name: 'Sort: Name, sort patient list' })
    expect(filter.querySelector('.button__label')).toHaveTextContent(/^Filter$/)
    expect(sort.querySelector('.button__label')).toHaveTextContent(/^Sort: Name$/)
    expect(filter).toHaveAttribute('aria-haspopup', 'menu')
    expect(sort).toHaveAttribute('aria-haspopup', 'menu')

    h.dispatch({ type: 'ui/setStatusFilter', filter: 'all' })
    h.dispatch({ type: 'ui/setSortOrder', sortOrder: 'nextVisit' })
    expect(screen.getByRole('button', { name: 'Filter patient list' }).querySelector('.button__label')).toHaveTextContent(/^Filter$/)
    expect(screen.getByRole('button', { name: 'Sort: Next visit, sort patient list' }).querySelector('.button__label')).toHaveTextContent(/^Sort: Next visit$/)

    h.dispatch({ type: 'ui/setSortOrder', sortOrder: 'recent' })
    expect(screen.getByRole('button', { name: 'Sort patient list, by Recent activity' }).querySelector('.button__label')).toHaveTextContent(/^Sort$/)
  })

  it('starts every tool’s accessible name with its visible label, for speech input (WCAG 2.5.3)', async () => {
    const h = await renderHarness(<AppHeader />)
    const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const check = (): void => {
      const buttons = within(screen.getByRole('toolbar')).getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      for (const button of buttons) {
        const visible = button.querySelector('.button__label')?.textContent?.trim() ?? ''
        expect(visible).not.toBe('')
        expect(button).toHaveAccessibleName(new RegExp(`^${escape(visible)}`))
      }
    }
    for (const view of VIEW_IDS) {
      h.dispatch({ type: 'ui/navigate', view })
      check()
    }
    h.dispatch({ type: 'ui/navigate', view: 'patients' })
    for (const filter of ['all', 'needs-review', 'open', 'completed'] as const) {
      for (const sortOrder of ['recent', 'name', 'nextVisit', 'status'] as const) {
        h.dispatch({ type: 'ui/setStatusFilter', filter })
        h.dispatch({ type: 'ui/setSortOrder', sortOrder })
        check()
      }
    }
  })

  it('lets the Patients tools run their commands', async () => {
    const h = await renderHarness(<AppHeader />, { initialUi: { view: 'patients' } })
    await h.user.click(screen.getByRole('button', { name: 'New patient' }))
    expect(h.state().ui.modal).toEqual({ kind: 'newPatient' })
  })

  it('disables Reply with a reason until a conversation is selected', async () => {
    const h = await renderHarness(<AppHeader />, { initialUi: { view: 'inbox' } })
    const reply = screen.getByRole('button', { name: 'Reply', description: 'Select a conversation to reply.' })
    expect(reply).toHaveAttribute('aria-disabled', 'true')
    await h.user.click(reply)
    expect(h.state().ui.status).toBeNull()

    h.dispatch({ type: 'ui/selectConversation', conversationId: 'c-home-monitoring' })
    expect(screen.getByRole('button', { name: 'Reply' })).not.toHaveAttribute('aria-disabled')
    await h.user.click(screen.getByRole('button', { name: 'New message' }))
    expect(h.state().ui.modal).toEqual({ kind: 'compose', patientId: null, conversationId: null, draftId: null })
  })

  it('toggles completed tasks in the Tasks view', async () => {
    const h = await renderHarness(<AppHeader />, { initialUi: { view: 'tasks' } })
    const toggle = screen.getByRole('button', { name: 'Show completed tasks' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await h.user.click(toggle)
    expect(h.state().ui.showCompletedTasks).toBe(true)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await h.user.click(screen.getByRole('button', { name: 'Command palette' }))
    expect(h.state().ui.modal).toEqual({ kind: 'palette' })
  })

  it('counts the tasks due today in the singular too', async () => {
    const api = createMemoryApi()
    for (const task of api.workspace.tasks) if (task.id !== 't-1') task.done = true
    const { container } = await renderHarness(<AppHeader />, { api, initialUi: { view: 'tasks' } })
    expect(container.querySelector('.app-header__title .chip')).toHaveTextContent('1 task due today')
  })

  it('follows navigation', async () => {
    const h = await renderHarness(<AppHeader />)
    h.dispatch({ type: 'ui/navigate', view: 'inbox' })
    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument()
    expect(toolbarNames('inbox')).toEqual(EXPECTED.inbox.tools)
  })

  it('has no axe violations', async () => {
    const { container } = await renderHarness(<AppHeader />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
