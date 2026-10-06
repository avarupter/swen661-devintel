import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { createMemoryApi, type MemoryApi } from '../../../../../tests/renderer/memoryApi'
import type { UiState } from '../../../../shared/api'
import { atDay } from '../../../../shared/seed'
import { AnnouncerProvider } from '../../a11y/Announcer'
import { ApiProvider } from '../../api/ApiContext'
import type { AppAction } from '../appState'
import { AppStateProvider, describeError, SAVE_DEBOUNCE_MS, useAppDispatch, useAppState, useStatus, useWorkspace } from '../AppStateProvider'
import { ClockProvider } from '../clock'
import { FIXED_NOW, liveText, renderHarness } from './harness'

const toggleTask = (taskId: string): AppAction => ({ type: 'task/toggled', taskId })
const lastUiState = (api: MemoryApi): UiState => api.updateUiState.mock.calls[api.updateUiState.mock.calls.length - 1][0]

/** Advances fake timers and lets the promises they settle run. */
async function advance(ms: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

afterEach(() => {
  jest.useRealTimers()
})

function ShowsClinic(): React.JSX.Element {
  return <p>{useWorkspace().clinic.name}</p>
}

/** Hands the useStatus() function to the test once mounted. */
function StatusSource({ onReady }: { onReady(status: ReturnType<typeof useStatus>): void }): null {
  const status = useStatus()
  useEffect(() => onReady(status), [onReady, status])
  return null
}

describe('loading', () => {
  it('loads the workspace, selects the most recent patient and starts synced', async () => {
    const h = await renderHarness()
    expect(h.api.loadWorkspace).toHaveBeenCalledTimes(1)
    expect(h.state().load).toEqual({ status: 'ready', source: 'file' })
    expect(h.state().workspace).toEqual(h.api.workspace)
    expect(h.state().ui.selectedPatientId).toBe('p-avery-park')
    expect(h.state().ui.recentPatients).toEqual(h.api.workspace.recentPatients)
    expect(h.state().lastSavedAt).toBe(FIXED_NOW.toISOString())
    expect(h.state().revision - h.state().savedRevision).toBe(0)
  })

  it('announces a recovered workspace assertively and keeps the warning in the status bar', async () => {
    const api = createMemoryApi()
    const backupPath = 'C:\\Users\\demo\\AppData\\Roaming\\CareConnect\\careconnect-workspace.corrupt-20261005T094200.json'
    api.nextLoad = { workspace: api.workspace, source: 'recovered', backupPath }
    const h = await renderHarness(null, { api })
    const text = `Your saved workspace could not be read, so demo data was restored. The damaged file was kept at ${backupPath}.`
    expect(h.state().load).toEqual({ status: 'ready', source: 'recovered', backupPath })
    expect(h.state().ui.status).toMatchObject({ tone: 'warning', text })
    await waitFor(() => expect(liveText('assertive')).toBe(text))
    expect(liveText('polite')).toBe('')
  })

  it('still explains a recovery when the backup path is unknown', async () => {
    const api = createMemoryApi()
    api.nextLoad = { workspace: api.workspace, source: 'recovered' }
    const h = await renderHarness(null, { api })
    expect(h.state().ui.status?.text).toBe('Your saved workspace could not be read, so demo data was restored. The damaged file was kept.')
  })

  it('does not announce anything for a normal or first-run load', async () => {
    const h = await renderHarness(null, { api: createMemoryApi({ source: 'seed' }) })
    expect(h.state().load).toEqual({ status: 'ready', source: 'seed' })
    expect(h.state().ui.status).toBeNull()
  })

  it('reports a load failure without the IPC prefix, and load/retry loads again', async () => {
    const api = createMemoryApi()
    api.nextLoad = new Error("Error invoking remote method 'workspace:load': Error: disk unavailable")
    const h = await renderHarness(null, { api, waitForLoad: false })
    await waitFor(() => expect(h.state().load).toEqual({ status: 'error', message: 'disk unavailable' }))
    h.dispatch({ type: 'load/retry' })
    await waitFor(() => expect(h.state().load.status).toBe('ready'))
    expect(api.loadWorkspace).toHaveBeenCalledTimes(2)
  })

  it('unmounts cleanly while the workspace is still loading', async () => {
    const api = createMemoryApi()
    let resolveLoad: (value: Awaited<ReturnType<MemoryApi['loadWorkspace']>>) => void = () => {}
    api.loadWorkspace.mockImplementationOnce(() => new Promise((resolve) => (resolveLoad = resolve)))
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    const h = await renderHarness(null, { api, waitForLoad: false })
    h.unmount()
    await act(async () => resolveLoad({ workspace: api.workspace, source: 'recovered' }))
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})

describe('autosave', () => {
  it('saves once, 600 ms after the last of several rapid changes', async () => {
    jest.useFakeTimers()
    const h = await renderHarness()
    expect(SAVE_DEBOUNCE_MS).toBe(600)

    h.dispatch(toggleTask('t-1'))
    await advance(400)
    h.dispatch(toggleTask('t-2'))
    await advance(400)
    h.dispatch(toggleTask('t-3'))
    expect(h.state().revision - h.state().savedRevision).toBe(3)
    await advance(SAVE_DEBOUNCE_MS - 1)
    expect(h.api.saveWorkspace).not.toHaveBeenCalled()

    await advance(1)
    expect(h.api.saveWorkspace).toHaveBeenCalledTimes(1)
    expect(h.api.saved[0].tasks.filter((task) => task.done).map((task) => task.id)).toEqual(['t-1', 't-2', 't-3', 't-8'])
    expect(h.state().savedRevision).toBe(3)
    expect(h.state().revision - h.state().savedRevision).toBe(0)
    expect(h.state().lastSavedAt).toBe(new Date(FIXED_NOW.getTime() + 60_000).toISOString())

    await advance(5_000)
    expect(h.api.saveWorkspace).toHaveBeenCalledTimes(1)
  })

  it('never saves when nothing changed, and UI-only changes do not count', async () => {
    jest.useFakeTimers()
    const h = await renderHarness()
    h.dispatch({ type: 'ui/navigate', view: 'inbox' })
    h.dispatch({ type: 'ui/selectPatient', patientId: 'p-riley-singh', at: FIXED_NOW.toISOString() })
    h.dispatch({ type: 'ui/setPatientQuery', query: 'riley' })
    await advance(5_000)
    expect(h.api.saveWorkspace).not.toHaveBeenCalled()
    expect(h.state().revision).toBe(0)
  })

  it('writes the session’s recent patients back with the workspace', async () => {
    jest.useFakeTimers()
    const h = await renderHarness()
    const at = FIXED_NOW.toISOString()
    h.dispatch({ type: 'ui/selectPatient', patientId: 'p-riley-singh', at })
    h.dispatch(toggleTask('t-1'))
    await advance(SAVE_DEBOUNCE_MS)
    expect(h.api.saved[0].recentPatients[0]).toEqual({ patientId: 'p-riley-singh', at })
    expect(h.api.saved[0].recentPatients.map((entry) => entry.patientId)).toEqual(['p-riley-singh', 'p-avery-park', 'p-morgan-chen'])
  })

  it('saves again when more changes arrive while a save is in flight', async () => {
    jest.useFakeTimers()
    const h = await renderHarness()
    let finishFirstSave: (value: { savedAt: string }) => void = () => {}
    h.api.saveWorkspace.mockImplementationOnce(() => new Promise((resolve) => (finishFirstSave = resolve)))
    h.dispatch(toggleTask('t-1'))
    await advance(SAVE_DEBOUNCE_MS)
    h.dispatch(toggleTask('t-2'))
    await act(async () => finishFirstSave({ savedAt: FIXED_NOW.toISOString() }))
    expect(h.state().savedRevision).toBe(1)
    expect(h.state().revision).toBe(2)
    await advance(SAVE_DEBOUNCE_MS)
    expect(h.api.saveWorkspace).toHaveBeenCalledTimes(2)
    expect(h.state().savedRevision).toBe(2)
  })

  it('surfaces a failed save: saveError, an error status, an assertive announcement, then Retry saves again', async () => {
    jest.useFakeTimers()
    const h = await renderHarness()
    h.api.nextSaveError = new Error("Error invoking remote method 'workspace:save': Error: The disk is full")
    h.dispatch(toggleTask('t-1'))
    await advance(SAVE_DEBOUNCE_MS)

    const text = "Couldn't save changes: The disk is full. Use Retry save, or keep working and they will be retried with your next change."
    expect(h.state().saveError).toBe('The disk is full')
    expect(h.state().ui.status).toMatchObject({ tone: 'error', text })
    expect(h.state().revision - h.state().savedRevision).toBe(1)
    await advance(100)
    expect(liveText('assertive')).toBe(text)

    h.dispatch({ type: 'save/retry' })
    expect(h.state().saveError).toBeNull()
    await advance(SAVE_DEBOUNCE_MS)
    expect(h.api.saveWorkspace).toHaveBeenCalledTimes(2)
    expect(h.state().savedRevision).toBe(1)
    expect(h.state().saveError).toBeNull()
  })

  it('retries a failed save with the next change', async () => {
    jest.useFakeTimers()
    const h = await renderHarness()
    h.api.nextSaveError = new Error('locked')
    h.dispatch(toggleTask('t-1'))
    await advance(SAVE_DEBOUNCE_MS)
    expect(h.state().saveError).toBe('locked')
    h.dispatch(toggleTask('t-2'))
    await advance(SAVE_DEBOUNCE_MS)
    expect(h.api.saveWorkspace).toHaveBeenCalledTimes(2)
    expect(h.state().saveError).toBeNull()
    expect(h.state().revision - h.state().savedRevision).toBe(0)
  })
})

describe('mirroring UI state to the main process', () => {
  it('sends the UiState the menus, tray and taskbar need', async () => {
    const h = await renderHarness()
    expect(lastUiState(h.api)).toEqual({
      view: 'patients',
      hasSelection: true,
      modal: null,
      unreadCount: 4,
      unsavedChanges: 0,
      showShortcutHints: true,
      highContrast: false,
      reduceMotion: false
    })

    h.dispatch({ type: 'ui/openModal', modal: { kind: 'palette' } })
    expect(lastUiState(h.api).modal).toBe('palette')
    h.dispatch({ type: 'ui/openModal', modal: { kind: 'compose', patientId: null, conversationId: null, draftId: null } })
    expect(lastUiState(h.api).modal).toBe('compose')
    h.dispatch({ type: 'ui/openModal', modal: { kind: 'help' } })
    expect(lastUiState(h.api).modal).toBe('dialog')
    h.dispatch({ type: 'ui/closeModal' })
    expect(lastUiState(h.api).modal).toBeNull()

    h.dispatch({ type: 'ui/navigate', view: 'inbox' })
    h.dispatch({ type: 'conversation/setUnread', conversationId: 'c-home-monitoring', unread: false })
    h.dispatch({ type: 'preferences/changed', changes: { highContrast: true, reduceMotion: true, showShortcutHints: false } })
    h.dispatch({ type: 'ui/selectPatient', patientId: null })
    expect(lastUiState(h.api)).toEqual({
      view: 'inbox',
      hasSelection: false,
      modal: null,
      unreadCount: 3,
      unsavedChanges: 2,
      showShortcutHints: false,
      highContrast: true,
      reduceMotion: true
    })
  })

  it('does not re-send for UI changes the main process does not mirror', async () => {
    const h = await renderHarness()
    const calls = h.api.updateUiState.mock.calls.length
    h.dispatch({ type: 'ui/setPatientQuery', query: 'avery' })
    h.dispatch({ type: 'ui/setSortOrder', sortOrder: 'name' })
    h.dispatch({ type: 'ui/setRevealHints', reveal: true })
    expect(h.api.updateUiState).toHaveBeenCalledTimes(calls)
  })

  it('sends nothing before the workspace has loaded', async () => {
    const api = createMemoryApi()
    api.loadWorkspace.mockImplementationOnce(() => new Promise(() => {}))
    await renderHarness(null, { api, waitForLoad: false })
    expect(api.updateUiState).not.toHaveBeenCalled()
  })
})

describe('platform and Windows High Contrast', () => {
  it('uses the Windows key labels on Windows and Linux', async () => {
    const h = await renderHarness(null, { api: createMemoryApi({ platform: 'linux' }) })
    await waitFor(() => expect(h.api.getAppInfo).toHaveBeenCalled())
    expect(h.state().ui.platform).toBe('windows')
  })

  it('switches to the macOS key labels when getAppInfo reports darwin', async () => {
    const h = await renderHarness(null, { api: createMemoryApi({ platform: 'darwin' }) })
    await waitFor(() => expect(h.state().ui.platform).toBe('mac'))
  })

  it('starts in high contrast when the system already is', async () => {
    const api = createMemoryApi()
    api.appInfo = { ...api.appInfo, highContrast: true }
    const h = await renderHarness(null, { api })
    await waitFor(() => expect(h.state().ui.systemHighContrast).toBe(true))
  })

  it('follows theme changes from the main process, and stops listening on unmount', async () => {
    const api = createMemoryApi()
    const subscribe = api.onThemeChanged.getMockImplementation() as NonNullable<ReturnType<typeof api.onThemeChanged.getMockImplementation>>
    const unsubscribed = jest.fn()
    api.onThemeChanged.mockImplementation((listener) => {
      const off = subscribe(listener)
      return () => {
        unsubscribed()
        off()
      }
    })
    const h = await renderHarness(null, { api })
    act(() => api.emitTheme({ highContrast: true, dark: false }))
    expect(h.state().ui.systemHighContrast).toBe(true)
    act(() => api.emitTheme({ highContrast: false, dark: true }))
    expect(h.state().ui.systemHighContrast).toBe(false)
    expect(api.onThemeChanged).toHaveBeenCalledTimes(1)
    h.unmount()
    expect(unsubscribed).toHaveBeenCalledTimes(1)
  })

  it('keeps working when getAppInfo fails', async () => {
    const api = createMemoryApi()
    api.getAppInfo.mockRejectedValueOnce(new Error('no info'))
    const h = await renderHarness(null, { api })
    expect(h.state().ui.platform).toBe('windows')
  })
})

describe('the launch notification for follow-ups due today', () => {
  it('is sent once, naming the count, the first three visits and the first patient', async () => {
    const h = await renderHarness()
    await waitFor(() => expect(h.api.showNotification).toHaveBeenCalled())
    expect(h.api.showNotification).toHaveBeenCalledWith({
      title: '3 follow-ups due today',
      body: 'Avery Park at 10:30 · Casey Morgan at 13:00 · Emerson Brooks at 15:45',
      patientId: 'p-avery-park'
    })
    h.dispatch(toggleTask('t-1'))
    h.dispatch({ type: 'preferences/changed', changes: { reduceMotion: true } })
    expect(h.api.showNotification).toHaveBeenCalledTimes(1)
  })

  it('summarises more than three visits', async () => {
    const api = createMemoryApi()
    api.workspace.patients[1].nextVisit = atDay(FIXED_NOW, 0, '11:00')
    api.workspace.patients[3].nextVisit = atDay(FIXED_NOW, 0, '12:00')
    await renderHarness(null, { api })
    await waitFor(() => expect(api.showNotification).toHaveBeenCalledTimes(1))
    expect(api.showNotification.mock.calls[0][0]).toEqual({
      title: '5 follow-ups due today',
      body: 'Avery Park at 10:30 · Morgan Chen at 11:00 · Taylor Lane at 12:00 and 2 more',
      patientId: 'p-avery-park'
    })
  })

  it('uses the singular for one visit, and skips completed patients', async () => {
    const api = createMemoryApi()
    for (const patient of api.workspace.patients) if (patient.name !== 'Emerson Brooks' && patient.name !== 'Avery Park') patient.nextVisit = null
    api.workspace.patients[0].status = 'completed'
    await renderHarness(null, { api })
    await waitFor(() => expect(api.showNotification).toHaveBeenCalledTimes(1))
    expect(api.showNotification.mock.calls[0][0]).toEqual({
      title: '1 follow-up due today',
      body: 'Emerson Brooks at 15:45',
      patientId: 'p-emerson-brooks'
    })
  })

  it('is not sent when nothing is due, or when notifications are turned off', async () => {
    const none = createMemoryApi()
    for (const patient of none.workspace.patients) patient.nextVisit = null
    await renderHarness(null, { api: none })

    const off = createMemoryApi()
    off.workspace.preferences.notifications = false
    await renderHarness(null, { api: off })

    await act(async () => {})
    expect(none.showNotification).not.toHaveBeenCalled()
    expect(off.showNotification).not.toHaveBeenCalled()
  })

  it('is decided at launch: turning notifications on later in the session does not send it', async () => {
    const api = createMemoryApi()
    api.workspace.preferences.notifications = false
    const h = await renderHarness(null, { api })
    await act(async () => {})
    h.dispatch({ type: 'preferences/changed', changes: { notifications: true } })
    h.dispatch(toggleTask('t-1'))
    await act(async () => {})
    expect(h.state().workspace?.preferences.notifications).toBe(true)
    expect(api.showNotification).not.toHaveBeenCalled()
  })

  it('is not sent again when notifications are turned off and on after launch', async () => {
    const h = await renderHarness()
    await waitFor(() => expect(h.api.showNotification).toHaveBeenCalledTimes(1))
    h.dispatch({ type: 'preferences/changed', changes: { notifications: false } })
    h.dispatch({ type: 'preferences/changed', changes: { notifications: true } })
    await act(async () => {})
    expect(h.api.showNotification).toHaveBeenCalledTimes(1)
  })

  it('swallows a notification failure', async () => {
    const api = createMemoryApi()
    api.showNotification.mockRejectedValueOnce(new Error('notifications blocked'))
    const h = await renderHarness(null, { api })
    await waitFor(() => expect(api.showNotification).toHaveBeenCalledTimes(1))
    await act(async () => {})
    expect(h.state().ui.status).toBeNull()
  })
})

describe('hooks', () => {
  it('throw a clear error outside the provider', () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAppState())).toThrow('useAppState() must be called inside <AppStateProvider>')
    expect(() => renderHook(() => useAppDispatch())).toThrow('useAppDispatch() must be called inside <AppStateProvider>')
    errors.mockRestore()
  })

  it('needs an ApiProvider around it', () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<AppStateProvider>{null}</AppStateProvider>)).toThrow('useApi() must be called inside <ApiProvider>')
    errors.mockRestore()
  })

  it('useWorkspace throws before the workspace has loaded', () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    const api = createMemoryApi()
    api.loadWorkspace.mockImplementation(() => new Promise(() => {}))
    expect(() =>
      render(
        <ApiProvider api={api}>
          <ClockProvider now={() => FIXED_NOW}>
            <AnnouncerProvider>
              <AppStateProvider>
                <ShowsClinic />
              </AppStateProvider>
            </AnnouncerProvider>
          </ClockProvider>
        </ApiProvider>
      )
    ).toThrow('useWorkspace() called before the workspace loaded')
    errors.mockRestore()
  })

  it('useWorkspace returns the loaded workspace', async () => {
    await renderHarness(<ShowsClinic />)
    expect(screen.getByText('North Coast Clinic')).toBeInTheDocument()
  })

  it('useStatus shows a persistent message and announces it, assertively only for errors', async () => {
    jest.useFakeTimers()
    let status: ReturnType<typeof useStatus> = () => {}
    const h = await renderHarness(
      <StatusSource
        onReady={(value) => {
          status = value
        }}
      />
    )

    act(() => status('Note added for Avery Park.'))
    expect(h.state().ui.status).toMatchObject({ tone: 'success', text: 'Note added for Avery Park.' })
    await advance(100)
    expect(liveText('polite')).toBe('Note added for Avery Park.')

    act(() => status('That link can’t be opened.', 'warning'))
    await advance(100)
    expect(h.state().ui.status?.tone).toBe('warning')
    expect(liveText('polite')).toBe('That link can’t be opened.')

    act(() => status("Couldn't copy the Care ID", 'error'))
    await advance(100)
    expect(h.state().ui.status?.tone).toBe('error')
    expect(liveText('assertive')).toBe("Couldn't copy the Care ID")
  })
})

describe('describeError', () => {
  it('strips the IPC wrapper from main-process errors', () => {
    expect(describeError(new Error("Error invoking remote method 'workspace:save': Error: The disk is full"))).toBe('The disk is full')
    expect(describeError(new Error("Error invoking remote method 'workspace:save': ValidationError: workspace.version: unsupported workspace version"))).toBe(
      'ValidationError: workspace.version: unsupported workspace version'
    )
    expect(describeError(new Error('plain failure'))).toBe('plain failure')
  })

  it('stringifies anything that is not an Error', () => {
    expect(describeError('offline')).toBe('offline')
    expect(describeError(404)).toBe('404')
  })
})
