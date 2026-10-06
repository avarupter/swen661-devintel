import { screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SHORTCUT_GROUPS, SHORTCUTS } from '../../../../../shared/shortcuts'
import { createMemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderWithProviders } from '../../../../../../tests/renderer/renderApp'

const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } }

async function renderOpener(options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<button type="button">Somewhere else</button>, { keyboard: true, ...options })
}

async function openShortcuts(options: Parameters<typeof renderWithProviders>[1] = {}) {
  const rendered = await renderOpener(options)
  screen.getByRole('button', { name: 'Somewhere else' }).focus()
  await rendered.user.keyboard('{Control>}/{/Control}')
  const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })
  return { ...rendered, dialog }
}

/** On macOS the native menu owns ⌘/, so open the dialog directly and wait for the Mac platform to arrive. */
async function openShortcutsOnMac() {
  const rendered = await renderOpener({ api: createMemoryApi({ platform: 'darwin' }), initialUi: { modal: { kind: 'shortcuts' } } })
  const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })
  await screen.findAllByRole('columnheader', { name: 'macOS (this computer)' })
  return { ...rendered, dialog }
}

function filterInput(): HTMLElement {
  return screen.getByRole('searchbox', { name: 'Find a command' })
}

/** The keycaps in one cell, as text: ["Ctrl", "K"]. */
function caps(cell: HTMLElement): (string | null)[] {
  return Array.from(cell.querySelectorAll('kbd'), (key) => key.textContent)
}

function rowFor(action: string | RegExp): HTMLElement {
  return screen.getByRole('rowheader', { name: action }).closest('tr') as HTMLElement
}

describe('ShortcutsDialog', () => {
  it('opens with Ctrl+/ and puts focus in the filter', async () => {
    await openShortcuts()
    expect(filterInput()).toHaveFocus()
  })

  it('lists every shortcut once, in one captioned table per group', async () => {
    await openShortcuts()
    const tables = screen.getAllByRole('table')
    expect(tables).toHaveLength(SHORTCUT_GROUPS.length)
    SHORTCUT_GROUPS.forEach((group, index) => {
      const caption = tables[index].querySelector('caption')
      expect(caption).toHaveTextContent(group.title)
      expect(caption).toHaveTextContent(group.description)
      expect(within(tables[index]).getByRole('heading', { level: 3, name: group.title })).toBeInTheDocument()
      const rows = within(tables[index]).getAllByRole('rowheader')
      expect(rows.map((row) => row.textContent)).toEqual(
        SHORTCUTS.filter((shortcut) => shortcut.group === group.id).map((shortcut) => (shortcut.sequence ? `${shortcut.label} Sequence` : shortcut.label))
      )
    })
    expect(screen.getAllByRole('rowheader')).toHaveLength(SHORTCUTS.length)
  })

  it('has Action, Windows / Linux and macOS column headers in every table', async () => {
    await openShortcuts()
    for (const table of screen.getAllByRole('table')) {
      const headers = within(table).getAllByRole('columnheader')
      expect(headers.map((header) => header.textContent)).toEqual(['Action', 'Windows / Linux (this computer)', 'macOS'])
      for (const header of headers) expect(header).toHaveAttribute('scope', 'col')
    }
  })

  it('shows Windows / Linux and macOS keycaps, with a Sequence badge for sequences', async () => {
    await openShortcuts()
    const palette = within(rowFor('Open command palette')).getAllByRole('cell')
    expect(caps(palette[0])).toEqual(['Ctrl', 'K'])
    expect(caps(palette[1])).toEqual(['⌘', 'K'])
    expect(palette[0]).toHaveTextContent('Ctrl+K')

    const overview = rowFor('Open Overview Sequence')
    expect(within(overview).getByText('Sequence')).toBeInTheDocument()
    const sequence = within(overview).getAllByRole('cell')
    expect(caps(sequence[0])).toEqual(['G', 'O'])
    expect(caps(sequence[1])).toEqual(['G', 'O'])
    expect(sequence[0]).toHaveTextContent('G then O')

    const region = within(rowFor('Next workspace region')).getAllByRole('cell')
    expect(caps(region[0])).toEqual(['F6'])
    expect(caps(region[1])).toEqual(['Fn', 'F6'])

    // Alternate keys are listed too: Ctrl+F or /.
    const search = within(rowFor('Search current list')).getAllByRole('cell')
    expect(caps(search[0])).toEqual(['Ctrl', 'F', '/'])
    expect(search[0]).toHaveTextContent('Ctrl+F or /')
  })

  it('lists the Menu key for Windows and Linux only, because Mac keyboards have none', async () => {
    await openShortcuts()
    const [windows, mac] = within(rowFor('Open context menu')).getAllByRole('cell')
    expect(caps(windows)).toEqual(['Shift', 'F10', 'Menu'])
    expect(windows).toHaveTextContent('Shift+F10 or Menu')
    expect(caps(mac)).toEqual(['⇧', 'Fn', 'F10'])
    expect(mac).toHaveTextContent('⇧+Fn+F10')
    expect(mac).not.toHaveTextContent('Menu')
    expect(mac).not.toHaveTextContent(' or ')
  })

  it('marks the macOS column as this computer on a Mac', async () => {
    const { dialog } = await openShortcutsOnMac()
    expect(within(dialog).getAllByRole('columnheader', { name: 'macOS (this computer)' })).toHaveLength(SHORTCUT_GROUPS.length)
    expect(within(dialog).getAllByRole('columnheader', { name: 'Windows / Linux' })).toHaveLength(SHORTCUT_GROUPS.length)
    const legend = within(dialog).getByText('Press together').closest('li') as HTMLElement
    expect(caps(legend)).toEqual(['⌘', 'K'])
  })

  it('explains chords and sequences in a legend', async () => {
    const { dialog } = await openShortcuts()
    const together = within(dialog).getByText('Press together').closest('li') as HTMLElement
    expect(caps(together)).toEqual(['Ctrl', 'K'])
    const sequence = within(dialog).getByText('Press in sequence').closest('li') as HTMLElement
    expect(caps(sequence)).toEqual(['G', 'P'])
  })

  it('filters rows and hides empty tables, announcing the count', async () => {
    const { user } = await openShortcuts()
    await user.type(filterInput(), 'draft')
    expect(screen.getAllByRole('rowheader').map((row) => row.textContent)).toEqual(['Save draft'])
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getByRole('table', { name: /^Communication/ })).toBeInTheDocument()
    await waitFor(() => expect(liveRegionText('polite')).toBe('1 shortcut'))
  })

  it('matches keys as well as action names', async () => {
    const { user } = await openShortcuts()
    await user.type(filterInput(), 'f6')
    expect(screen.getAllByRole('rowheader').map((row) => row.textContent)).toEqual(['Next workspace region', 'Previous workspace region'])
    await waitFor(() => expect(liveRegionText('polite')).toBe('2 shortcuts'))
  })

  it('says when no shortcut matches', async () => {
    const { user } = await openShortcuts()
    await user.type(filterInput(), 'zzz')
    expect(screen.queryAllByRole('table')).toHaveLength(0)
    expect(screen.getByText('No shortcuts match “zzz”.')).toBeInTheDocument()
    await waitFor(() => expect(liveRegionText('polite')).toBe('No shortcuts'))
  })

  it('moves focus to the filter with Ctrl+F', async () => {
    const { user } = await openShortcuts()
    const print = screen.getByRole('button', { name: 'Print reference' })
    print.focus()
    await user.keyboard('{Control>}f{/Control}')
    expect(filterInput()).toHaveFocus()
  })

  it('moves focus to the filter with ⌘F on a Mac', async () => {
    const { user } = await openShortcutsOnMac()
    screen.getByRole('button', { name: 'Print reference' }).focus()
    await user.keyboard('{Control>}f{/Control}')
    expect(filterInput()).not.toHaveFocus()
    await user.keyboard('{Meta>}f{/Meta}')
    expect(filterInput()).toHaveFocus()
  })

  it('prints the reference', async () => {
    const { user, api } = await openShortcuts()
    expect(screen.getByText('Browser or assistive technology shortcuts take priority. CareConnect does not override reserved key combinations.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Print reference' }))
    expect(api.printPage).toHaveBeenCalledTimes(1)
  })

  it('reports a failed print', async () => {
    const { user, api } = await openShortcuts()
    api.printPage.mockRejectedValueOnce(new Error('No printer is available'))
    await user.click(screen.getByRole('button', { name: 'Print reference' }))
    await waitFor(() => expect(liveRegionText('assertive')).toBe('Couldn’t print the shortcuts reference: No printer is available'))
  })

  it('closes with Escape and returns focus to the opener', async () => {
    const { user } = await openShortcuts()
    await user.type(filterInput(), 'draft')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Somewhere else' })).toHaveFocus()
  })

  it('has no axe violations', async () => {
    const { user, dialog } = await openShortcuts()
    expect(await axe(dialog, AXE_OPTIONS)).toHaveNoViolations()
    await user.type(filterInput(), 'zzz')
    expect(await axe(dialog, AXE_OPTIONS)).toHaveNoViolations()
  })
})
