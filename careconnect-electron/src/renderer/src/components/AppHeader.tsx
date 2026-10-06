import { VIEW_LABELS, type ViewId } from '../../../shared/commands'
import { formatWeekdayDate, pluralize, STATUS_LABELS } from '../../../shared/format'
import type { Workspace } from '../../../shared/model'
import type { UiSlice } from '../state/appState'
import { useAppDispatch, useAppState, useWorkspace } from '../state/AppStateProvider'
import { useNow } from '../state/clock'
import { tasksDueToday, unreadCount } from '../state/selectors'
import { Toolbar, ToolbarButton } from './Toolbar'

const SORT_LABELS: Record<UiSlice['sortOrder'], string> = {
  recent: 'Recent activity',
  name: 'Name',
  nextVisit: 'Next visit',
  status: 'Status'
}

function subtitleFor(view: ViewId, workspace: Workspace, now: Date): string {
  switch (view) {
    case 'patients':
      return `Care team · ${workspace.patients.length}`
    case 'inbox':
      return `${unreadCount(workspace.conversations)} unread`
    case 'tasks':
      return `${pluralize(tasksDueToday(workspace.tasks, now).length, 'task')} due today`
    case 'overview':
      return formatWeekdayDate(now, now)
    case 'schedule':
      return 'Next 7 days'
    case 'reports':
      return 'Synthetic demo data'
    case 'resources':
      return 'Opens in your browser'
  }
}

function ViewTools({ view, ui }: { view: ViewId; ui: UiSlice }): React.JSX.Element {
  const dispatch = useAppDispatch()
  switch (view) {
    case 'patients': {
      // Each accessible name starts with the visible label, so speech input can say
      // what it sees (WCAG 2.5.3). The Patients list shows the active filter
      // ("Showing: Needs review"), so the Filter button keeps its short label.
      const sortText = ui.sortOrder === 'recent' ? 'Sort' : `Sort: ${SORT_LABELS[ui.sortOrder]}`
      return (
        <>
          <ToolbarButton command="patient.search" label="Search" icon="search" hintKeys={['/']} />
          <ToolbarButton
            command="patient.filter"
            label={ui.statusFilter === 'all' ? 'Filter patient list' : `Filter patient list, showing ${STATUS_LABELS[ui.statusFilter]}`}
            icon="sliders"
            hasPopup="menu"
          >
            Filter
          </ToolbarButton>
          <ToolbarButton
            command="patient.sort"
            label={ui.sortOrder === 'recent' ? `Sort patient list, by ${SORT_LABELS.recent}` : `${sortText}, sort patient list`}
            icon="sort"
            hasPopup="menu"
          >
            {sortText}
          </ToolbarButton>
          <ToolbarButton command="patient.new" label="New patient" icon="userPlus" variant="primary" />
        </>
      )
    }
    case 'inbox':
      return (
        <>
          <ToolbarButton
            command="message.reply"
            label="Reply"
            icon="reply"
            disabledReason={ui.selectedConversationId ? undefined : 'Select a conversation to reply.'}
          />
          <ToolbarButton command="message.new" label="New message" icon="message" variant="primary" />
        </>
      )
    case 'tasks':
      return (
        <>
          <ToolbarButton
            label="Show completed tasks"
            icon="checkCircle"
            pressed={ui.showCompletedTasks}
            onClick={() => dispatch({ type: 'ui/setShowCompletedTasks', show: !ui.showCompletedTasks })}
          />
          <ToolbarButton command="app.commandPalette" label="Command palette" icon="command" />
        </>
      )
    default:
      return (
        <>
          <ToolbarButton command="app.commandPalette" label="Command palette" icon="command" />
          <ToolbarButton command="patient.new" label="New patient" icon="userPlus" variant="primary" />
        </>
      )
  }
}

/** The banner landmark: the view title (focused after navigation) and the view's toolbar. */
export function AppHeader(): React.JSX.Element {
  const { ui } = useAppState()
  const workspace = useWorkspace()
  const now = useNow()
  return (
    <header className="app-header">
      <div className="app-header__title">
        <h1 id="view-title" tabIndex={-1}>
          {VIEW_LABELS[ui.view]}
        </h1>
        <span className="chip chip--info">{subtitleFor(ui.view, workspace, now)}</span>
      </div>
      <Toolbar label={`${VIEW_LABELS[ui.view]} tools`} region="toolbar" className="app-header__toolbar">
        <ViewTools view={ui.view} ui={ui} />
      </Toolbar>
    </header>
  )
}
