import type { BrowserWindow } from 'electron'
import { FakeBrowserWindow, mockElectron } from '../../../tests/mocks/electron'
import { CLOSE_WAIT_MS, guardUnsavedChanges } from '../closeGuard'

beforeEach(() => {
  mockElectron.reset()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

function setup(timeoutMs?: number) {
  const win = new FakeBrowserWindow()
  const guard = guardUnsavedChanges(win as unknown as BrowserWindow, timeoutMs === undefined ? {} : { timeoutMs })
  return { win, guard }
}

describe('guardUnsavedChanges', () => {
  it('closes at once when every change is saved', () => {
    const { win, guard } = setup()
    guard.update(0)
    win.close()
    expect(win.destroyed).toBe(true)
  })

  it('closes at once before the renderer has reported anything', () => {
    const { win } = setup()
    win.close()
    expect(win.destroyed).toBe(true)
  })

  it('waits for the pending autosave, then closes when the renderer reports it saved', () => {
    const { win, guard } = setup()
    guard.update(2)
    win.close()
    expect(win.destroyed).toBe(false)

    guard.update(1)
    expect(win.destroyed).toBe(false)
    guard.update(0)
    expect(win.destroyed).toBe(true)
  })

  it(`closes anyway after ${CLOSE_WAIT_MS} ms if the save never completes`, () => {
    const { win, guard } = setup()
    guard.update(1)
    win.close()
    jest.advanceTimersByTime(CLOSE_WAIT_MS - 1)
    expect(win.destroyed).toBe(false)
    jest.advanceTimersByTime(1)
    expect(win.destroyed).toBe(true)
  })

  it('honours a custom wait', () => {
    const { win, guard } = setup(100)
    guard.update(1)
    win.close()
    jest.advanceTimersByTime(100)
    expect(win.destroyed).toBe(true)
  })

  it('treats repeated close requests while waiting as one', () => {
    const { win, guard } = setup()
    guard.update(3)
    win.close()
    win.close()
    win.close()
    expect(jest.getTimerCount()).toBe(1)
    guard.update(0)
    expect(win.destroyed).toBe(true)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('does not close a window nobody asked to close when the save completes', () => {
    const { win, guard } = setup()
    guard.update(2)
    guard.update(0)
    expect(win.destroyed).toBe(false)
  })

  it('ignores updates after the window is gone', () => {
    const { win, guard } = setup()
    win.close()
    expect(() => guard.update(0)).not.toThrow()
    expect(win.close).toHaveBeenCalledTimes(1)
  })
})
