import type { CareTask, Conversation, Patient } from '../../../../shared/model'
import { atDay, createSeedWorkspace } from '../../../../shared/seed'
import {
  conversationById,
  followUpsDueToday,
  isOverdue,
  latestActivityAt,
  matchesPatientQuery,
  mergeImportedPatients,
  patientById,
  patientSecondaryText,
  sortedConversations,
  statusCounts,
  tasksDueToday,
  unreadCount,
  upcomingVisits,
  visiblePatients
} from '../selectors'

// Monday 5 October 2026, 09:42 local time.
const NOW = new Date(2026, 9, 5, 9, 42)
const workspace = createSeedWorkspace(NOW)
const { patients } = workspace

function seedPatient(name: string): Patient {
  const found = patients.find((patient) => patient.name === name)
  if (!found) throw new Error(`${name} is not in the seed`)
  return found
}

function makePatient(overrides: Partial<Patient>): Patient {
  return { ...seedPatient('Avery Park'), activity: [], ...overrides }
}

const names = (list: readonly Patient[]): string[] => list.map((patient) => patient.name)

describe('lookups', () => {
  it('patientById finds a patient and tolerates missing input', () => {
    expect(patientById(workspace, 'p-avery-park')?.name).toBe('Avery Park')
    expect(patientById(workspace, 'p-nobody')).toBeNull()
    expect(patientById(workspace, null)).toBeNull()
    expect(patientById(workspace, undefined)).toBeNull()
    expect(patientById(null, 'p-avery-park')).toBeNull()
  })

  it('conversationById finds a conversation and tolerates missing input', () => {
    expect(conversationById(workspace, 'c-lab-results')?.with).toBe('Dr. Sam Okafor')
    expect(conversationById(workspace, 'c-nothing')).toBeNull()
    expect(conversationById(workspace, null)).toBeNull()
    expect(conversationById(null, 'c-lab-results')).toBeNull()
  })
})

describe('latestActivityAt', () => {
  it('is the newest activity, or the last contact when that is newer', () => {
    expect(latestActivityAt(seedPatient('Avery Park'))).toBe(atDay(NOW, 0, '09:14'))
    expect(latestActivityAt(makePatient({ lastContact: atDay(NOW, -2, '08:00') }))).toBe(atDay(NOW, -2, '08:00'))
    const contactAfterNotes = makePatient({
      lastContact: atDay(NOW, 0, '09:30'),
      activity: [{ id: 'a', kind: 'note', title: 'Note', at: atDay(NOW, -1, '10:00') }]
    })
    expect(latestActivityAt(contactAfterNotes)).toBe(atDay(NOW, 0, '09:30'))
  })
})

describe('patientSecondaryText', () => {
  it('shows the visit time when the patient has a visit today', () => {
    expect(patientSecondaryText(seedPatient('Avery Park'), NOW)).toBe('Wellness follow-up · 10:30')
    expect(patientSecondaryText(seedPatient('Casey Morgan'), NOW)).toBe('Chronic care review · 13:00')
  })

  it('otherwise shows the day of the latest activity', () => {
    expect(patientSecondaryText(seedPatient('Morgan Chen'), NOW)).toBe('Care plan update · Today')
    expect(patientSecondaryText(seedPatient('Riley Singh'), NOW)).toBe('Lab results · Yesterday')
    expect(patientSecondaryText(seedPatient('Taylor Lane'), NOW)).toBe('New referral · Sep 28')
  })

  it('ignores a visit on another day', () => {
    const tomorrow = makePatient({ reason: 'Blood pressure check', nextVisit: atDay(NOW, 1, '09:00'), lastContact: atDay(NOW, -1, '12:00') })
    expect(patientSecondaryText(tomorrow, NOW)).toBe('Blood pressure check · Yesterday')
  })
})

describe('matchesPatientQuery', () => {
  const avery = seedPatient('Avery Park')

  it('matches name, Care ID or reason, ignoring case and surrounding spaces', () => {
    expect(matchesPatientQuery(avery, 'avery')).toBe(true)
    expect(matchesPatientQuery(avery, '  PARK ')).toBe(true)
    expect(matchesPatientQuery(avery, 'cc-1048')).toBe(true)
    expect(matchesPatientQuery(avery, 'wellness')).toBe(true)
    expect(matchesPatientQuery(avery, 'riley')).toBe(false)
  })

  it('matches everything for an empty or blank query', () => {
    expect(matchesPatientQuery(avery, '')).toBe(true)
    expect(matchesPatientQuery(avery, '   ')).toBe(true)
  })
})

describe('visiblePatients', () => {
  it('sorts by most recent activity by default, as in the design', () => {
    const list = visiblePatients(patients, { query: '', filter: 'all', sortOrder: 'recent' })
    expect(list).toHaveLength(28)
    expect(names(list).slice(0, 5)).toEqual(['Avery Park', 'Morgan Chen', 'Riley Singh', 'Taylor Lane', 'Jamie Wu'])
  })

  it('sorts by name', () => {
    const list = visiblePatients(patients, { query: '', filter: 'all', sortOrder: 'name' })
    expect(names(list)[0]).toBe('Alex Rivera')
    expect(names(list)).toEqual([...names(patients)].sort((a, b) => a.localeCompare(b)))
  })

  it('sorts by next visit, soonest first, with unscheduled patients last', () => {
    const list = visiblePatients(patients, { query: '', filter: 'all', sortOrder: 'nextVisit' })
    expect(names(list).slice(0, 3)).toEqual(['Avery Park', 'Casey Morgan', 'Emerson Brooks'])
    const firstUnscheduled = list.findIndex((patient) => patient.nextVisit === null)
    expect(firstUnscheduled).toBeGreaterThan(0)
    expect(list.slice(firstUnscheduled).every((patient) => patient.nextVisit === null)).toBe(true)
    const scheduled = list.slice(0, firstUnscheduled).map((patient) => patient.nextVisit as string)
    expect(scheduled).toEqual([...scheduled].sort())
  })

  it('breaks next-visit ties by recent activity', () => {
    const visit = atDay(NOW, 1, '09:00')
    const older = makePatient({ id: 'p-1', name: 'Older', nextVisit: visit, lastContact: atDay(NOW, -3, '09:00') })
    const newer = makePatient({ id: 'p-2', name: 'Newer', nextVisit: visit, lastContact: atDay(NOW, -1, '09:00') })
    const none1 = makePatient({ id: 'p-3', name: 'Unscheduled old', nextVisit: null, lastContact: atDay(NOW, -9, '09:00') })
    const none2 = makePatient({ id: 'p-4', name: 'Unscheduled new', nextVisit: null, lastContact: atDay(NOW, -2, '09:00') })
    expect(names(visiblePatients([none1, older, none2, newer], { query: '', filter: 'all', sortOrder: 'nextVisit' }))).toEqual([
      'Newer',
      'Older',
      'Unscheduled new',
      'Unscheduled old'
    ])
  })

  it('sorts by status: needs review, then open, then completed, each by recent activity', () => {
    const list = visiblePatients(patients, { query: '', filter: 'all', sortOrder: 'status' })
    const statuses = list.map((patient) => patient.status)
    expect(statuses).toEqual([...statuses].sort((a, b) => ['needs-review', 'open', 'completed'].indexOf(a) - ['needs-review', 'open', 'completed'].indexOf(b)))
    expect(list[0].name).toBe('Avery Park')
    expect(names(list.filter((patient) => patient.status === 'open')).slice(0, 2)).toEqual(['Morgan Chen', 'Taylor Lane'])
  })

  it('filters by status and query together', () => {
    expect(names(visiblePatients(patients, { query: 'riley', filter: 'all', sortOrder: 'recent' }))).toEqual(['Riley Singh'])
    expect(visiblePatients(patients, { query: 'riley', filter: 'open', sortOrder: 'recent' })).toEqual([])
    const needsReview = visiblePatients(patients, { query: '', filter: 'needs-review', sortOrder: 'recent' })
    expect(needsReview.length).toBe(statusCounts(patients)['needs-review'])
    expect(needsReview.every((patient) => patient.status === 'needs-review')).toBe(true)
  })

  it('never reorders the list it was given', () => {
    const before = names(patients)
    visiblePatients(patients, { query: '', filter: 'all', sortOrder: 'name' })
    expect(names(patients)).toEqual(before)
  })
})

describe('counts', () => {
  it('statusCounts counts every status', () => {
    expect(statusCounts([])).toEqual({ 'needs-review': 0, open: 0, completed: 0 })
    expect(statusCounts(patients.slice(0, 5))).toEqual({ 'needs-review': 1, open: 2, completed: 2 })
    const counts = statusCounts(patients)
    expect(counts['needs-review'] + counts.open + counts.completed).toBe(28)
  })

  it('unreadCount counts unread conversations', () => {
    expect(unreadCount(workspace.conversations)).toBe(4)
    expect(unreadCount([])).toBe(0)
  })
})

describe('visits', () => {
  it('upcomingVisits lists visits from today through the next days, soonest first', () => {
    const week = upcomingVisits(patients, NOW, 7)
    const offsets = week.map((patient) => Math.round((new Date(patient.nextVisit as string).setHours(0, 0, 0, 0) - new Date(NOW).setHours(0, 0, 0, 0)) / 86_400_000))
    expect(offsets.every((offset) => offset >= 0 && offset < 7)).toBe(true)
    expect(week.map((patient) => patient.nextVisit)).toEqual([...week.map((patient) => patient.nextVisit)].sort())
    expect(names(week).slice(0, 3)).toEqual(['Avery Park', 'Casey Morgan', 'Emerson Brooks'])
    expect(names(week)).toContain('Morgan Chen')
    expect(names(week)).toContain('Taylor Lane')
    expect(names(week)).not.toContain('Jamie Wu')
  })

  it('includes a visit earlier today but not yesterday’s, and skips unscheduled patients', () => {
    const earlier = makePatient({ id: 'p-early', name: 'Early', nextVisit: atDay(NOW, 0, '07:00') })
    const yesterday = makePatient({ id: 'p-y', name: 'Yesterday', nextVisit: atDay(NOW, -1, '16:00') })
    const unscheduled = makePatient({ id: 'p-u', name: 'Unscheduled', nextVisit: null })
    const edge = makePatient({ id: 'p-edge', name: 'Day seven', nextVisit: atDay(NOW, 7, '08:00') })
    expect(names(upcomingVisits([edge, yesterday, earlier, unscheduled], NOW, 7))).toEqual(['Early'])
  })

  it('followUpsDueToday lists today’s visits for patients that are not completed', () => {
    expect(names(followUpsDueToday(patients, NOW))).toEqual(['Avery Park', 'Casey Morgan', 'Emerson Brooks'])
    const completed = makePatient({ id: 'p-done', name: 'Done', status: 'completed', nextVisit: atDay(NOW, 0, '11:00') })
    expect(followUpsDueToday([completed], NOW)).toEqual([])
  })
})

describe('tasks', () => {
  const task = (id: string, days: number, time: string, done = false): CareTask => ({
    id,
    title: id,
    patientId: null,
    due: atDay(NOW, days, time),
    done,
    priority: 'routine'
  })

  it('tasksDueToday lists open tasks due today or earlier, soonest first', () => {
    expect(tasksDueToday(workspace.tasks, NOW).map((entry) => entry.id)).toEqual(['t-1', 't-2', 't-3', 't-4'])
    const list = [task('later-today', 0, '17:00'), task('overdue', -2, '09:00'), task('tomorrow', 1, '09:00'), task('done', 0, '08:00', true)]
    expect(tasksDueToday(list, NOW).map((entry) => entry.id)).toEqual(['overdue', 'later-today'])
  })

  it('isOverdue compares against the current time, and done tasks are never overdue', () => {
    expect(isOverdue(task('past', 0, '09:00'), NOW)).toBe(true)
    expect(isOverdue(task('soon', 0, '10:00'), NOW)).toBe(false)
    expect(isOverdue(task('done', -1, '09:00', true), NOW)).toBe(false)
  })
})

describe('sortedConversations', () => {
  it('orders conversations by their latest message, newest first, without mutating the input', () => {
    const before = workspace.conversations.map((conversation) => conversation.id)
    expect(sortedConversations(workspace.conversations).map((conversation) => conversation.id)).toEqual([
      'c-care-plan-question',
      'c-lab-results',
      'c-refill',
      'c-home-monitoring',
      'c-schedule-change',
      'c-referral'
    ])
    expect(workspace.conversations.map((conversation) => conversation.id)).toEqual(before)
  })

  it('puts a conversation with no messages last', () => {
    const empty: Conversation = { id: 'c-empty', patientId: null, subject: 'Empty', with: 'Nobody', messages: [], unread: false }
    expect(sortedConversations([empty, ...workspace.conversations]).at(-1)?.id).toBe('c-empty')
  })
})

describe('mergeImportedPatients', () => {
  let generated = 0
  const makeId = jest.fn((prefix: string): string => `${prefix}-generated-${++generated}`)

  beforeEach(() => {
    generated = 0
    makeId.mockClear()
  })

  it('adds new patients unchanged', () => {
    const incoming = [makePatient({ id: 'p-new', careId: 'CC-9001', name: 'New Person' })]
    expect(mergeImportedPatients(patients, incoming, makeId)).toEqual({ added: incoming, duplicates: 0 })
    expect(makeId).not.toHaveBeenCalled()
  })

  it('skips records whose Care ID is already in the list, including repeats within the file', () => {
    const repeat = makePatient({ id: 'p-new', careId: 'CC-9001', name: 'New Person' })
    const incoming = [seedPatient('Avery Park'), repeat, { ...repeat, id: 'p-new-2' }]
    const result = mergeImportedPatients(patients, incoming, makeId)
    expect(result.duplicates).toBe(2)
    expect(result.added.map((patient) => patient.careId)).toEqual(['CC-9001'])
  })

  it('re-keys records whose id collides, so an import never overwrites existing work', () => {
    const collision = makePatient({ id: 'p-avery-park', careId: 'CC-9002', name: 'Avery Park' })
    const twin = makePatient({ id: 'p-twin', careId: 'CC-9003', name: 'Twin' })
    const sameIdInFile = makePatient({ id: 'p-twin', careId: 'CC-9004', name: 'Other twin' })
    const result = mergeImportedPatients(patients, [collision, twin, sameIdInFile], makeId)
    expect(result.duplicates).toBe(0)
    expect(makeId).toHaveBeenCalledTimes(2)
    expect(makeId).toHaveBeenCalledWith('p')
    expect(result.added.map((patient) => patient.id)).toEqual(['p-generated-1', 'p-twin', 'p-generated-2'])
    expect(result.added[0]).toEqual({ ...collision, id: 'p-generated-1' })
    expect(collision.id).toBe('p-avery-park')
  })
})
