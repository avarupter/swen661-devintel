import { createSeedWorkspace } from '../../../../../shared/seed'
import { validatePatient } from '../../../../../shared/validate'
import { buildNewPatient, EMPTY_NEW_PATIENT, nextCareId, toDateInputValue, validateNewPatientForm, visitDateTime, type NewPatientForm } from '../newPatient'

const NOW = new Date(2026, 9, 5, 9, 42)

function form(changes: Partial<NewPatientForm> = {}): NewPatientForm {
  return { ...EMPTY_NEW_PATIENT, ...changes }
}

describe('new patient form helpers', () => {
  it('starts with the documented defaults', () => {
    expect(EMPTY_NEW_PATIENT).toEqual({
      name: '',
      pronouns: '',
      ageGroup: 'Adult',
      reason: '',
      visitDate: '',
      scheduleLater: false,
      visitTime: '09:00',
      status: 'open'
    })
  })

  it('reports every missing field, in form order, with the spec wording', () => {
    expect(validateNewPatientForm(form(), NOW)).toEqual([
      { field: 'new-patient-name', message: 'Enter the patient’s full name.' },
      { field: 'new-patient-reason', message: 'Enter a reason for the visit.' },
      { field: 'new-patient-date', message: 'Visit date is required. Enter a date, or choose “Schedule later.”' }
    ])
  })

  it('treats whitespace as empty', () => {
    const errors = validateNewPatientForm(form({ name: '   ', reason: '\t', scheduleLater: true }), NOW)
    expect(errors.map((error) => error.field)).toEqual(['new-patient-name', 'new-patient-reason'])
  })

  it('needs no date or time when the visit is scheduled later', () => {
    expect(validateNewPatientForm(form({ name: 'Sam Rowe', reason: 'Check-in', scheduleLater: true, visitTime: '' }), NOW)).toEqual([])
  })

  it('rejects a visit date before today but accepts today', () => {
    const base = { name: 'Sam Rowe', reason: 'Check-in' }
    expect(validateNewPatientForm(form({ ...base, visitDate: '2026-10-04' }), NOW)).toEqual([
      { field: 'new-patient-date', message: 'Enter a visit date that is today or later.' }
    ])
    expect(validateNewPatientForm(form({ ...base, visitDate: '2026-10-05', visitTime: '08:00' }), NOW)).toEqual([])
  })

  it('asks for a time when a date is given without one', () => {
    expect(validateNewPatientForm(form({ name: 'Sam Rowe', reason: 'Check-in', visitDate: '2026-10-06', visitTime: '' }), NOW)).toEqual([
      { field: 'new-patient-time', message: 'Enter a visit time, or choose “Schedule later.”' }
    ])
  })

  it('parses date and time inputs as local wall-clock time and rejects impossible dates', () => {
    expect(visitDateTime('2026-10-06', '14:30')?.getTime()).toBe(new Date(2026, 9, 6, 14, 30).getTime())
    expect(visitDateTime('2026-10-06', '14:30:00')?.getTime()).toBe(new Date(2026, 9, 6, 14, 30).getTime())
    expect(visitDateTime('2026-02-31', '09:00')).toBeNull()
    expect(visitDateTime('2026-10-06', '')).toBeNull()
    expect(visitDateTime('', '09:00')).toBeNull()
    expect(visitDateTime('06/10/2026', '09:00')).toBeNull()
  })

  it('formats a date for a date input', () => {
    expect(toDateInputValue(new Date(2026, 0, 7))).toBe('2026-01-07')
  })

  it('gives the next Care ID after the highest existing one', () => {
    const { patients } = createSeedWorkspace(NOW)
    expect(nextCareId(patients)).toBe('CC-1137')
    expect(nextCareId([])).toBe('CC-1001')
    expect(nextCareId([{ ...patients[0], careId: 'EXT-99' }, { ...patients[1], careId: 'CC-1200' }])).toBe('CC-1201')
  })

  it('builds a valid synthetic patient record', () => {
    const patient = buildNewPatient(
      form({ name: '  Sam Rowe ', reason: ' Check-in ', visitDate: '2026-10-07', visitTime: '13:15', status: 'needs-review', pronouns: 'she/her' }),
      { id: 'p-1', activityId: 'a-1', careId: 'CC-1137', now: NOW, author: 'Jordan Lee, RN' }
    )
    expect(patient).toEqual({
      id: 'p-1',
      name: 'Sam Rowe',
      pronouns: 'she/her',
      ageGroup: 'Adult',
      careId: 'CC-1137',
      status: 'needs-review',
      reason: 'Check-in',
      lastContact: NOW.toISOString(),
      nextVisit: new Date(2026, 9, 7, 13, 15).toISOString(),
      careTeam: ['Jordan Lee, RN'],
      alert: null,
      plan: [],
      activity: [{ id: 'a-1', kind: 'record', title: 'Patient record created', at: NOW.toISOString(), author: 'Jordan Lee, RN' }]
    })
    expect(() => validatePatient(patient)).not.toThrow()
  })

  it('leaves the next visit empty when scheduling later, even with a date filled in', () => {
    const patient = buildNewPatient(form({ name: 'Sam Rowe', reason: 'Check-in', visitDate: '2026-10-07', scheduleLater: true }), {
      id: 'p-1',
      activityId: 'a-1',
      careId: 'CC-1137',
      now: NOW,
      author: 'Jordan Lee, RN'
    })
    expect(patient.nextVisit).toBeNull()
    expect(patient.pronouns).toBe('')
    expect(() => validatePatient(patient)).not.toThrow()
  })
})
