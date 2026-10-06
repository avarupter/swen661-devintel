import { createSeedWorkspace } from '../../../../../shared/seed'
import { needsAttention, statCardName, statCards } from '../overviewModel'

const NOW = new Date(2026, 9, 5, 9, 42)

describe('statCards', () => {
  it('counts patients by status, unread conversations and tasks due today', () => {
    expect(statCards(createSeedWorkspace(NOW), NOW).map((card) => [card.id, card.label, card.count, card.unit])).toEqual([
      ['needs-review', 'Needs review', 8, 'patients'],
      ['open', 'Open', 12, 'patients'],
      ['completed', 'Completed', 8, 'patients'],
      ['unread', 'Unread messages', 4, null],
      ['tasks', 'Tasks due today', 4, null]
    ])
  })

  it('names each card with its count, in the singular when there is one', () => {
    const workspace = createSeedWorkspace(NOW)
    workspace.patients = workspace.patients.slice(0, 1)
    const [needsReview, open] = statCards(workspace, NOW)
    expect(statCardName(needsReview)).toBe('Needs review: 1 patient')
    expect(needsReview.unit).toBe('patient')
    expect(statCardName(open)).toBe('Open: 0 patients')
    expect(statCardName(statCards(workspace, NOW)[3])).toBe('Unread messages: 4')
  })
})

describe('needsAttention', () => {
  it('lists patients with an alert, soonest visit first, then those without a visit by name', () => {
    const patients = createSeedWorkspace(NOW).patients.map((patient) =>
      patient.name === 'Kai Thompson' || patient.name === 'Blake Murphy' ? { ...patient, nextVisit: null } : patient
    )
    expect(needsAttention(patients).map((patient) => patient.name)).toEqual([
      'Avery Park',
      'Casey Morgan',
      'Quinn Foster',
      'Marlowe Ito',
      'Dakota Shah',
      'Rory Okoye',
      'Blake Murphy',
      'Kai Thompson'
    ])
  })
})
