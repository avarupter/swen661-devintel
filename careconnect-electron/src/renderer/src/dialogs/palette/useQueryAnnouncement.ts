import { useEffect, useRef } from 'react'
import { useAnnounce } from '../../a11y/Announcer'

/** How long typing must pause before a result count is announced. */
export const QUERY_ANNOUNCE_DELAY_MS = 300

/**
 * Announces `message` (a result count such as "3 results") politely once
 * `query` has stopped changing for `delayMs`. Nothing is said for the
 * initial query, only the latest message is read, and a pending
 * announcement is dropped when the component unmounts, so closing a dialog
 * never leaves a stale count behind.
 */
export function useQueryAnnouncement(query: string, message: string, delayMs = QUERY_ANNOUNCE_DELAY_MS): void {
  const announce = useAnnounce()
  const latestMessage = useRef(message)
  useEffect(() => {
    latestMessage.current = message
  })
  const announcedQuery = useRef(query)
  useEffect(() => {
    if (announcedQuery.current === query) return
    announcedQuery.current = query
    const timer = setTimeout(() => announce(latestMessage.current, 'polite'), delayMs)
    return () => clearTimeout(timer)
  }, [query, delayMs, announce])
}
