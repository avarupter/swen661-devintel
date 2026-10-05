/**
 * First-run demo workspace: 28 synthetic patients (the first five exactly as
 * in the Assignment 7 design), six conversations (four unread) and eight care
 * tasks. Everything is generated relative to `now`, so "Today, 10:30" stays
 * true whichever day the app is first opened. The output is deterministic
 * for a given `now`.
 */
import type { Activity, ActivityKind, CareTask, Conversation, FollowUpAlert, Patient, PatientStatus, Workspace } from './model'
import { DEFAULT_PREFERENCES } from './model'

/** ISO timestamp for local wall-clock `time` ("10:30"), `days` calendar days from `now`. */
export function atDay(now: Date, days: number, time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, hours, minutes, 0, 0).toISOString()
}

function minutesBefore(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString()
}

export function patientIdFor(name: string): string {
  return `p-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
}

const TEAM = ['Jordan Lee, RN', 'Dr. Sam Okafor', 'Robin Hale, PharmD', 'Chris Vega, MSW', 'Dr. Lee Moreno', 'Pat Kim, RD', 'Alex Shaw, PT']

function teamFrom(offset: number, size = 4): string[] {
  // The signed-in coordinator is on every care team.
  const others = TEAM.slice(1)
  const members = [TEAM[0]]
  for (let i = 0; members.length < size; i++) members.push(others[(offset + i) % others.length])
  return members
}

type ActivitySeed = [kind: ActivityKind, title: string, days: number, time: string, detail?: string]

interface PatientSeed {
  name: string
  pronouns: string
  ageGroup: string
  careId: string
  status: PatientStatus
  reason: string
  lastContact: [days: number, time: string]
  nextVisit: [days: number, time: string] | null
  plan: string[]
  alert: FollowUpAlert | null
  activity: ActivitySeed[]
  teamOffset: number
}

const DESIGN_PATIENTS: PatientSeed[] = [
  {
    name: 'Avery Park',
    pronouns: 'they/them',
    ageGroup: 'Adult',
    careId: 'CC-1048',
    status: 'needs-review',
    reason: 'Wellness follow-up',
    lastContact: [-5, '14:10'],
    nextVisit: [0, '10:30'],
    plan: ['Confirm symptom trend and energy level', 'Review adherence to hydration goals', 'Coordinate next wellness follow-up'],
    alert: { title: 'Follow-up due today', detail: 'Review home monitoring notes before the 10:30 check-in.' },
    activity: [
      ['note', 'Visit note updated', 0, '09:14', 'Home monitoring notes uploaded; evening readings slightly higher than usual.'],
      ['message', 'Portal message', -1, '15:22', 'Patient shared this week’s blood pressure readings.'],
      ['task', 'Care task completed', -9, '11:05', 'Medication reconciliation completed.']
    ],
    teamOffset: 0
  },
  {
    name: 'Morgan Chen',
    pronouns: 'she/her',
    ageGroup: 'Adult',
    careId: 'CC-1052',
    status: 'open',
    reason: 'Care plan update',
    lastContact: [-2, '11:40'],
    nextVisit: [3, '09:00'],
    plan: ['Agree weekly exercise goals', 'Review new home exercise sheet', 'Check in by phone after two weeks'],
    alert: null,
    activity: [
      ['record', 'Care plan updated', 0, '08:40', 'Exercise goals drafted for review.'],
      ['message', 'Portal message', 0, '08:05', 'Asked about the new exercise goals.']
    ],
    teamOffset: 2
  },
  {
    name: 'Riley Singh',
    pronouns: 'he/him',
    ageGroup: 'Young adult',
    careId: 'CC-1057',
    status: 'completed',
    reason: 'Lab results',
    lastContact: [-1, '16:30'],
    nextVisit: null,
    plan: ['Share lab results with patient', 'Close the review task', 'Repeat labs in six months'],
    alert: null,
    activity: [
      ['record', 'Lab results reviewed', -1, '16:45', 'Results within range.'],
      ['visit', 'Lab visit', -4, '08:20']
    ],
    teamOffset: 1
  },
  {
    name: 'Taylor Lane',
    pronouns: 'they/them',
    ageGroup: 'Adult',
    careId: 'CC-1061',
    status: 'open',
    reason: 'New referral',
    lastContact: [-7, '11:02'],
    nextVisit: [6, '13:30'],
    plan: ['Send referral packet', 'Confirm first appointment', 'Collect current medication list'],
    alert: null,
    activity: [
      ['message', 'Portal message', -7, '11:02', 'Advised what to bring to the first appointment.'],
      ['record', 'Referral received', -8, '15:10']
    ],
    teamOffset: 3
  },
  {
    name: 'Jamie Wu',
    pronouns: 'she/her',
    ageGroup: 'Older adult',
    careId: 'CC-1063',
    status: 'completed',
    reason: 'Medication review',
    lastContact: [-8, '10:15'],
    nextVisit: [14, '10:00'],
    plan: ['Confirm current dosage with pharmacy', 'Authorize refill', 'Review side effects at next visit'],
    alert: null,
    activity: [
      ['record', 'Medication review completed', -8, '10:40'],
      ['visit', 'Clinic visit', -8, '10:15']
    ],
    teamOffset: 4
  }
]

const GENERATED_NAMES = [
  'Alex Rivera', 'Casey Morgan', 'Drew Patel', 'Emerson Brooks', 'Finley Ortiz', 'Harper Nguyen',
  'Kai Thompson', 'Logan Reyes', 'Quinn Foster', 'Reese Kim', 'Rowan Hughes', 'Sage Bennett',
  'Skyler Diaz', 'Blake Murphy', 'Cameron Price', 'Dakota Shah', 'Elliot Ward', 'Hayden Cruz',
  'Jesse Coleman', 'Kendall Ross', 'Marlowe Ito', 'Peyton Grant', 'Rory Okoye'
]

const REASON_PLANS: [reason: string, plan: string[]][] = [
  ['Post-discharge check-in', ['Confirm follow-up appointments are booked', 'Review discharge medicines', 'Check home support arrangements']],
  ['Chronic care review', ['Review symptom diary', 'Update long-term goals', 'Schedule the next quarterly review']],
  ['Blood pressure check', ['Compare home and clinic readings', 'Review salt and fluid intake', 'Adjust monitoring schedule if needed']],
  ['Nutrition consult', ['Review three-day food diary', 'Set two achievable meal goals', 'Share the healthy-plate handout']],
  ['Mobility assessment', ['Assess walking distance and balance', 'Review home safety checklist', 'Refer to physical therapy if needed']],
  ['Annual wellness visit', ['Update preventive care checklist', 'Review immunization record', 'Confirm screening appointments']],
  ['Diabetes education', ['Review glucose log', 'Practice sick-day plan', 'Set foot-care reminders']],
  ['Wellness follow-up', ['Check energy and sleep', 'Review hydration goals', 'Plan next wellness follow-up']]
]

const PRONOUNS = ['they/them', 'she/her', 'he/him']
const AGE_GROUPS = ['Adult', 'Older adult', 'Young adult', 'Adult']
const STATUS_CYCLE: PatientStatus[] = ['open', 'needs-review', 'completed', 'open', 'completed', 'open', 'needs-review']
const VISIT_TIMES = ['08:30', '13:00', '11:15', '15:45', '09:00', '14:30', '16:15']

function generatedPatientSeed(name: string, index: number): PatientSeed {
  const [reason, plan] = REASON_PLANS[index % REASON_PLANS.length]
  const status = STATUS_CYCLE[index % STATUS_CYCLE.length]
  // Two more visits today and a handful this week keep Schedule and Overview busy.
  let nextVisit: [number, string] | null
  if (index === 1 || index === 3) nextVisit = [0, VISIT_TIMES[index]]
  else if (status === 'completed') nextVisit = index % 2 === 0 ? null : [21 + index, '10:00']
  else nextVisit = [1 + (index % 6), VISIT_TIMES[index % VISIT_TIMES.length]]

  const alert: FollowUpAlert | null =
    status === 'needs-review'
      ? { title: 'Review needed', detail: `Check the latest ${reason.toLowerCase()} notes before the next contact.` }
      : null

  return {
    name,
    pronouns: PRONOUNS[index % PRONOUNS.length],
    ageGroup: AGE_GROUPS[index % AGE_GROUPS.length],
    careId: `CC-${1070 + index * 3}`,
    status,
    reason,
    lastContact: [-(10 + index), '10:00'],
    nextVisit,
    plan,
    alert,
    activity: [
      ['note', 'Visit note updated', -(9 + index), '14:20'],
      ['record', 'Care plan reviewed', -(15 + index), '09:45']
    ],
    teamOffset: index
  }
}

function buildPatient(seed: PatientSeed, now: Date): Patient {
  const id = patientIdFor(seed.name)
  const activity: Activity[] = seed.activity.map(([kind, title, days, time, detail], i) => ({
    id: `${id}-a${i + 1}`,
    kind,
    title,
    at: atDay(now, days, time),
    author: 'Jordan Lee, RN',
    ...(detail ? { detail } : {})
  }))
  return {
    id,
    name: seed.name,
    pronouns: seed.pronouns,
    ageGroup: seed.ageGroup,
    careId: seed.careId,
    status: seed.status,
    reason: seed.reason,
    lastContact: atDay(now, seed.lastContact[0], seed.lastContact[1]),
    nextVisit: seed.nextVisit ? atDay(now, seed.nextVisit[0], seed.nextVisit[1]) : null,
    careTeam: teamFrom(seed.teamOffset),
    alert: seed.alert,
    plan: [...seed.plan],
    activity
  }
}

export function createSeedPatients(now: Date): Patient[] {
  const seeds = [...DESIGN_PATIENTS, ...GENERATED_NAMES.map(generatedPatientSeed)]
  return seeds.map((seed) => buildPatient(seed, now))
}

function seedConversations(now: Date): Conversation[] {
  const message = (id: string, author: string, body: string, at: string, outgoing = false) => ({
    id,
    author,
    body,
    at,
    outgoing,
    attachments: []
  })
  return [
    {
      id: 'c-home-monitoring',
      patientId: patientIdFor('Avery Park'),
      subject: 'Home monitoring readings',
      with: 'Avery Park',
      unread: true,
      messages: [
        message('m-1', 'Avery Park', 'I uploaded this week’s blood pressure readings to the portal. The evening ones were a little higher than usual.', atDay(now, -1, '15:22'))
      ]
    },
    {
      id: 'c-care-plan-question',
      patientId: patientIdFor('Morgan Chen'),
      subject: 'Question about my care plan',
      with: 'Morgan Chen',
      unread: true,
      messages: [
        message('m-2', 'Morgan Chen', 'Can we go over the new exercise goals at the next visit? I’m not sure how many days a week I should aim for.', atDay(now, 0, '08:05'))
      ]
    },
    {
      id: 'c-lab-results',
      patientId: patientIdFor('Riley Singh'),
      subject: 'Lab results: Riley Singh',
      with: 'Dr. Sam Okafor',
      unread: true,
      messages: [
        message('m-3', 'Dr. Sam Okafor', 'Riley’s results are back and within range. Please let them know and close the review task.', atDay(now, 0, '07:48'))
      ]
    },
    {
      id: 'c-refill',
      patientId: patientIdFor('Jamie Wu'),
      subject: 'Refill authorization: Jamie Wu',
      with: 'North Coast Pharmacy',
      unread: true,
      messages: [
        message('m-4', 'North Coast Pharmacy', 'We received a refill request for Jamie Wu. Please confirm the current dosage before we process it.', atDay(now, -1, '17:10'))
      ]
    },
    {
      id: 'c-referral',
      patientId: patientIdFor('Taylor Lane'),
      subject: 'Referral paperwork',
      with: 'Taylor Lane',
      unread: false,
      messages: [
        message('m-5', 'Taylor Lane', 'Do I need to bring anything to my first appointment?', atDay(now, -7, '10:20')),
        message('m-6', 'Jordan Lee, RN', 'Please bring a photo ID and a list of your current medicines.', atDay(now, -7, '11:02'), true)
      ]
    },
    {
      id: 'c-schedule-change',
      patientId: null,
      subject: 'Schedule change for Friday',
      with: 'Front desk',
      unread: false,
      messages: [
        message('m-7', 'Front desk', 'Dr. Moreno’s Friday afternoon clinic moves to 13:00–16:00.', atDay(now, -2, '09:30'))
      ]
    }
  ]
}

function seedTasks(now: Date): CareTask[] {
  return [
    { id: 't-1', title: 'Review home monitoring notes for Avery Park', patientId: patientIdFor('Avery Park'), due: atDay(now, 0, '10:00'), done: false, priority: 'urgent' },
    { id: 't-2', title: 'Authorize refill for Jamie Wu', patientId: patientIdFor('Jamie Wu'), due: atDay(now, 0, '11:00'), done: false, priority: 'urgent' },
    { id: 't-3', title: 'Call Riley Singh with lab results', patientId: patientIdFor('Riley Singh'), due: atDay(now, 0, '12:00'), done: false, priority: 'routine' },
    { id: 't-4', title: 'Confirm care plan changes with Morgan Chen', patientId: patientIdFor('Morgan Chen'), due: atDay(now, 0, '16:00'), done: false, priority: 'routine' },
    { id: 't-5', title: 'Send referral packet to Taylor Lane', patientId: patientIdFor('Taylor Lane'), due: atDay(now, 1, '09:00'), done: false, priority: 'routine' },
    { id: 't-6', title: 'Schedule mobility assessment for Rowan Hughes', patientId: patientIdFor('Rowan Hughes'), due: atDay(now, 2, '10:00'), done: false, priority: 'routine' },
    { id: 't-7', title: 'Update the hydration goals handout', patientId: null, due: atDay(now, 3, '15:00'), done: false, priority: 'routine' },
    { id: 't-8', title: 'Medication reconciliation for Avery Park', patientId: patientIdFor('Avery Park'), due: atDay(now, -9, '11:05'), done: true, priority: 'routine' }
  ]
}

export function createSeedWorkspace(now: Date): Workspace {
  return {
    version: 1,
    clinic: { name: 'North Coast Clinic', subtitle: 'Clinical operations' },
    user: { name: 'Jordan Lee, RN', role: 'Care coordinator' },
    patients: createSeedPatients(now),
    conversations: seedConversations(now),
    drafts: [],
    tasks: seedTasks(now),
    preferences: { ...DEFAULT_PREFERENCES },
    recentPatients: [
      { patientId: patientIdFor('Avery Park'), at: minutesBefore(now, 4) },
      { patientId: patientIdFor('Morgan Chen'), at: minutesBefore(now, 52) }
    ]
  }
}
