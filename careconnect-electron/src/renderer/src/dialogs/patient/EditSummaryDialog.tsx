import './patientDialogs.css'
import { useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import type { FollowUpAlert } from '../../../../shared/model'
import { LIMITS } from '../../../../shared/validate'
import { useAnnounce } from '../../a11y/Announcer'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { useAppDispatch, useStatus, useWorkspace } from '../../state/AppStateProvider'
import { useClock } from '../../state/clock'
import { createId } from '../../state/ids'
import { patientById } from '../../state/selectors'
import { ErrorSummary, errorFor, fieldA11y, FieldErrorMessage, type FieldError } from './formErrors'
import { MissingPatientDialog } from './MissingPatientDialog'

const FORM_ID = 'edit-summary-form'
const ADD_BUTTON_ID = 'edit-summary-add-plan-item'
const FIELDS = { showAlert: 'edit-summary-show-alert', alertTitle: 'edit-summary-alert-title', alertDetail: 'edit-summary-alert-detail' } as const

interface PlanRow {
  /** Stable React key and input id suffix; the text can change freely. */
  key: string
  text: string
}

function planInputId(key: string): string {
  return `edit-summary-plan-${key}`
}

function sameAlert(a: FollowUpAlert | null, b: FollowUpAlert | null): boolean {
  return a === b || (a !== null && b !== null && a.title === b.title && a.detail === b.detail)
}

function samePlan(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

/** Edit care summary (E): the plan items and the follow-up alert. */
export function EditSummaryDialog({ patientId, onClose }: { patientId: string; onClose(): void }): React.JSX.Element {
  const workspace = useWorkspace()
  const dispatch = useAppDispatch()
  const setStatus = useStatus()
  const announce = useAnnounce()
  const clock = useClock()
  const patient = patientById(workspace, patientId)
  // Initial rows are keyed by position; rows added later get generated keys in the click handler.
  const [rows, setRows] = useState<PlanRow[]>(() => (patient?.plan ?? []).map((text, index) => ({ key: `item-${index}`, text })))
  const [showAlert, setShowAlert] = useState(Boolean(patient?.alert))
  const [alertTitle, setAlertTitle] = useState(patient?.alert?.title ?? '')
  const [alertDetail, setAlertDetail] = useState(patient?.alert?.detail ?? '')
  const [errors, setErrors] = useState<FieldError[]>([])
  const summaryRef = useRef<HTMLDivElement>(null)

  if (!patient) return <MissingPatientDialog title="Edit care summary" onClose={onClose} />

  const addRow = (): void => {
    const key = createId('plan')
    flushSync(() => setRows((current) => [...current, { key, text: '' }]))
    document.getElementById(planInputId(key))?.focus()
  }

  const removeRow = (index: number): void => {
    const remaining = rows.filter((_, position) => position !== index)
    flushSync(() => setRows(remaining))
    // The removed button is gone: focus the row that took its place, the one above, or "Add plan item".
    const next = remaining[index] ?? remaining[index - 1]
    document.getElementById(next ? planInputId(next.key) : ADD_BUTTON_ID)?.focus()
    announce(`Plan item ${index + 1} removed.`)
  }

  const updateRow = (key: string, text: string): void => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, text } : row)))
  }

  const toggleAlert = (checked: boolean): void => {
    setShowAlert(checked)
    if (!checked) setErrors([])
  }

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (showAlert && !alertTitle.trim()) {
      flushSync(() => setErrors([{ field: FIELDS.alertTitle, message: 'Enter a title for the follow-up alert.' }]))
      summaryRef.current?.focus()
      return
    }
    // Empty rows are dropped; the main process rejects blank plan items.
    const plan = rows.map((row) => row.text.trim()).filter(Boolean)
    const alert = showAlert ? { title: alertTitle.trim(), detail: alertDetail.trim() } : null
    if (samePlan(plan, patient.plan) && sameAlert(alert, patient.alert)) {
      onClose()
      setStatus('No changes to the care summary.', 'info')
      return
    }
    dispatch({
      type: 'patient/updated',
      patientId: patient.id,
      changes: { plan, alert },
      activity: { id: createId('a'), kind: 'record', title: 'Care summary updated', at: clock().toISOString(), author: workspace.user.name }
    })
    onClose()
    setStatus(`Care summary updated for ${patient.name}.`, 'success')
  }

  const titleError = errorFor(errors, FIELDS.alertTitle)

  return (
    <Dialog
      title="Edit care summary"
      icon="edit"
      description={`For ${patient.name} · Care ID ${patient.careId}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="button button--primary">
            Save
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="form" noValidate onSubmit={submit}>
        {errors.length > 0 && <ErrorSummary ref={summaryRef} errors={errors} />}

        <fieldset className="field patient-plan-editor">
          <legend className="field__label">Current plan</legend>
          {rows.length > 0 ? (
            <ol className="patient-plan-editor__list">
              {rows.map((row, index) => (
                <li key={row.key} className="patient-plan-editor__row">
                  <span className="patient-plan-editor__number" aria-hidden="true">
                    {index + 1}.
                  </span>
                  <label htmlFor={planInputId(row.key)} className="visually-hidden">
                    Plan item {index + 1}
                  </label>
                  <input
                    id={planInputId(row.key)}
                    className="input"
                    type="text"
                    maxLength={LIMITS.longText}
                    value={row.text}
                    onChange={(event) => updateRow(row.key, event.target.value)}
                  />
                  <button type="button" className="button button--ghost button--icon" aria-label={`Remove plan item ${index + 1}`} onClick={() => removeRow(index)}>
                    <Icon name="x" />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No plan items. Use “Add plan item” to add one.</p>
          )}
          <button id={ADD_BUTTON_ID} type="button" className="button button--small patient-plan-editor__add" onClick={addRow}>
            <Icon name="plus" />
            Add plan item
          </button>
        </fieldset>

        <fieldset className="field patient-alert-editor">
          <legend className="field__label">Follow-up alert</legend>
          <label className="choice">
            <input id={FIELDS.showAlert} type="checkbox" checked={showAlert} onChange={(event) => toggleAlert(event.target.checked)} />
            Show follow-up alert
          </label>
          {showAlert && (
            <div className="patient-alert-editor__fields">
              <div className="field">
                <label htmlFor={FIELDS.alertTitle} className="field__label">
                  Title
                </label>
                <FieldErrorMessage field={FIELDS.alertTitle} message={titleError} />
                <input
                  id={FIELDS.alertTitle}
                  className="input"
                  type="text"
                  required
                  maxLength={LIMITS.shortText}
                  value={alertTitle}
                  onChange={(event) => setAlertTitle(event.target.value)}
                  {...fieldA11y(FIELDS.alertTitle, titleError)}
                />
              </div>
              <div className="field">
                <label htmlFor={FIELDS.alertDetail} className="field__label">
                  Details <span className="field__optional">(optional)</span>
                </label>
                <textarea
                  id={FIELDS.alertDetail}
                  className="textarea patient-alert-editor__details"
                  rows={3}
                  maxLength={LIMITS.longText}
                  value={alertDetail}
                  onChange={(event) => setAlertDetail(event.target.value)}
                />
              </div>
            </div>
          )}
        </fieldset>
      </form>
    </Dialog>
  )
}
