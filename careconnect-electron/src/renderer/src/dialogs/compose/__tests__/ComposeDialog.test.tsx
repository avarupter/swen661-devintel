import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useEffect, type Dispatch } from 'react'
import { createMemoryApi, FIXED_NOW, type MemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import { createSeedWorkspace, patientIdFor } from '../../../../../shared/seed'
import { AnnouncerProvider } from '../../../a11y/Announcer'
import { ApiProvider } from '../../../api/ApiContext'
import { CommandProvider, useCommands } from '../../../commands/CommandProvider'
import { ModalHost } from '../../../dialogs/ModalHost'
import type { AppAction, AppState } from '../../../state/appState'
import { AppStateProvider, SAVE_DEBOUNCE_MS, useAppDispatch, useAppState } from '../../../state/AppStateProvider'
import { ClockProvider } from '../../../state/clock'

const AVERY = patientIdFor('Avery Park')
const MORGAN = patientIdFor('Morgan Chen')

interface ComposeRequest {
  patientId: string | null
  conversationId: string | null
  draftId: string | null
}

const REPLY: ComposeRequest = { patientId: AVERY, conversationId: 'c-home-monitoring', draftId: null }
const NEW_MESSAGE: ComposeRequest = { patientId: null, conversationId: null, draftId: null }

const probe: { state: AppState | null; dispatch: Dispatch<AppAction> | null } = { state: null, dispatch: null }

function StateProbe(): null {
  const state = useAppState()
  const dispatch = useAppDispatch()
  useEffect(() => {
    probe.state = state
    probe.dispatch = dispatch
  })
  return null
}

function current(): AppState {
  if (!probe.state) throw new Error('The state probe has not rendered')
  return probe.state
}

function Opener({ request }: { request: ComposeRequest }): React.JSX.Element {
  const { openModal } = useCommands()
  return (
    <>
      <StateProbe />
      <button type="button" onClick={() => openModal({ kind: 'compose', ...request })}>
        Open compose
      </button>
    </>
  )
}

async function openCompose(request: ComposeRequest, api?: MemoryApi) {
  const rendered = await renderWithProviders(<Opener request={request} />, { keyboard: true, api })
  await rendered.user.click(screen.getByRole('button', { name: 'Open compose' }))
  const dialog = await screen.findByRole('dialog')
  return { ...rendered, dialog }
}

function conversation(id: string) {
  const found = current().workspace?.conversations.find((entry) => entry.id === id)
  if (!found) throw new Error(`No conversation ${id}`)
  return found
}

beforeEach(() => {
  probe.state = null
  probe.dispatch = null
})

describe('ComposeDialog', () => {
  it('opens a reply titled "Reply" to the conversation, ready to type in the message body', async () => {
    const { dialog } = await openCompose(REPLY)
    expect(dialog).toHaveAccessibleName('Reply')
    expect(dialog).toHaveAccessibleDescription('Your reply is added to the conversation with Avery Park.')
    expect(dialog).toHaveTextContent('To: Avery Park')
    expect(within(dialog).queryByRole('combobox', { name: 'To' })).not.toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveValue('Re: Home monitoring readings')
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveFocus()
  })

  it('opens a new message with a recipient picker of patients', async () => {
    const { dialog } = await openCompose(NEW_MESSAGE)
    expect(dialog).toHaveAccessibleName('New message')
    const to = within(dialog).getByRole('combobox', { name: 'To' })
    expect(to).toHaveFocus()
    expect(within(to).getByRole('option', { name: 'Choose a recipient' })).toHaveProperty('selected', true)
    expect(within(to).getAllByRole('option')).toHaveLength(29)
  })

  it('preselects the patient when messaging one without a conversation', async () => {
    const { dialog } = await openCompose({ patientId: patientIdFor('Casey Morgan'), conversationId: null, draftId: null })
    expect(within(dialog).getByRole('combobox', { name: 'To' })).toHaveValue(patientIdFor('Casey Morgan'))
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveFocus()
  })

  it('marks every field of a new message as required, so screen readers say so before the first Send', async () => {
    const { dialog } = await openCompose(NEW_MESSAGE)
    expect(within(dialog).getByRole('combobox', { name: 'To' })).toBeRequired()
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toBeRequired()
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toBeRequired()
  })

  it('marks the subject and message of a reply as required (the recipient is fixed)', async () => {
    const { dialog } = await openCompose(REPLY)
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toBeRequired()
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toBeRequired()
  })

  it('limits the subject and message to what the workspace can store', async () => {
    const { dialog } = await openCompose(REPLY)
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveAttribute('maxLength', '200')
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveAttribute('maxLength', '10000')
  })

  it('Send with an empty message focuses the error summary, marks the field and keeps the values', async () => {
    const { dialog, user } = await openCompose(REPLY)
    const subject = within(dialog).getByRole('textbox', { name: 'Subject' })
    await user.clear(subject)
    await user.type(subject, 'Re: readings this week')
    await user.click(within(dialog).getByRole('button', { name: 'Send' }))

    const summary = within(dialog).getByRole('alert')
    expect(summary).toHaveFocus()
    expect(within(summary).getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument()
    const message = within(dialog).getByRole('textbox', { name: 'Message' })
    expect(message).toHaveAttribute('aria-invalid', 'true')
    expect(message).toHaveAccessibleDescription('Enter a message.')
    expect(subject).toHaveValue('Re: readings this week')
    expect(subject).not.toHaveAttribute('aria-invalid')

    await user.click(within(summary).getByRole('link', { name: 'Enter a message.' }))
    expect(message).toHaveFocus()
    expect(current().ui.modal?.kind).toBe('compose')
  })

  it('lists every problem for a new message, and each summary link moves to its field', async () => {
    const { dialog, user } = await openCompose(NEW_MESSAGE)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Your results are ready.')
    await user.keyboard('{Control>}{Enter}{/Control}')

    const summary = within(dialog).getByRole('alert')
    expect(summary).toHaveFocus()
    expect(within(summary).getByRole('heading', { name: 'There are 2 problems' })).toBeInTheDocument()
    const links = within(summary).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Choose a recipient.', 'Enter a subject.'])
    expect(links[0]).toHaveAttribute('href', '#compose-to')

    await user.click(links[0])
    expect(within(dialog).getByRole('combobox', { name: 'To' })).toHaveFocus()
    await user.click(links[1])
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveFocus()
    expect(within(dialog).getByRole('combobox', { name: 'To' })).toHaveAccessibleDescription('Choose a recipient.')
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue('Your results are ready.')
  })

  it('Ctrl+Enter sends a reply: the conversation gains the message and the patient activity records it', async () => {
    const { dialog, user } = await openCompose(REPLY)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Thanks, I will review them before your visit.')
    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const thread = conversation('c-home-monitoring')
    expect(thread.messages).toHaveLength(2)
    expect(thread.messages[1]).toMatchObject({
      author: 'Jordan Lee, RN',
      body: 'Thanks, I will review them before your visit.',
      outgoing: true,
      at: FIXED_NOW.toISOString()
    })
    const avery = current().workspace?.patients.find((patient) => patient.id === AVERY)
    expect(avery?.activity[0]).toMatchObject({ kind: 'message', title: 'Message sent', detail: 'Re: Home monitoring readings' })
    expect(current().ui.status?.text).toBe('Message sent to Avery Park.')
    await waitFor(() => expect(liveRegionText()).toBe('Message sent to Avery Park.'))
    expect(screen.getByRole('button', { name: 'Open compose' })).toHaveFocus()
    expect(current().workspace?.drafts).toEqual([])
  })

  it('sends a new message to the chosen patient as a new conversation', async () => {
    const { dialog, user } = await openCompose(NEW_MESSAGE)
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'To' }), 'Morgan Chen')
    await user.type(within(dialog).getByRole('textbox', { name: 'Subject' }), 'Exercise goals')
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Three short walks a week is a good start.')
    await user.click(within(dialog).getByRole('button', { name: 'Send' }))

    const [newest] = current().workspace?.conversations ?? []
    expect(newest).toMatchObject({ patientId: MORGAN, with: 'Morgan Chen', subject: 'Exercise goals', unread: false })
    expect(newest.messages).toHaveLength(1)
    expect(current().ui.status?.text).toBe('Message sent to Morgan Chen.')
  })

  it('Ctrl+S saves a draft and keeps the dialog open', async () => {
    const { dialog, user } = await openCompose(REPLY)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Draft reply')
    await user.keyboard('{Control>}s{/Control}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue('Draft reply')
    expect(current().workspace?.drafts).toEqual([
      expect.objectContaining({ conversationId: 'c-home-monitoring', patientId: AVERY, to: 'Avery Park', subject: 'Re: Home monitoring readings', body: 'Draft reply' })
    ])
    expect(current().ui.status?.text).toBe('Draft saved.')
    await waitFor(() => expect(liveRegionText()).toBe('Draft saved.'))
  })

  it('says there is nothing to save when nothing has been typed', async () => {
    const { dialog, user } = await openCompose(REPLY)
    await user.click(within(dialog).getByRole('button', { name: 'Save draft' }))
    expect(current().workspace?.drafts).toEqual([])
    expect(current().ui.status?.text).toBe('Nothing to save yet.')
  })

  it('sending after saving a draft removes that draft instead of leaving a duplicate', async () => {
    const { dialog, user } = await openCompose(REPLY)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Saved, then sent')
    await user.keyboard('{Control>}s{/Control}')
    expect(current().workspace?.drafts).toHaveLength(1)

    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(current().workspace?.drafts).toEqual([])
    expect(conversation('c-home-monitoring').messages.at(-1)?.body).toBe('Saved, then sent')
  })

  it('Ctrl+Shift+A attaches the chosen document, lists it and announces it; Remove takes it off again', async () => {
    const api = createMemoryApi()
    api.nextAttachment = { name: 'readings.pdf', size: 52_000 }
    const { dialog, user } = await openCompose(REPLY, api)
    await user.keyboard('{Control>}{Shift>}A{/Shift}{/Control}')

    const list = await within(dialog).findByRole('list', { name: 'Attachments' })
    expect(list).toHaveTextContent('readings.pdf')
    expect(list).toHaveTextContent('51 KB')
    await waitFor(() => expect(liveRegionText()).toBe('readings.pdf attached.'))
    expect(api.pickAttachment).toHaveBeenCalledTimes(1)

    // Attaching the same file twice is reported, not duplicated.
    await user.click(within(dialog).getByRole('button', { name: 'Attach document…' }))
    await waitFor(() => expect(liveRegionText()).toBe('readings.pdf is already attached.'))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)

    await user.click(within(dialog).getByRole('button', { name: 'Remove readings.pdf' }))
    expect(within(dialog).queryByRole('list', { name: 'Attachments' })).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Attach document…' })).toHaveFocus()
    await waitFor(() => expect(liveRegionText()).toBe('readings.pdf removed.'))
  })

  it('sends attachments with the message, and attaches nothing when the picker is cancelled', async () => {
    const api = createMemoryApi()
    const { dialog, user } = await openCompose(REPLY, api)
    await user.click(within(dialog).getByRole('button', { name: 'Attach document…' }))
    expect(api.pickAttachment).toHaveBeenCalledTimes(1)
    expect(within(dialog).queryByRole('list', { name: 'Attachments' })).not.toBeInTheDocument()

    api.nextAttachment = { name: 'a.txt', size: 10 }
    await user.click(within(dialog).getByRole('button', { name: 'Attach document…' }))
    api.nextAttachment = { name: 'b.txt', size: 20 }
    await user.click(within(dialog).getByRole('button', { name: 'Attach document…' }))
    await within(dialog).findByRole('button', { name: 'Remove b.txt' })

    // Removing the first moves focus to the next remove button.
    await user.click(within(dialog).getByRole('button', { name: 'Remove a.txt' }))
    expect(within(dialog).getByRole('button', { name: 'Remove b.txt' })).toHaveFocus()

    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'See attached.')
    await user.click(within(dialog).getByRole('button', { name: 'Send' }))
    expect(conversation('c-home-monitoring').messages.at(-1)?.attachments).toEqual([{ name: 'b.txt', size: 20 }])
  })

  it('stops at the attachment limit the workspace can store', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    const attachments = Array.from({ length: 20 }, (_, index) => ({ name: `page-${index + 1}.pdf`, size: 1000 + index }))
    workspace.drafts = [{ id: 'd-full', conversationId: null, patientId: MORGAN, to: 'Morgan Chen', subject: 'Scans', body: 'All pages', attachments, updatedAt: FIXED_NOW.toISOString() }]
    const api = createMemoryApi({ workspace })
    const { dialog, user } = await openCompose({ patientId: null, conversationId: null, draftId: 'd-full' }, api)
    await user.click(within(dialog).getByRole('button', { name: 'Attach document…' }))
    expect(api.pickAttachment).not.toHaveBeenCalled()
    expect(current().ui.status).toMatchObject({ tone: 'warning', text: 'You can attach up to 20 documents to one message.' })
  })

  it('reports a failed attachment pick without losing the message', async () => {
    const api = createMemoryApi()
    api.pickAttachment.mockRejectedValueOnce(new Error('The file could not be read'))
    const { dialog, user } = await openCompose(REPLY, api)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Keep me')
    await user.click(within(dialog).getByRole('button', { name: 'Attach document…' }))
    await waitFor(() => expect(liveRegionText('assertive')).toBe('Couldn’t attach the document: The file could not be read'))
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue('Keep me')
  })

  it('Escape with typed text saves a draft and says so', async () => {
    const { dialog, user } = await openCompose(REPLY)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Half-written reply')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ conversationId: 'c-home-monitoring', body: 'Half-written reply' })])
    expect(current().ui.status?.text).toBe('Draft saved.')
    expect(screen.getByRole('button', { name: 'Open compose' })).toHaveFocus()
  })

  it('the Close button also keeps typed text, including a subject typed on its own', async () => {
    const { dialog, user } = await openCompose(NEW_MESSAGE)
    await user.type(within(dialog).getByRole('textbox', { name: 'Subject' }), 'Only a subject')
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ subject: 'Only a subject', body: '', patientId: null, to: '' })])
    expect(current().ui.status?.text).toBe('Draft saved.')
  })

  it('closing an untouched message saves nothing', async () => {
    const { user } = await openCompose(REPLY)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(current().workspace?.drafts).toEqual([])
    expect(current().ui.status).toBeNull()
  })

  it('restores a saved draft, updates it as it is typed and removes it once sent', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.drafts = [
      {
        id: 'd-saved',
        conversationId: null,
        patientId: MORGAN,
        to: 'Morgan Chen',
        subject: 'Exercise goals',
        body: 'Hi Morgan,',
        attachments: [{ name: 'goals.pdf', size: 2048 }],
        updatedAt: FIXED_NOW.toISOString()
      }
    ]
    const api = createMemoryApi({ workspace })
    const { dialog, user } = await openCompose({ patientId: MORGAN, conversationId: null, draftId: 'd-saved' }, api)
    expect(dialog).toHaveAccessibleName('New message')
    expect(within(dialog).getByRole('combobox', { name: 'To' })).toHaveValue(MORGAN)
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveValue('Exercise goals')
    const message = within(dialog).getByRole('textbox', { name: 'Message' })
    expect(message).toHaveValue('Hi Morgan,')
    expect(message).toHaveFocus()
    expect(within(dialog).getByRole('list', { name: 'Attachments' })).toHaveTextContent('goals.pdf')

    await user.type(message, ' see the plan.')
    // Updated as it is typed, not only on close.
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ id: 'd-saved', body: 'Hi Morgan, see the plan.' })])
    await user.keyboard('{Escape}')
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ id: 'd-saved', body: 'Hi Morgan, see the plan.' })])

    await user.click(screen.getByRole('button', { name: 'Open compose' }))
    const reopened = await screen.findByRole('dialog')
    expect(within(reopened).getByRole('textbox', { name: 'Message' })).toHaveValue('Hi Morgan, see the plan.')
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(current().workspace?.drafts).toEqual([])
    expect(current().workspace?.conversations[0]).toMatchObject({ with: 'Morgan Chen', subject: 'Exercise goals' })
  })

  it('opening an unchanged draft and closing it leaves it alone and stays quiet', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    const draft = { id: 'd-1', conversationId: 'c-home-monitoring', patientId: AVERY, to: 'Avery Park', subject: 'Re: Home monitoring readings', body: 'Hello', attachments: [], updatedAt: FIXED_NOW.toISOString() }
    workspace.drafts = [draft]
    const { user } = await openCompose({ patientId: null, conversationId: null, draftId: 'd-1' }, createMemoryApi({ workspace }))
    await user.keyboard('{Escape}')
    expect(current().workspace?.drafts).toEqual([draft])
    expect(current().ui.status).toBeNull()
  })

  it('deletes the draft it created once the text is cleared again, and closes quietly', async () => {
    const { dialog, user } = await openCompose(NEW_MESSAGE)
    const message = within(dialog).getByRole('textbox', { name: 'Message' })
    await user.type(message, 'Second thoughts')
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ body: 'Second thoughts' })])

    await user.clear(message)
    expect(current().workspace?.drafts).toEqual([])
    await user.keyboard('{Escape}')
    expect(current().workspace?.drafts).toEqual([])
    expect(current().ui.status).toBeNull()
  })

  it('clearing a saved draft deletes it rather than letting the old text come back, and says so', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.drafts = [
      { id: 'd-1', conversationId: null, patientId: MORGAN, to: 'Morgan Chen', subject: 'Exercise goals', body: 'Hi Morgan', attachments: [], updatedAt: FIXED_NOW.toISOString() }
    ]
    const { dialog, user } = await openCompose({ patientId: null, conversationId: null, draftId: 'd-1' }, createMemoryApi({ workspace }))
    await user.clear(within(dialog).getByRole('textbox', { name: 'Subject' }))
    await user.clear(within(dialog).getByRole('textbox', { name: 'Message' }))
    expect(current().workspace?.drafts).toEqual([])

    // Ctrl+S on the emptied draft explains where it went; the dialog stays open.
    await user.keyboard('{Control>}s{/Control}')
    expect(current().ui.status).toMatchObject({ tone: 'info', text: 'Empty draft deleted.' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Typing again brings the draft back under the same id.
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Changed my mind')
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ id: 'd-1', subject: '', body: 'Changed my mind' })])
  })

  it('closing a saved draft after clearing it says the empty draft was deleted', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.drafts = [
      { id: 'd-reply', conversationId: 'c-home-monitoring', patientId: AVERY, to: 'Avery Park', subject: 'Re: Home monitoring readings', body: 'Started earlier', attachments: [], updatedAt: FIXED_NOW.toISOString() }
    ]
    const { dialog, user } = await openCompose(REPLY, createMemoryApi({ workspace }))
    await user.clear(within(dialog).getByRole('textbox', { name: 'Message' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(current().workspace?.drafts).toEqual([])
    expect(current().ui.status).toMatchObject({ tone: 'info', text: 'Empty draft deleted.' })

    // Replying again starts fresh: the old text does not come back.
    await user.click(screen.getByRole('button', { name: 'Open compose' }))
    expect(within(await screen.findByRole('dialog')).getByRole('textbox', { name: 'Message' })).toHaveValue('')
  })

  it('Reply resumes the conversation’s saved reply draft rather than starting another', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.drafts = [
      { id: 'd-reply', conversationId: 'c-home-monitoring', patientId: AVERY, to: 'Avery Park', subject: 'Re: Home monitoring readings', body: 'Started earlier', attachments: [], updatedAt: FIXED_NOW.toISOString() }
    ]
    const { dialog } = await openCompose(REPLY, createMemoryApi({ workspace }))
    expect(dialog).toHaveAccessibleName('Reply')
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue('Started earlier')
  })

  it('runs Send, Save draft and Attach from the native menu while open', async () => {
    const api = createMemoryApi()
    const { dialog, user } = await openCompose(REPLY, api)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'From the menu')

    act(() => api.emitCommand({ id: 'message.saveDraft' }))
    expect(current().workspace?.drafts).toHaveLength(1)

    api.nextAttachment = { name: 'menu.pdf', size: 900 }
    act(() => api.emitCommand({ id: 'message.attach' }))
    expect(await within(dialog).findByRole('button', { name: 'Remove menu.pdf' })).toBeInTheDocument()

    act(() => api.emitCommand({ id: 'message.send' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(conversation('c-home-monitoring').messages.at(-1)).toMatchObject({ body: 'From the menu', attachments: [{ name: 'menu.pdf', size: 900 }] })
    expect(current().workspace?.drafts).toEqual([])
  })

  it('keeps typed text even when something else closes the dialog', async () => {
    const { dialog, user } = await openCompose(NEW_MESSAGE)
    await user.type(within(dialog).getByRole('textbox', { name: 'Message' }), 'Not lost')
    act(() => probe.dispatch?.({ type: 'ui/closeModal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ body: 'Not lost' })])
  })

  it('has no axe violations, including with the error summary showing', async () => {
    const { dialog, user } = await openCompose(NEW_MESSAGE)
    expect(await axe(dialog, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
    await user.click(within(dialog).getByRole('button', { name: 'Send' }))
    expect(await axe(dialog, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})

describe('ComposeDialog and closing the window', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  /** The `unsavedChanges` in the latest ui:state report: main's close guard holds a window close while it is above 0. */
  function lastUnsavedChanges(api: MemoryApi): number | undefined {
    return api.updateUiState.mock.calls.at(-1)?.[0].unsavedChanges
  }

  async function advance(ms: number): Promise<void> {
    await act(async () => {
      jest.advanceTimersByTime(ms)
    })
  }

  async function openWithFakeTimers(request: ComposeRequest) {
    const api = createMemoryApi()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(
      <ApiProvider api={api}>
        <ClockProvider now={() => FIXED_NOW}>
          <AnnouncerProvider>
            <AppStateProvider>
              <CommandProvider>
                <Opener request={request} />
                <ModalHost />
              </CommandProvider>
            </AppStateProvider>
          </AnnouncerProvider>
        </ClockProvider>
      </ApiProvider>
    )
    await user.click(await screen.findByRole('button', { name: 'Open compose' }))
    const dialog = await screen.findByRole('dialog')
    return { user, dialog, api }
  }

  it('puts every keystroke in the workspace at once, so closing the window straight after typing waits for the write', async () => {
    const { user, dialog, api } = await openWithFakeTimers(REPLY)
    expect(lastUnsavedChanges(api)).toBe(0)

    const message = within(dialog).getByRole('textbox', { name: 'Message' })
    await user.type(message, 'Hi')
    // No timer has run, yet the text is already a workspace change: no window for Alt+F4, Exit or tray Quit to lose it.
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ conversationId: 'c-home-monitoring', body: 'Hi' })])
    expect(lastUnsavedChanges(api)).toBeGreaterThan(0)
    expect(api.saveWorkspace).not.toHaveBeenCalled()
    expect(current().ui.status).toBeNull()

    // The workspace autosave writes it, and only then does the count the close guard waits on return to 0.
    await advance(SAVE_DEBOUNCE_MS)
    expect(api.saved.at(-1)?.drafts).toEqual([expect.objectContaining({ body: 'Hi' })])
    expect(lastUnsavedChanges(api)).toBe(0)

    // The next keystroke is guarded again straight away, and updates the same draft.
    await user.type(message, '!')
    expect(lastUnsavedChanges(api)).toBeGreaterThan(0)
    expect(current().workspace?.drafts).toEqual([expect.objectContaining({ body: 'Hi!' })])
    await advance(SAVE_DEBOUNCE_MS)
    expect(api.saved.at(-1)?.drafts).toEqual([expect.objectContaining({ body: 'Hi!' })])

    // Closing the dialog reports the draft that already exists.
    await user.keyboard('{Escape}')
    expect(current().workspace?.drafts).toHaveLength(1)
    expect(current().ui.status?.text).toBe('Draft saved.')
  })
})
