import { formatActivityTime, formatDayTime, isSameDay } from '../format'
import { DEFAULT_PREFERENCES, RECENT_PATIENT_LIMIT, type Patient } from '../model'
import { atDay, createSeedPatients, createSeedWorkspace, patientIdFor } from '../seed'
import { validateWorkspace } from '../validate'

// Monday 5 October 2026, 09:42 local time.
const NOW = new Date(2026, 9, 5, 9, 42)

describe('createSeedWorkspace', () => {
  const workspace = createSeedWorkspace(NOW)
  const byName = (name: string): Patient => {
    const patient = workspace.patients.find((entry) => entry.name === name)
    if (!patient) throw new Error(`${name} is not in the seed`)
    return patient
  }

  it('has 28 patients with unique ids and Care IDs', () => {
    expect(workspace.patients).toHaveLength(28)
    expect(new Set(workspace.patients.map((patient) => patient.id)).size).toBe(28)
    expect(new Set(workspace.patients.map((patient) => patient.careId)).size).toBe(28)
    for (const patient of workspace.patients) {
      expect(patient.careId).toMatch(/^CC-\d{4}$/)
      expect(patient.id).toBe(patientIdFor(patient.name))
    }
  })

  it('starts with the five patients from the design, exactly as drawn', () => {
    expect(
      workspace.patients.slice(0, 5).map(({ name, status, reason, careId, pronouns, ageGroup }) => ({ name, status, reason, careId, pronouns, ageGroup }))
    ).toEqual([
      { name: 'Avery Park', status: 'needs-review', reason: 'Wellness follow-up', careId: 'CC-1048', pronouns: 'they/them', ageGroup: 'Adult' },
      { name: 'Morgan Chen', status: 'open', reason: 'Care plan update', careId: 'CC-1052', pronouns: 'she/her', ageGroup: 'Adult' },
      { name: 'Riley Singh', status: 'completed', reason: 'Lab results', careId: 'CC-1057', pronouns: 'he/him', ageGroup: 'Young adult' },
      { name: 'Taylor Lane', status: 'open', reason: 'New referral', careId: 'CC-1061', pronouns: 'they/them', ageGroup: 'Adult' },
      { name: 'Jamie Wu', status: 'completed', reason: 'Medication review', careId: 'CC-1063', pronouns: 'she/her', ageGroup: 'Older adult' }
    ])
  })

  it('gives Avery Park the design’s care summary, relative to now', () => {
    const avery = byName('Avery Park')
    expect(formatDayTime(avery.nextVisit as string, NOW)).toBe('Today, 10:30')
    expect(avery.alert).toEqual({ title: 'Follow-up due today', detail: 'Review home monitoring notes before the 10:30 check-in.' })
    expect(avery.plan).toEqual([
      'Confirm symptom trend and energy level',
      'Review adherence to hydration goals',
      'Coordinate next wellness follow-up'
    ])
    expect(avery.careTeam).toHaveLength(4)
    expect(avery.activity[0]).toMatchObject({ kind: 'note', title: 'Visit note updated', author: 'Jordan Lee, RN' })
    expect(formatActivityTime(avery.activity[0].at, NOW)).toBe('Today · 09:14')
    expect(formatActivityTime(avery.activity[1].at, NOW)).toBe('Yesterday · 15:22')
  })

  it('puts the signed-in coordinator on every care team', () => {
    for (const patient of workspace.patients) {
      expect(patient.careTeam[0]).toBe(workspace.user.name)
      expect(new Set(patient.careTeam).size).toBe(patient.careTeam.length)
    }
  })

  it('keeps activity newest first and in the past', () => {
    for (const patient of workspace.patients) {
      const times = patient.activity.map((activity) => activity.at)
      expect(times).toEqual([...times].sort().reverse())
      for (const time of times) expect(new Date(time).getTime()).toBeLessThanOrEqual(NOW.getTime())
      expect(new Set(patient.activity.map((activity) => activity.id)).size).toBe(patient.activity.length)
      expect(new Date(patient.lastContact).getTime()).toBeLessThan(NOW.getTime())
    }
  })

  it('schedules three visits today, so Overview and Schedule have an agenda', () => {
    const today = workspace.patients.filter((patient) => patient.nextVisit && isSameDay(patient.nextVisit, NOW))
    expect(today.map((patient) => patient.name)).toEqual(['Avery Park', 'Casey Morgan', 'Emerson Brooks'])
  })

  it('has six conversations, four of them unread, each oldest message first', () => {
    expect(workspace.conversations).toHaveLength(6)
    expect(workspace.conversations.filter((conversation) => conversation.unread)).toHaveLength(4)
    for (const conversation of workspace.conversations) {
      const times = conversation.messages.map((message) => message.at)
      expect(times).toEqual([...times].sort())
    }
  })

  it('has eight care tasks, one already done', () => {
    expect(workspace.tasks).toHaveLength(8)
    expect(workspace.tasks.filter((task) => task.done).map((task) => task.id)).toEqual(['t-8'])
  })

  it('only refers to patients that exist', () => {
    const ids = new Set(workspace.patients.map((patient) => patient.id))
    const references = [
      ...workspace.conversations.map((conversation) => conversation.patientId),
      ...workspace.tasks.map((task) => task.patientId),
      ...workspace.recentPatients.map((entry) => entry.patientId)
    ].filter((id): id is string => id !== null)
    for (const id of references) expect(ids).toContain(id)
  })

  it('remembers Avery Park and Morgan Chen as recently viewed', () => {
    expect(workspace.recentPatients).toEqual([
      { patientId: 'p-avery-park', at: new Date(NOW.getTime() - 4 * 60_000).toISOString() },
      { patientId: 'p-morgan-chen', at: new Date(NOW.getTime() - 52 * 60_000).toISOString() }
    ])
    expect(workspace.recentPatients.length).toBeLessThanOrEqual(RECENT_PATIENT_LIMIT)
  })

  it('uses the fixed demo clinic, user and default preferences', () => {
    expect(workspace.version).toBe(1)
    expect(workspace.clinic).toEqual({ name: 'North Coast Clinic', subtitle: 'Clinical operations' })
    expect(workspace.user).toEqual({ name: 'Jordan Lee, RN', role: 'Care coordinator' })
    expect(workspace.preferences).toEqual(DEFAULT_PREFERENCES)
    expect(workspace.preferences).not.toBe(DEFAULT_PREFERENCES)
    expect(workspace.drafts).toEqual([])
  })

  it('passes validateWorkspace unchanged', () => {
    expect(validateWorkspace(workspace)).toEqual(workspace)
  })

  it('survives JSON, as it must to be saved and sent over IPC', () => {
    expect(JSON.parse(JSON.stringify(workspace))).toEqual(workspace)
  })

  it('is deterministic for the same now', () => {
    expect(createSeedWorkspace(new Date(NOW.getTime()))).toEqual(workspace)
  })

  it('moves with the clock, so "Today, 10:30" stays true on any day', () => {
    const later = new Date(2027, 2, 14, 8, 0)
    const avery = createSeedWorkspace(later).patients[0]
    expect(formatDayTime(avery.nextVisit as string, later)).toBe('Today, 10:30')
  })

  it('returns fresh arrays, so editing one workspace never leaks into the next', () => {
    const first = createSeedPatients(NOW)
    first[0].plan.push('Extra item')
    expect(createSeedPatients(NOW)[0].plan).toHaveLength(3)
  })
})

describe('seed helpers', () => {
  it('builds stable patient ids from names', () => {
    expect(patientIdFor('Avery Park')).toBe('p-avery-park')
    expect(patientIdFor("  Dr. O'Neil-Smith ")).toBe('p-dr-o-neil-smith')
  })

  it('places a wall-clock time a number of calendar days from now', () => {
    expect(new Date(atDay(NOW, 0, '10:30'))).toEqual(new Date(2026, 9, 5, 10, 30))
    expect(new Date(atDay(NOW, -1, '15:22'))).toEqual(new Date(2026, 9, 4, 15, 22))
    expect(new Date(atDay(NOW, 30, '08:00'))).toEqual(new Date(2026, 10, 4, 8, 0))
  })
})
