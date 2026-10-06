/**
 * The compose dialog's rules, kept free of React so each one is unit tested:
 * what the form starts with, what counts as typed text (which must never be
 * lost), validation, and the draft and message records it produces.
 */
import type { Attachment, Conversation, Draft, Patient, Workspace } from '../../../../shared/model'
import { LIMITS } from '../../../../shared/validate'
import type { SentMessage } from '../../state/appState'
import { conversationById, patientById } from '../../state/selectors'

/** The same limits the main process enforces on save, so a draft or message can never be rejected there. */
export const SUBJECT_MAX_LENGTH = LIMITS.shortText
export const BODY_MAX_LENGTH = LIMITS.longText
export const MAX_ATTACHMENTS = LIMITS.attachments

export interface ComposeFields {
  /** The patient a new message goes to ('' until one is chosen). Fixed when replying. */
  recipientId: string
  subject: string
  body: string
  attachments: Attachment[]
}

export interface ComposeRequest {
  patientId: string | null
  conversationId: string | null
  draftId: string | null
}

export interface ComposeSetup {
  /** The conversation being replied to; null for a new message. */
  conversation: Conversation | null
  /** The saved draft this dialog edits, if any. */
  draft: Draft | null
  /** What the form starts with. */
  initial: ComposeFields
  /** An untouched form in the same context. Anything beyond it is text the user typed. */
  blank: ComposeFields
}

export type ComposeField = 'recipient' | 'subject' | 'body'

export interface ComposeError {
  field: ComposeField
  inputId: string
  message: string
}

export const COMPOSE_INPUT_IDS: Record<ComposeField, string> = {
  recipient: 'compose-to',
  subject: 'compose-subject',
  body: 'compose-body'
}

/** "Re: Home monitoring readings", without stacking prefixes or outgrowing the subject limit. */
export function replySubject(subject: string): string {
  const reply = /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`
  return reply.slice(0, SUBJECT_MAX_LENGTH)
}

function knownPatientId(workspace: Workspace, patientId: string | null | undefined): string {
  return patientById(workspace, patientId)?.id ?? ''
}

/**
 * Works out what the dialog is editing. A reply resumes the conversation's
 * saved reply draft when there is one, so pressing R twice never splits a
 * reply across two drafts.
 */
export function setupCompose(workspace: Workspace, request: ComposeRequest): ComposeSetup {
  const draft = request.draftId
    ? (workspace.drafts.find((entry) => entry.id === request.draftId) ?? null)
    : request.conversationId
      ? (workspace.drafts.find((entry) => entry.conversationId === request.conversationId) ?? null)
      : null
  const conversation = conversationById(workspace, draft ? draft.conversationId : request.conversationId)

  const blank: ComposeFields = conversation
    ? { recipientId: conversation.patientId ?? '', subject: replySubject(conversation.subject), body: '', attachments: [] }
    : { recipientId: knownPatientId(workspace, request.patientId), subject: '', body: '', attachments: [] }

  const initial: ComposeFields = draft
    ? {
        recipientId: conversation ? blank.recipientId : knownPatientId(workspace, draft.patientId),
        subject: draft.subject,
        body: draft.body,
        attachments: draft.attachments.map((attachment) => ({ ...attachment }))
      }
    : blank

  return { conversation, draft, initial, blank }
}

/** Whether the form holds anything the user typed or attached (a prefilled subject or recipient doesn't count). */
export function hasTypedContent(fields: ComposeFields, blank: ComposeFields): boolean {
  const subject = fields.subject.trim()
  return fields.body.trim() !== '' || fields.attachments.length > 0 || (subject !== '' && subject !== blank.subject.trim())
}

export function sameFields(a: ComposeFields, b: ComposeFields): boolean {
  return (
    a.recipientId === b.recipientId &&
    a.subject === b.subject &&
    a.body === b.body &&
    a.attachments.length === b.attachments.length &&
    a.attachments.every((attachment, index) => attachment.name === b.attachments[index].name && attachment.size === b.attachments[index].size)
  )
}

export type DraftChange = 'save' | 'delete' | null

/**
 * What the stored draft needs after an edit so that it matches the form:
 * typed text it doesn't hold yet is saved (the first edit creates the draft),
 * and a draft whose text has all been cleared is deleted. `stored` is what the
 * draft holds, or null when there is no draft.
 */
export function draftChange(fields: ComposeFields, stored: ComposeFields | null, blank: ComposeFields): DraftChange {
  if (hasTypedContent(fields, blank)) return stored && sameFields(fields, stored) ? null : 'save'
  return stored ? 'delete' : null
}

function recipient(fields: ComposeFields, patients: readonly Patient[]): Patient | null {
  return patients.find((patient) => patient.id === fields.recipientId) ?? null
}

/** Who the message goes to: the conversation's correspondent, or the chosen patient. */
export function recipientName(fields: ComposeFields, setup: ComposeSetup, patients: readonly Patient[]): string {
  if (setup.conversation) return setup.conversation.with
  return recipient(fields, patients)?.name ?? ''
}

/** Problems in field order, each with the specific fix (spec card 07). */
export function validateCompose(fields: ComposeFields, setup: ComposeSetup, patients: readonly Patient[]): ComposeError[] {
  const errors: ComposeError[] = []
  const add = (field: ComposeField, message: string): void => {
    errors.push({ field, inputId: COMPOSE_INPUT_IDS[field], message })
  }
  if (!setup.conversation && !recipient(fields, patients)) add('recipient', 'Choose a recipient.')
  if (fields.subject.trim() === '') add('subject', 'Enter a subject.')
  else if (fields.subject.length > SUBJECT_MAX_LENGTH) add('subject', `Enter a subject of ${SUBJECT_MAX_LENGTH} characters or fewer.`)
  if (fields.body.trim() === '') add('body', 'Enter a message.')
  else if (fields.body.length > BODY_MAX_LENGTH) add('body', `Enter a message of ${BODY_MAX_LENGTH.toLocaleString('en-US')} characters or fewer.`)
  return errors
}

function recipientPatientId(fields: ComposeFields, setup: ComposeSetup): string | null {
  if (setup.conversation) return setup.conversation.patientId
  return fields.recipientId || null
}

export function toDraft(id: string, fields: ComposeFields, setup: ComposeSetup, patients: readonly Patient[], updatedAt: string): Draft {
  return {
    id,
    conversationId: setup.conversation?.id ?? null,
    patientId: recipientPatientId(fields, setup),
    to: recipientName(fields, setup, patients),
    subject: fields.subject,
    body: fields.body,
    attachments: fields.attachments.map((attachment) => ({ ...attachment })),
    updatedAt
  }
}

/** The `message/sent` payload: a reply joins its conversation, a new message starts one. */
export function toSentMessage(
  fields: ComposeFields,
  setup: ComposeSetup,
  patients: readonly Patient[],
  options: { makeId(prefix: string): string; author: string; at: string }
): SentMessage {
  return {
    conversationId: setup.conversation?.id ?? options.makeId('c'),
    patientId: recipientPatientId(fields, setup),
    with: recipientName(fields, setup, patients),
    subject: fields.subject.trim(),
    message: {
      id: options.makeId('m'),
      author: options.author,
      body: fields.body.trim(),
      at: options.at,
      outgoing: true,
      attachments: fields.attachments.map((attachment) => ({ ...attachment }))
    }
  }
}

/** Where typing starts: the body of a reply, otherwise the first field that still needs input. */
export function initialFocusId(setup: ComposeSetup): string {
  if (setup.conversation) return COMPOSE_INPUT_IDS.body
  if (!setup.initial.recipientId) return COMPOSE_INPUT_IDS.recipient
  if (!setup.initial.subject.trim()) return COMPOSE_INPUT_IDS.subject
  return COMPOSE_INPUT_IDS.body
}
