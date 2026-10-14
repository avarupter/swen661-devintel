import { navigateCommand, VIEW_LABELS, type ViewId } from '../../../shared/commands'
import { initials } from '../../../shared/format'
import { useCommands } from '../commands/CommandProvider'
import { useAppState, useWorkspace } from '../state/AppStateProvider'
import { unreadCount } from '../state/selectors'
import { Avatar } from './Avatar'
import { Icon, type IconName } from './Icon'
import { KeyHint } from './KeyHint'

const WORKSPACE_ITEMS: { view: ViewId; icon: IconName }[] = [
  { view: 'overview', icon: 'grid' },
  { view: 'schedule', icon: 'calendar' },
  { view: 'patients', icon: 'users' },
  { view: 'inbox', icon: 'inbox' },
  { view: 'tasks', icon: 'clipboard' }
]

const TOOL_ITEMS: { view: ViewId; icon: IconName }[] = [
  { view: 'reports', icon: 'chart' },
  { view: 'resources', icon: 'book' }
]

function NavItem({ view, icon, active, unread }: { view: ViewId; icon: IconName; active: boolean; unread?: number }): React.JSX.Element {
  const { run } = useCommands()
  const command = navigateCommand(view)
  return (
    <li>
      <button
        type="button"
        id={`nav-${view}`}
        className={`nav-item${active ? ' nav-item--active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => run({ id: command })}
      >
        <Icon name={icon} />
        {/* The count is read once: "Inbox, 4 unread" (spec card 05). The visible label and badge are hidden
            from screen readers rather than overridden with aria-label (WCAG 2.5.3). */}
        <span className="nav-item__label" aria-hidden={unread ? true : undefined}>
          {VIEW_LABELS[view]}
        </span>
        {unread ? <span className="visually-hidden">{`${VIEW_LABELS[view]}, ${unread} unread`}</span> : null}
        {unread ? (
          <span className="badge" aria-hidden="true">
            {unread}
          </span>
        ) : null}
        <KeyHint command={command} />
      </button>
    </li>
  )
}

/** The "Workspace" navigation landmark: clinic, destinations, keyboard mode, signed-in user. */
export function Sidebar(): React.JSX.Element {
  const { ui } = useAppState()
  const workspace = useWorkspace()
  const { run } = useCommands()
  const unread = unreadCount(workspace.conversations)
  const hintsOn = workspace.preferences.showShortcutHints

  return (
    <nav className="sidebar" aria-label="Workspace" data-region="navigation">
      <div className="clinic">
        <span className="clinic__logo" aria-hidden="true">
          {initials(workspace.clinic.name)}
        </span>
        <span className="clinic__text">
          <span className="clinic__name">{workspace.clinic.name}</span>
          <span className="clinic__subtitle">{workspace.clinic.subtitle}</span>
        </span>
        <button
          type="button"
          className="button button--icon"
          aria-label="Switch clinic"
          aria-disabled="true"
          aria-describedby="clinic-switch-reason"
          title="Only one clinic is available in this demo."
        >
          <Icon name="chevronsUpDown" />
        </button>
        <span id="clinic-switch-reason" className="visually-hidden">
          Only one clinic is available in this demo.
        </span>
      </div>

      <div className="sidebar__label" id="nav-workspace-label">
        Workspace
      </div>
      <ul className="nav-list" aria-labelledby="nav-workspace-label">
        {WORKSPACE_ITEMS.map((item) => (
          <NavItem key={item.view} {...item} active={ui.view === item.view} unread={item.view === 'inbox' ? unread : undefined} />
        ))}
      </ul>

      <div className="sidebar__label" id="nav-tools-label">
        Tools
      </div>
      <ul className="nav-list" aria-labelledby="nav-tools-label">
        {TOOL_ITEMS.map((item) => (
          <NavItem key={item.view} {...item} active={ui.view === item.view} />
        ))}
      </ul>

      <div className="keyboard-card">
        <p className="keyboard-card__title">
          <Icon name="command" /> Keyboard mode
        </p>
        <p className="keyboard-card__text">
          Hold <kbd>{ui.platform === 'mac' ? '⌥' : 'Alt'}</kbd> to show access keys on interactive controls.
        </p>
        <button
          type="button"
          className="button button--small"
          aria-pressed={hintsOn}
          onClick={() => run({ id: 'view.toggleShortcutHints' })}
        >
          Always show shortcut hints
        </button>
      </div>

      <div className="user">
        <Avatar name={workspace.user.name} />
        <span className="user__text">
          <span className="user__name">{workspace.user.name}</span>
          <span className="user__role">{workspace.user.role}</span>
        </span>
        <button
          type="button"
          className="button button--icon"
          aria-label="Settings"
          aria-keyshortcuts={ui.platform === 'mac' ? 'Meta+,' : 'Control+,'}
          onClick={() => run({ id: 'app.settings' })}
        >
          <Icon name="settings" />
        </button>
      </div>
    </nav>
  )
}
