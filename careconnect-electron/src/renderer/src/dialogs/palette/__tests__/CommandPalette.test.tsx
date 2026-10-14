import { computeAccessibleName } from 'dom-accessibility-api'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { patientIdFor } from '../../../../../shared/seed'
import { createMemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderApp, renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import { useCommands, useSearchTarget } from '../../../commands/CommandProvider'
import { useAppState } from '../../../state/AppStateProvider'

const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } }
const AVERY = patientIdFor('Avery Park')
const RILEY = patientIdFor('Riley Singh')

/**
 * Stands in for the app shell: somewhere to start from, a search target, and
 * the UI state to assert on. Like the real shell it is `inert` while a modal
 * is open. Used for behaviour that does not depend on the real views.
 */
function Probe(): React.JSX.Element {
  const { ui } = useAppState()
  const { run } = useCommands()
  const searchTarget = useSearchTarget()
  return (
    <div inert={ui.modal !== null}>
      <button type="button">Somewhere else</button>
      <button type="button" onClick={() => run({ id: 'app.commandPalette' })}>
        Command palette
      </button>
      <label>
        Probe search <input ref={searchTarget} />
      </label>
      <p data-testid="view">{ui.view}</p>
      <p data-testid="selected">{ui.selectedPatientId ?? 'none'}</p>
    </div>
  )
}

async function renderProbe() {
  const rendered = await renderWithProviders(<Probe />, { keyboard: true })
  return rendered
}

// jsdom does not implement `inert`; Chromium refuses to focus anything inside it. Mimic that, so a
// command that runs while the shell is still inert fails here exactly as it would in the app.
const nativeFocus = HTMLElement.prototype.focus
beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (this: HTMLElement, options?: FocusOptions) {
    if (this.closest('[inert]')) return
    nativeFocus.call(this, options)
  })
})
afterEach(() => {
  jest.restoreAllMocks()
})

async function openPalette(user: UserEvent): Promise<HTMLElement> {
  await user.keyboard('{Control>}k{/Control}')
  return screen.findByRole('dialog', { name: 'Command palette' })
}

function combobox(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Search commands' })
}

/** The palette's listbox. In the real app the (inert) patient list behind it is a listbox too. */
function resultList(): HTMLElement {
  return screen.getByRole('listbox', { name: 'Commands' })
}

function options(): HTMLElement[] {
  return within(resultList()).queryAllByRole('option')
}

function groups(): HTMLElement[] {
  return within(resultList()).queryAllByRole('group')
}

function activeOption(): HTMLElement {
  const id = combobox().getAttribute('aria-activedescendant')
  expect(id).toBeTruthy()
  const element = document.getElementById(id as string)
  expect(element).not.toBeNull()
  return element as HTMLElement
}

/** The text a screen reader reads from `root`: aria-hidden subtrees are skipped. */
function spokenText(root: Node): string {
  if (root.nodeType === Node.TEXT_NODE) return root.textContent ?? ''
  if (root instanceof Element && root.getAttribute('aria-hidden') === 'true') return ''
  return Array.from(root.childNodes, spokenText).join('')
}

describe('CommandPalette in the app', () => {
  it('opens with Ctrl+K in the app and puts focus in the combobox', async () => {
    const { user } = await renderApp()
    const dialog = await openPalette(user)
    const input = combobox()
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox', { name: 'Commands' }).id)
    expect(input).toHaveAccessibleDescription('Type a command, patient label, or destination')
    expect(within(dialog).getByText('All commands')).toBeInTheDocument()
    expect(within(dialog).getByText('Searching CareConnect · synthetic demo data only')).toBeInTheDocument()
  })

  it('filters as you type without moving focus', async () => {
    const { user } = await renderApp()
    await openPalette(user)
    await user.type(combobox(), 'inbox')
    expect(combobox()).toHaveFocus()
    expect(options().map((option) => computeAccessibleName(option))).toEqual(['Open Inbox, 4 unread conversations'])
    expect(within(resultList()).getByRole('group', { name: 'Destinations' })).toBeInTheDocument()
    expect(within(activeOption()).getByText('1 of 1')).toBeInTheDocument()
  })

  it('moves the active option with the arrow keys, wrapping at both ends', async () => {
    const { user } = await renderApp()
    await openPalette(user)
    const all = options()
    expect(activeOption()).toBe(all[0])
    await user.keyboard('{ArrowDown}')
    expect(combobox()).toHaveAttribute('aria-activedescendant', all[1].id)
    expect(all[1]).toHaveAttribute('aria-selected', 'true')
    expect(all[0]).toHaveAttribute('aria-selected', 'false')
    expect(within(all[1]).getByText('2 of 8')).toBeInTheDocument()
    expect(within(all[0]).queryByText('1 of 8')).not.toBeInTheDocument()

    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(activeOption()).toBe(all[all.length - 1])
    expect(within(all[all.length - 1]).getByText('8 of 8')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}')
    expect(activeOption()).toBe(all[0])
    expect(combobox()).toHaveFocus()
  })

  it('numbers every option across groups with aria-posinset and aria-setsize', async () => {
    const { user } = await renderApp()
    await openPalette(user)
    const check = (expectedCount?: number): void => {
      const all = options()
      expect(all.length).toBeGreaterThan(1)
      if (expectedCount !== undefined) expect(all).toHaveLength(expectedCount)
      all.forEach((option, index) => {
        expect(option).toHaveAttribute('aria-posinset', String(index + 1))
        expect(option).toHaveAttribute('aria-setsize', String(all.length))
      })
    }
    check(8)
    await user.type(combobox(), 'patient')
    // Several groups now: positions run on across them.
    expect(groups().length).toBeGreaterThan(1)
    check()
  })

  it('runs Open Inbox with Enter, closing the palette and navigating', async () => {
    const { user } = await renderApp()
    await openPalette(user)
    await user.type(combobox(), 'inbox')
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument()
  })

  it('opens a patient chosen from the results: selected in the list, with focus on it', async () => {
    const { user } = await renderApp({ initialUi: { view: 'overview' } })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Overview')
    await openPalette(user)
    await user.type(combobox(), 'riley')
    expect(activeOption()).toHaveAccessibleName('Riley Singh, CC-1057 · Lab results · Completed')
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
    expect(document.getElementById('patient-name-heading')).toHaveTextContent('Riley Singh')
    const option = document.getElementById(`patient-option-${RILEY}`)
    expect(option).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(option).toHaveFocus())
  })

  it('closes with Escape and returns focus to the control focused before it opened', async () => {
    const { user } = await renderApp()
    const option = document.getElementById(`patient-option-${AVERY}`) as HTMLElement
    act(() => option.focus())
    expect(option).toHaveFocus()
    await openPalette(user)
    expect(combobox()).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(option).toHaveFocus()
  })

  it('announces the number of results politely after typing stops', async () => {
    const { user } = await renderApp()
    await openPalette(user)
    await user.type(combobox(), 'inbox')
    await waitFor(() => expect(liveRegionText('polite')).toBe('1 result'))
    await user.type(combobox(), 'zzz')
    await waitFor(() => expect(liveRegionText('polite')).toBe('No results'))
    await user.clear(combobox())
    await waitFor(() => expect(liveRegionText('polite')).toBe('8 results'))
  })

  it('says the shortcut in its footer as text, not only as keycaps', async () => {
    const { user } = await renderApp()
    const dialog = await openPalette(user)
    const hint = within(dialog).getByText(/Open anytime/)
    expect(Array.from(hint.querySelectorAll('kbd'), (key) => key.textContent)).toEqual(['Ctrl', 'K'])
    expect(spokenText(hint)).toBe('Open anytime Ctrl+K')
  })

  it('names the Mac keys in its footer on a Mac', async () => {
    await renderApp({ api: createMemoryApi({ platform: 'darwin' }), initialUi: { modal: { kind: 'palette' } } })
    const hint = within(await screen.findByRole('dialog', { name: 'Command palette' })).getByText(/Open anytime/)
    await waitFor(() => expect(spokenText(hint)).toBe('Open anytime ⌘+K'))
  })

  it('keeps focus in the combobox wherever the palette is pressed, so typing still searches', async () => {
    const { user } = await renderApp()
    const dialog = await openPalette(user)
    // Start one press from the Close button (Tab wraps to it), so the press has to bring focus back.
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
    const targets: [string, Element][] = [
      ['title', within(dialog).getByRole('heading', { level: 2, name: 'Command palette' })],
      ['header icon', dialog.querySelector('.dialog__icon') as Element],
      ['header', dialog.querySelector('.dialog__header') as Element],
      ['body padding', dialog.querySelector('.dialog__body') as Element],
      ['scope chip', within(dialog).getByText('All commands')],
      ['helper text', within(dialog).getByText('Type a command, patient label, or destination')],
      ['group heading', within(dialog).getByText('Recent destinations')],
      ['list', within(dialog).getByRole('listbox', { name: 'Commands' })],
      ['footer note', within(dialog).getByText('Searching CareConnect · synthetic demo data only')],
      ['footer hint', within(dialog).getByText(/Open anytime/)],
      ['footer', dialog.querySelector('.dialog__footer') as Element]
    ]
    for (const [label, target] of targets) {
      expect(target).not.toBeNull()
      await user.click(target)
      expect({ label, focused: document.activeElement === combobox() }).toEqual({ label, focused: true })
    }
    await user.keyboard('inbox')
    expect(combobox()).toHaveValue('inbox')
    expect(options().map((option) => computeAccessibleName(option))).toEqual(['Open Inbox, 4 unread conversations'])
  })

  it('still closes from its Close button', async () => {
    const { user } = await renderApp()
    const dialog = await openPalette(user)
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves focus to the patient search field for Search patient directory, from another view', async () => {
    const { user } = await renderApp({ initialUi: { view: 'overview' } })
    await openPalette(user)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(activeOption()).toHaveAccessibleName('Search patient directory, Search across assigned care teams')
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
    await waitFor(() => expect(document.getElementById('patient-search')).toHaveFocus())
  })

  it('has no axe violations, empty or filtered', async () => {
    const { user } = await renderApp()
    const dialog = await openPalette(user)
    expect(await axe(dialog, AXE_OPTIONS)).toHaveNoViolations()
    await user.type(combobox(), 'pa')
    expect(await axe(dialog, AXE_OPTIONS)).toHaveNoViolations()
    await user.type(combobox(), 'zzz')
    expect(await axe(dialog, AXE_OPTIONS)).toHaveNoViolations()
  })
})

describe('CommandPalette behaviour (isolated shell)', () => {
  it('shows the design’s groups under visible headings, with the first option active', async () => {
    const { user } = await renderProbe()
    await openPalette(user)
    const headingOf = (group: HTMLElement): string | null | undefined =>
      document.getElementById(group.getAttribute('aria-labelledby') ?? '')?.textContent
    expect(screen.getAllByRole('group').map(headingOf)).toEqual(['Suggested commands', 'Recent destinations', 'Global commands'])
    expect(within(screen.getByRole('group', { name: 'Suggested commands' })).getAllByRole('option')).toHaveLength(3)
    expect(within(screen.getByRole('group', { name: 'Recent destinations' })).getAllByRole('option')).toHaveLength(3)
    expect(within(screen.getByRole('group', { name: 'Global commands' })).getAllByRole('option')).toHaveLength(2)

    const first = screen.getByRole('option', { name: 'Open Patients, Navigate to patient workspace' })
    expect(activeOption()).toBe(first)
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(within(first).getByText('1 of 8')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Avery Park — Care summary, Recent · 4 minutes ago' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('option', { name: 'Team Inbox — Triage, 4 unread conversations' })).toBeInTheDocument()
  })

  it('shows keycaps and describes the shortcut to screen readers', async () => {
    const { user } = await renderProbe()
    await openPalette(user)
    const create = screen.getByRole('option', { name: 'Create new patient record, Opens a blank synthetic record form' })
    expect(Array.from(create.querySelectorAll('kbd'), (key) => key.textContent)).toEqual(['Ctrl', 'N'])
    expect(create).toHaveAccessibleDescription('Shortcut: Ctrl+N')
    expect(screen.getByRole('option', { name: 'Open Patients, Navigate to patient workspace' })).toHaveAccessibleDescription('Shortcut: G then P')
  })

  it('starts again at the first result when the query changes', async () => {
    const { user } = await renderProbe()
    await openPalette(user)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await user.type(combobox(), 'open')
    expect(activeOption()).toBe(options()[0])
  })

  it('runs an option when it is clicked, and hovering makes it active', async () => {
    const { user } = await renderProbe()
    await openPalette(user)
    const morgan = screen.getByRole('option', { name: /^Morgan Chen — Care summary/ })
    await user.hover(morgan)
    expect(activeOption()).toBe(morgan)
    await user.click(morgan)
    expect(screen.getByTestId('selected')).toHaveTextContent(patientIdFor('Morgan Chen'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not let Enter also press the button that focus returns to', async () => {
    const { user } = await renderProbe()
    const opener = screen.getByRole('button', { name: 'Command palette' })
    opener.focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('dialog', { name: 'Command palette' })
    await user.type(combobox(), 'tasks')
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('view')).toHaveTextContent('tasks')
    // Focus went back to the opener; had the Enter leaked, it would have reopened the palette.
    expect(opener).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes when the backdrop is clicked', async () => {
    const { user } = await renderProbe()
    const dialog = await openPalette(user)
    fireEvent.mouseDown(dialog.parentElement as HTMLElement)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.mouseUp(dialog.parentElement as HTMLElement)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('hands over to a dialog it opens, and focus still returns to the original control', async () => {
    const { user } = await renderProbe()
    const before = screen.getByRole('button', { name: 'Somewhere else' })
    before.focus()
    await openPalette(user)
    await user.click(screen.getByRole('option', { name: 'Open keyboard shortcuts' }))
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(before).toHaveFocus()
  })

  it('moves focus to the search field for Search patient directory', async () => {
    const { user } = await renderProbe()
    await openPalette(user)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(activeOption()).toHaveAccessibleName('Search patient directory, Search across assigned care teams')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('textbox', { name: 'Probe search' })).toHaveFocus()
  })

  it('does not announce results after it has closed', async () => {
    const { user } = await renderProbe()
    await openPalette(user)
    await user.type(combobox(), 'zzz')
    await user.keyboard('{Escape}')
    await new Promise((resolve) => setTimeout(resolve, 450))
    expect(liveRegionText('polite')).toBe('')
  })

  it('says when nothing matches and drops the active descendant', async () => {
    const { user } = await renderProbe()
    await openPalette(user)
    await user.type(combobox(), 'zzz')
    expect(options()).toHaveLength(0)
    expect(combobox()).not.toHaveAttribute('aria-activedescendant')
    expect(screen.getByText('No commands, patients or destinations match “zzz”.')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
  })

  it('keeps Tab inside the dialog', async () => {
    const { user } = await renderProbe()
    const dialog = await openPalette(user)
    for (let i = 0; i < 4; i += 1) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })
})
