import { createSeedWorkspace } from '../../../../../shared/seed'
import { dayHeading, scheduleDays } from '../scheduleModel'

const NOW = new Date(2026, 9, 5, 9, 42)

describe('dayHeading', () => {
  it('names today and tomorrow, then uses the weekday and date alone', () => {
    expect(dayHeading(new Date(2026, 9, 5), NOW)).toBe('Today · Mon, Oct 5')
    expect(dayHeading(new Date(2026, 9, 6), NOW)).toBe('Tomorrow · Tue, Oct 6')
    expect(dayHeading(new Date(2026, 9, 7), NOW)).toBe('Wed, Oct 7')
  })

  it('crosses month and year boundaries', () => {
    const newYearsEve = new Date(2026, 11, 31, 12, 0)
    expect(dayHeading(new Date(2027, 0, 1), newYearsEve)).toBe('Tomorrow · Fri, Jan 1, 2027')
  })
})

describe('scheduleDays', () => {
  it('returns seven consecutive days starting today, each with its visits in time order', () => {
    const days = scheduleDays(createSeedWorkspace(NOW).patients, NOW, 7)
    expect(days.map((day) => day.heading)).toEqual([
      'Today · Mon, Oct 5',
      'Tomorrow · Tue, Oct 6',
      'Wed, Oct 7',
      'Thu, Oct 8',
      'Fri, Oct 9',
      'Sat, Oct 10',
      'Sun, Oct 11'
    ])
    expect(days.map((day) => day.key)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'])
    expect(days[0].visits.map((patient) => patient.name)).toEqual(['Avery Park', 'Casey Morgan', 'Emerson Brooks'])
    expect(days.reduce((total, day) => total + day.visits.length, 0)).toBe(20)
  })

  it('keeps empty days, so every day of the week is listed', () => {
    const patients = createSeedWorkspace(NOW).patients.map((patient) => ({ ...patient, nextVisit: null }))
    const days = scheduleDays(patients, NOW, 3)
    expect(days).toHaveLength(3)
    expect(days.every((day) => day.visits.length === 0)).toBe(true)
  })
})
