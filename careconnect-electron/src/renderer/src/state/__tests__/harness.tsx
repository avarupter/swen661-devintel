/**
 * Test harness for the renderer foundation. It mounts the real providers
 * (API, clock, announcer, state, commands and, optionally, the window key
 * handler) around a component, but not <App/>, the views or the modal host,
 * so foundation tests never depend on feature code.
 *
 * Shared by the state, commands, keyboard and components tests.
 */
import { act, render, screen, waitFor, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { useEffect, type ReactNode } from 'react'
import { createMemoryApi, FIXED_NOW, type MemoryApi } from '../../../../../tests/renderer/memoryApi'
import { AnnouncerProvider } from '../../a11y/Announcer'
import { ApiProvider } from '../../api/ApiContext'
import { CommandProvider, useCommands } from '../../commands/CommandProvider'
import { useKeyboardShortcuts } from '../../keyboard/useKeyboardShortcuts'
import type { AppAction, AppState, UiSlice } from '../appState'
import { AppStateProvider, useAppDispatch, useAppState } from '../AppStateProvider'
import { ClockProvider } from '../clock'

export type Commands = ReturnType<typeof useCommands>

interface Snapshot {
  state: AppState
  dispatch(action: AppAction): void
  commands: Commands
}

export interface HarnessOptions {
  api?: MemoryApi
  /** The pinned time; defaults to FIXED_NOW (Mon 5 Oct 2026, 09:42). */
  now?: Date
  initialUi?: Partial<UiSlice>
  /** Mount the window-level key handler (useKeyboardShortcuts). */
  keyboard?: boolean
  /** Wait for the workspace to load before resolving (default), and render `ui` only then. */
  waitForLoad?: boolean
  /** Options for userEvent.setup, e.g. `{ advanceTimers: jest.advanceTimersByTime }` with fake timers. */
  user?: Parameters<typeof userEvent.setup>[0]
}

export interface Harness extends RenderResult {
  api: MemoryApi
  user: UserEvent
  /** The latest committed AppState. */
  state(): AppState
  /** Dispatches inside act(). */
  dispatch(action: AppAction): void
  commands(): Commands
}

/** Reports what the component tree sees after every commit. */
function Probe({ onCommit }: { onCommit(snapshot: Snapshot): void }): null {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const commands = useCommands()
  useEffect(() => onCommit({ state, dispatch, commands }))
  return null
}

function KeyboardShortcuts(): null {
  useKeyboardShortcuts()
  return null
}

function WhenReady({ children, waitForLoad }: { children: ReactNode; waitForLoad: boolean }): React.JSX.Element | null {
  const { load } = useAppState()
  if (waitForLoad && load.status !== 'ready') return null
  return <>{children}</>
}

interface ProvidersProps {
  api: MemoryApi
  clock(): Date
  initialUi?: Partial<UiSlice>
  keyboard: boolean
  waitForLoad: boolean
  onCommit(snapshot: Snapshot): void
  children: ReactNode
}

function Providers({ api, clock, initialUi, keyboard, waitForLoad, onCommit, children }: ProvidersProps): React.JSX.Element {
  return (
    <ApiProvider api={api}>
      <ClockProvider now={clock}>
        <AnnouncerProvider>
          <AppStateProvider initialUi={initialUi}>
            <CommandProvider>
              <Probe onCommit={onCommit} />
              {keyboard && <KeyboardShortcuts />}
              <WhenReady waitForLoad={waitForLoad}>{children}</WhenReady>
            </CommandProvider>
          </AppStateProvider>
        </AnnouncerProvider>
      </ClockProvider>
    </ApiProvider>
  )
}

/**
 * Renders `ui` inside the providers. `rerender(otherUi)` on the result swaps
 * only `ui`; the providers and their state stay mounted.
 */
export async function renderHarness(ui: ReactNode = null, options: HarnessOptions = {}): Promise<Harness> {
  const now = options.now ?? FIXED_NOW
  const api = options.api ?? createMemoryApi({ now })
  const waitForLoad = options.waitForLoad ?? true
  let latest: Snapshot | null = null
  const onCommit = (snapshot: Snapshot): void => {
    latest = snapshot
  }
  const current = (): Snapshot => {
    if (!latest) throw new Error('The harness has not rendered yet')
    return latest
  }
  const clock = (): Date => now
  const user = userEvent.setup(options.user)

  const wrapper = ({ children }: { children: ReactNode }): React.JSX.Element => (
    <Providers api={api} clock={clock} initialUi={options.initialUi} keyboard={options.keyboard ?? false} waitForLoad={waitForLoad} onCommit={onCommit}>
      {children}
    </Providers>
  )
  const result = render(ui, { wrapper })
  if (waitForLoad) await waitFor(() => expect(current().state.load.status).toBe('ready'))
  // Let already-settled API promises (getAppInfo, a scripted load) update state inside act().
  else await act(async () => {})

  return {
    ...result,
    api,
    user,
    state: () => current().state,
    dispatch: (action) => {
      act(() => current().dispatch(action))
    },
    commands: () => current().commands
  }
}

/** Text currently in the polite or assertive live region. */
export function liveText(politeness: 'polite' | 'assertive' = 'polite'): string {
  return screen.getByTestId(`live-${politeness}`).textContent ?? ''
}

export { FIXED_NOW }
