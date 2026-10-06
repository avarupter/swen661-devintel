import { act, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryApi } from '../../../../tests/renderer/memoryApi'
import { renderApp } from '../../../../tests/renderer/renderApp'

describe('App shell', () => {
  it('loads the workspace and renders the named landmarks from the spec', async () => {
    await renderApp()
    expect(screen.getByRole('navigation', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
  })

  it('shows skip links first in the document', async () => {
    const { container } = await renderApp()
    const links = container.querySelectorAll('.skip-links a')
    expect(Array.from(links, (link) => link.textContent)).toEqual(['Skip to main workspace', 'Skip to patient list', 'Skip to status'])
    const firstFocusable = container.querySelector('a, button, input, [tabindex="0"]')
    expect(firstFocusable).toBe(links[0])
  })

  it('has no axe violations', async () => {
    const { container } = await renderApp()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })

  it('focuses a patient opened from the main process, revealing one the list search hid', async () => {
    // Menu, tray, Jump List and notification commands arrive outside a React event.
    const { api } = await renderApp({ initialUi: { view: 'reports', patientQuery: 'riley' } })
    act(() => api.emitCommand({ id: 'patient.open', patientId: 'p-jamie-wu' }))
    await waitFor(() => expect(document.activeElement?.id).toBe('patient-option-p-jamie-wu'))
    expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveValue('')
  })

  it('offers a retry when the workspace cannot be loaded', async () => {
    const api = createMemoryApi()
    api.nextLoad = new Error('disk unavailable')
    const { user } = await renderAppAllowingError(api)
    expect(screen.getByText('disk unavailable').closest('[role="alert"]')).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument())
  })
})

async function renderAppAllowingError(api: ReturnType<typeof createMemoryApi>) {
  const { render } = await import('@testing-library/react')
  const userEvent = (await import('@testing-library/user-event')).default
  const { App } = await import('../App')
  const user = userEvent.setup()
  render(<App api={api} now={() => new Date(2026, 9, 5, 9, 42)} />)
  await screen.findByRole('button', { name: 'Try again' })
  return { user }
}
