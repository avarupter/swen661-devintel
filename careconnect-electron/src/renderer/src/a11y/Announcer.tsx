import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Politeness = 'polite' | 'assertive'

type Announce = (message: string, politeness?: Politeness) => void

const AnnounceContext = createContext<Announce>(() => {})

/** Delay between clearing a live region and refilling it, so a repeated message is read again. */
export const ANNOUNCE_DELAY_MS = 50

/**
 * Two visually hidden live regions: polite for confirmations ("Note added"),
 * assertive for failures ("Couldn't save changes"). They render after the app
 * shell, outside the subtree that becomes `inert` under a modal dialog, so
 * announcements still reach screen readers while a dialog is open.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [messages, setMessages] = useState<Record<Politeness, string>>({ polite: '', assertive: '' })

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    setMessages((current) => ({ ...current, [politeness]: '' }))
    setTimeout(() => setMessages((current) => ({ ...current, [politeness]: message })), ANNOUNCE_DELAY_MS)
  }, [])

  const value = useMemo(() => announce, [announce])

  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-testid="live-polite">
        {messages.polite}
      </div>
      <div className="visually-hidden" role="alert" aria-live="assertive" aria-atomic="true" data-testid="live-assertive">
        {messages.assertive}
      </div>
    </AnnounceContext.Provider>
  )
}

export function useAnnounce(): Announce {
  return useContext(AnnounceContext)
}
