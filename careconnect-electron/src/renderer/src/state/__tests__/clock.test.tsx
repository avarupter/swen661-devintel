import { act, render, renderHook, screen } from '@testing-library/react'
import { formatTime } from '../../../../shared/format'
import { ClockProvider, useClock, useNow } from '../clock'

function Now({ intervalMs }: { intervalMs?: number }): React.JSX.Element {
  return <p>{formatTime(useNow(intervalMs))}</p>
}

afterEach(() => {
  jest.useRealTimers()
})

describe('clock', () => {
  it('reads the system clock when no time is injected', () => {
    const before = Date.now()
    const { result } = renderHook(() => useClock())
    const fromDefault = result.current().getTime()
    const { result: provided } = renderHook(() => useClock(), { wrapper: ({ children }) => <ClockProvider>{children}</ClockProvider> })
    const fromProvider = provided.current().getTime()
    const after = Date.now()
    for (const time of [fromDefault, fromProvider]) {
      expect(time).toBeGreaterThanOrEqual(before)
      expect(time).toBeLessThanOrEqual(after)
    }
  })

  it('uses the injected clock in event handlers and while rendering', () => {
    const fixed = new Date(2026, 9, 5, 9, 42)
    const { result } = renderHook(() => ({ clock: useClock(), now: useNow() }), {
      wrapper: ({ children }) => <ClockProvider now={() => fixed}>{children}</ClockProvider>
    })
    expect(result.current.clock()).toBe(fixed)
    expect(result.current.now).toBe(fixed)
  })

  it('re-renders with the new time every interval, so "Today" rolls over at midnight', () => {
    jest.useFakeTimers()
    let current = new Date(2026, 9, 5, 23, 59, 50)
    const { unmount } = render(
      <ClockProvider now={() => current}>
        <Now intervalMs={10_000} />
      </ClockProvider>
    )
    expect(screen.getByText('23:59')).toBeInTheDocument()
    current = new Date(2026, 9, 6, 0, 0, 0)
    act(() => jest.advanceTimersByTime(9_999))
    expect(screen.getByText('23:59')).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(1))
    expect(screen.getByText('00:00')).toBeInTheDocument()
    unmount()
    expect(jest.getTimerCount()).toBe(0)
  })

  it('refreshes every 30 seconds by default', () => {
    jest.useFakeTimers()
    let current = new Date(2026, 9, 5, 9, 42)
    render(
      <ClockProvider now={() => current}>
        <Now />
      </ClockProvider>
    )
    current = new Date(2026, 9, 5, 9, 43)
    act(() => jest.advanceTimersByTime(29_999))
    expect(screen.getByText('09:42')).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(1))
    expect(screen.getByText('09:43')).toBeInTheDocument()
  })
})
