import './patientDialogs.css'
import { useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { chordKeys, matchesChord, type KeyChord } from '../../../../shared/shortcuts'
import { LIMITS } from '../../../../shared/validate'
import { Dialog } from '../../components/Dialog'
import { KeyHint } from '../../components/KeyHint'
import { useAppDispatch, useAppState, useStatus, useWorkspace } from '../../state/AppStateProvider'
import { useClock } from '../../state/clock'
import { createId } from '../../state/ids'
import { patientById } from '../../state/selectors'
import { ErrorSummary, errorFor, fieldA11y, FieldErrorMessage, type FieldError } from './formErrors'
import { MissingPatientDialog } from './MissingPatientDialog'

export const NOTE_TYPES = ['Visit note', 'Phone call', 'Care coordination'] as const

const FORM_ID = 'add-note-form'
const FIELDS = { type: 'add-note-type', text: 'add-note-text', clearAlert: 'add-note-clear-alert' } as const
const ALERT_HINT_ID = 'add-note-alert-hint'
/** Ctrl+Enter (⌘Return) adds the note from the text area, as Send does in compose. */
const SUBMIT_CHORD: KeyChord = { key: 'Enter', mod: true }

/** Add clinical note (N) for one patient. */
export function AddNoteDialog({ patientId, onClose }: { patientId: string; onClose(): void }): React.JSX.Element {
  const workspace = useWorkspace()
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const setStatus = useStatus()
  const clock = useClock()
  const [noteType, setNoteType] = useState<string>(NOTE_TYPES[0])
  const [text, setText] = useState('')
  const [clearAlert, setClearAlert] = useState(false)
  const [errors, setErrors] = useState<FieldError[]>([])
  const summaryRef = useRef<HTMLDivElement>(null)
  const patient = patientById(workspace, patientId)

  if (!patient) return <MissingPatientDialog title="Add clinical note" onClose={onClose} />

  const save = (): void => {
    if (!text.trim()) {
      flushSync(() => setErrors([{ field: FIELDS.text, message: 'Enter the note text.' }]))
      summaryRef.current?.focus()
      return
    }
    dispatch({
      type: 'patient/noteAdded',
      patientId: patient.id,
      activity: { id: createId('a'), kind: 'note', title: `${noteType} added`, detail: text.trim(), at: clock().toISOString(), author: workspace.user.name }
    })
    if (clearAlert && patient.alert) dispatch({ type: 'patient/updated', patientId: patient.id, changes: { alert: null } })
    onClose()
    setStatus(`Note added for ${patient.name}.`, 'success')
  }

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    save()
  }

  const textError = errorFor(errors, FIELDS.text)
  const submitKeys = chordKeys(SUBMIT_CHORD, ui.platform)

  return (
    <Dialog
      title="Add clinical note"
      icon="file"
      description={`For ${patient.name} · Care ID ${patient.careId}`}
      onClose={onClose}
      onKeyDown={(event) => {
        if (matchesChord(event, SUBMIT_CHORD, ui.platform)) {
          event.preventDefault()
          save()
        }
      }}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="button button--primary" aria-keyshortcuts={ui.platform === 'mac' ? 'Meta+Enter' : 'Control+Enter'}>
            Add note
            <KeyHint keys={submitKeys} />
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="form" noValidate onSubmit={submit}>
        {errors.length > 0 && <ErrorSummary ref={summaryRef} errors={errors} />}

        <div className="field">
          <label htmlFor={FIELDS.type} className="field__label">
            Note type
          </label>
          <select id={FIELDS.type} className="select" value={noteType} onChange={(event) => setNoteType(event.target.value)}>
            {NOTE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={FIELDS.text} className="field__label">
            Note
          </label>
          <FieldErrorMessage field={FIELDS.text} message={textError} />
          <textarea
            id={FIELDS.text}
            className="textarea"
            rows={6}
            required
            maxLength={LIMITS.longText}
            value={text}
            onChange={(event) => setText(event.target.value)}
            {...fieldA11y(FIELDS.text, textError)}
          />
        </div>

        {patient.alert && (
          <div className="field">
            <label className="choice">
              <input
                id={FIELDS.clearAlert}
                type="checkbox"
                checked={clearAlert}
                aria-describedby={ALERT_HINT_ID}
                onChange={(event) => setClearAlert(event.target.checked)}
              />
              Clear the follow-up alert
            </label>
            <p id={ALERT_HINT_ID} className="field__hint">
              Current alert: {patient.alert.title}
            </p>
          </div>
        )}
      </form>
    </Dialog>
  )
}
