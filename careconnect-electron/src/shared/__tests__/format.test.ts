import {
  calendarDayOffset,
  formatActivityTime,
  formatBytes,
  formatDayTime,
  formatLongDateTime,
  formatRelativeDay,
  formatShortDate,
  formatTime,
  formatTimeAgo,
  formatWeekdayDate,
  initials,
  isSameDay,
  pluralize,
  STATUS_LABELS
} from '../format'

/** Local wall-clock time, so the tests hold in any time zone. */
const at = (year: number, month: number, day: number, hours = 0, minutes = 0): Date => new Date(year, month - 1, day, hours, minutes)

// Monday 5 October 2026, 09:42: the moment the renderer tests run at.
const NOW = at(2026, 10, 5, 9, 42)

describe('calendar days', () => {
  it('counts whole calendar days, not 24-hour periods', () => {
    expect(calendarDayOffset(at(2026, 10, 5, 0, 1), NOW)).toBe(0)
    expect(calendarDayOffset(at(2026, 10, 5, 23, 59), NOW)).toBe(0)
    expect(calendarDayOffset(at(2026, 10, 4, 23, 59), NOW)).toBe(-1)
    expect(calendarDayOffset(at(2026, 10, 6, 0, 0), NOW)).toBe(1)
    expect(calendarDayOffset(at(2026, 9, 28, 12), NOW)).toBe(-7)
  })

  it('accepts ISO strings as well as dates', () => {
    expect(calendarDayOffset(at(2026, 10, 6, 8).toISOString(), NOW)).toBe(1)
    expect(isSameDay(at(2026, 10, 5, 18).toISOString(), NOW)).toBe(true)
    expect(isSameDay(at(2026, 10, 6, 0).toISOString(), NOW)).toBe(false)
  })

  it('stays exact across a daylight-saving change', () => {
    // Whatever the machine's zone, a calendar day can be 23 or 25 hours long; rounding absorbs it.
    const beforeChange = at(2026, 10, 31, 12)
    expect(calendarDayOffset(at(2026, 11, 2, 12), beforeChange)).toBe(2)
    expect(calendarDayOffset(at(2026, 3, 9, 0, 30), at(2026, 3, 7, 23, 30))).toBe(2)
  })
})

describe('formatTime', () => {
  it('uses the 24-hour clock with leading zeros', () => {
    expect(formatTime(at(2026, 10, 5, 9, 14))).toBe('09:14')
    expect(formatTime(at(2026, 10, 5, 15, 22))).toBe('15:22')
    expect(formatTime(at(2026, 10, 5, 0, 0))).toBe('00:00')
    expect(formatTime(at(2026, 10, 5, 23, 59).toISOString())).toBe('23:59')
  })
})

describe('dates', () => {
  it('shows short dates without the year in the current year', () => {
    expect(formatShortDate(at(2026, 9, 28), NOW)).toBe('Sep 28')
    expect(formatShortDate(at(2026, 1, 1), NOW)).toBe('Jan 1')
    expect(formatShortDate(at(2026, 12, 31).toISOString(), NOW)).toBe('Dec 31')
  })

  it('adds the year across the year boundary', () => {
    const newYear = at(2027, 1, 2, 9)
    expect(formatShortDate(at(2026, 12, 31), newYear)).toBe('Dec 31, 2026')
    expect(formatShortDate(at(2027, 1, 1), newYear)).toBe('Jan 1')
    expect(formatShortDate(at(2025, 9, 28), NOW)).toBe('Sep 28, 2025')
  })

  it('formats weekday dates', () => {
    expect(formatWeekdayDate(NOW, NOW)).toBe('Mon, Oct 5')
    expect(formatWeekdayDate(at(2026, 9, 29), NOW)).toBe('Tue, Sep 29')
    expect(formatWeekdayDate(at(2026, 12, 31), at(2027, 1, 2))).toBe('Thu, Dec 31, 2026')
  })

  it('formats unambiguous long dates for exported files', () => {
    expect(formatLongDateTime(at(2026, 10, 5, 10, 30))).toBe('Mon, Oct 5, 2026, 10:30')
    expect(formatLongDateTime(at(2027, 1, 1, 0, 5).toISOString())).toBe('Fri, Jan 1, 2027, 00:05')
  })
})

describe('formatRelativeDay', () => {
  it('names today, yesterday and tomorrow, and dates anything else', () => {
    expect(formatRelativeDay(at(2026, 10, 5, 7), NOW)).toBe('Today')
    expect(formatRelativeDay(at(2026, 10, 4, 15, 22), NOW)).toBe('Yesterday')
    expect(formatRelativeDay(at(2026, 10, 6, 8), NOW)).toBe('Tomorrow')
    expect(formatRelativeDay(at(2026, 10, 3, 8), NOW)).toBe('Oct 3')
    expect(formatRelativeDay(at(2026, 10, 7, 8), NOW)).toBe('Oct 7')
  })

  it('says "Yesterday" for something ten minutes earlier but before midnight', () => {
    const justAfterMidnight = at(2026, 10, 5, 0, 5)
    expect(formatRelativeDay(at(2026, 10, 4, 23, 55), justAfterMidnight)).toBe('Yesterday')
    expect(formatRelativeDay(at(2026, 10, 5, 0, 1), justAfterMidnight)).toBe('Today')
  })

  it('handles yesterday and tomorrow across the year boundary', () => {
    expect(formatRelativeDay(at(2026, 12, 31, 23, 50), at(2027, 1, 1, 0, 10))).toBe('Yesterday')
    expect(formatRelativeDay(at(2027, 1, 1, 9), at(2026, 12, 31, 18))).toBe('Tomorrow')
    expect(formatRelativeDay(at(2026, 12, 30, 9), at(2027, 1, 1, 9))).toBe('Dec 30, 2026')
  })

  it('builds the stat-card and activity-feed forms from the design', () => {
    expect(formatDayTime(at(2026, 10, 5, 10, 30).toISOString(), NOW)).toBe('Today, 10:30')
    expect(formatDayTime(at(2026, 10, 8, 9), NOW)).toBe('Oct 8, 09:00')
    expect(formatActivityTime(at(2026, 10, 5, 9, 14), NOW)).toBe('Today · 09:14')
    expect(formatActivityTime(at(2026, 10, 4, 15, 22), NOW)).toBe('Yesterday · 15:22')
    expect(formatActivityTime(at(2026, 9, 26, 11, 5), NOW)).toBe('Sep 26 · 11:05')
  })
})

describe('formatTimeAgo', () => {
  const minutesBefore = (minutes: number, now = NOW): Date => new Date(now.getTime() - minutes * 60_000)

  it('says "just now" under a minute, and for clocks slightly ahead', () => {
    expect(formatTimeAgo(NOW, NOW)).toBe('just now')
    expect(formatTimeAgo(new Date(NOW.getTime() - 59_000), NOW)).toBe('just now')
    expect(formatTimeAgo(new Date(NOW.getTime() + 30_000), NOW)).toBe('just now')
  })

  it('counts minutes', () => {
    expect(formatTimeAgo(minutesBefore(1), NOW)).toBe('1 minute ago')
    expect(formatTimeAgo(minutesBefore(4).toISOString(), NOW)).toBe('4 minutes ago')
    expect(formatTimeAgo(minutesBefore(59), NOW)).toBe('59 minutes ago')
  })

  it('counts hours on the same day', () => {
    expect(formatTimeAgo(minutesBefore(60), NOW)).toBe('1 hour ago')
    expect(formatTimeAgo(minutesBefore(119), NOW)).toBe('1 hour ago')
    expect(formatTimeAgo(minutesBefore(120), NOW)).toBe('2 hours ago')
    expect(formatTimeAgo(minutesBefore(9 * 60 + 41), NOW)).toBe('9 hours ago')
  })

  it('switches to "Yesterday" once the time is on the previous calendar day', () => {
    const lateNight = at(2026, 10, 5, 1, 0)
    expect(formatTimeAgo(at(2026, 10, 4, 23, 0), lateNight)).toBe('Yesterday')
    expect(formatTimeAgo(at(2026, 10, 4, 9, 0), NOW)).toBe('Yesterday')
  })

  it('falls back to the date for anything older', () => {
    expect(formatTimeAgo(at(2026, 9, 26, 14), NOW)).toBe('Sep 26')
    expect(formatTimeAgo(at(2025, 12, 1, 14), NOW)).toBe('Dec 1, 2025')
  })
})

describe('initials', () => {
  it('takes the first letter of the first and last words, upper-cased', () => {
    expect(initials('Avery Park')).toBe('AP')
    expect(initials('avery park')).toBe('AP')
  })

  it('handles one word, three words and messy spacing', () => {
    expect(initials('Avery')).toBe('A')
    expect(initials('Mary Ann Lee')).toBe('ML')
    expect(initials('  Jordan   Lee, RN  ')).toBe('JR')
    expect(initials('North Coast Clinic')).toBe('NC')
  })

  it('returns a placeholder for an empty name', () => {
    expect(initials('')).toBe('?')
    expect(initials('   ')).toBe('?')
  })
})

describe('labels and counts', () => {
  it('labels every status in sentence case', () => {
    expect(STATUS_LABELS).toEqual({ 'needs-review': 'Needs review', open: 'Open', completed: 'Completed' })
  })

  it('pluralizes', () => {
    expect(pluralize(0, 'unsaved change')).toBe('0 unsaved changes')
    expect(pluralize(1, 'unsaved change')).toBe('1 unsaved change')
    expect(pluralize(2, 'task')).toBe('2 tasks')
    expect(pluralize(1, 'person', 'people')).toBe('1 person')
    expect(pluralize(3, 'person', 'people')).toBe('3 people')
  })

  it.each<[number, string]>([
    [0, '0 bytes'],
    [1, '1 byte'],
    [512, '512 bytes'],
    [1023, '1023 bytes'],
    [1024, '1 KB'],
    [1536, '2 KB'],
    [12 * 1024, '12 KB'],
    // Just below 1 MiB, rounding to whole KB would give "1024 KB": switch to MB first.
    [1_048_063, '1023 KB'],
    [1_048_064, '1.0 MB'],
    [1_048_575, '1.0 MB'],
    [1024 * 1024, '1.0 MB'],
    [Math.round(3.4 * 1024 * 1024), '3.4 MB'],
    [250 * 1024 * 1024, '250.0 MB']
  ])('formatBytes(%i) is %s', (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text)
  })
})
