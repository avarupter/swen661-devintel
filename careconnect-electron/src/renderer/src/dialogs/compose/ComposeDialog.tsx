import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import type { CommandId } from '../../../../shared/commands'
import { formatBytes } from '../../../../shared/format'
import type { Attachment } from '../../../../shared/model'
import { ariaKeyShortcuts } from '../../../../shared/shortcuts'
import { useAnnounce } from '../../a11y/Announcer'
import { useApi } from '../../api/ApiContext'
import { useCommandHandler } from '../../commands/CommandProvider'
import { describeFailure } from '../../commands/defaultCommands'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { KeyHint } from '../../components/KeyHint'
import { findScopedCommand } from '../../keyboard/useKeyboardShortcuts'
import { useAppDispatch, useAppState, useStatus, useWorkspace } from '../../state/AppStateProvider'
import { useClock } from '../../state/clock'
import { createId } from '../../state/ids'
import {
  BODY_MAX_LENGTH,
  COMPOSE_INPUT_IDS,
  draftChange,
  hasTypedContent,
  initialFocusId,
  MAX_ATTACHMENTS,
  sameFields,
  setupCompose,
  SUBJECT_MAX_LENGTH,
  toDraft,
  toSentMessage,
  validateCompose,
  type ComposeError,
  type ComposeField,
  type ComposeFields
} from './composeModel'
import './compose.css'

export interface ComposeDialogProps {
  patientId: string | null
  conversationId: string | null
  draftId: string | null
  onClose(): void
}

const ATTACH_BUTTON_ID = 'compose-attach'

/** Said when the dialog opened a saved draft and every bit of its text has been cleared. */
const EMPTY_DRAFT_DELETED = 'Empty draft deleted.'

function errorId(field: ComposeField): string {
  return `${COMPOSE_INPUT_IDS[field]}-error`
}

function removeButtonId(index: number): string {
  return `compose-remove-${index}`
}

function ErrorSummary({ errors, summaryRef }: { errors: ComposeError[]; summaryRef: RefObject<HTMLDivElement | null> }): React.JSX.Element {
  const titleId = useId()
  return (
    <div ref={summaryRef} className="error-summary" role="alert" tabIndex={-1} aria-labelledby={titleId}>
      <h3 id={titleId} className="error-summary__title">
        <Icon name="alert" />
        {errors.length === 1 ? 'There is a problem' : `There are ${errors.length} problems`}
      </h3>
      <ul>
        {errors.map((error) => (
          <li key={error.field}>
            <a
              href={`#${error.inputId}`}
              onClick={(event) => {
                event.preventDefault()
                document.getElementById(error.inputId)?.focus()
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FieldError({ field, error }: { field: ComposeField; error: ComposeError | undefined }): React.JSX.Element | null {
  if (!error) return null
  return (
    <p id={errorId(field)} className="field__error">
      <Icon name="alert" />
      {error.message}
    </p>
  )
}

/**
 * New message and Reply (spec card 07 for errors). Ctrl+Enter sends, Ctrl+S
 * saves a draft and Ctrl+Shift+A attaches a document; the native menu reaches
 * the same actions through command handlers.
 *
 * Typed text never lives only in this dialog. Every edit is written to the
 * workspace draft as it happens (and a draft whose text is cleared is
 * deleted), so each keystroke is an unsaved workspace change. The main
 * process's close guard waits for unsaved changes to be written before the
 * window closes, so closing the window or quitting straight after typing
 * still keeps the text (up to the guard's time limit for a stuck write).
 */
export function ComposeDialog({ patientId, conversationId, draftId, onClose }: ComposeDialogProps): React.JSX.Element {
  const workspace = useWorkspace()
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const api = useApi()
  const clock = useClock()
  const setStatus = useStatus()
  const announce = useAnnounce()

  // Resolved once, when the dialog opens: its own draft saves must never reset what is being typed.
  const [setup] = useState(() => setupCompose(workspace, { patientId, conversationId, draftId }))
  const [fields, setFields] = useState<ComposeFields>(setup.initial)
  const [errors, setErrors] = useState<ComposeError[]>([])
  const [attempt, setAttempt] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)

  /** The latest fields, for handlers: menu commands, and attachments picked after an await. */
  const fieldsRef = useRef<ComposeFields>(setup.initial)
  /** The draft record this dialog writes to: the one it opened, or one it creates on the first edit. */
  const draftIdRef = useRef<string | null>(setup.draft?.id ?? null)
  /** What that draft holds in the workspace; null while there is none (never created, or deleted once emptied). */
  const storedRef = useRef<ComposeFields | null>(setup.draft ? setup.initial : null)
  /** Set once the message is sent or the dialog has closed itself. */
  const finishedRef = useRef(false)

  const isReply = setup.conversation !== null

  /** Makes the workspace draft match the form: typed text is saved, a draft whose text was cleared is deleted. */
  const keepDraft = (next: ComposeFields): void => {
    const change = draftChange(next, storedRef.current, setup.blank)
    if (change === 'save') {
      const id = draftIdRef.current ?? createId('d')
      draftIdRef.current = id
      dispatch({ type: 'draft/saved', draft: toDraft(id, next, setup, workspace.patients, clock().toISOString()) })
      storedRef.current = next
    } else if (change === 'delete' && draftIdRef.current) {
      dispatch({ type: 'draft/deleted', draftId: draftIdRef.current })
      storedRef.current = null
    }
  }

  /**
   * Every edit goes through here. The draft is written in the same update as
   * the form, never on a timer, so no keystroke is ever held only in the dialog.
   * Side effects stay out of the state updater, which StrictMode runs twice.
   */
  const edit = (update: (current: ComposeFields) => ComposeFields): void => {
    const next = update(fieldsRef.current)
    fieldsRef.current = next
    setFields(next)
    if (!finishedRef.current) keepDraft(next)
  }

  const close = (): void => {
    if (finishedRef.current) return
    finishedRef.current = true
    const current = fieldsRef.current
    // Nothing to write here: every edit is already in the draft.
    if (hasTypedContent(current, setup.blank)) {
      if (!sameFields(current, setup.initial)) setStatus('Draft saved.')
    } else if (setup.draft && !storedRef.current) {
      setStatus(EMPTY_DRAFT_DELETED, 'info')
    }
    onClose()
  }

  const saveDraft = (): void => {
    if (finishedRef.current) return
    const current = fieldsRef.current
    if (!hasTypedContent(current, setup.blank)) {
      setStatus(setup.draft && !storedRef.current ? EMPTY_DRAFT_DELETED : 'Nothing to save yet.', 'info')
      return
    }
    keepDraft(current)
    setStatus('Draft saved.')
  }

  const send = (): void => {
    if (finishedRef.current) return
    const current = fieldsRef.current
    const problems = validateCompose(current, setup, workspace.patients)
    if (problems.length > 0) {
      setErrors(problems)
      setAttempt((count) => count + 1)
      return
    }
    const sent = toSentMessage(current, setup, workspace.patients, { makeId: createId, author: workspace.user.name, at: clock().toISOString() })
    finishedRef.current = true
    dispatch({ type: 'message/sent', sent, draftId: draftIdRef.current })
    onClose()
    setStatus(`Message sent to ${sent.with}.`)
  }

  const attach = async (): Promise<void> => {
    if (finishedRef.current) return
    if (fieldsRef.current.attachments.length >= MAX_ATTACHMENTS) {
      setStatus(`You can attach up to ${MAX_ATTACHMENTS} documents to one message.`, 'warning')
      return
    }
    let file: Attachment | null
    try {
      file = await api.pickAttachment()
    } catch (error) {
      setStatus(`Couldn’t attach the document: ${describeFailure(error)}`, 'error')
      return
    }
    if (!file || finishedRef.current) return
    const picked = file
    if (fieldsRef.current.attachments.some((attachment) => attachment.name === picked.name && attachment.size === picked.size)) {
      announce(`${picked.name} is already attached.`)
      return
    }
    edit((current) => ({ ...current, attachments: [...current.attachments, picked] }))
    announce(`${picked.name} attached.`)
  }

  const removeAttachment = (index: number): void => {
    const { attachments } = fieldsRef.current
    const removed = attachments[index]
    const remaining = attachments.length - 1
    flushSync(() => edit((current) => ({ ...current, attachments: current.attachments.filter((_, i) => i !== index) })))
    // Keep focus in the list: the next attachment, else the previous one, else Attach document.
    const next = Math.min(index, remaining - 1)
    document.getElementById(next >= 0 ? removeButtonId(next) : ATTACH_BUTTON_ID)?.focus()
    announce(`${removed.name} removed.`)
  }

  const runCommand = (command: CommandId): void => {
    if (command === 'message.send') send()
    else if (command === 'message.saveDraft') saveDraft()
    else if (command === 'message.attach') void attach()
  }

  // Native menu items (and, on macOS, their key equivalents) arrive as commands.
  useCommandHandler('message.send', () => send())
  useCommandHandler('message.saveDraft', () => saveDraft())
  useCommandHandler('message.attach', () => attach())

  const onKeyDown = (event: KeyboardEvent): void => {
    const command = findScopedCommand(event, 'compose', ui.platform)
    if (!command) return
    event.preventDefault()
    runCommand(command)
  }

  // After a failed Send, focus moves to the error summary (spec card 07).
  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus()
  }, [attempt])

  const errorFor = (field: ComposeField): ComposeError | undefined => errors.find((error) => error.field === field)
  const invalidProps = (field: ComposeField) => {
    const error = errorFor(field)
    return error ? { 'aria-invalid': true as const, 'aria-describedby': errorId(field) } : {}
  }
  const recipients = [...workspace.patients].sort((a, b) => a.name.localeCompare(b.name))

  const footer = (
    <>
      <button
        type="button"
        id={ATTACH_BUTTON_ID}
        className="button compose__attach"
        aria-keyshortcuts={ariaKeyShortcuts('message.attach', ui.platform)}
        onClick={() => void attach()}
      >
        <Icon name="paperclip" />
        Attach document…
        <KeyHint command="message.attach" />
      </button>
      <button type="button" className="button" aria-keyshortcuts={ariaKeyShortcuts('message.saveDraft', ui.platform)} onClick={saveDraft}>
        <Icon name="save" />
        Save draft
        <KeyHint command="message.saveDraft" />
      </button>
      <button
        type="button"
        className="button button--primary compose__send"
        aria-keyshortcuts={ariaKeyShortcuts('message.send', ui.platform)}
        onClick={send}
      >
        <Icon name="send" />
        Send
        <KeyHint command="message.send" />
      </button>
    </>
  )

  return (
    <Dialog
      title={isReply ? 'Reply' : 'New message'}
      icon={isReply ? 'reply' : 'message'}
      description={setup.conversation ? `Your reply is added to the conversation with ${setup.conversation.with}.` : undefined}
      onClose={close}
      onKeyDown={onKeyDown}
      initialFocusId={initialFocusId(setup)}
      footer={footer}
      className="compose"
    >
      <div className="form">
        {errors.length > 0 && <ErrorSummary errors={errors} summaryRef={summaryRef} />}

        <p className="form__instructions">
          {setup.conversation ? 'Subject and message are required.' : 'Recipient, subject and message are required.'}
        </p>

        {setup.conversation ? (
          <p className="compose__to">
            To: <strong>{setup.conversation.with}</strong>
          </p>
        ) : (
          <div className="field">
            <label htmlFor={COMPOSE_INPUT_IDS.recipient} className="field__label">
              To
            </label>
            <FieldError field="recipient" error={errorFor('recipient')} />
            <select
              id={COMPOSE_INPUT_IDS.recipient}
              className="select"
              required
              value={fields.recipientId}
              onChange={(event) => {
                const recipientId = event.target.value
                edit((current) => ({ ...current, recipientId }))
              }}
              {...invalidProps('recipient')}
            >
              <option value="">Choose a recipient</option>
              {recipients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor={COMPOSE_INPUT_IDS.subject} className="field__label">
            Subject
          </label>
          <FieldError field="subject" error={errorFor('subject')} />
          <input
            id={COMPOSE_INPUT_IDS.subject}
            className="input"
            type="text"
            autoComplete="off"
            required
            maxLength={SUBJECT_MAX_LENGTH}
            value={fields.subject}
            onChange={(event) => {
              const subject = event.target.value
              edit((current) => ({ ...current, subject }))
            }}
            {...invalidProps('subject')}
          />
        </div>

        <div className="field">
          <label htmlFor={COMPOSE_INPUT_IDS.body} className="field__label">
            Message
          </label>
          <FieldError field="body" error={errorFor('body')} />
          <textarea
            id={COMPOSE_INPUT_IDS.body}
            className="textarea compose__body"
            rows={8}
            required
            maxLength={BODY_MAX_LENGTH}
            value={fields.body}
            onChange={(event) => {
              const body = event.target.value
              edit((current) => ({ ...current, body }))
            }}
            {...invalidProps('body')}
          />
        </div>

        {fields.attachments.length > 0 && (
          <div className="field">
            <span id="compose-attachments-label" className="field__label">
              Attachments
            </span>
            <ul className="compose__attachments" aria-labelledby="compose-attachments-label">
              {fields.attachments.map((attachment, index) => (
                <li key={`${attachment.name}-${attachment.size}`} className="compose__attachment">
                  <Icon name="paperclip" />
                  <span className="compose__attachment-name">{attachment.name}</span>
                  <span className="compose__attachment-size">{formatBytes(attachment.size)}</span>
                  <button
                    type="button"
                    id={removeButtonId(index)}
                    className="button button--icon button--ghost compose__remove"
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() => removeAttachment(index)}
                  >
                    <Icon name="x" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  )
}
