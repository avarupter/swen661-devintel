import { formatTime, pluralize } from '../../../shared/format'
import { useCommands } from '../commands/CommandProvider'
import type { StatusTone } from '../state/appState'
import { useAppDispatch, useAppState } from '../state/AppStateProvider'
import { Icon, type IconName } from './Icon'
import { KeyHint } from './KeyHint'

const TONE_ICONS: Record<StatusTone, IconName> = {
  info: 'info',
  success: 'checkCircle',
  warning: 'alert',
  error: 'alert'
}

/**
 * The "Status" contentinfo landmark. The latest status message stays visible
 * until it is replaced or dismissed (spec card 08); screen readers hear it
 * through the announcer's live regions, so this bar is not itself live. Those
 * regions sit outside the app shell, which is inert while a dialog is open: a
 * live region here would go silent exactly then, and would read every message
 * a second time otherwise.
 */
export function StatusBar(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { run } = useCommands()
  const unsaved = state.revision - state.savedRevision
  const { status, pendingSequence } = state.ui

  return (
    <footer id="status-bar" className="status-bar" aria-label="Status" data-region="status" tabIndex={-1}>
      <div className={`status-bar__health${state.saveError ? ' status-bar__health--error' : ''}`}>
        <span className="status-dot" aria-hidden="true" />
        <Icon name={state.saveError ? 'alert' : 'check'} />
        <span>
          {state.saveError ? 'Changes not saved' : 'All systems operational'} · {pluralize(unsaved, 'unsaved change')}
        </span>
        {state.saveError && (
          <button type="button" className="button button--small" onClick={() => dispatch({ type: 'save/retry' })}>
            <Icon name="refresh" /> Retry save
          </button>
        )}
      </div>

      {status && (
        <div className={`status-message status-message--${status.tone}`}>
          <Icon name={TONE_ICONS[status.tone]} />
          <span className="status-message__text">{status.text}</span>
          <button type="button" className="button button--icon button--small" aria-label="Dismiss message" onClick={() => dispatch({ type: 'ui/dismissStatus' })}>
            <Icon name="x" />
          </button>
        </div>
      )}

      {pendingSequence && (
        <span className="status-bar__sequence" aria-hidden="true">
          <kbd>{pendingSequence.toUpperCase()}</kbd> then O, S, P, I or T
        </span>
      )}

      <div className="status-bar__meta">
        <span className="status-bar__item">
          {state.ui.browserPreview ? (
            <>
              <Icon name="info" /> Browser preview · data stays in this browser
            </>
          ) : (
            <>
              <Icon name="lock" /> Secure session
            </>
          )}
        </span>
        <span className="status-bar__item">{state.lastSavedAt ? `Synced ${formatTime(state.lastSavedAt)}` : 'Not synced yet'}</span>
        <button type="button" className="link-button" aria-keyshortcuts="F1" onClick={() => run({ id: 'app.help' })}>
          Keyboard help <KeyHint command="app.help" />
        </button>
      </div>
    </footer>
  )
}
