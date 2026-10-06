import { act, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { isAllowedExternalUrl, RESOURCE_LINKS } from '../../../../../shared/links'
import { createMemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderApp, renderWithProviders } from '../../../../../../tests/renderer/renderApp'

const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } }
const ACCESSIBILITY_LINKS = RESOURCE_LINKS.filter((link) => link.category === 'Accessibility')

async function openHelp(options: Parameters<typeof renderWithProviders>[1] = {}) {
  const rendered = await renderWithProviders(<button type="button">Somewhere else</button>, { keyboard: true, ...options })
  screen.getByRole('button', { name: 'Somewhere else' }).focus()
  await rendered.user.keyboard('{F1}')
  const dialog = await screen.findByRole('dialog', { name: 'CareConnect help' })
  return { ...rendered, dialog }
}

/** On macOS the native menu owns F1, so open the dialog directly. */
async function openHelpOnMac() {
  const rendered = await renderWithProviders(<button type="button">Somewhere else</button>, {
    keyboard: true,
    api: createMemoryApi({ platform: 'darwin' }),
    initialUi: { modal: { kind: 'help' } }
  })
  const dialog = await screen.findByRole('dialog', { name: 'CareConnect help' })
  return { ...rendered, dialog }
}

/** The help section introduced by the h3 `name`. */
function section(dialog: HTMLElement, name: string): HTMLElement {
  return within(dialog).getByRole('heading', { level: 3, name }).closest('section') as HTMLElement
}

describe('HelpDialog', () => {
  it('opens with F1 and starts reading at the top', async () => {
    const { dialog } = await openHelp()
    const headings = within(dialog).getAllByRole('heading', { level: 3 })
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Getting around',
      'Using a screen reader',
      'Status and errors',
      'Keyboard shortcuts',
      'Accessibility resources'
    ])
    expect(headings[0]).toHaveFocus()
  })

  it('explains regions in F6 order, skip links, G sequences and the command palette', async () => {
    const { dialog } = await openHelp()
    const gettingAround = section(dialog, 'Getting around')
    const regions = within(gettingAround).getByRole('list', { name: 'Regions in F6 order' })
    expect(within(regions).getAllByRole('listitem').map((item) => item.textContent?.split(':')[0])).toEqual([
      'Navigation',
      'Toolbar',
      'Patient list',
      'Detail pane',
      'Status'
    ])
    expect(gettingAround).toHaveTextContent('Press F6')
    expect(gettingAround).toHaveTextContent('Shift+F6')
    expect(gettingAround).toHaveTextContent('Skip to main workspace')
    expect(gettingAround).toHaveTextContent('G then P')
    expect(gettingAround).toHaveTextContent('Ctrl+K')
  })

  it('covers landmarks, NVDA browse and focus modes, and Narrator', async () => {
    const { dialog } = await openHelp()
    const screenReader = section(dialog, 'Using a screen reader')
    for (const text of ['Workspace', 'Recent activity', 'Status', 'browse mode', 'Insert+Space', 'Narrator']) expect(screenReader).toHaveTextContent(text)
  })

  it('explains where status messages appear and how errors are summarised', async () => {
    const { dialog } = await openHelp()
    const statusAndErrors = section(dialog, 'Status and errors')
    expect(statusAndErrors).toHaveTextContent('status bar')
    expect(statusAndErrors).toHaveTextContent('summary')
  })

  it('names keys for the Mac on a Mac', async () => {
    const { dialog } = await openHelpOnMac()
    const gettingAround = section(dialog, 'Getting around')
    await waitFor(() => expect(gettingAround).toHaveTextContent('⌘+K'))
    expect(gettingAround).toHaveTextContent('Fn+F6')
  })

  it('opens each accessibility resource in the browser, with an allow-listed URL', async () => {
    const { user, api } = await openHelp()
    expect(ACCESSIBILITY_LINKS.length).toBeGreaterThan(0)
    for (const link of ACCESSIBILITY_LINKS) {
      const button = screen.getByRole('button', { name: `${link.title} (opens in your browser)` })
      expect(button).toHaveAccessibleDescription(link.description)
      await user.click(button)
      expect(api.openExternal).toHaveBeenLastCalledWith(link.url)
      expect(isAllowedExternalUrl(link.url)).toBe(true)
    }
    expect(api.openExternal).toHaveBeenCalledTimes(ACCESSIBILITY_LINKS.length)
  })

  it('lists only the accessibility resources', async () => {
    await openHelp()
    for (const link of RESOURCE_LINKS.filter((entry) => entry.category !== 'Accessibility')) {
      expect(screen.queryByRole('button', { name: `${link.title} (opens in your browser)` })).not.toBeInTheDocument()
    }
  })

  it('says so when a link cannot be opened', async () => {
    const { user, api } = await openHelp()
    api.openExternal.mockResolvedValueOnce(false)
    await user.click(screen.getByRole('button', { name: `${ACCESSIBILITY_LINKS[0].title} (opens in your browser)` }))
    await waitFor(() => expect(liveRegionText('polite')).toBe('That link can’t be opened.'))
  })

  it('reports an error opening a link', async () => {
    const { user, api } = await openHelp()
    api.openExternal.mockRejectedValueOnce(new Error('Blocked IPC from an untrusted sender'))
    await user.click(screen.getByRole('button', { name: `${ACCESSIBILITY_LINKS[0].title} (opens in your browser)` }))
    await waitFor(() => expect(liveRegionText('assertive')).toBe('Couldn’t open the link: Blocked IPC from an untrusted sender'))
  })

  it('switches to the keyboard shortcuts, and closing them returns focus to the original opener', async () => {
    const { user } = await openHelp()
    await user.click(screen.getByRole('button', { name: 'Open keyboard shortcuts' }))
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'CareConnect help' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Somewhere else' })).toHaveFocus()
  })

  it('switches to the keyboard shortcuts with Ctrl+/, the shortcut its button advertises', async () => {
    const { user } = await openHelp()
    const button = screen.getByRole('button', { name: 'Open keyboard shortcuts' })
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+/')
    expect(button).toHaveTextContent('Ctrl+/')
    // Focus is on the first heading, as when the dialog opens; the key works from anywhere in it.
    await user.keyboard('{Control>}/{/Control}')
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'CareConnect help' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Somewhere else' })).toHaveFocus()
  })

  it('switches to the keyboard shortcuts when Help › Keyboard Shortcuts is chosen in the menu', async () => {
    const { api } = await openHelp()
    act(() => api.emitCommand({ id: 'app.shortcuts' }))
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'CareConnect help' })).not.toBeInTheDocument()
  })

  it('on a Mac, leaves ⌘/ to the menu, whose command switches to the keyboard shortcuts', async () => {
    const api = createMemoryApi({ platform: 'darwin' })
    const { user } = await renderApp({ api, initialUi: { modal: { kind: 'help' } } })
    const button = within(await screen.findByRole('dialog', { name: 'CareConnect help' })).getByRole('button', { name: 'Open keyboard shortcuts' })
    await waitFor(() => expect(button).toHaveAttribute('aria-keyshortcuts', 'Meta+/'))
    expect(button).toHaveTextContent('⌘+/')

    // The macOS menu owns ⌘/ (menuOwnsChord). Acting on the key here as well would open the shortcuts
    // twice over: the menu's command would then arrive with a dialog open and be refused.
    await user.keyboard('{Meta>}/{/Meta}')
    expect(screen.getByRole('dialog', { name: 'CareConnect help' })).toBeInTheDocument()

    act(() => api.emitCommand({ id: 'app.shortcuts' }))
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'CareConnect help' })).not.toBeInTheDocument()
    expect(screen.getByRole('contentinfo', { name: 'Status' })).not.toHaveTextContent('Close the open dialog first.')
  })

  it('closes with Escape and returns focus to the opener', async () => {
    const { user } = await openHelp()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Somewhere else' })).toHaveFocus()
  })

  it('keeps Tab inside the dialog', async () => {
    const { user, dialog } = await openHelp()
    for (let i = 0; i < ACCESSIBILITY_LINKS.length + 4; i += 1) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('has no axe violations', async () => {
    const { dialog } = await openHelp()
    expect(await axe(dialog, AXE_OPTIONS)).toHaveNoViolations()
  })
})
