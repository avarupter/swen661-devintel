import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import type { ViewId } from '../../../../shared/commands'
import { SkipLinks } from '../SkipLinks'

function Page({ view, withList = true }: { view: ViewId; withList?: boolean }): React.JSX.Element {
  return (
    <>
      <SkipLinks view={view} />
      <nav aria-label="Workspace">
        <button type="button">Overview</button>
      </nav>
      <main id="main" tabIndex={-1} aria-label="Patients">
        {withList && (
          <section id="patient-list" aria-label="Recent patients">
            <button type="button">Avery Park</button>
          </section>
        )}
      </main>
      <footer id="status-bar" aria-label="Status">
        Synced 09:42
      </footer>
    </>
  )
}

const linkTexts = (): string[] => screen.getAllByRole('link').map((link) => link.textContent ?? '')

describe('SkipLinks', () => {
  it('offers the main workspace, the patient list and the status bar in the Patients view', () => {
    render(<Page view="patients" />)
    expect(linkTexts()).toEqual(['Skip to main workspace', 'Skip to patient list', 'Skip to status'])
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['#main', '#patient-list', '#status-bar'])
  })

  it.each<ViewId>(['overview', 'schedule', 'inbox', 'tasks', 'reports', 'resources'])('leaves out the patient list in %s', (view) => {
    render(<Page view={view} withList={false} />)
    expect(linkTexts()).toEqual(['Skip to main workspace', 'Skip to status'])
  })

  it('are the first stops in the tab order', async () => {
    const user = userEvent.setup()
    render(<Page view="patients" />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to main workspace' })).toHaveFocus()
  })

  it.each<[string, string]>([
    ['Skip to main workspace', 'main'],
    ['Skip to patient list', 'patient-list'],
    ['Skip to status', 'status-bar']
  ])('"%s" moves focus to #%s', async (name, id) => {
    const user = userEvent.setup()
    render(<Page view="patients" />)
    screen.getByRole('link', { name }).focus()
    await user.keyboard('{Enter}')
    const target = document.getElementById(id) as HTMLElement
    expect(target).toHaveFocus()
    expect(target).toHaveAttribute('tabindex', '-1')
  })

  it('keeps a target’s own tabindex', async () => {
    const user = userEvent.setup()
    render(<Page view="patients" />)
    const main = document.getElementById('main') as HTMLElement
    main.setAttribute('tabindex', '0')
    await user.click(screen.getByRole('link', { name: 'Skip to main workspace' }))
    expect(main).toHaveFocus()
    expect(main).toHaveAttribute('tabindex', '0')
  })

  it('does not change the URL, and does nothing when the target is missing', async () => {
    const user = userEvent.setup()
    render(<SkipLinks view="patients" />)
    const link = screen.getByRole('link', { name: 'Skip to patient list' })
    link.focus()
    await user.keyboard('{Enter}')
    expect(link).toHaveFocus()
    expect(window.location.hash).toBe('')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Page view="patients" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
