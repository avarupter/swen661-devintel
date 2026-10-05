import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from 'react'
import { keyPlatform } from '../../../shared/shortcuts'
import type { Workspace } from '../../../shared/model'
import { useApi } from '../api/ApiContext'
import { useAnnounce } from '../a11y/Announcer'
import { useClock } from './clock'
import {
  appReducer,
  createInitialState,
  modalCategory,
  type AppAction,
  type AppState,
  type StatusTone,
  type UiSlice
} from './appState'
import { followUpsDueToday, unreadCount } from './selectors'
import { formatTime } from '../../../shared/format'

/** Changes are written this long after the last edit. */
export const SAVE_DEBOUNCE_MS = 600

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<AppAction> | null>(null)

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
  return String(error)
}

/**
 * Owns the reducer and every side effect that keeps it in step with the main
 * process: loading the workspace, autosaving it, mirroring UI state into the
 * native menus/tray/taskbar, following Windows High Contrast, and the launch
 * notification for follow-ups due today.
 */
export function AppStateProvider({ children, initialUi }: { children: ReactNode; initialUi?: Partial<UiSlice> }): React.JSX.Element {
  const api = useApi()
  const clock = useClock()
  const announce = useAnnounce()
  const [state, dispatch] = useReducer(appReducer, initialUi, createInitialState)
  const notifiedRef = useRef(false)

  // Load (and reload after "Try again").
  useEffect(() => {
    if (state.load.status !== 'loading') return
    let cancelled = false
    api.loadWorkspace().then(
      (result) => {
        if (cancelled) return
        dispatch({ type: 'load/succeeded', workspace: result.workspace, source: result.source, backupPath: result.backupPath, at: clock().toISOString() })
        if (result.source === 'recovered') {
          const text = `Your saved workspace could not be read, so demo data was restored. The damaged file was kept${result.backupPath ? ` at ${result.backupPath}` : ''}.`
          dispatch({ type: 'ui/setStatus', tone: 'warning', text })
          announce(text, 'assertive')
        }
      },
      (error: unknown) => {
        if (!cancelled) dispatch({ type: 'load/failed', message: describeError(error) })
      }
    )
    return () => {
      cancelled = true
    }
  }, [state.load.status, api, clock, announce])

  // Autosave: debounce, then send the whole workspace to the main process.
  const { workspace, revision, savedRevision, saveRequest } = state
  const recentPatients = state.ui.recentPatients
  useEffect(() => {
    if (!workspace || revision === savedRevision) return
    const payload: Workspace = { ...workspace, recentPatients }
    const timer = setTimeout(() => {
      api.saveWorkspace(payload).then(
        (result) => dispatch({ type: 'save/succeeded', revision, savedAt: result.savedAt }),
        (error: unknown) => {
          const text = `Couldn't save changes: ${describeError(error)}. Use Retry save, or keep working and they will be retried with your next change.`
          dispatch({ type: 'save/failed', message: describeError(error) })
          dispatch({ type: 'ui/setStatus', tone: 'error', text })
          announce(text, 'assertive')
        }
      )
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [workspace, recentPatients, revision, savedRevision, saveRequest, api, announce])

  // Mirror UI state into the main process (menus, tray tooltip, taskbar badge).
  const ui = state.ui
  const unread = workspace ? unreadCount(workspace.conversations) : 0
  useEffect(() => {
    if (!workspace) return
    api.updateUiState({
      view: ui.view,
      hasSelection: ui.selectedPatientId !== null,
      modal: modalCategory(ui.modal),
      unreadCount: unread,
      unsavedChanges: revision - savedRevision,
      showShortcutHints: workspace.preferences.showShortcutHints,
      highContrast: workspace.preferences.highContrast,
      reduceMotion: workspace.preferences.reduceMotion
    })
  }, [api, workspace, ui.view, ui.selectedPatientId, ui.modal, unread, revision, savedRevision])

  // Platform (for shortcut labels) and Windows High Contrast.
  useEffect(() => {
    let cancelled = false
    api.getAppInfo().then(
      (info) => {
        if (cancelled) return
        dispatch({ type: 'ui/setPlatform', platform: keyPlatform(info.platform) })
        dispatch({ type: 'ui/setSystemHighContrast', value: info.highContrast })
      },
      () => {}
    )
    const unsubscribe = api.onThemeChanged((theme) => dispatch({ type: 'ui/setSystemHighContrast', value: theme.highContrast }))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [api])

  // One native notification per launch for follow-ups due today.
  useEffect(() => {
    if (!workspace || notifiedRef.current || !workspace.preferences.notifications) return
    notifiedRef.current = true
    const now = clock()
    const due = followUpsDueToday(workspace.patients, now)
    if (due.length === 0) return
    const names = due.slice(0, 3).map((patient) => `${patient.name} at ${formatTime(patient.nextVisit as string)}`)
    void api
      .showNotification({
        title: due.length === 1 ? '1 follow-up due today' : `${due.length} follow-ups due today`,
        body: names.join(' · ') + (due.length > 3 ? ` and ${due.length - 3} more` : ''),
        patientId: due[0].id
      })
      .catch(() => {})
  }, [workspace, api, clock])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): AppState {
  const state = useContext(StateContext)
  if (!state) throw new Error('useAppState() must be called inside <AppStateProvider>')
  return state
}

export function useAppDispatch(): Dispatch<AppAction> {
  const dispatch = useContext(DispatchContext)
  if (!dispatch) throw new Error('useAppDispatch() must be called inside <AppStateProvider>')
  return dispatch
}

/** The loaded workspace. Only call from components rendered after loading completes. */
export function useWorkspace(): Workspace {
  const { workspace } = useAppState()
  if (!workspace) throw new Error('useWorkspace() called before the workspace loaded')
  return workspace
}

/** Shows a persistent status-bar message and announces it (assertively for errors). */
export function useStatus(): (text: string, tone?: StatusTone) => void {
  const dispatch = useAppDispatch()
  const announce = useAnnounce()
  return useCallback(
    (text: string, tone: StatusTone = 'success') => {
      dispatch({ type: 'ui/setStatus', tone, text })
      announce(text, tone === 'error' ? 'assertive' : 'polite')
    },
    [dispatch, announce]
  )
}
