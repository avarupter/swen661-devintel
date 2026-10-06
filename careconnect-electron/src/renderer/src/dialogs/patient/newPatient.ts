/**
 * The New patient form's rules, kept free of React so they are tested once:
 * defaults, validation messages (spec card 07), Care ID numbering and the
 * record the form creates.
 */
import { calendarDayOffset } from '../../../../shared/format'
import type { Patient, PatientStatus } from '../../../../shared/model'
import type { FieldError } from './formErrors'

export const NEW_PATIENT_FIELDS = {
  name: 'new-patient-name',
  pronouns: 'new-patient-pronouns',
  ageGroup: 'new-patient-age-group',
  reason: 'new-patient-reason',
  visitDate: 'new-patient-date',
  scheduleLater: 'new-patient-schedule-later',
  visitTime: 'new-patient-time'
} as const

/** Value '' is stored for "Not recorded"; exports print it as "Not recorded". */
export const PRONOUN_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'they/them', label: 'they/them' },
  { value: 'she/her', label: 'she/her' },
  { value: 'he/him', label: 'he/him' },
  { value: '', label: 'Not recorded' }
]

export const AGE_GROUPS: readonly string[] = ['Adult', 'Older adult', 'Young adult']

export const NEW_PATIENT_STATUSES: readonly { value: PatientStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'needs-review', label: 'Needs review' }
]

export interface NewPatientForm {
  name: string
  pronouns: string
  ageGroup: string
  reason: string
  /** A date input's value: "2026-10-06", or '' when empty. */
  visitDate: string
  scheduleLater: boolean
  /** A time input's value: "09:00". */
  visitTime: string
  status: PatientStatus
}

export const EMPTY_NEW_PATIENT: NewPatientForm = {
  name: '',
  pronouns: '',
  ageGroup: 'Adult',
  reason: '',
  visitDate: '',
  scheduleLater: false,
  visitTime: '09:00',
  status: 'open'
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** "2026-10-05": the value format of `<input type="date">`, in local time. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * The local wall-clock moment for a date input value and a time input value,
 * or null if either is empty or not a real date. (Never `Date.parse`, which
 * reads "2026-10-06" as UTC midnight.)
 */
export function visitDateTime(date: string, time: string): Date | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const clock = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(time)
  if (!day || !clock) return null
  const [year, month, dayOfMonth] = [Number(day[1]), Number(day[2]) - 1, Number(day[3])]
  const result = new Date(year, month, dayOfMonth, Number(clock[1]), Number(clock[2]), 0, 0)
  const rolledOver = result.getFullYear() !== year || result.getMonth() !== month || result.getDate() !== dayOfMonth
  return rolledOver || Number.isNaN(result.getTime()) ? null : result
}

/** Errors in form order, so the summary reads top to bottom. An empty list means valid. */
export function validateNewPatientForm(form: NewPatientForm, now: Date): FieldError[] {
  const errors: FieldError[] = []
  if (!form.name.trim()) errors.push({ field: NEW_PATIENT_FIELDS.name, message: 'Enter the patient’s full name.' })
  if (!form.reason.trim()) errors.push({ field: NEW_PATIENT_FIELDS.reason, message: 'Enter a reason for the visit.' })
  if (!form.scheduleLater) {
    const day = visitDateTime(form.visitDate, '00:00')
    if (!day) {
      errors.push({ field: NEW_PATIENT_FIELDS.visitDate, message: 'Visit date is required. Enter a date, or choose “Schedule later.”' })
    } else if (calendarDayOffset(day, now) < 0) {
      errors.push({ field: NEW_PATIENT_FIELDS.visitDate, message: 'Enter a visit date that is today or later.' })
    } else if (!visitDateTime(form.visitDate, form.visitTime)) {
      errors.push({ field: NEW_PATIENT_FIELDS.visitTime, message: 'Enter a visit time, or choose “Schedule later.”' })
    }
  }
  return errors
}

/** The next Care ID after the highest existing "CC-<number>". */
export function nextCareId(patients: readonly Patient[]): string {
  let highest = 1000
  for (const patient of patients) {
    const match = /^CC-(\d+)$/.exec(patient.careId)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return `CC-${highest + 1}`
}

export interface NewPatientContext {
  id: string
  activityId: string
  careId: string
  now: Date
  /** The signed-in user, who starts the care team. */
  author: string
}

/** The record a valid form creates. Text is trimmed, because the main process rejects blank fields. */
export function buildNewPatient(form: NewPatientForm, context: NewPatientContext): Patient {
  const at = context.now.toISOString()
  const visit = form.scheduleLater ? null : visitDateTime(form.visitDate, form.visitTime)
  return {
    id: context.id,
    name: form.name.trim(),
    pronouns: form.pronouns,
    ageGroup: form.ageGroup,
    careId: context.careId,
    status: form.status,
    reason: form.reason.trim(),
    lastContact: at,
    nextVisit: visit ? visit.toISOString() : null,
    careTeam: [context.author],
    alert: null,
    plan: [],
    activity: [{ id: context.activityId, kind: 'record', title: 'Patient record created', at, author: context.author }]
  }
}
