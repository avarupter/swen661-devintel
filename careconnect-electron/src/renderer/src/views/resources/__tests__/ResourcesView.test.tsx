import { screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useEffect } from 'react'
import { createMemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import { RESOURCE_LINKS } from '../../../../../shared/links'
import type { AppState } from '../../../state/appState'
import { useAppState } from '../../../state/AppStateProvider'
import { ResourcesView } from '../ResourcesView'

const probe: { state: AppState | null } = { state: null }

function StateProbe(): null {
  const state = useAppState()
  useEffect(() => {
    probe.state = state
  })
  return null
}

function current(): AppState {
  if (!probe.state) throw new Error('The state probe has not rendered')
  return probe.state
}

function renderResources(api = createMemoryApi()) {
  return renderWithProviders(
    <main aria-label="Resources">
      <StateProbe />
      <ResourcesView />
    </main>,
    { api, initialUi: { view: 'resources' } }
  )
}

beforeEach(() => {
  probe.state = null
})

describe('ResourcesView', () => {
  it('groups the links by category, one heading per group', async () => {
    await renderResources()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['Accessibility', 'Clinical reference', 'Product'])
    expect(within(screen.getByRole('region', { name: 'Accessibility' })).getAllByRole('listitem')).toHaveLength(4)
  })

  it('gives every link a card with its title, description, site and a named Open button', async () => {
    await renderResources()
    for (const link of RESOURCE_LINKS) {
      const card = screen.getByRole('heading', { level: 3, name: link.title }).closest('li') as HTMLElement
      expect(card).toHaveTextContent(link.description)
      expect(card).toHaveTextContent(new URL(link.url).hostname)
      expect(within(card).getByRole('button', { name: `Open ${link.title} (opens in your browser)` })).toBeInTheDocument()
    }
  })

  it('opens the link in the browser through the main process', async () => {
    const { api, user } = await renderResources()
    await user.click(screen.getByRole('button', { name: 'Open WCAG 2.2 quick reference (opens in your browser)' }))
    expect(api.openExternal).toHaveBeenCalledWith('https://www.w3.org/WAI/WCAG22/quickref/')
    expect(current().ui.status).toBeNull()
  })

  it('warns when the link can’t be opened', async () => {
    const api = createMemoryApi()
    api.openExternal.mockResolvedValueOnce(false)
    const { user } = await renderResources(api)
    await user.click(screen.getByRole('button', { name: 'Open MedlinePlus health topics (opens in your browser)' }))
    await waitFor(() => expect(current().ui.status).toMatchObject({ tone: 'warning', text: 'That link can’t be opened.' }))
    await waitFor(() => expect(liveRegionText()).toBe('That link can’t be opened.'))
  })

  it('reports a failed request as an error', async () => {
    const api = createMemoryApi()
    api.openExternal.mockRejectedValueOnce(new Error("Error invoking remote method 'external:open': Error: url: host is not allowed"))
    const { user } = await renderResources(api)
    await user.click(screen.getByRole('button', { name: 'Open Electron accessibility (opens in your browser)' }))
    await waitFor(() => expect(current().ui.status).toMatchObject({ tone: 'error', text: 'That link can’t be opened: url: host is not allowed' }))
    await waitFor(() => expect(liveRegionText('assertive')).toBe('That link can’t be opened: url: host is not allowed'))
  })

  it('is the main F6 region and has no axe violations', async () => {
    const { container } = await renderResources()
    expect(container.querySelector('main > [data-region="main"]')).not.toBeNull()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
