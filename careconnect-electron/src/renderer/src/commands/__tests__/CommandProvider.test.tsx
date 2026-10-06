import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import type { AppCommand, CommandId } from '../../../../shared/commands'
import { liveText, renderHarness } from '../../state/__tests__/harness'
import { useCommandHandler, useCommands, useSearchTarget, type CommandHandler } from '../CommandProvider'

function Handler({ id, onRun, enabled }: { id: CommandId; onRun: CommandHandler; enabled?: boolean }): null {
  useCommandHandler(id, onRun, enabled)
  return null
}

function SearchField({ label = 'Search list' }: { label?: string }): React.JSX.Element {
  return <input type="search" aria-label={label} defaultValue="avery" ref={useSearchTarget()} />
}

function Shell({ children }: { children?: React.ReactNode }): React.JSX.Element {
  return (
    <>
      <h1 id="view-title" tabIndex={-1}>
        Patients
      </h1>
      <nav aria-label="Workspace" data-region="navigation">
        <button type="button">Overview</button>
        <button type="button">Patients</button>
      </nav>
      <div role="toolbar" aria-label="Patients tools" data-region="toolbar">
        <button type="button">New patient</button>
      </div>
      {children}
    </>
  )
}

describe('handler registration', () => {
  it('runs the most recently registered handler, and unregistering restores the previous one, then the default', async () => {
    const h = await renderHarness()
    const first = jest.fn()
    const second = jest.fn()
    let offFirst = (): void => {}
    let offSecond = (): void => {}
    act(() => {
      offFirst = h.commands().register('app.help', first)
      offSecond = h.commands().register('app.help', second)
    })

    act(() => h.commands().run('app.help'))
    expect(second).toHaveBeenCalledWith({ id: 'app.help' })
    expect(first).not.toHaveBeenCalled()

    offSecond()
    act(() => h.commands().run({ id: 'app.help' }))
    expect(first).toHaveBeenCalledTimes(1)

    offFirst()
    offFirst()
    act(() => h.commands().run('app.help'))
    expect(h.state().ui.modal).toEqual({ kind: 'help' })
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('keeps the newest handler on top when an older one unregisters first', async () => {
    const h = await renderHarness()
    const older = jest.fn()
    const newer = jest.fn()
    const offOlder = h.commands().register('message.reply', older)
    h.commands().register('message.reply', newer)
    offOlder()
    act(() => h.commands().run('message.reply'))
    expect(newer).toHaveBeenCalledTimes(1)
    expect(older).not.toHaveBeenCalled()
  })

  it('useCommandHandler handles a command only while mounted', async () => {
    const onRun = jest.fn()
    const h = await renderHarness(<Handler id="message.send" onRun={onRun} />)
    act(() => h.commands().run('message.send'))
    expect(onRun).toHaveBeenCalledWith({ id: 'message.send' })
    expect(h.state().ui.status).toBeNull()

    h.rerender(<></>)
    act(() => h.commands().run('message.send'))
    expect(onRun).toHaveBeenCalledTimes(1)
    expect(h.state().ui.status?.text).toBe('Open a message first (Ctrl+Shift+M for a new one).')
  })

  it('useCommandHandler steps aside while disabled', async () => {
    const onRun = jest.fn()
    const h = await renderHarness(<Handler id="message.send" onRun={onRun} enabled={false} />)
    act(() => h.commands().run('message.send'))
    expect(onRun).not.toHaveBeenCalled()
    expect(h.state().ui.status?.text).toBe('Open a message first (Ctrl+Shift+M for a new one).')

    h.rerender(<Handler id="message.send" onRun={onRun} enabled />)
    act(() => h.commands().run('message.send'))
    expect(onRun).toHaveBeenCalledTimes(1)
  })

  it('useCommandHandler always calls the latest handler, without re-registering on every render', async () => {
    const first = jest.fn()
    const second = jest.fn()
    const h = await renderHarness(<Handler id="patient.export" onRun={first} />)
    const later = jest.fn()
    const offLater = h.commands().register('patient.export', later)

    // Re-registering would put the component's handler back on top of `later`.
    h.rerender(<Handler id="patient.export" onRun={second} />)
    act(() => h.commands().run('patient.export'))
    expect(later).toHaveBeenCalledTimes(1)

    offLater()
    act(() => h.commands().run('patient.export'))
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })
})

describe('commands from the main process', () => {
  it('runs menu, tray, Jump List and notification commands', async () => {
    const h = await renderHarness()
    act(() => h.api.emitCommand({ id: 'app.settings' }))
    expect(h.state().ui.modal).toEqual({ kind: 'settings' })
    h.dispatch({ type: 'ui/closeModal' })

    act(() => h.api.emitCommand({ id: 'patient.open', patientId: 'p-riley-singh' }))
    expect(h.state().ui.selectedPatientId).toBe('p-riley-singh')
    expect(h.state().ui.view).toBe('patients')
  })

  it('stops listening when unmounted', async () => {
    const api = createMemoryApi()
    const subscribe = api.onCommand.getMockImplementation() as (listener: (command: AppCommand) => void) => () => void
    const unsubscribed = jest.fn()
    api.onCommand.mockImplementation((listener) => {
      const off = subscribe(listener)
      return () => {
        unsubscribed()
        off()
      }
    })
    const h = await renderHarness(null, { api })
    expect(api.onCommand).toHaveBeenCalledTimes(1)
    h.unmount()
    expect(unsubscribed).toHaveBeenCalledTimes(1)
  })
})

describe('modal focus', () => {
  it('returns focus to the control that opened the modal', async () => {
    const h = await renderHarness(<Shell />)
    const opener = screen.getByRole('button', { name: 'New patient' })
    opener.focus()
    act(() => h.commands().openModal({ kind: 'newPatient' }))
    expect(h.state().ui.modal).toEqual({ kind: 'newPatient' })
    screen.getByRole('button', { name: 'Overview' }).focus()
    h.dispatch({ type: 'ui/closeModal' })
    act(() => h.commands().restoreFocusAfterModal())
    expect(opener).toHaveFocus()
  })

  it('remembers the first opener when one modal replaces another', async () => {
    const h = await renderHarness(<Shell />)
    const opener = screen.getByRole('button', { name: 'Patients' })
    opener.focus()
    act(() => h.commands().openModal({ kind: 'palette' }))
    screen.getByRole('button', { name: 'Overview' }).focus()
    act(() => h.commands().openModal({ kind: 'help' }))
    h.dispatch({ type: 'ui/closeModal' })
    act(() => h.commands().restoreFocusAfterModal())
    expect(opener).toHaveFocus()
  })

  it('falls back to the view title when the opener is gone', async () => {
    const h = await renderHarness(<Shell />)
    const opener = document.createElement('button')
    opener.textContent = 'Temporary'
    document.body.append(opener)
    opener.focus()
    act(() => h.commands().openModal({ kind: 'help' }))
    opener.remove()
    act(() => h.commands().restoreFocusAfterModal())
    expect(screen.getByRole('heading', { name: 'Patients' })).toHaveFocus()
  })

  it('falls back to the view title when the opener is inert', async () => {
    const h = await renderHarness(<Shell />)
    const opener = screen.getByRole('button', { name: 'New patient' })
    opener.focus()
    act(() => h.commands().openModal({ kind: 'help' }))
    opener.closest('[data-region]')?.setAttribute('inert', '')
    act(() => h.commands().restoreFocusAfterModal())
    expect(screen.getByRole('heading', { name: 'Patients' })).toHaveFocus()
  })

  it('falls back to the view title when nothing was focused, and forgets the opener once used', async () => {
    const h = await renderHarness(<Shell />)
    expect(document.activeElement).toBe(document.body)
    act(() => h.commands().openModal({ kind: 'shortcuts' }))
    h.dispatch({ type: 'ui/closeModal' })
    act(() => h.commands().restoreFocusAfterModal())
    expect(screen.getByRole('heading', { name: 'Patients' })).toHaveFocus()

    const opener = screen.getByRole('button', { name: 'Overview' })
    opener.focus()
    act(() => h.commands().openModal({ kind: 'help' }))
    h.dispatch({ type: 'ui/closeModal' })
    act(() => h.commands().restoreFocusAfterModal())
    expect(opener).toHaveFocus()
    screen.getByRole('button', { name: 'New patient' }).focus()
    act(() => h.commands().restoreFocusAfterModal())
    expect(screen.getByRole('heading', { name: 'Patients' })).toHaveFocus()
  })
})

describe('failures', () => {
  it('turns a thrown handler error into an assertive error status', async () => {
    jest.useFakeTimers()
    try {
      const h = await renderHarness()
      h.commands().register('patient.export', () => {
        throw new Error('boom')
      })
      act(() => h.commands().run('patient.export'))
      expect(h.state().ui.status).toMatchObject({ tone: 'error', text: 'Something went wrong: boom' })
      act(() => jest.advanceTimersByTime(100))
      expect(liveText('assertive')).toBe('Something went wrong: boom')
    } finally {
      jest.useRealTimers()
    }
  })

  it('turns a rejected handler promise into an error status, without the IPC prefix', async () => {
    const h = await renderHarness()
    h.commands().register('patient.import', () => Promise.reject(new Error("Error invoking remote method 'patients:import': Error: kaput")))
    act(() => h.commands().run('patient.import'))
    await waitFor(() => expect(h.state().ui.status).toMatchObject({ tone: 'error', text: 'Something went wrong: kaput' }))
  })

  it('reports a failure inside a default command', async () => {
    const h = await renderHarness()
    h.api.showContextMenu.mockRejectedValueOnce(new Error('menu failed'))
    act(() => h.commands().run('patient.contextMenu'))
    await waitFor(() => expect(h.state().ui.status?.text).toBe('Something went wrong: menu failed'))
  })
})

describe('the default context', () => {
  it('focuses and selects the registered search field for Search current list', async () => {
    const h = await renderHarness(<SearchField />)
    act(() => h.commands().run('patient.search'))
    const field = screen.getByRole('searchbox', { name: 'Search list' }) as HTMLInputElement
    expect(field).toHaveFocus()
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 5])
    expect(h.state().ui.view).toBe('patients')
  })

  it('focuses a search target that is not an <input> without selecting anything', async () => {
    function NotesSearch(): React.JSX.Element {
      return <textarea aria-label="Search notes" defaultValue="avery" ref={useSearchTarget()} />
    }
    const h = await renderHarness(<NotesSearch />)
    act(() => h.commands().run('patient.search'))
    expect(screen.getByRole('textbox', { name: 'Search notes' })).toHaveFocus()
  })

  it('goes to the Patients search when the registered field has gone', async () => {
    const h = await renderHarness(<SearchField />, { initialUi: { view: 'overview' } })
    h.rerender(<input id="patient-search" type="search" aria-label="Patient search" />)
    act(() => h.commands().run('patient.search'))
    expect(h.state().ui.view).toBe('patients')
    await waitFor(() => expect(screen.getByRole('searchbox', { name: 'Patient search' })).toHaveFocus())
  })

  it('focuses the view title after navigating', async () => {
    const h = await renderHarness(<Shell />)
    act(() => h.commands().run('navigate.inbox'))
    expect(h.state().ui.view).toBe('inbox')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Patients' })).toHaveFocus())
  })

  it('moves between regions and returns to the last focused control in each', async () => {
    const h = await renderHarness(<Shell />)
    screen.getByRole('button', { name: 'Patients' }).focus()
    act(() => h.commands().run('region.next'))
    expect(screen.getByRole('button', { name: 'New patient' })).toHaveFocus()
    act(() => h.commands().run('region.previous'))
    expect(screen.getByRole('button', { name: 'Patients' })).toHaveFocus()
  })
})

describe('useCommands', () => {
  it('throws a clear error outside the provider', () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useCommands())).toThrow('useCommands() must be called inside <CommandProvider>')
    errors.mockRestore()
  })
})
