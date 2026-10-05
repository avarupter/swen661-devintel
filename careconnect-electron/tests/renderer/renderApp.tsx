/**
 * Render helpers for renderer tests.
 *
 *  - renderApp() mounts the whole application against an in-memory API with a
 *    pinned clock and waits for the workspace to load.
 *  - renderWithProviders() mounts one component inside the same providers
 *    (plus the modal host), for focused component tests.
 */
import { render, screen, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { AnnouncerProvider } from '../../src/renderer/src/a11y/Announcer'
import { ApiProvider } from '../../src/renderer/src/api/ApiContext'
import { App } from '../../src/renderer/src/App'
import { CommandProvider } from '../../src/renderer/src/commands/CommandProvider'
import { ModalHost } from '../../src/renderer/src/dialogs/ModalHost'
import { useKeyboardShortcuts } from '../../src/renderer/src/keyboard/useKeyboardShortcuts'
import type { UiSlice } from '../../src/renderer/src/state/appState'
import { AppStateProvider, useAppState } from '../../src/renderer/src/state/AppStateProvider'
import { ClockProvider } from '../../src/renderer/src/state/clock'
import { createMemoryApi, FIXED_NOW, type MemoryApi } from './memoryApi'

export interface RenderOptions {
  api?: MemoryApi
  now?: Date
  initialUi?: Partial<UiSlice>
}

export interface Rendered extends RenderResult {
  api: MemoryApi
  user: UserEvent
}

/** Mounts the full app and resolves once the view title is on screen. */
export async function renderApp(options: RenderOptions = {}): Promise<Rendered> {
  const now = options.now ?? FIXED_NOW
  const api = options.api ?? createMemoryApi({ now })
  const user = userEvent.setup()
  const result = render(<App api={api} now={() => now} initialUi={options.initialUi} />)
  await screen.findByRole('heading', { level: 1 })
  return { ...result, api, user }
}

function WhenReady({ children, keyboard }: { children: ReactNode; keyboard: boolean }): React.JSX.Element | null {
  const { load } = useAppState()
  if (load.status !== 'ready') return null
  return (
    <>
      {keyboard && <KeyboardShortcuts />}
      <div data-testid="providers-ready">{children}</div>
      <ModalHost />
    </>
  )
}

function KeyboardShortcuts(): null {
  useKeyboardShortcuts()
  return null
}

/** Mounts `ui` inside every app provider and resolves once the workspace has loaded. */
export async function renderWithProviders(
  ui: ReactNode,
  options: RenderOptions & { keyboard?: boolean } = {}
): Promise<Rendered> {
  const now = options.now ?? FIXED_NOW
  const api = options.api ?? createMemoryApi({ now })
  const user = userEvent.setup()
  const result = render(
    <ApiProvider api={api}>
      <ClockProvider now={() => now}>
        <AnnouncerProvider>
          <AppStateProvider initialUi={options.initialUi}>
            <CommandProvider>
              <WhenReady keyboard={options.keyboard ?? false}>{ui}</WhenReady>
            </CommandProvider>
          </AppStateProvider>
        </AnnouncerProvider>
      </ClockProvider>
    </ApiProvider>
  )
  await screen.findByTestId('providers-ready')
  return { ...result, api, user }
}

/** Text currently in the polite or assertive live region. */
export function liveRegionText(politeness: 'polite' | 'assertive' = 'polite'): string {
  return screen.getByTestId(`live-${politeness}`).textContent ?? ''
}
