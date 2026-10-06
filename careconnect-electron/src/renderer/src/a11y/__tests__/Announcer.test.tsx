import { act, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { ANNOUNCE_DELAY_MS, AnnouncerProvider, useAnnounce } from '../Announcer'
import { VisuallyHidden } from '../VisuallyHidden'

type Announce = ReturnType<typeof useAnnounce>

/** Hands the announce function to the test once mounted. */
function Source({ onReady }: { onReady(announce: Announce): void }): null {
  const announce = useAnnounce()
  useEffect(() => onReady(announce), [announce, onReady])
  return null
}

function renderAnnouncer(): () => Announce {
  let announce: Announce = () => {}
  render(
    <AnnouncerProvider>
      <Source
        onReady={(value) => {
          announce = value
        }}
      />
    </AnnouncerProvider>
  )
  return () => announce
}

const polite = (): HTMLElement => screen.getByTestId('live-polite')
const assertive = (): HTMLElement => screen.getByTestId('live-assertive')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('Announcer', () => {
  it('renders a polite status region and an assertive alert region, both atomic', () => {
    renderAnnouncer()
    expect(polite()).toHaveAttribute('role', 'status')
    expect(polite()).toHaveAttribute('aria-live', 'polite')
    expect(polite()).toHaveAttribute('aria-atomic', 'true')
    expect(assertive()).toHaveAttribute('role', 'alert')
    expect(assertive()).toHaveAttribute('aria-live', 'assertive')
    expect(assertive()).toHaveAttribute('aria-atomic', 'true')
    for (const region of [polite(), assertive()]) {
      expect(region).toHaveClass('visually-hidden')
      expect(region).toBeEmptyDOMElement()
    }
  })

  it('announces confirmations politely, by default', () => {
    const announce = renderAnnouncer()
    act(() => announce()('Note added for Avery Park.'))
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS))
    expect(polite()).toHaveTextContent('Note added for Avery Park.')
    expect(assertive()).toBeEmptyDOMElement()
  })

  it('announces failures assertively, without touching the polite region', () => {
    const announce = renderAnnouncer()
    act(() => announce()('Saved.', 'polite'))
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS))
    act(() => announce()("Couldn't save changes.", 'assertive'))
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS))
    expect(assertive()).toHaveTextContent("Couldn't save changes.")
    expect(polite()).toHaveTextContent('Saved.')
  })

  it('clears the region first, so the same message is read again', () => {
    const announce = renderAnnouncer()
    act(() => announce()('Draft saved.'))
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS))
    expect(polite()).toHaveTextContent('Draft saved.')

    act(() => announce()('Draft saved.'))
    expect(polite()).toBeEmptyDOMElement()
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS - 1))
    expect(polite()).toBeEmptyDOMElement()
    act(() => jest.advanceTimersByTime(1))
    expect(polite()).toHaveTextContent('Draft saved.')
  })

  it('shows the latest message when several arrive together', () => {
    const announce = renderAnnouncer()
    act(() => {
      announce()('5 results')
      announce()('1 result')
    })
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS))
    expect(polite()).toHaveTextContent('1 result')
  })

  it('renders its regions after the app, outside the subtree that becomes inert', () => {
    const { container } = render(
      <AnnouncerProvider>
        <div className="app-shell" inert>
          App
        </div>
      </AnnouncerProvider>
    )
    const [shell, ...regions] = Array.from(container.children)
    expect(shell).toHaveClass('app-shell')
    expect(regions.map((region) => region.getAttribute('data-testid'))).toEqual(['live-polite', 'live-assertive'])
    for (const region of regions) expect(region.closest('[inert]')).toBeNull()
  })

  it('is a harmless no-op outside the provider', () => {
    const { result } = renderHook(() => useAnnounce())
    expect(() => result.current('Nobody is listening')).not.toThrow()
  })
})

describe('VisuallyHidden', () => {
  it('keeps text for screen readers, with an optional id for aria-describedby', () => {
    render(
      <button type="button" aria-describedby="reply-reason">
        Reply<VisuallyHidden id="reply-reason">Select a conversation to reply.</VisuallyHidden>
      </button>
    )
    const hidden = screen.getByText('Select a conversation to reply.')
    expect(hidden.tagName).toBe('SPAN')
    expect(hidden).toHaveClass('visually-hidden')
    expect(hidden).toHaveAttribute('id', 'reply-reason')
    expect(screen.getByRole('button')).toHaveAccessibleDescription('Select a conversation to reply.')
  })
})
