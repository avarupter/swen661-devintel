import { act, fireEvent, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import { renderHarness } from '../../state/__tests__/harness'
import { Toolbar, ToolbarButton } from '../Toolbar'

function Tools({ onToggle = () => {}, extra = false }: { onToggle?(): void; extra?: boolean }): React.JSX.Element {
  return (
    <>
      <button type="button">Before</button>
      <Toolbar label="Patients tools" region="toolbar" className="app-header__toolbar">
        <ToolbarButton command="patient.search" label="Search" icon="search" hintKeys={['/']} />
        <ToolbarButton command="patient.filter" label="Filter patient list, showing Needs review" icon="sliders" hasPopup="menu">
          Filter: Needs review
        </ToolbarButton>
        <ToolbarButton label="Show completed tasks" icon="checkCircle" pressed={false} onClick={onToggle} />
        <ToolbarButton command="message.reply" label="Reply" icon="reply" disabledReason="Select a conversation to reply." />
        <ToolbarButton command="patient.new" label="New patient" icon="userPlus" variant="primary" />
        {extra && <ToolbarButton id="toolbar-extra" label="Print" icon="printer" onClick={() => {}} />}
      </Toolbar>
      <button type="button">After</button>
    </>
  )
}

const items = (): HTMLElement[] => within(screen.getByRole('toolbar', { name: 'Patients tools' })).getAllByRole('button')
const tabStops = (): string[] =>
  items()
    .filter((item) => item.tabIndex === 0)
    .map((item) => item.getAttribute('aria-label') ?? item.querySelector('.button__label')?.textContent ?? '')

describe('Toolbar', () => {
  it('is a named toolbar and an F6 region', async () => {
    await renderHarness(<Tools />)
    const toolbar = screen.getByRole('toolbar', { name: 'Patients tools' })
    expect(toolbar).toHaveAttribute('data-region', 'toolbar')
    expect(toolbar).toHaveClass('toolbar', 'app-header__toolbar')
  })

  it('is a single Tab stop', async () => {
    const { user } = await renderHarness(<Tools />)
    expect(items().filter((item) => item.tabIndex === 0)).toEqual([items()[0]])
    screen.getByRole('button', { name: 'Before' }).focus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  it('moves with the arrow keys, wrapping, and Home/End jump to the ends', async () => {
    const { user } = await renderHarness(<Tools />)
    items()[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Filter patient list, showing Needs review' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'New patient' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'New patient' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus()
  })

  it('remembers the last item as the Tab stop when you leave and come back', async () => {
    const { user } = await renderHarness(<Tools />)
    items()[0].focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(tabStops()).toEqual(['Show completed tasks'])
    await user.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Show completed tasks' })).toHaveFocus()
  })

  it('makes a clicked item the Tab stop', async () => {
    const { user } = await renderHarness(<Tools />)
    await user.click(screen.getByRole('button', { name: 'New patient' }))
    expect(tabStops()).toEqual(['New patient'])
  })

  it('leaves other keys alone', async () => {
    await renderHarness(<Tools />)
    items()[0].focus()
    expect(fireEvent.keyDown(items()[0], { key: 'a' })).toBe(true)
    expect(fireEvent.keyDown(items()[0], { key: 'ArrowDown' })).toBe(true)
    expect(items()[0]).toHaveFocus()
  })

  it('ignores arrow keys from a control that is not one of its items', async () => {
    await renderHarness(
      <Toolbar label="Search tools">
        <input type="search" aria-label="Find" />
        <ToolbarButton label="Clear" onClick={() => {}} />
      </Toolbar>
    )
    const field = screen.getByRole('searchbox', { name: 'Find' })
    field.focus()
    expect(fireEvent.keyDown(field, { key: 'ArrowRight' })).toBe(true)
    expect(field).toHaveFocus()
  })

  it('keeps exactly one Tab stop when items are added later', async () => {
    const h = await renderHarness(<Tools />)
    h.rerender(<Tools extra />)
    await act(async () => {})
    expect(tabStops()).toEqual(['Search'])
    expect(items()).toHaveLength(6)
  })

  it('copes with an empty toolbar', async () => {
    await renderHarness(<Toolbar label="Empty tools">{null}</Toolbar>)
    expect(screen.getByRole('toolbar', { name: 'Empty tools' })).toBeEmptyDOMElement()
  })
})

describe('ToolbarButton', () => {
  it('runs its command when clicked', async () => {
    const h = await renderHarness(<Tools />)
    await h.user.click(screen.getByRole('button', { name: 'New patient' }))
    expect(h.state().ui.modal).toEqual({ kind: 'newPatient' })
  })

  it('runs onClick instead of a command when given one', async () => {
    const onToggle = jest.fn()
    const h = await renderHarness(<Tools onToggle={onToggle} />)
    await h.user.click(screen.getByRole('button', { name: 'Show completed tasks' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(h.state().ui.modal).toBeNull()
  })

  it('stays focusable when disabled, explains why, and does nothing when pressed', async () => {
    const h = await renderHarness(<Tools />)
    const reply = screen.getByRole('button', { name: 'Reply', description: 'Select a conversation to reply.' })
    expect(reply).toHaveAttribute('aria-disabled', 'true')
    expect(reply).not.toBeDisabled()
    expect(reply).toHaveAttribute('title', 'Select a conversation to reply.')
    await h.user.click(reply)
    reply.focus()
    await h.user.keyboard('{Enter}')
    expect(h.state().ui.view).toBe('patients')
    expect(h.state().ui.status).toBeNull()
    items()[0].focus()
    await h.user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(reply).toHaveFocus()
  })

  it('exposes its shortcut through aria-keyshortcuts and a visual hint', async () => {
    await renderHarness(<Tools />)
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-keyshortcuts', 'Control+F')
    expect(screen.getByRole('button', { name: 'New patient' })).toHaveAttribute('aria-keyshortcuts', 'Control+N')
    expect(screen.getByRole('button', { name: 'Reply' })).toHaveAttribute('aria-keyshortcuts', 'R')
    expect(screen.getByRole('button', { name: 'Show completed tasks' })).not.toHaveAttribute('aria-keyshortcuts')
    expect(screen.getByRole('button', { name: 'Search' }).querySelector('.key-hint')).toHaveTextContent('/')
    expect(screen.getByRole('button', { name: 'New patient' }).querySelector('.key-hint')).toHaveTextContent('Ctrl+N')
    expect(screen.getByRole('button', { name: 'Show completed tasks' }).querySelector('.key-hint')).toBeNull()
  })

  it('stops advertising single-key shortcuts once they are turned off', async () => {
    const api = createMemoryApi()
    api.workspace.preferences.singleKeyShortcuts = false
    await renderHarness(<Tools />, { api })
    const reply = screen.getByRole('button', { name: 'Reply' })
    expect(reply).not.toHaveAttribute('aria-keyshortcuts')
    expect(reply.querySelector('.key-hint')).toBeNull()
    expect(screen.getByRole('button', { name: 'Search' }).querySelector('.key-hint')).toBeNull()
    expect(screen.getByRole('button', { name: 'New patient' })).toHaveAttribute('aria-keyshortcuts', 'Control+N')
  })

  it('uses the macOS key names on a Mac', async () => {
    await renderHarness(<Tools />, { api: createMemoryApi({ platform: 'darwin' }) })
    expect(await screen.findByRole('button', { name: 'New patient' })).toHaveAttribute('aria-keyshortcuts', 'Meta+N')
    expect(screen.getByRole('button', { name: 'New patient' }).querySelector('.key-hint')).toHaveTextContent('⌘+N')
  })

  it('keeps the accessible name when the visible label is shortened', async () => {
    await renderHarness(<Tools />)
    const filter = screen.getByRole('button', { name: 'Filter patient list, showing Needs review' })
    expect(filter).toHaveTextContent('Filter: Needs review')
    expect(filter).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('gets an id from its command, or the id it is given', async () => {
    await renderHarness(<Tools extra />)
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('id', 'toolbar-patient.search')
    expect(screen.getByRole('button', { name: 'Print' })).toHaveAttribute('id', 'toolbar-extra')
    expect(screen.getByRole('button', { name: 'Show completed tasks' })).not.toHaveAttribute('id')
  })

  it('marks toggle state and the primary action', async () => {
    await renderHarness(<Tools />)
    expect(screen.getByRole('button', { name: 'Show completed tasks' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'New patient' })).toHaveClass('button--primary')
    expect(screen.getByRole('button', { name: 'Search' })).not.toHaveClass('button--primary')
    for (const icon of screen.getByRole('toolbar').querySelectorAll('svg')) expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('has no axe violations', async () => {
    const { container } = await renderHarness(<Tools />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
