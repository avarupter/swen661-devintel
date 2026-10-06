import { act, render } from '@testing-library/react'
import * as Announcer from '../../../a11y/Announcer'
import { ANNOUNCE_DELAY_MS, AnnouncerProvider } from '../../../a11y/Announcer'
import { useQueryAnnouncement } from '../useQueryAnnouncement'

function Harness({ query, message }: { query: string; message: string }): null {
  useQueryAnnouncement(query, message, 300)
  return null
}

interface Props {
  query: string
  message: string
  mounted?: boolean
}

function Tree({ query, message, mounted = true }: Props): React.JSX.Element {
  return <AnnouncerProvider>{mounted && <Harness query={query} message={message} />}</AnnouncerProvider>
}

function polite(): string {
  return document.querySelector('[data-testid="live-polite"]')?.textContent ?? ''
}

describe('useQueryAnnouncement', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('says nothing for the initial query', () => {
    render(<Tree query="" message="8 results" />)
    act(() => jest.advanceTimersByTime(1000))
    expect(polite()).toBe('')
  })

  it('announces the latest message in the polite live region once typing pauses', () => {
    const view = render(<Tree query="" message="8 results" />)
    view.rerender(<Tree query="i" message="5 results" />)
    act(() => jest.advanceTimersByTime(200))
    view.rerender(<Tree query="in" message="2 results" />)
    act(() => jest.advanceTimersByTime(200))
    expect(polite()).toBe('')
    // The count can change while the query stays the same (the data updated); the latest wins.
    view.rerender(<Tree query="in" message="1 result" />)
    act(() => jest.advanceTimersByTime(100 + ANNOUNCE_DELAY_MS))
    expect(polite()).toBe('1 result')
  })

  it('makes one announcement for a burst of typing, not one per key', () => {
    const announce = jest.fn()
    jest.spyOn(Announcer, 'useAnnounce').mockReturnValue(announce)
    const view = render(<Harness query="" message="8 results" />)
    for (const [query, message] of [
      ['i', '5 results'],
      ['in', '2 results'],
      ['inb', '1 result'],
      ['inbo', '1 result'],
      ['inbox', '1 result']
    ]) {
      view.rerender(<Harness query={query} message={message} />)
      act(() => jest.advanceTimersByTime(120))
    }
    expect(announce).not.toHaveBeenCalled()
    act(() => jest.advanceTimersByTime(300))
    expect(announce).toHaveBeenCalledTimes(1)
    expect(announce).toHaveBeenCalledWith('1 result', 'polite')
    // Re-rendering with the same query (other state changed) does not repeat it.
    view.rerender(<Harness query="inbox" message="1 result" />)
    act(() => jest.advanceTimersByTime(5000))
    expect(announce).toHaveBeenCalledTimes(1)
  })

  it('announces nothing once the component using it has gone', () => {
    const view = render(<Tree query="" message="8 results" />)
    view.rerender(<Tree query="zzz" message="No results" />)
    view.rerender(<Tree query="zzz" message="No results" mounted={false} />)
    act(() => jest.advanceTimersByTime(1000))
    expect(polite()).toBe('')
  })
})
