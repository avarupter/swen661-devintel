import { createSeedWorkspace } from '../../../../../shared/seed'
import { percentOf, statusRows, topReasons, visitRows } from '../reportModel'

const NOW = new Date(2026, 9, 5, 9, 42)
const patients = createSeedWorkspace(NOW).patients

describe('percentOf', () => {
  it('rounds to a whole percentage and never divides by zero', () => {
    expect(percentOf(8, 28)).toBe(29)
    expect(percentOf(12, 28)).toBe(43)
    expect(percentOf(0, 0)).toBe(0)
  })
})

describe('statusRows', () => {
  it('counts every status, in workflow order, with its share', () => {
    expect(statusRows(patients)).toEqual({
      total: 28,
      rows: [
        { status: 'needs-review', label: 'Needs review', count: 8, percent: 29 },
        { status: 'open', label: 'Open', count: 12, percent: 43 },
        { status: 'completed', label: 'Completed', count: 8, percent: 29 }
      ]
    })
  })
})

describe('visitRows', () => {
  it('counts visits for each of the next seven days', () => {
    const rows = visitRows(patients, NOW)
    expect(rows.map((row) => [row.heading, row.count])).toEqual([
      ['Today · Mon, Oct 5', 3],
      ['Tomorrow · Tue, Oct 6', 3],
      ['Wed, Oct 7', 3],
      ['Thu, Oct 8', 4],
      ['Fri, Oct 9', 2],
      ['Sat, Oct 10', 2],
      ['Sun, Oct 11', 3]
    ])
  })
})

describe('topReasons', () => {
  it('ranks reasons by patient count, breaking ties alphabetically', () => {
    expect(topReasons(patients, 5)).toEqual([
      { reason: 'Annual wellness visit', count: 3, percent: 11 },
      { reason: 'Blood pressure check', count: 3, percent: 11 },
      { reason: 'Chronic care review', count: 3, percent: 11 },
      { reason: 'Diabetes education', count: 3, percent: 11 },
      { reason: 'Mobility assessment', count: 3, percent: 11 }
    ])
  })

  it('returns fewer rows when there are fewer reasons', () => {
    expect(topReasons(patients.slice(0, 2), 5).map((row) => row.reason)).toEqual(['Care plan update', 'Wellness follow-up'])
    expect(topReasons([], 5)).toEqual([])
  })
})
