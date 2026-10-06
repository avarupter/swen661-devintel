import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createSeedWorkspace } from '../../../../../shared/seed'
import { STATUS_LABELS } from '../../../../../shared/format'
import { LIMITS, validateContextMenuRequest } from '../../../../../shared/validate'
import { ANNOUNCE_DELAY_MS } from '../../../a11y/Announcer'
import { patientContextMenuItems } from '../../../commands/patientContextMenu'
import { statusCounts } from '../../../state/selectors'
import { createMemoryApi, FIXED_NOW } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderApp } from '../../../../../../tests/renderer/renderApp'
import { SEARCH_ANNOUNCE_DELAY_MS } from '../PatientList'

/** The "Status" footer, where status messages stay visible (the live region repeats them for screen readers). */
function statusBar(): HTMLElement {
  return screen.getByRole('contentinfo', { name: 'Status' })
}

const seed = createSeedWorkspace(FIXED_NOW)
const counts = statusCounts(seed.patients)

function listbox(): HTMLElement {
  return screen.getByRole('listbox', { name: 'Recent patients' })
}

function options(): HTMLElement[] {
  return within(listbox()).getAllByRole('option')
}

function option(name: string): HTMLElement {
  return screen.getByRole('option', { name: new RegExp(`^${name},`) })
}

/** The patient name an option announces first: "Avery Park, …" → "Avery Park". */
function nameOf(element: HTMLElement): string {
  return (element.getAttribute('aria-label') ?? '').split(',')[0]
}

function detailHeading(): HTMLElement {
  return document.getElementById('patient-name-heading') as HTMLElement
}

function patient(name: string) {
  const found = seed.patients.find((entry) => entry.name === name)
  if (!found) throw new Error(`No seed patient ${name}`)
  return found
}

/**
 * Gives `element` an on-screen box, so a native menu anchored to it gets distinct
 * coordinates (jsdom puts every element at 0,0). Returns the expected menu position:
 * the box's bottom-left, rounded.
 */
function placeAt(element: Element | null, left: number, bottom: number): { x: number; y: number } {
  if (!element) throw new Error('No element to place')
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({ left, bottom, top: bottom - 44, right: left + 120, width: 120, height: 44, x: left, y: bottom - 44, toJSON: () => ({}) })
  return { x: Math.round(left), y: Math.round(bottom) }
}

/** Runs pending fake timers for `ms` and flushes the React updates they cause. */
async function advance(ms: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

describe('PatientsView: list pane', () => {
  it('renders all 28 patients, most recent first, with Avery Park selected', async () => {
    await renderApp()
    const all = options()
    expect(all).toHaveLength(28)
    expect(all[0]).toHaveAttribute('id', `patient-option-${patient('Avery Park').id}`)
    expect(all[0]).toHaveAttribute('aria-selected', 'true')
    expect(all[1]).toHaveAttribute('aria-selected', 'false')
    expect(all.slice(0, 5).map((element) => element.textContent)).toEqual([
      expect.stringContaining('Avery Park'),
      expect.stringContaining('Morgan Chen'),
      expect.stringContaining('Riley Singh'),
      expect.stringContaining('Taylor Lane'),
      expect.stringContaining('Jamie Wu')
    ])
    expect(screen.getByRole('heading', { level: 2, name: 'Recent patients' })).toBeInTheDocument()
    expect(screen.getByText('28 results')).toBeInTheDocument()
  })

  it('names each option "<name>, <secondary>. <status>" (spec card 05)', async () => {
    await renderApp()
    expect(options()[0]).toHaveAccessibleName('Avery Park, Wellness follow-up · 10:30. Needs review')
    expect(option('Morgan Chen')).toHaveAccessibleName('Morgan Chen, Care plan update · Today. Open')
    expect(option('Riley Singh')).toHaveAccessibleName('Riley Singh, Lab results · Yesterday. Completed')
    expect(option('Taylor Lane')).toHaveAccessibleName('Taylor Lane, New referral · Sep 28. Open')
  })

  it('shows the secondary text and a worded status chip on each row', async () => {
    await renderApp()
    const avery = options()[0]
    expect(within(avery).getByText('Wellness follow-up · 10:30')).toBeInTheDocument()
    expect(within(avery).getByText('Needs review')).toBeInTheDocument()
    expect(within(avery).getByText('AP')).toHaveAttribute('aria-hidden', 'true')
  })

  it('is one Tab stop: only the selected option is tabbable', async () => {
    await renderApp()
    const tabbable = options().filter((element) => element.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toHaveAttribute('aria-selected', 'true')
    for (const element of options()) expect(element).toHaveClass('focus-inset')
  })

  it('ArrowDown moves focus and selection to Morgan Chen and updates the detail pane', async () => {
    const { user } = await renderApp()
    act(() => options()[0].focus())
    await user.keyboard('{ArrowDown}')
    const morgan = option('Morgan Chen')
    expect(morgan).toHaveFocus()
    expect(morgan).toHaveAttribute('aria-selected', 'true')
    expect(morgan).toHaveAttribute('tabindex', '0')
    expect(options()[0]).toHaveAttribute('aria-selected', 'false')
    expect(options()[0]).toHaveAttribute('tabindex', '-1')
    expect(detailHeading()).toHaveTextContent('Morgan Chen')

    await user.keyboard('{ArrowUp}')
    expect(options()[0]).toHaveFocus()
    expect(detailHeading()).toHaveTextContent('Avery Park')
  })

  it('stops at the ends instead of wrapping', async () => {
    const { user } = await renderApp()
    act(() => options()[0].focus())
    await user.keyboard('{ArrowUp}')
    expect(options()[0]).toHaveFocus()
    await user.keyboard('{End}{ArrowDown}')
    expect(options()[27]).toHaveFocus()
  })

  it('Home, End, PageDown and PageUp move by the expected amounts', async () => {
    const { user } = await renderApp()
    act(() => options()[0].focus())

    await user.keyboard('{End}')
    expect(options()[27]).toHaveFocus()
    expect(options()[27]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(options()[0]).toHaveFocus()
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{PageDown}')
    expect(options()[10]).toHaveFocus()
    await user.keyboard('{PageDown}{PageDown}')
    expect(options()[27]).toHaveFocus()
    await user.keyboard('{PageUp}')
    expect(options()[17]).toHaveFocus()
    expect(options()[17]).toHaveAttribute('aria-selected', 'true')
    expect(detailHeading()).toHaveTextContent(nameOf(options()[17]))
  })

  it('has no type-ahead: letters stay workspace shortcuts', async () => {
    const { user } = await renderApp()
    act(() => options()[0].focus())
    // "J" would jump to Jamie Wu in a type-ahead listbox; here it does nothing.
    await user.keyboard('j')
    expect(options()[0]).toHaveFocus()
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    // "M" is Message patient.
    await user.keyboard('m')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('Space and Shift+Space keep the focused row in view instead of scrolling the list a page', async () => {
    await renderApp()
    const morgan = option('Morgan Chen')
    act(() => morgan.focus())
    // fireEvent returns false when the browser's default action (here, scrolling the overflow container) was prevented.
    expect(fireEvent.keyDown(morgan, { key: ' ', code: 'Space' })).toBe(false)
    expect(fireEvent.keyDown(morgan, { key: ' ', code: 'Space', shiftKey: true })).toBe(false)
    expect(morgan).toHaveFocus()
    expect(morgan).toHaveAttribute('aria-selected', 'true')
    expect(options().filter((element) => element.getAttribute('aria-selected') === 'true')).toEqual([morgan])
    expect(detailHeading()).toHaveTextContent('Morgan Chen')
    // Space with Ctrl, Alt or Meta is left alone for the system and assistive technology.
    expect(fireEvent.keyDown(morgan, { key: ' ', code: 'Space', ctrlKey: true })).toBe(true)
  })

  it('Enter moves focus to the patient name heading in the detail pane', async () => {
    const { user } = await renderApp()
    act(() => option('Morgan Chen').focus())
    await user.keyboard('{Enter}')
    expect(detailHeading()).toHaveFocus()
    expect(detailHeading()).toHaveTextContent('Morgan Chen')
  })

  it('a click selects the patient, and Tab into the list lands on the selected option', async () => {
    const { user } = await renderApp()
    await user.click(option('Riley Singh'))
    expect(option('Riley Singh')).toHaveAttribute('aria-selected', 'true')
    expect(detailHeading()).toHaveTextContent('Riley Singh')

    act(() => screen.getByRole('searchbox', { name: 'Search list' }).focus())
    await user.tab()
    // The filter row is absent, so the next stop after the search field is the selected option.
    expect(option('Riley Singh')).toHaveFocus()
  })

  it('remembers the selection as a recent patient with the clock time', async () => {
    const { user, api } = await renderApp()
    await user.click(option('Morgan Chen'))
    // Changes are saved with the session's recent patients; trigger a save with a workspace change.
    act(() => api.emitCommand({ id: 'patient.markOpen', patientId: patient('Avery Park').id }))
    await waitFor(() => expect(api.saved.length).toBeGreaterThan(0))
    const recent = api.saved[api.saved.length - 1].recentPatients
    expect(recent[0]).toEqual({ patientId: patient('Morgan Chen').id, at: FIXED_NOW.toISOString() })
  })
})

describe('PatientsView: search', () => {
  it('is a labelled search landmark bound to the patient query', async () => {
    await renderApp()
    const search = screen.getByRole('search', { name: 'Patient list' })
    const input = within(search).getByRole('searchbox', { name: 'Search list' })
    expect(input).toHaveAttribute('id', 'patient-search')
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('placeholder', 'Search list')
  })

  it('typing "riley" leaves one option and announces "1 result" after a pause', async () => {
    const { user } = await renderApp()
    await user.type(screen.getByRole('searchbox', { name: 'Search list' }), 'riley')
    expect(options()).toHaveLength(1)
    expect(options()[0]).toHaveAccessibleName('Riley Singh, Lab results · Yesterday. Completed')
    expect(screen.getByText('1 result')).toBeInTheDocument()
    await waitFor(() => expect(liveRegionText()).toBe('1 result'))
  })

  it('matches Care IDs too', async () => {
    const { user } = await renderApp()
    await user.type(screen.getByRole('searchbox', { name: 'Search list' }), 'cc-1052')
    expect(options()).toHaveLength(1)
    expect(options()[0]).toHaveTextContent('Morgan Chen')
  })

  it('does not announce until typing starts', async () => {
    await renderApp()
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(liveRegionText()).toBe('')
  })

  describe('with fake timers', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('announces the count once, 400 ms after the last keystroke, and stays quiet while typing continues', async () => {
      expect(SEARCH_ANNOUNCE_DELAY_MS).toBe(400)
      await renderApp()
      const input = screen.getByRole('searchbox', { name: 'Search list' })

      // Each keystroke within 400 ms of the previous one restarts the wait.
      fireEvent.change(input, { target: { value: 'r' } })
      await advance(SEARCH_ANNOUNCE_DELAY_MS - 100)
      expect(liveRegionText()).toBe('')
      fireEvent.change(input, { target: { value: 'ri' } })
      await advance(SEARCH_ANNOUNCE_DELAY_MS - 100)
      expect(liveRegionText()).toBe('')
      fireEvent.change(input, { target: { value: 'riley' } })
      expect(screen.getByText('1 result')).toBeInTheDocument()

      // The announcer clears its region and refills it ANNOUNCE_DELAY_MS later, so the
      // text can only appear SEARCH_ANNOUNCE_DELAY_MS + ANNOUNCE_DELAY_MS after the last keystroke.
      await advance(SEARCH_ANNOUNCE_DELAY_MS - 1)
      expect(liveRegionText()).toBe('')
      await advance(ANNOUNCE_DELAY_MS)
      expect(liveRegionText()).toBe('')
      await advance(1)
      expect(liveRegionText()).toBe('1 result')

      // Nothing else is announced once typing has stopped.
      await advance(5_000)
      expect(liveRegionText()).toBe('1 result')
    })

    it('announces the new count after Escape clears the query', async () => {
      await renderApp()
      const input = screen.getByRole('searchbox', { name: 'Search list' })
      fireEvent.change(input, { target: { value: 'riley' } })
      await advance(SEARCH_ANNOUNCE_DELAY_MS + ANNOUNCE_DELAY_MS)
      expect(liveRegionText()).toBe('1 result')

      fireEvent.keyDown(input, { key: 'Escape' })
      expect(input).toHaveValue('')
      await advance(SEARCH_ANNOUNCE_DELAY_MS + ANNOUNCE_DELAY_MS - 1)
      expect(liveRegionText()).toBe('')
      await advance(1)
      expect(liveRegionText()).toBe('28 results')
    })
  })

  it('Escape clears the query, and Escape again moves focus to the selected option', async () => {
    const { user } = await renderApp()
    const input = screen.getByRole('searchbox', { name: 'Search list' })
    await user.type(input, 'riley')
    expect(options()).toHaveLength(1)

    await user.keyboard('{Escape}')
    expect(input).toHaveValue('')
    expect(options()).toHaveLength(28)
    expect(input).toHaveFocus()
    await waitFor(() => expect(liveRegionText()).toBe('28 results'))

    await user.keyboard('{Escape}')
    expect(options()[0]).toHaveFocus()
  })

  it('ArrowDown from the search field moves into the list', async () => {
    const { user } = await renderApp()
    await user.click(screen.getByRole('searchbox', { name: 'Search list' }))
    await user.keyboard('{ArrowDown}')
    expect(options()[0]).toHaveFocus()
  })

  it('"/" and the toolbar Search button focus the search field', async () => {
    const { user } = await renderApp()
    act(() => options()[0].focus())
    await user.keyboard('/')
    expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: /^Search/ }))
    expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveFocus()
  })

  it('shows an empty state with "Clear search" that restores the list and keeps focus in the search field', async () => {
    const { user } = await renderApp()
    await user.type(screen.getByRole('searchbox', { name: 'Search list' }), 'zzz')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByText('No patients match “zzz”.')).toBeInTheDocument()
    expect(screen.getByText('No results')).toBeInTheDocument()
    await waitFor(() => expect(liveRegionText()).toBe('No results'))

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(options()).toHaveLength(28)
    expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveValue('')
    expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveFocus()
  })

  it('keeps a Tab stop when the selected patient is filtered out', async () => {
    const { user } = await renderApp()
    await user.type(screen.getByRole('searchbox', { name: 'Search list' }), 'morgan')
    // Morgan Chen and Casey Morgan match; Avery stays selected in the detail pane.
    const visible = options()
    expect(visible.filter((element) => element.tabIndex === 0)).toHaveLength(1)
    expect(visible[0]).toHaveAttribute('tabindex', '0')
    expect(visible.every((element) => element.getAttribute('aria-selected') === 'false')).toBe(true)
    expect(detailHeading()).toHaveTextContent('Avery Park')

    // Selection follows focus once the user moves into the list.
    await user.tab()
    expect(visible[0]).toHaveFocus()
    expect(visible[0]).toHaveAttribute('aria-selected', 'true')
  })
})

describe('PatientsView: filter, sort and context menus', () => {
  it('filters through a native radio menu at the Filter button and announces the result', async () => {
    const { api, user } = await renderApp()
    const filterButton = placeAt(document.getElementById('toolbar-patient.filter'), 1012.4, 96.6)
    placeAt(document.getElementById('toolbar-patient.sort'), 1140, 96)
    api.nextContextMenuChoice = 'needs-review'
    await act(async () => api.emitCommand({ id: 'patient.filter' }))

    expect(filterButton).toEqual({ x: 1012, y: 97 })
    expect(api.showContextMenu).toHaveBeenCalledWith({
      items: [
        { id: 'all', label: 'All patients', type: 'radio', checked: true },
        { id: 'needs-review', label: 'Needs review', type: 'radio', checked: false },
        { id: 'open', label: 'Open', type: 'radio', checked: false },
        { id: 'completed', label: 'Completed', type: 'radio', checked: false }
      ],
      ...filterButton
    })
    const expected = counts['needs-review']
    await waitFor(() => expect(options()).toHaveLength(expected))
    expect(options().every((element) => element.textContent?.includes('Needs review'))).toBe(true)
    expect(screen.getByText(`${expected} results`)).toBeInTheDocument()
    await waitFor(() => expect(liveRegionText()).toBe(`Showing Needs review patients, ${expected} results`))

    expect(screen.getByText('Showing: Needs review')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filter' }))
    expect(options()).toHaveLength(28)
    expect(screen.queryByText('Showing: Needs review')).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveFocus()
    await waitFor(() => expect(liveRegionText()).toBe('Showing all patients, 28 results'))
  })

  it('the Filter toolbar button opens the same menu, with the current filter checked', async () => {
    const { api, user } = await renderApp()
    api.nextContextMenuChoice = 'completed'
    await user.click(screen.getByRole('button', { name: 'Filter patient list' }))
    await waitFor(() => expect(options()).toHaveLength(counts.completed))

    api.nextContextMenuChoice = null
    await user.click(screen.getByRole('button', { name: /^Filter patient list, showing Completed/ }))
    await waitFor(() => expect(api.showContextMenu).toHaveBeenCalledTimes(2))
    const items = api.showContextMenu.mock.calls[1][0].items
    expect(items.find((item) => item.checked)?.id).toBe('completed')
    // Dismissing the menu changes nothing.
    expect(options()).toHaveLength(counts.completed)
  })

  it('Ctrl+Shift+L opens the filter menu', async () => {
    const { api, user } = await renderApp()
    api.nextContextMenuChoice = 'open'
    act(() => options()[0].focus())
    await user.keyboard('{Control>}{Shift>}L{/Shift}{/Control}')
    await waitFor(() => expect(options()).toHaveLength(counts.open))
  })

  it('sorts by name through a radio menu at the Sort button, putting Alex Rivera first', async () => {
    const { api } = await renderApp()
    placeAt(document.getElementById('toolbar-patient.filter'), 1012, 96)
    const sortButton = placeAt(document.getElementById('toolbar-patient.sort'), 1140.2, 96.2)
    api.nextContextMenuChoice = 'name'
    await act(async () => api.emitCommand({ id: 'patient.sort' }))
    expect(api.showContextMenu).toHaveBeenCalledWith({
      items: [
        { id: 'recent', label: 'Recent activity', type: 'radio', checked: true },
        { id: 'name', label: 'Name', type: 'radio', checked: false },
        { id: 'nextVisit', label: 'Next visit', type: 'radio', checked: false },
        { id: 'status', label: 'Status', type: 'radio', checked: false }
      ],
      ...sortButton
    })
    expect(sortButton).toEqual({ x: 1140, y: 96 })
    await waitFor(() => expect(options()[0]).toHaveTextContent('Alex Rivera'))
    const names = options().map((element) => element.getAttribute('aria-label') ?? '')
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names)
    await waitFor(() => expect(liveRegionText()).toBe('Sorted by name'))
  })

  it('a contextmenu event on an option selects it and opens the patient menu at the pointer', async () => {
    const { api } = await renderApp()
    api.nextContextMenuChoice = 'patient.addNote'
    const morgan = option('Morgan Chen')
    fireEvent.contextMenu(morgan, { clientX: 120, clientY: 340 })

    expect(api.showContextMenu).toHaveBeenCalledWith({ items: patientContextMenuItems(patient('Morgan Chen')), x: 120, y: 340 })
    expect(morgan).toHaveAttribute('aria-selected', 'true')
    expect(morgan).toHaveFocus()
    expect(await screen.findByRole('dialog', { name: 'Add clinical note' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('Morgan Chen')
  })

  it('a keyboard contextmenu (no pointer position) places the menu at the row', async () => {
    const { api } = await renderApp()
    const avery = options()[0]
    jest.spyOn(avery, 'getBoundingClientRect').mockReturnValue({ left: 272, bottom: 361.4, top: 273, right: 652, width: 380, height: 88, x: 272, y: 273, toJSON: () => ({}) })
    fireEvent.contextMenu(avery)
    await waitFor(() => expect(api.showContextMenu).toHaveBeenCalledWith({ items: patientContextMenuItems(patient('Avery Park')), x: 272, y: 361 }))
  })

  it('runs the chosen status command for that patient', async () => {
    const { api } = await renderApp()
    api.nextContextMenuChoice = 'patient.markCompleted'
    fireEvent.contextMenu(option('Taylor Lane'))
    // The status change is logged as today's activity, so the secondary text moves to "Today".
    await waitFor(() => expect(option('Taylor Lane')).toHaveAccessibleName('Taylor Lane, New referral · Today. Completed'))
    expect(within(statusBar()).getByText('Taylor Lane marked as completed.')).toBeInTheDocument()
  })

  it('the "Open context menu" command opens the selected patient\'s menu at its row', async () => {
    const { api } = await renderApp()
    const row = placeAt(options()[0], 272, 361.4)
    placeAt(screen.getByRole('button', { name: 'More actions for Avery Park' }), 1180, 230)
    await act(async () => api.emitCommand({ id: 'patient.contextMenu' }))
    expect(api.showContextMenu).toHaveBeenCalledWith({ items: patientContextMenuItems(patient('Avery Park')), ...row })
    expect(row).toEqual({ x: 272, y: 361 })
  })

  it('opens the menu at the More button when a search hides the selected patient\'s row', async () => {
    const { api, user } = await renderApp()
    await user.type(screen.getByRole('searchbox', { name: 'Search list' }), 'morgan')
    expect(document.getElementById(`patient-option-${patient('Avery Park').id}`)).toBeNull()
    expect(detailHeading()).toHaveTextContent('Avery Park')
    const more = placeAt(screen.getByRole('button', { name: 'More actions for Avery Park' }), 1180.7, 230)
    await act(async () => api.emitCommand({ id: 'patient.contextMenu' }))
    expect(api.showContextMenu).toHaveBeenCalledWith({ items: patientContextMenuItems(patient('Avery Park')), ...more })
    expect(more).toEqual({ x: 1181, y: 230 })
  })

  it('opens the menu for a patient whose name and Care ID are at the length limit', async () => {
    const api = createMemoryApi()
    const longest = { ...api.workspace.patients[0], name: 'N'.repeat(LIMITS.shortText), careId: 'C'.repeat(LIMITS.shortText) }
    api.workspace.patients[0] = longest
    await renderApp({ api })
    api.nextContextMenuChoice = 'patient.addNote'
    fireEvent.contextMenu(document.getElementById(`patient-option-${longest.id}`) as HTMLElement, { clientX: 40, clientY: 50 })

    await waitFor(() => expect(api.showContextMenu).toHaveBeenCalledTimes(1))
    const request = api.showContextMenu.mock.calls[0][0]
    // The main process accepts it: every label fits, and the ids and position are unchanged.
    expect(() => validateContextMenuRequest(request)).not.toThrow()
    expect(request).toMatchObject({ x: 40, y: 50 })
    expect(request.items.map((item) => item.id)).toEqual(patientContextMenuItems(longest).map((item) => item.id))
    expect(request.items[0].label).toMatch(/^Message N+…$/)
    expect(within(statusBar()).queryByText(/Couldn't open the menu/)).not.toBeInTheDocument()
    expect(await screen.findByRole('dialog', { name: 'Add clinical note' })).toBeInTheDocument()
  })

  it('moves focus to a neighbouring option when the focused one drops out of a filtered list', async () => {
    const { api } = await renderApp()
    api.nextContextMenuChoice = 'needs-review'
    await act(async () => api.emitCommand({ id: 'patient.filter' }))
    await waitFor(() => expect(options()).toHaveLength(counts['needs-review']))

    const avery = options()[0]
    act(() => avery.focus())
    api.nextContextMenuChoice = 'patient.markCompleted'
    fireEvent.contextMenu(avery)
    await waitFor(() => expect(options()).toHaveLength(counts['needs-review'] - 1))
    expect(options()[0]).toHaveFocus()
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
  })
})

describe('PatientsView: edge cases', () => {
  it('"Open context menu" with no patient selected asks for a selection', async () => {
    const { api } = await renderApp({ initialUi: { selectedPatientId: 'p-not-in-the-list' } })
    await act(async () => api.emitCommand({ id: 'patient.contextMenu' }))
    expect(api.showContextMenu).not.toHaveBeenCalled()
    expect(within(statusBar()).getByText('Select a patient first.')).toBeInTheDocument()
  })

  it('reports a native menu failure in the status bar', async () => {
    const { api } = await renderApp()
    api.showContextMenu.mockRejectedValueOnce(new Error('menu unavailable'))
    fireEvent.contextMenu(option('Morgan Chen'))
    await waitFor(() => expect(within(statusBar()).getByText("Couldn't open the menu: menu unavailable")).toBeInTheDocument())
  })

  it('dismissing the patient menu runs nothing', async () => {
    const { api } = await renderApp()
    api.nextContextMenuChoice = null
    fireEvent.contextMenu(option('Morgan Chen'))
    await waitFor(() => expect(api.showContextMenu).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(option('Morgan Chen')).toHaveAccessibleName('Morgan Chen, Care plan update · Today. Open')
  })

  it('explains an empty filtered list without a second "Clear filter" button', async () => {
    const api = createMemoryApi()
    api.workspace.patients = api.workspace.patients.map((entry) => ({ ...entry, status: entry.status === 'completed' ? 'open' : entry.status }))
    await renderApp({ api })
    api.nextContextMenuChoice = 'completed'
    await act(async () => api.emitCommand({ id: 'patient.filter' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByText('No patients are marked completed.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Clear filter' })).toHaveLength(1)
    await waitFor(() => expect(liveRegionText()).toBe('Showing Completed patients, 0 results'))
  })

  it('does not pull focus back to the list when the vanished row was not focused', async () => {
    const { api, user } = await renderApp()
    api.nextContextMenuChoice = 'needs-review'
    await act(async () => api.emitCommand({ id: 'patient.filter' }))
    await waitFor(() => expect(options()).toHaveLength(counts['needs-review']))
    act(() => options()[0].focus())
    const careTeam = screen.getByRole('button', { name: /^4 members/ })
    await user.click(careTeam)
    act(() => api.emitCommand({ id: 'patient.markCompleted', patientId: patient('Avery Park').id }))
    await waitFor(() => expect(options()).toHaveLength(counts['needs-review'] - 1))
    expect(careTeam).toHaveFocus()
  })

  it('uses macOS key names on a Mac', async () => {
    await renderApp({ api: createMemoryApi({ platform: 'darwin' }) })
    await waitFor(() => expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveAttribute('aria-keyshortcuts', 'Meta+F /'))
  })
})

describe('PatientsView: layout and accessibility', () => {
  it('exposes the list and detail panes as F6 regions, and the view root is not a region', async () => {
    await renderApp()
    const list = document.getElementById('patient-list') as HTMLElement
    expect(list.tagName).toBe('SECTION')
    expect(list).toHaveAttribute('data-region', 'list')
    expect(list).toHaveAccessibleName('Recent patients')
    const detail = document.querySelector('[data-region="detail"]') as HTMLElement
    expect(detail.tagName).toBe('SECTION')
    expect(detail).toHaveAttribute('aria-labelledby', 'patient-name-heading')
    expect(detail).toHaveAccessibleName('Avery Park')
    const regions = Array.from(document.querySelectorAll('#main [data-region]'), (element) => element.getAttribute('data-region'))
    expect(regions).toEqual(['list', 'detail'])
  })

  it('names the detail pane as a group, not a landmark, so "Recent activity" is a top-level complementary landmark', async () => {
    const { container } = await renderApp()
    const detail = document.querySelector('[data-region="detail"]') as HTMLElement
    expect(screen.getByRole('group', { name: 'Avery Park' })).toBe(detail)
    expect(screen.queryByRole('region', { name: 'Avery Park' })).not.toBeInTheDocument()
    // Spec card 03's landmarks: complementary "Recent activity" sits in main, not inside another landmark.
    const activity = screen.getByRole('complementary', { name: 'Recent activity' })
    expect(detail).toContainElement(activity)
    expect(screen.getByRole('search', { name: 'Patient list' })).toBeInTheDocument()
    // jest-axe's default run skips these best-practice landmark rules, so run them explicitly.
    const landmarkRules = [
      'landmark-complementary-is-top-level',
      'landmark-banner-is-top-level',
      'landmark-contentinfo-is-top-level',
      'landmark-main-is-top-level',
      'landmark-no-duplicate-banner',
      'landmark-no-duplicate-contentinfo',
      'landmark-no-duplicate-main',
      'landmark-one-main',
      'landmark-unique'
    ]
    expect(await axe(container, { runOnly: { type: 'rule', values: landmarkRules } })).toHaveNoViolations()
  })

  it('F6 moves from the list to the detail pane and Shift+F6 back', async () => {
    const { user } = await renderApp()
    act(() => options()[0].focus())
    await user.keyboard('{F6}')
    expect(document.querySelector('[data-region="detail"]')?.contains(document.activeElement)).toBe(true)
    await user.keyboard('{Shift>}{F6}{/Shift}')
    expect(options()[0]).toHaveFocus()
  })

  it('the "Skip to patient list" link reaches the list pane', async () => {
    const { user } = await renderApp()
    await user.click(screen.getByText('Skip to patient list'))
    expect(document.getElementById('patient-list')).toHaveFocus()
  })

  it('renders an empty list when the workspace has no patients', async () => {
    const api = createMemoryApi()
    api.workspace = { ...api.workspace, patients: [], recentPatients: [] }
    await renderApp({ api })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByText('No patients yet.')).toBeInTheDocument()
    expect(screen.getByText('Select a patient to see their care summary.')).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = await renderApp()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })

  it('has no axe violations with a filter applied and an empty search', async () => {
    const { api, container, user } = await renderApp()
    api.nextContextMenuChoice = 'open'
    await act(async () => api.emitCommand({ id: 'patient.filter' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search list' }), 'nobody')
    expect(screen.getByText(`Showing: ${STATUS_LABELS.open}`)).toBeInTheDocument()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
