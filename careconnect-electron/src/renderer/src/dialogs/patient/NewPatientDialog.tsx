import './patientDialogs.css'
import { useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { LIMITS } from '../../../../shared/validate'
import { useCommands } from '../../commands/CommandProvider'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { useAppDispatch, useAppState, useStatus, useWorkspace } from '../../state/AppStateProvider'
import { useClock, useNow } from '../../state/clock'
import { createId } from '../../state/ids'
import { matchesPatientQuery } from '../../state/selectors'
import { ErrorSummary, errorFor, fieldA11y, FieldErrorMessage, type FieldError } from './formErrors'
import {
  AGE_GROUPS,
  buildNewPatient,
  EMPTY_NEW_PATIENT,
  NEW_PATIENT_FIELDS as FIELDS,
  NEW_PATIENT_STATUSES,
  nextCareId,
  PRONOUN_OPTIONS,
  toDateInputValue,
  validateNewPatientForm,
  type NewPatientForm
} from './newPatient'

const FORM_ID = 'new-patient-form'

/**
 * Create patient record (Ctrl+N). On submit with errors, focus moves to an
 * error summary that links to each invalid field; entered values are kept
 * (spec card 07). On success the new record is selected and focused.
 */
export function NewPatientDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const workspace = useWorkspace()
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const { run } = useCommands()
  const setStatus = useStatus()
  const clock = useClock()
  const now = useNow()
  const [form, setForm] = useState<NewPatientForm>(EMPTY_NEW_PATIENT)
  const [errors, setErrors] = useState<FieldError[]>([])
  const summaryRef = useRef<HTMLDivElement>(null)

  const update = <K extends keyof NewPatientForm>(key: K, value: NewPatientForm[K]): void => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const setScheduleLater = (checked: boolean): void => {
    update('scheduleLater', checked)
    // The visit date and time are no longer needed, so their errors are resolved.
    if (checked) setErrors((current) => current.filter((error) => error.field !== FIELDS.visitDate && error.field !== FIELDS.visitTime))
  }

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const at = clock()
    const found = validateNewPatientForm(form, at)
    if (found.length > 0) {
      flushSync(() => setErrors(found))
      summaryRef.current?.focus()
      return
    }
    const patient = buildNewPatient(form, {
      id: createId('p'),
      activityId: createId('a'),
      careId: nextCareId(workspace.patients),
      now: at,
      author: workspace.user.name
    })
    // Commit the new record and close the dialog now: the command dispatcher reads
    // committed state, and opening the record must happen inside this event so its
    // render lands before the dispatcher moves focus to the new option.
    flushSync(() => {
      dispatch({ type: 'patient/added', patient })
      // The new record must be visible in the list so it can take focus.
      if (!matchesPatientQuery(patient, ui.patientQuery)) dispatch({ type: 'ui/setPatientQuery', query: '' })
      if (ui.statusFilter !== 'all' && ui.statusFilter !== patient.status) dispatch({ type: 'ui/setStatusFilter', filter: 'all' })
      onClose()
    })
    setStatus(`${patient.name} added. Care ID ${patient.careId}`, 'success')
    run({ id: 'patient.open', patientId: patient.id })
  }

  const nameError = errorFor(errors, FIELDS.name)
  const reasonError = errorFor(errors, FIELDS.reason)
  const dateError = errorFor(errors, FIELDS.visitDate)
  const timeError = errorFor(errors, FIELDS.visitTime)

  return (
    <Dialog
      title="New patient"
      icon="userPlus"
      description="Creates a synthetic demo record. Never enter real patient information."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="button button--primary">
            <Icon name="userPlus" />
            Add patient
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="form" noValidate onSubmit={submit}>
        {errors.length > 0 && <ErrorSummary ref={summaryRef} errors={errors} />}

        <div className="field">
          <label htmlFor={FIELDS.name} className="field__label">
            Full name
          </label>
          <FieldErrorMessage field={FIELDS.name} message={nameError} />
          <input
            id={FIELDS.name}
            className="input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            required
            maxLength={LIMITS.shortText}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            {...fieldA11y(FIELDS.name, nameError)}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={FIELDS.pronouns} className="field__label">
              Pronouns
            </label>
            <select id={FIELDS.pronouns} className="select" value={form.pronouns} onChange={(event) => update('pronouns', event.target.value)}>
              {PRONOUN_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={FIELDS.ageGroup} className="field__label">
              Age group
            </label>
            <select id={FIELDS.ageGroup} className="select" value={form.ageGroup} onChange={(event) => update('ageGroup', event.target.value)}>
              {AGE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor={FIELDS.reason} className="field__label">
            Reason for visit
          </label>
          <FieldErrorMessage field={FIELDS.reason} message={reasonError} />
          <input
            id={FIELDS.reason}
            className="input"
            type="text"
            autoComplete="off"
            required
            maxLength={LIMITS.shortText}
            value={form.reason}
            onChange={(event) => update('reason', event.target.value)}
            {...fieldA11y(FIELDS.reason, reasonError)}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={FIELDS.visitDate} className="field__label">
              Visit date
            </label>
            <FieldErrorMessage field={FIELDS.visitDate} message={dateError} />
            <input
              id={FIELDS.visitDate}
              className="input"
              type="date"
              min={toDateInputValue(now)}
              required={!form.scheduleLater}
              disabled={form.scheduleLater}
              value={form.visitDate}
              onChange={(event) => update('visitDate', event.target.value)}
              {...fieldA11y(FIELDS.visitDate, dateError)}
            />
            <label className="choice">
              <input
                id={FIELDS.scheduleLater}
                type="checkbox"
                checked={form.scheduleLater}
                onChange={(event) => setScheduleLater(event.target.checked)}
              />
              Schedule later
            </label>
          </div>
          <div className="field">
            <label htmlFor={FIELDS.visitTime} className="field__label">
              Visit time
            </label>
            <FieldErrorMessage field={FIELDS.visitTime} message={timeError} />
            <input
              id={FIELDS.visitTime}
              className="input"
              type="time"
              required={!form.scheduleLater}
              disabled={form.scheduleLater}
              value={form.visitTime}
              onChange={(event) => update('visitTime', event.target.value)}
              {...fieldA11y(FIELDS.visitTime, timeError)}
            />
          </div>
        </div>

        <fieldset className="field">
          <legend className="field__label">Status</legend>
          <div className="patient-form__choices">
            {NEW_PATIENT_STATUSES.map((option) => (
              <label key={option.value} className="choice">
                <input
                  type="radio"
                  name="new-patient-status"
                  value={option.value}
                  checked={form.status === option.value}
                  onChange={() => update('status', option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  )
}
