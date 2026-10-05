import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * The renderer's only source of "now". Components read it through these hooks
 * instead of calling `new Date()`, so tests can pin the clock.
 */
const ClockContext = createContext<() => Date>(() => new Date())

export function ClockProvider({ now, children }: { now?: () => Date; children: ReactNode }): React.JSX.Element {
  return <ClockContext.Provider value={now ?? (() => new Date())}>{children}</ClockContext.Provider>
}

/** A function returning the current time, for event handlers and effects. */
export function useClock(): () => Date {
  return useContext(ClockContext)
}

/** The current time for rendering, refreshed every `intervalMs` so "Today" rolls over. */
export function useNow(intervalMs = 30_000): Date {
  const clock = useContext(ClockContext)
  const [now, setNow] = useState(clock)
  useEffect(() => {
    const timer = setInterval(() => setNow(clock()), intervalMs)
    return () => clearInterval(timer)
  }, [clock, intervalMs])
  return now
}
