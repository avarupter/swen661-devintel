import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import type { ReactNode } from 'react'
import { Dialog, type DialogProps } from '../Dialog'

function NoteFields(): React.JSX.Element {
  return (
    <>
      <label>
        Note type
        <select>
          <option>Visit note</option>
          <option>Phone call</option>
        </select>
      </label>
      <label>
        Note
        <textarea />
      </label>
    </>
  )
}

function renderDialog(props: Partial<DialogProps> = {}, children: ReactNode = <NoteFields />) {
  const onClose = jest.fn()
  const user = userEvent.setup()
  const result = render(
    <>
      <button type="button">Outside before</button>
      <Dialog title="Add clinical note" description="For Avery Park" onClose={onClose} footer={<button type="button">Save note</button>} {...props}>
        {children}
      </Dialog>
      <button type="button">Outside after</button>
    </>
  )
  return { ...result, onClose, user }
}

describe('Dialog', () => {
  it('is a modal dialog named by its title and described by its description', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Add clinical note', description: 'For Avery Park' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { level: 2, name: 'Add clinical note' })).toBeInTheDocument()
  })

  it('has no description reference when there is no description', () => {
    renderDialog({ description: undefined })
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })

  it('moves focus to the first control in its body, not the header’s Close button', () => {
    renderDialog()
    expect(screen.getByRole('combobox', { name: 'Note type' })).toHaveFocus()
  })

  it('focuses the requested element instead, when given an id', () => {
    renderDialog({ initialFocusId: 'note-text' }, <textarea id="note-text" aria-label="Note" />)
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus()
  })

  it('focuses the dialog itself when its body has nothing to focus', () => {
    renderDialog({ footer: undefined }, <p>Nothing to fill in.</p>)
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('keeps Tab inside the dialog, in both directions', async () => {
    const { user } = renderDialog()
    const close = screen.getByRole('button', { name: 'Close' })
    const save = screen.getByRole('button', { name: 'Save note' })

    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus()
    await user.tab()
    expect(save).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(save).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus()
  })

  it('sends Shift+Tab from the dialog itself to its last control', async () => {
    const { user } = renderDialog({}, <p>Read only.</p>)
    expect(screen.getByRole('dialog')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Save note' })).toHaveFocus()
  })

  it('closes on Escape and keeps the key from reaching the app’s shortcuts', async () => {
    const windowKeys = jest.fn()
    window.addEventListener('keydown', windowKeys)
    const { user, onClose } = renderDialog()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(windowKeys.mock.calls.map(([event]) => (event as KeyboardEvent).key)).not.toContain('Escape')
    window.removeEventListener('keydown', windowKeys)
  })

  it('closes from the Close button, which names its Esc shortcut', async () => {
    const { user, onClose } = renderDialog()
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close).toHaveAttribute('aria-keyshortcuts', 'Escape')
    await user.click(close)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('lets onKeyDown claim keys before its own handling', async () => {
    const onKeyDown = jest.fn((event: KeyboardEvent) => {
      if (event.key === 'Escape' || (event.ctrlKey && event.key === 'Enter')) event.preventDefault()
    })
    const { user, onClose } = renderDialog({ onKeyDown })
    await user.keyboard('{Escape}')
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onClose).not.toHaveBeenCalled()
    expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(expect.arrayContaining(['Escape', 'Enter']))
  })

  it('ignores other keys', () => {
    const { onClose } = renderDialog()
    expect(fireEvent.keyDown(screen.getByRole('dialog'), { key: 'a' })).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on a backdrop click only when asked to', () => {
    const { container, onClose } = renderDialog({ closeOnBackdrop: true })
    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(container.querySelector('.dialog-backdrop') as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps form input safe from a stray backdrop click by default', () => {
    const { container, onClose } = renderDialog()
    fireEvent.mouseDown(container.querySelector('.dialog-backdrop') as Element)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('stops a backdrop press from taking focus out of a dialog that stays open', () => {
    const { container } = renderDialog()
    // fireEvent returns false when the default action (moving focus to <body>) was prevented.
    expect(fireEvent.mouseDown(container.querySelector('.dialog-backdrop') as Element)).toBe(false)
    expect(fireEvent.mouseDown(screen.getByRole('dialog'))).toBe(true)
  })

  it('calls the latest onClose after re-rendering', async () => {
    const { user, rerender, onClose } = renderDialog()
    const latest = jest.fn()
    rerender(
      <Dialog title="Add clinical note" onClose={latest}>
        <NoteFields />
      </Dialog>
    )
    await user.keyboard('{Escape}')
    expect(latest).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies the size, extra class and icon', () => {
    renderDialog({ size: 'large', className: 'palette', icon: 'command' })
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('dialog', 'dialog--large', 'palette')
    const icon = dialog.querySelector('.dialog__header svg.dialog__icon')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('defaults to the medium size', () => {
    renderDialog()
    expect(screen.getByRole('dialog')).toHaveClass('dialog--medium')
  })

  it('has no axe violations', async () => {
    const { container } = renderDialog()
    expect(await axe(container)).toHaveNoViolations()
  })
})
