import type { ContextMenuItem, UiState } from '../api'
import { formatPatientSummaryJson } from '../exportFormat'
import type { Patient, Workspace } from '../model'
import { createSeedWorkspace } from '../seed'
import {
  LIMITS,
  parsePatientImport,
  validateActivity,
  validateAttachment,
  validateClipboardText,
  validateContextMenuRequest,
  validateExportRequest,
  validateExternalUrl,
  validateNotificationRequest,
  validatePatient,
  validateUiState,
  validateWorkspace,
  ValidationError
} from '../validate'

const NOW = new Date(2026, 9, 5, 9, 42)

/** A deep copy of the seed that a test may freely break. */
function seed(): Workspace {
  return JSON.parse(JSON.stringify(createSeedWorkspace(NOW))) as Workspace
}

function avery(): Patient {
  return seed().patients[0]
}

/** Runs `fn` and returns the ValidationError it throws (failing the test if it throws anything else). */
function validationError(fn: () => unknown): ValidationError {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError)
    return error as ValidationError
  }
  throw new Error('expected a ValidationError, but nothing was thrown')
}

function expectRejected(fn: () => unknown, path: string, reason?: string | RegExp): void {
  const error = validationError(fn)
  expect(error.path).toBe(path)
  if (typeof reason === 'string') expect(error.reason).toBe(reason)
  else if (reason) expect(error.reason).toMatch(reason)
  expect(error.message).toBe(`${error.path}: ${error.reason}`)
  expect(error.name).toBe('ValidationError')
}

const longText = (length: number): string => 'x'.repeat(length)

describe('validateWorkspace', () => {
  it('accepts the seed and returns an equal, fresh object', () => {
    const workspace = seed()
    const result = validateWorkspace(workspace)
    expect(result).toEqual(workspace)
    expect(result).not.toBe(workspace)
    expect(result.patients[0]).not.toBe(workspace.patients[0])
  })

  it('strips unknown fields at every level', () => {
    const tainted = seed() as unknown as Record<string, unknown> & Workspace
    const extra = { injected: true }
    Object.assign(tainted, { extra })
    Object.assign(tainted.clinic, { extra })
    Object.assign(tainted.user, { extra })
    Object.assign(tainted.patients[0], { extra })
    Object.assign(tainted.patients[0].alert as object, { extra })
    Object.assign(tainted.patients[0].activity[0], { extra })
    Object.assign(tainted.conversations[0], { extra })
    Object.assign(tainted.conversations[0].messages[0], { extra })
    tainted.conversations[0].messages[0].attachments.push({ name: 'scan.pdf', size: 2048, extra } as never)
    tainted.drafts.push({ id: 'd-1', conversationId: null, patientId: null, to: '', subject: '', body: '', attachments: [], updatedAt: NOW.toISOString(), extra } as never)
    Object.assign(tainted.tasks[0], { extra })
    Object.assign(tainted.preferences, { extra })
    Object.assign(tainted.recentPatients[0], { extra })

    const result = validateWorkspace(tainted)
    expect(JSON.stringify(result)).not.toContain('extra')
    expect(JSON.stringify(result)).not.toContain('injected')
    expect(result.conversations[0].messages[0].attachments).toEqual([{ name: 'scan.pdf', size: 2048 }])
    expect(result.drafts[0]).toEqual({ id: 'd-1', conversationId: null, patientId: null, to: '', subject: '', body: '', attachments: [], updatedAt: NOW.toISOString() })
  })

  it('never copies a __proto__ key from parsed JSON', () => {
    const patient = JSON.parse(JSON.stringify(avery()).replace(/^\{/, '{"__proto__":{"polluted":true},')) as Patient
    const result = validatePatient(patient)
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect((result as unknown as Record<string, unknown>).polluted).toBeUndefined()
  })

  it.each<[string, (workspace: Workspace) => unknown, string, string | RegExp]>([
    ['a non-object', () => null, 'workspace', 'expected an object'],
    ['an array', () => [], 'workspace', 'expected an object'],
    ['another version', (w) => ({ ...w, version: 2 }), 'workspace.version', 'unsupported workspace version'],
    ['a missing clinic', (w) => ({ ...w, clinic: undefined }), 'workspace.clinic', 'expected an object'],
    ['an empty clinic name', (w) => ({ ...w, clinic: { ...w.clinic, name: '  ' } }), 'workspace.clinic.name', 'must not be empty'],
    ['a numeric user name', (w) => ({ ...w, user: { ...w.user, name: 42 } }), 'workspace.user.name', 'expected text'],
    ['patients that are not a list', (w) => ({ ...w, patients: {} }), 'workspace.patients', 'expected a list'],
    ['an empty patient name', (w) => (w.patients[3].name = '', w), 'workspace.patients[3].name', 'must not be empty'],
    ['an unknown status', (w) => ((w.patients[0] as { status: string }).status = 'urgent', w), 'workspace.patients[0].status', 'expected one of needs-review, open, completed'],
    ['a bad last-contact date', (w) => (w.patients[0].lastContact = 'last Tuesday', w), 'workspace.patients[0].lastContact', 'expected an ISO 8601 date'],
    ['a bad next-visit date', (w) => (w.patients[1].nextVisit = 'soon', w), 'workspace.patients[1].nextVisit', 'expected an ISO 8601 date'],
    ['an empty care-team member', (w) => (w.patients[0].careTeam[1] = '', w), 'workspace.patients[0].careTeam[1]', 'must not be empty'],
    ['an alert without a title', (w) => (w.patients[0].alert = { title: '', detail: 'x' }, w), 'workspace.patients[0].alert.title', 'must not be empty'],
    ['a plan item that is not text', (w) => ((w.patients[0].plan as unknown[])[0] = 42, w), 'workspace.patients[0].plan[0]', 'expected text'],
    ['an unknown activity kind', (w) => ((w.patients[0].activity[1] as { kind: string }).kind = 'call', w), 'workspace.patients[0].activity[1].kind', /^expected one of note, message/],
    ['an activity without an id', (w) => ((w.patients[0].activity[0] as { id?: string }).id = undefined, w), 'workspace.patients[0].activity[0].id', 'expected text'],
    ['a conversation with a non-boolean unread flag', (w) => ((w.conversations[2] as { unread: unknown }).unread = 'yes', w), 'workspace.conversations[2].unread', 'expected true or false'],
    ['an empty conversation patient id', (w) => (w.conversations[0].patientId = '', w), 'workspace.conversations[0].patientId', 'must not be empty'],
    ['an empty message body', (w) => (w.conversations[0].messages[0].body = '', w), 'workspace.conversations[0].messages[0].body', 'must not be empty'],
    ['a negative attachment size', (w) => (w.conversations[0].messages[0].attachments = [{ name: 'a.pdf', size: -1 }], w), 'workspace.conversations[0].messages[0].attachments[0].size', /^expected a whole number from 0 to/],
    ['a draft with a bad date', (w) => (w.drafts = [{ id: 'd', conversationId: null, patientId: null, to: '', subject: '', body: 'Hi', attachments: [], updatedAt: 'now' }], w), 'workspace.drafts[0].updatedAt', 'expected an ISO 8601 date'],
    ['a task with an unknown priority', (w) => ((w.tasks[4] as { priority: string }).priority = 'high', w), 'workspace.tasks[4].priority', 'expected one of routine, urgent'],
    ['a task with a non-boolean done flag', (w) => ((w.tasks[0] as { done: unknown }).done = 1, w), 'workspace.tasks[0].done', 'expected true or false'],
    ['missing preferences', (w) => ({ ...w, preferences: null }), 'workspace.preferences', 'expected an object'],
    ['a missing preference', (w) => ((w.preferences as Partial<Workspace['preferences']>).notifications = undefined, w), 'workspace.preferences.notifications', 'expected true or false'],
    ['a recent patient with a bad date', (w) => (w.recentPatients[1].at = 'earlier', w), 'workspace.recentPatients[1].at', 'expected an ISO 8601 date']
  ])('rejects %s and names the field', (_name, mutate, path, reason) => {
    expectRejected(() => validateWorkspace(mutate(seed())), path, reason)
  })

  describe('dates', () => {
    // Each of these is accepted by Date.parse, which is why a parse check alone is not enough.
    it.each([
      ['a bare number, which V8 reads as 1 January 2001', '1'],
      ['a month and day without a year, which V8 places in 2001', 'Oct 5'],
      ['a date without a time', '2026-10-05'],
      ['a local time without an offset', '2026-10-05T10:30:00'],
      ['a space instead of the T', '2026-10-05 10:30:00Z'],
      ['an offset without a colon', '2026-10-05T10:30:00+0500'],
      ['an expanded year', '+002026-10-05T10:30:00Z'],
      ['a day that does not exist, which V8 rolls on to 3 March', '2026-02-31T10:00:00Z'],
      ['29 February outside a leap year', '2026-02-29T10:00:00Z'],
      ['hour 24, which V8 rolls on to the next day', '2026-10-05T24:00:00Z'],
      ['a time that an offset carries past year 9999', '9999-12-31T23:00:00-05:00']
    ])('rejects %s (%j)', (_name, value) => {
      const workspace = seed()
      workspace.patients[0].lastContact = value
      expectRejected(() => validateWorkspace(workspace), 'workspace.patients[0].lastContact', 'expected an ISO 8601 date')
    })

    it('stores every date as UTC with milliseconds, so the string comparisons in the selectors hold', () => {
      const workspace = seed()
      // 10:30 at +05:00 is 05:30 UTC: earlier than 06:00 UTC, although it sorts later as raw text.
      workspace.patients[0].lastContact = '2026-10-05T10:30:00+05:00'
      workspace.patients[1].lastContact = '2026-10-05T06:00:00.000Z'
      workspace.patients[2].nextVisit = '2026-10-05T14:30Z'
      workspace.patients[3].lastContact = '2026-10-05T14:30:15.123456Z'
      workspace.tasks[0].due = '2026-10-05T09:00:00-04:00'
      workspace.recentPatients[0].at = '2024-02-29T08:00:00Z'
      expect('2026-10-05T10:30:00+05:00' > '2026-10-05T06:00:00.000Z').toBe(true)

      const result = validateWorkspace(workspace)
      expect(result.patients[0].lastContact).toBe('2026-10-05T05:30:00.000Z')
      expect(result.patients[0].lastContact < result.patients[1].lastContact).toBe(true)
      expect(result.patients[2].nextVisit).toBe('2026-10-05T14:30:00.000Z')
      expect(result.patients[3].lastContact).toBe('2026-10-05T14:30:15.123Z')
      expect(result.tasks[0].due).toBe('2026-10-05T13:00:00.000Z')
      expect(result.recentPatients[0].at).toBe('2024-02-29T08:00:00.000Z')
    })

    it('leaves the dates CareConnect writes (toISOString) unchanged', () => {
      const workspace = seed()
      const result = validateWorkspace(workspace)
      expect(result.patients.map((patient) => [patient.lastContact, patient.nextVisit])).toEqual(
        workspace.patients.map((patient) => [patient.lastContact, patient.nextVisit])
      )
      expect(validateWorkspace(result)).toEqual(result)
    })
  })

  it('keeps a draft’s conversation and patient', () => {
    const workspace = seed()
    workspace.drafts = [
      {
        id: 'd-1',
        conversationId: 'c-home-monitoring',
        patientId: 'p-avery-park',
        to: 'Avery Park',
        subject: 'Re: Home monitoring readings',
        body: 'Thanks for sending these.',
        attachments: [{ name: 'readings.pdf', size: 52_000 }],
        updatedAt: NOW.toISOString()
      }
    ]
    expect(validateWorkspace(workspace).drafts).toEqual(workspace.drafts)
    workspace.drafts[0].conversationId = ''
    expectRejected(() => validateWorkspace(workspace), 'workspace.drafts[0].conversationId', 'must not be empty')
  })

  it('allows the optional and blank-able fields to be empty', () => {
    const workspace = seed()
    workspace.clinic.subtitle = ''
    workspace.user.role = ''
    workspace.patients[0].pronouns = ''
    workspace.patients[0].ageGroup = ''
    workspace.patients[0].nextVisit = null
    workspace.patients[0].alert = { title: 'Call back', detail: '' }
    workspace.patients[0].plan = []
    workspace.patients[0].activity = [{ id: 'a-1', kind: 'record', title: 'Created', at: NOW.toISOString(), detail: '' }]
    workspace.conversations[5].patientId = null
    expect(validateWorkspace(workspace)).toEqual(workspace)
  })

  describe('limits', () => {
    it('enforces the short-text limit', () => {
      const workspace = seed()
      workspace.patients[0].name = longText(LIMITS.shortText)
      expect(validateWorkspace(workspace).patients[0].name).toHaveLength(200)
      workspace.patients[0].name = longText(LIMITS.shortText + 1)
      expectRejected(() => validateWorkspace(workspace), 'workspace.patients[0].name', 'must be at most 200 characters')
    })

    it('enforces the long-text limit on plan items, notes and message bodies', () => {
      const workspace = seed()
      workspace.patients[0].plan = [longText(LIMITS.longText)]
      workspace.patients[0].activity[0].detail = longText(LIMITS.longText)
      expect(() => validateWorkspace(workspace)).not.toThrow()
      workspace.patients[0].plan = [longText(LIMITS.longText + 1)]
      expectRejected(() => validateWorkspace(workspace), 'workspace.patients[0].plan[0]', 'must be at most 10000 characters')
      const message = seed()
      message.conversations[0].messages[0].body = longText(LIMITS.longText + 1)
      expectRejected(() => validateWorkspace(message), 'workspace.conversations[0].messages[0].body', 'must be at most 10000 characters')
    })

    it('enforces the date length', () => {
      const workspace = seed()
      workspace.patients[0].lastContact = `${NOW.toISOString()}${' '.repeat(LIMITS.isoDate)}`
      expectRejected(() => validateWorkspace(workspace), 'workspace.patients[0].lastContact', 'must be at most 40 characters')
    })

    it('enforces list sizes before looking at the entries', () => {
      const tooManyPatients = { ...seed(), patients: new Array(LIMITS.patients + 1).fill(null) }
      expectRejected(() => validateWorkspace(tooManyPatients), 'workspace.patients', 'must have at most 2000 entries')

      const bigTeam = seed()
      bigTeam.patients[0].careTeam = Array.from({ length: LIMITS.careTeam + 1 }, (_, index) => `Member ${index}`)
      expectRejected(() => validateWorkspace(bigTeam), 'workspace.patients[0].careTeam', 'must have at most 20 entries')

      const manyAttachments = seed()
      manyAttachments.conversations[0].messages[0].attachments = Array.from({ length: LIMITS.attachments + 1 }, () => ({ name: 'a.pdf', size: 1 }))
      expectRejected(() => validateWorkspace(manyAttachments), 'workspace.conversations[0].messages[0].attachments', 'must have at most 20 entries')

      const recent = seed()
      recent.recentPatients = Array.from({ length: 6 }, () => ({ patientId: 'p-avery-park', at: NOW.toISOString() }))
      expectRejected(() => validateWorkspace(recent), 'workspace.recentPatients', 'must have at most 5 entries')
    })
  })
})

describe('record validators', () => {
  it('validatePatient and validateActivity default to readable paths', () => {
    expectRejected(() => validatePatient({ ...avery(), name: '' }), 'patient.name', 'must not be empty')
    expectRejected(() => validateActivity({ id: 'a', kind: 'note', title: '', at: NOW.toISOString() }), 'activity.title', 'must not be empty')
  })

  it('validateActivity keeps the optional detail and author only when present', () => {
    const minimal = { id: 'a', kind: 'note', title: 'Call', at: NOW.toISOString() }
    expect(validateActivity(minimal)).toEqual(minimal)
    expect(Object.keys(validateActivity(minimal))).toEqual(['id', 'kind', 'title', 'at'])
    expect(validateActivity({ ...minimal, detail: 'Spoke', author: 'Jordan Lee, RN' })).toEqual({ ...minimal, detail: 'Spoke', author: 'Jordan Lee, RN' })
    expectRejected(() => validateActivity({ ...minimal, author: '' }), 'activity.author', 'must not be empty')
  })

  it('validateAttachment checks the name and a whole-number size', () => {
    expect(validateAttachment({ name: 'scan.pdf', size: 2048, path: 'C:\\secret' })).toEqual({ name: 'scan.pdf', size: 2048 })
    expect(validateAttachment({ name: 'empty.txt', size: 0 })).toEqual({ name: 'empty.txt', size: 0 })
    expectRejected(() => validateAttachment({ name: longText(256), size: 1 }), 'attachment.name', 'must be at most 255 characters')
    expectRejected(() => validateAttachment({ name: 'a.pdf', size: 1.5 }), 'attachment.size')
    expectRejected(() => validateAttachment({ name: 'a.pdf', size: LIMITS.attachmentBytes + 1 }), 'attachment.size')
    expectRejected(() => validateAttachment({ name: 'a.pdf', size: '12' }), 'attachment.size')
  })
})

describe('IPC payload validators', () => {
  const uiState: UiState = {
    view: 'patients',
    hasSelection: true,
    modal: null,
    unreadCount: 4,
    unsavedChanges: 0,
    showShortcutHints: true,
    highContrast: false,
    reduceMotion: false
  }

  describe('validateUiState', () => {
    it('accepts a valid state and strips unknown fields', () => {
      expect(validateUiState({ ...uiState, extra: 'x' })).toEqual(uiState)
      for (const modal of ['palette', 'compose', 'dialog'] as const) expect(validateUiState({ ...uiState, modal }).modal).toBe(modal)
    })

    it.each<[string, Partial<Record<keyof UiState, unknown>>, string]>([
      ['an unknown view', { view: 'admin' }, 'uiState.view'],
      ['an unknown modal kind', { modal: 'settings' }, 'uiState.modal'],
      ['a non-boolean selection flag', { hasSelection: 'yes' }, 'uiState.hasSelection'],
      ['a negative unread count', { unreadCount: -1 }, 'uiState.unreadCount'],
      ['a fractional unread count', { unreadCount: 1.5 }, 'uiState.unreadCount'],
      ['an unread count as text', { unreadCount: '4' }, 'uiState.unreadCount'],
      ['an absurd unread count', { unreadCount: 100_001 }, 'uiState.unreadCount'],
      ['an absurd unsaved count', { unsavedChanges: 1_000_001 }, 'uiState.unsavedChanges'],
      ['a missing preference flag', { reduceMotion: undefined }, 'uiState.reduceMotion']
    ])('rejects %s', (_name, change, path) => {
      expectRejected(() => validateUiState({ ...uiState, ...change }), path)
    })

    it('rejects a non-object', () => {
      expectRejected(() => validateUiState('patients'), 'uiState', 'expected an object')
    })
  })

  describe('validateExportRequest', () => {
    it('accepts both formats', () => {
      expect(validateExportRequest({ patient: avery(), format: 'txt' })).toEqual({ patient: avery(), format: 'txt' })
      expect(validateExportRequest({ patient: avery(), format: 'json', extra: true })).toEqual({ patient: avery(), format: 'json' })
    })

    it('rejects other formats and invalid patients', () => {
      expectRejected(() => validateExportRequest({ patient: avery(), format: 'pdf' }), 'exportRequest.format', 'expected one of txt, json')
      expectRejected(() => validateExportRequest({ patient: { ...avery(), careId: '' }, format: 'txt' }), 'exportRequest.patient.careId')
      expectRejected(() => validateExportRequest(undefined), 'exportRequest', 'expected an object')
    })
  })

  describe('validateNotificationRequest', () => {
    it('accepts a title and body, with or without a patient', () => {
      expect(validateNotificationRequest({ title: '3 follow-ups due today', body: '' })).toEqual({ title: '3 follow-ups due today', body: '' })
      expect(validateNotificationRequest({ title: 'Due', body: 'Avery Park at 10:30', patientId: 'p-avery-park', icon: 'x' })).toEqual({
        title: 'Due',
        body: 'Avery Park at 10:30',
        patientId: 'p-avery-park'
      })
    })

    it('rejects an empty title, an empty patient id and long text', () => {
      expectRejected(() => validateNotificationRequest({ title: '', body: 'x' }), 'notification.title', 'must not be empty')
      expectRejected(() => validateNotificationRequest({ title: 'Due', body: 'x', patientId: '' }), 'notification.patientId', 'must not be empty')
      expectRejected(() => validateNotificationRequest({ title: longText(201), body: 'x' }), 'notification.title', 'must be at most 200 characters')
      expectRejected(() => validateNotificationRequest({ title: 'Due', body: longText(1001) }), 'notification.body', 'must be at most 1000 characters')
    })
  })

  describe('validateContextMenuRequest', () => {
    const items: ContextMenuItem[] = [
      { id: 'patient.message', label: 'Message Avery Park…', accelerator: 'M' },
      { id: 'separator-status', label: '', type: 'separator' },
      { id: 'patient.markOpen', label: 'Open', type: 'radio', checked: false },
      { id: 'patient.export', label: 'Export summary…', enabled: false }
    ]

    it('accepts menu items, defaulting the type to normal', () => {
      expect(validateContextMenuRequest({ items, x: 10, y: 20 })).toEqual({
        items: [
          { id: 'patient.message', label: 'Message Avery Park…', type: 'normal', accelerator: 'M' },
          { id: 'separator-status', label: '', type: 'separator' },
          { id: 'patient.markOpen', label: 'Open', type: 'radio', checked: false },
          { id: 'patient.export', label: 'Export summary…', type: 'normal', enabled: false }
        ],
        x: 10,
        y: 20
      })
    })

    it('never lets the renderer smuggle Electron menu options through', () => {
      const result = validateContextMenuRequest({ items: [{ id: 'quit', label: 'Quit', role: 'quit', click: 'x', submenu: [] }] })
      expect(result.items).toEqual([{ id: 'quit', label: 'Quit', type: 'normal' }])
    })

    it('ignores a separator’s label and rounds coordinates', () => {
      const result = validateContextMenuRequest({ items: [{ id: 's', type: 'separator' }], x: 12.6, y: 0 })
      expect(result).toEqual({ items: [{ id: 's', label: '', type: 'separator' }], x: 13, y: 0 })
      expect(validateContextMenuRequest({ items: [{ id: 'a', label: 'A' }] })).toEqual({ items: [{ id: 'a', label: 'A', type: 'normal' }] })
    })

    it.each<[string, unknown, string]>([
      ['no items', { items: [] }, 'contextMenu.items'],
      ['too many items', { items: Array.from({ length: LIMITS.contextMenuItems + 1 }, (_, i) => ({ id: `i${i}`, label: 'Item' })) }, 'contextMenu.items'],
      ['an unknown item type', { items: [{ id: 'a', label: 'A', type: 'submenu' }] }, 'contextMenu.items[0].type'],
      ['a normal item without a label', { items: [{ id: 'a' }] }, 'contextMenu.items[0].label'],
      ['a non-boolean checked flag', { items: [{ id: 'a', label: 'A', checked: 'yes' }] }, 'contextMenu.items[0].checked'],
      ['a non-boolean enabled flag', { items: [{ id: 'a', label: 'A', enabled: 1 }] }, 'contextMenu.items[0].enabled'],
      ['a long accelerator', { items: [{ id: 'a', label: 'A', accelerator: longText(41) }] }, 'contextMenu.items[0].accelerator'],
      ['a negative x', { items: [{ id: 'a', label: 'A' }], x: -1 }, 'contextMenu.x'],
      ['a NaN y', { items: [{ id: 'a', label: 'A' }], y: Number.NaN }, 'contextMenu.y'],
      ['an infinite x', { items: [{ id: 'a', label: 'A' }], x: Number.POSITIVE_INFINITY }, 'contextMenu.x'],
      ['an off-screen y', { items: [{ id: 'a', label: 'A' }], y: 100_001 }, 'contextMenu.y'],
      ['a coordinate as text', { items: [{ id: 'a', label: 'A' }], x: '10' }, 'contextMenu.x']
    ])('rejects %s', (_name, request, path) => {
      expectRejected(() => validateContextMenuRequest(request), path)
    })
  })

  describe('validateExternalUrl', () => {
    it('accepts allow-listed https links', () => {
      expect(validateExternalUrl('https://www.w3.org/WAI/WCAG22/quickref/')).toBe('https://www.w3.org/WAI/WCAG22/quickref/')
    })

    it('rejects anything else with a clear reason', () => {
      expectRejected(() => validateExternalUrl('http://www.w3.org/'), 'url', 'only allow-listed https links can be opened')
      expectRejected(() => validateExternalUrl('javascript:alert(1)'), 'url', 'only allow-listed https links can be opened')
      expectRejected(() => validateExternalUrl(42), 'url', 'expected text')
      expectRejected(() => validateExternalUrl(''), 'url', 'must not be empty')
      expectRejected(() => validateExternalUrl(`https://www.w3.org/${longText(LIMITS.url)}`), 'url', 'must be at most 2048 characters')
    })
  })

  describe('validateClipboardText', () => {
    it('accepts text up to the long-text limit', () => {
      expect(validateClipboardText('CC-1048')).toBe('CC-1048')
      expect(validateClipboardText(longText(LIMITS.longText))).toHaveLength(LIMITS.longText)
    })

    it('rejects empty, oversized and non-text values', () => {
      expectRejected(() => validateClipboardText(''), 'text', 'must not be empty')
      expectRejected(() => validateClipboardText(longText(LIMITS.longText + 1)), 'text', 'must be at most 10000 characters')
      expectRejected(() => validateClipboardText({ text: 'x' }), 'text', 'expected text')
    })
  })
})

describe('parsePatientImport', () => {
  it('accepts an array of patients', () => {
    const [first, second] = seed().patients
    expect(parsePatientImport(JSON.stringify([first, second]))).toEqual({ patients: [first, second], skipped: 0 })
  })

  it('accepts { patients: [...] }, such as a whole workspace file', () => {
    const workspace = seed()
    const result = parsePatientImport(JSON.stringify(workspace))
    expect(result.patients).toEqual(workspace.patients)
    expect(result.skipped).toBe(0)
  })

  it('accepts a single-patient export from File > Export Patient Summary', () => {
    const patient = avery()
    expect(parsePatientImport(formatPatientSummaryJson(patient, NOW))).toEqual({ patients: [patient], skipped: 0 })
  })

  it('skips and counts invalid records instead of failing the whole file', () => {
    const [first, second] = seed().patients
    const json = JSON.stringify([first, { ...second, status: 'urgent' }, { name: 'Nobody' }, null, 'text'])
    expect(parsePatientImport(json)).toEqual({ patients: [first], skipped: 4 })
    expect(parsePatientImport(JSON.stringify({ patient: null }))).toEqual({ patients: [], skipped: 1 })
  })

  it('strips unknown fields from imported records', () => {
    const json = JSON.stringify([{ ...avery(), ssn: '000-00-0000' }])
    expect(parsePatientImport(json).patients[0]).not.toHaveProperty('ssn')
  })

  it('skips records with dates that are not ISO 8601, and converts offset times to UTC', () => {
    const [first, second, third] = seed().patients
    const json = JSON.stringify([
      { ...first, lastContact: 'Oct 5' },
      { ...second, nextVisit: '1' },
      { ...third, lastContact: '2026-10-05T10:30:00+05:00', activity: [{ ...third.activity[0], at: '2026-10-04T23:15:00-07:00' }] }
    ])
    const result = parsePatientImport(json)
    expect(result.skipped).toBe(2)
    expect(result.patients).toHaveLength(1)
    expect(result.patients[0].lastContact).toBe('2026-10-05T05:30:00.000Z')
    expect(result.patients[0].activity[0].at).toBe('2026-10-05T06:15:00.000Z')
  })

  it('accepts an empty list', () => {
    expect(parsePatientImport('[]')).toEqual({ patients: [], skipped: 0 })
  })

  it.each<[string, string, string]>([
    ['an empty file', '', 'is not valid JSON'],
    ['a blank file', '  \n', 'is not valid JSON'],
    ['non-JSON text', 'Name,Care ID\nAvery Park,CC-1048', 'is not valid JSON'],
    ['an object without patients', '{"format":"other"}', 'contains no patients'],
    ['a patients field that is not a list', '{"patients":"all"}', 'contains no patients'],
    ['null', 'null', 'contains no patients'],
    ['a number', '42', 'contains no patients'],
    ['a string', '"Avery Park"', 'contains no patients']
  ])('rejects %s', (_name, json, reason) => {
    expectRejected(() => parsePatientImport(json), 'file', reason)
  })

  it('rejects files with more patients than the workspace may hold', () => {
    expectRejected(() => parsePatientImport(JSON.stringify(new Array(LIMITS.patients + 1).fill(null))), 'file', 'has more than 2000 patients')
  })
})
