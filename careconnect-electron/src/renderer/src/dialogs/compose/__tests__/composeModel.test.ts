import type { Workspace } from '../../../../../shared/model'
import { createSeedWorkspace, patientIdFor } from '../../../../../shared/seed'
import { LIMITS, validateWorkspace } from '../../../../../shared/validate'
import {
  BODY_MAX_LENGTH,
  draftChange,
  hasTypedContent,
  initialFocusId,
  MAX_ATTACHMENTS,
  recipientName,
  replySubject,
  sameFields,
  setupCompose,
  SUBJECT_MAX_LENGTH,
  toDraft,
  toSentMessage,
  validateCompose,
  type ComposeFields,
  type ComposeSetup
} from '../composeModel'

const NOW = new Date(2026, 9, 5, 9, 42)
const AVERY = patientIdFor('Avery Park')
const MORGAN = patientIdFor('Morgan Chen')

function workspace(): Workspace {
  return createSeedWorkspace(NOW)
}

function fields(overrides: Partial<ComposeFields> = {}): ComposeFields {
  return { recipientId: '', subject: '', body: '', attachments: [], ...overrides }
}

describe('replySubject', () => {
  it('prefixes "Re:" once', () => {
    expect(replySubject('Home monitoring readings')).toBe('Re: Home monitoring readings')
    expect(replySubject('Re: Home monitoring readings')).toBe('Re: Home monitoring readings')
    expect(replySubject('RE: shouting')).toBe('RE: shouting')
  })

  it('never exceeds the saved subject limit', () => {
    expect(replySubject('x'.repeat(LIMITS.shortText))).toHaveLength(LIMITS.shortText)
  })
})

describe('setupCompose', () => {
  it('starts a blank new message', () => {
    const setup = setupCompose(workspace(), { patientId: null, conversationId: null, draftId: null })
    expect(setup.conversation).toBeNull()
    expect(setup.draft).toBeNull()
    expect(setup.initial).toEqual(fields())
    expect(setup.blank).toEqual(fields())
  })

  it('preselects the recipient for a new message to a patient', () => {
    const setup = setupCompose(workspace(), { patientId: AVERY, conversationId: null, draftId: null })
    expect(setup.initial.recipientId).toBe(AVERY)
  })

  it('ignores a recipient that is not in the patient list', () => {
    const setup = setupCompose(workspace(), { patientId: 'p-nobody', conversationId: null, draftId: null })
    expect(setup.initial.recipientId).toBe('')
  })

  it('replies to a conversation with a "Re:" subject', () => {
    const setup = setupCompose(workspace(), { patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null })
    expect(setup.conversation?.id).toBe('c-home-monitoring')
    expect(setup.initial).toEqual(fields({ recipientId: AVERY, subject: 'Re: Home monitoring readings' }))
    expect(setup.blank).toEqual(setup.initial)
  })

  it('falls back to a new message when the conversation no longer exists', () => {
    const setup = setupCompose(workspace(), { patientId: null, conversationId: 'c-gone', draftId: null })
    expect(setup.conversation).toBeNull()
    expect(setup.initial.subject).toBe('')
  })

  it('restores a saved draft by id', () => {
    const ws = workspace()
    ws.drafts = [
      { id: 'd-1', conversationId: null, patientId: MORGAN, to: 'Morgan Chen', subject: 'Exercise goals', body: 'Hi Morgan', attachments: [{ name: 'goals.pdf', size: 2048 }], updatedAt: NOW.toISOString() }
    ]
    const setup = setupCompose(ws, { patientId: null, conversationId: null, draftId: 'd-1' })
    expect(setup.draft?.id).toBe('d-1')
    expect(setup.conversation).toBeNull()
    expect(setup.initial).toEqual(fields({ recipientId: MORGAN, subject: 'Exercise goals', body: 'Hi Morgan', attachments: [{ name: 'goals.pdf', size: 2048 }] }))
    // A copy, so editing the form can never mutate workspace state.
    expect(setup.initial.attachments).not.toBe(ws.drafts[0].attachments)
    expect(setup.blank.subject).toBe('')
  })

  it('resumes the saved reply draft for a conversation instead of starting a second one', () => {
    const ws = workspace()
    ws.drafts = [
      { id: 'd-reply', conversationId: 'c-home-monitoring', patientId: AVERY, to: 'Avery Park', subject: 'Re: Home monitoring readings', body: 'Thanks, Avery', attachments: [], updatedAt: NOW.toISOString() }
    ]
    const setup = setupCompose(ws, { patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null })
    expect(setup.draft?.id).toBe('d-reply')
    expect(setup.conversation?.id).toBe('c-home-monitoring')
    expect(setup.initial.body).toBe('Thanks, Avery')
    expect(setup.blank.subject).toBe('Re: Home monitoring readings')
  })

  it('treats a missing draft id as a fresh message', () => {
    const setup = setupCompose(workspace(), { patientId: null, conversationId: null, draftId: 'd-missing' })
    expect(setup.draft).toBeNull()
    expect(setup.initial).toEqual(fields())
  })
})

describe('hasTypedContent', () => {
  const blank = fields({ recipientId: AVERY, subject: 'Re: Home monitoring readings' })

  it('is false for an untouched form, even with a prefilled subject and recipient', () => {
    expect(hasTypedContent(blank, blank)).toBe(false)
    expect(hasTypedContent(fields({ recipientId: MORGAN }), fields())).toBe(false)
  })

  it('counts a body, an edited subject or an attachment as typed content', () => {
    expect(hasTypedContent({ ...blank, body: 'Hello' }, blank)).toBe(true)
    expect(hasTypedContent({ ...blank, subject: 'Re: Home monitoring readings, urgent' }, blank)).toBe(true)
    expect(hasTypedContent({ ...blank, attachments: [{ name: 'a.pdf', size: 1 }] }, blank)).toBe(true)
  })

  it('ignores whitespace', () => {
    expect(hasTypedContent({ ...blank, body: '  \n ' }, blank)).toBe(false)
    expect(hasTypedContent(fields({ subject: '   ' }), fields())).toBe(false)
  })
})

describe('sameFields', () => {
  it('compares every field, including attachments', () => {
    const a = fields({ subject: 'S', body: 'B', attachments: [{ name: 'a.pdf', size: 1 }] })
    expect(sameFields(a, { ...a, attachments: [{ name: 'a.pdf', size: 1 }] })).toBe(true)
    expect(sameFields(a, { ...a, body: 'B2' })).toBe(false)
    expect(sameFields(a, { ...a, subject: 'S2' })).toBe(false)
    expect(sameFields(a, { ...a, recipientId: AVERY })).toBe(false)
    expect(sameFields(a, { ...a, attachments: [] })).toBe(false)
    expect(sameFields(a, { ...a, attachments: [{ name: 'b.pdf', size: 1 }] })).toBe(false)
  })
})

describe('draftChange', () => {
  const blank = fields({ recipientId: AVERY, subject: 'Re: Home monitoring readings' })
  const typed = { ...blank, body: 'Hello' }

  it('saves typed text the stored draft does not hold yet, creating the draft on the first edit', () => {
    expect(draftChange(typed, null, blank)).toBe('save')
    expect(draftChange(typed, { ...typed, body: 'Hell' }, blank)).toBe('save')
    expect(draftChange({ ...blank, attachments: [{ name: 'a.pdf', size: 1 }] }, null, blank)).toBe('save')
  })

  it('leaves a draft alone when it already holds exactly what is in the form', () => {
    expect(draftChange(typed, { ...typed }, blank)).toBeNull()
  })

  it('deletes a stored draft once all of its text is cleared, and never stores an empty one', () => {
    expect(draftChange(blank, typed, blank)).toBe('delete')
    expect(draftChange({ ...blank, body: '   ' }, typed, blank)).toBe('delete')
    expect(draftChange(blank, null, blank)).toBeNull()
    // Choosing a recipient alone is not typed text.
    expect(draftChange(fields({ recipientId: MORGAN }), null, fields())).toBeNull()
  })
})

describe('validateCompose', () => {
  const ws = workspace()
  const newMessage = setupCompose(ws, { patientId: null, conversationId: null, draftId: null })
  const reply = setupCompose(ws, { patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null })

  it('lists every problem in field order with specific guidance', () => {
    expect(validateCompose(fields(), newMessage, ws.patients)).toEqual([
      { field: 'recipient', inputId: 'compose-to', message: 'Choose a recipient.' },
      { field: 'subject', inputId: 'compose-subject', message: 'Enter a subject.' },
      { field: 'body', inputId: 'compose-body', message: 'Enter a message.' }
    ])
  })

  it('does not ask for a recipient when replying', () => {
    expect(validateCompose({ ...reply.initial, body: 'Thanks' }, reply, ws.patients)).toEqual([])
    expect(validateCompose(reply.initial, reply, ws.patients).map((error) => error.field)).toEqual(['body'])
  })

  it('rejects a recipient that is not a patient', () => {
    const errors = validateCompose(fields({ recipientId: 'p-nobody', subject: 'Hi', body: 'Hello' }), newMessage, ws.patients)
    expect(errors.map((error) => error.message)).toEqual(['Choose a recipient.'])
  })

  it('enforces the limits the main process validates, so a save can never be rejected', () => {
    const tooLong = fields({ recipientId: AVERY, subject: 's'.repeat(LIMITS.shortText + 1), body: 'b'.repeat(LIMITS.longText + 1) })
    expect(validateCompose(tooLong, newMessage, ws.patients).map((error) => error.message)).toEqual([
      'Enter a subject of 200 characters or fewer.',
      'Enter a message of 10,000 characters or fewer.'
    ])
  })
})

describe('recipientName', () => {
  const ws = workspace()

  it('is who the conversation is with when replying', () => {
    const reply = setupCompose(ws, { patientId: null, conversationId: 'c-lab-results', draftId: null })
    expect(recipientName(reply.initial, reply, ws.patients)).toBe('Dr. Sam Okafor')
  })

  it('is the chosen patient for a new message, or empty', () => {
    const setup = setupCompose(ws, { patientId: null, conversationId: null, draftId: null })
    expect(recipientName(fields({ recipientId: MORGAN }), setup, ws.patients)).toBe('Morgan Chen')
    expect(recipientName(fields(), setup, ws.patients)).toBe('')
  })
})

describe('toDraft', () => {
  const ws = workspace()

  it('records a reply draft against its conversation', () => {
    const reply = setupCompose(ws, { patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null })
    const draft = toDraft('d-9', { ...reply.initial, body: 'Thanks for the readings.' }, reply, ws.patients, NOW.toISOString())
    expect(draft).toEqual({
      id: 'd-9',
      conversationId: 'c-home-monitoring',
      patientId: AVERY,
      to: 'Avery Park',
      subject: 'Re: Home monitoring readings',
      body: 'Thanks for the readings.',
      attachments: [],
      updatedAt: NOW.toISOString()
    })
  })

  it('records a new-message draft with or without a recipient', () => {
    const setup = setupCompose(ws, { patientId: null, conversationId: null, draftId: null })
    expect(toDraft('d-1', fields({ recipientId: MORGAN, body: 'Hi' }), setup, ws.patients, NOW.toISOString())).toMatchObject({
      conversationId: null,
      patientId: MORGAN,
      to: 'Morgan Chen'
    })
    expect(toDraft('d-2', fields({ body: 'Hi' }), setup, ws.patients, NOW.toISOString())).toMatchObject({ patientId: null, to: '' })
  })
})

describe('drafts written while typing pass the main process’s workspace validation', () => {
  // Every edit is saved, so a half-written draft that workspace:save rejected would fail the save on each keystroke.
  const ws = workspace()
  const newMessage = setupCompose(ws, { patientId: null, conversationId: null, draftId: null })
  const reply = setupCompose(ws, { patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null })
  const atLimit = fields({
    recipientId: MORGAN,
    subject: 's'.repeat(SUBJECT_MAX_LENGTH),
    body: 'b'.repeat(BODY_MAX_LENGTH),
    attachments: Array.from({ length: MAX_ATTACHMENTS }, (_, index) => ({ name: `page-${index}.pdf`, size: index }))
  })
  const shapes: [string, ComposeFields, ComposeSetup][] = [
    ['a new message with no recipient yet and only a subject', fields({ subject: 'Exercise goals' }), newMessage],
    ['a new message with a body but no subject', fields({ recipientId: MORGAN, body: 'Hi Morgan' }), newMessage],
    ['a new message with only an attachment', fields({ attachments: [{ name: 'plan.pdf', size: 4096 }] }), newMessage],
    ['a reply whose subject was cleared', { ...reply.initial, subject: '', body: 'Thanks' }, reply],
    ['every field at its limit', atLimit, newMessage]
  ]

  it.each(shapes)('%s', (_label, form, setup) => {
    const draft = toDraft('d-1', form, setup, ws.patients, NOW.toISOString())
    expect(validateWorkspace({ ...ws, drafts: [draft] }).drafts).toEqual([draft])
  })
})

describe('toSentMessage', () => {
  const ws = workspace()
  const makeId = (prefix: string) => `${prefix}-new`

  it('adds a reply to the existing conversation', () => {
    const reply = setupCompose(ws, { patientId: null, conversationId: 'c-lab-results', draftId: null })
    const sent = toSentMessage({ ...reply.initial, body: '  Thanks, I will call Riley.  ' }, reply, ws.patients, {
      makeId,
      author: 'Jordan Lee, RN',
      at: NOW.toISOString()
    })
    expect(sent).toEqual({
      conversationId: 'c-lab-results',
      patientId: patientIdFor('Riley Singh'),
      with: 'Dr. Sam Okafor',
      subject: 'Re: Lab results: Riley Singh',
      message: { id: 'm-new', author: 'Jordan Lee, RN', body: 'Thanks, I will call Riley.', at: NOW.toISOString(), outgoing: true, attachments: [] }
    })
  })

  it('starts a new conversation with the chosen patient', () => {
    const setup = setupCompose(ws, { patientId: null, conversationId: null, draftId: null })
    const attachments = [{ name: 'plan.pdf', size: 4096 }]
    const sent = toSentMessage(fields({ recipientId: MORGAN, subject: ' Exercise goals ', body: 'Hi Morgan', attachments }), setup, ws.patients, {
      makeId,
      author: 'Jordan Lee, RN',
      at: NOW.toISOString()
    })
    expect(sent).toMatchObject({ conversationId: 'c-new', patientId: MORGAN, with: 'Morgan Chen', subject: 'Exercise goals' })
    expect(sent.message.attachments).toEqual(attachments)
  })
})

describe('initialFocusId', () => {
  const ws = workspace()

  it('starts a reply in the message body', () => {
    const reply = setupCompose(ws, { patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null })
    expect(initialFocusId(reply)).toBe('compose-body')
  })

  it('starts a new message at the first field that still needs input', () => {
    expect(initialFocusId(setupCompose(ws, { patientId: null, conversationId: null, draftId: null }))).toBe('compose-to')
    expect(initialFocusId(setupCompose(ws, { patientId: AVERY, conversationId: null, draftId: null }))).toBe('compose-subject')
    ws.drafts = [{ id: 'd-1', conversationId: null, patientId: AVERY, to: 'Avery Park', subject: 'Hello', body: '', attachments: [], updatedAt: NOW.toISOString() }]
    expect(initialFocusId(setupCompose(ws, { patientId: null, conversationId: null, draftId: 'd-1' }))).toBe('compose-body')
  })
})
