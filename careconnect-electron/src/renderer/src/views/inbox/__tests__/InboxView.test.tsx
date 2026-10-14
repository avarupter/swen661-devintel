import { computeAccessibleName } from 'dom-accessibility-api'
import { act, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useEffect } from 'react'
import { createMemoryApi, FIXED_NOW, type MemoryApi } from '../../../../../../tests/renderer/memoryApi'
import { liveRegionText, renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import type { Workspace } from '../../../../../shared/model'
import { createSeedWorkspace, patientIdFor } from '../../../../../shared/seed'
import { AppHeader } from '../../../components/AppHeader'
import { Sidebar } from '../../../components/Sidebar'
import { StatusBar } from '../../../components/StatusBar'
import type { AppState, UiSlice } from '../../../state/appState'
import { useAppState } from '../../../state/AppStateProvider'
import { InboxView } from '../InboxView'

const probe: { state: AppState | null } = { state: null }

function StateProbe(): null {
  const state = useAppState()
  useEffect(() => {
    probe.state = state
  })
  return null
}

function current(): AppState {
  if (!probe.state) throw new Error('The state probe has not rendered')
  return probe.state
}

function Shell(): React.JSX.Element {
  return (
    <>
      <StateProbe />
      <Sidebar />
      <AppHeader />
      <main id="main" aria-labelledby="view-title">
        <InboxView />
      </main>
      <StatusBar />
    </>
  )
}

async function renderInbox(options: { api?: MemoryApi; initialUi?: Partial<UiSlice> } = {}) {
  const rendered = await renderWithProviders(<Shell />, { keyboard: true, api: options.api, initialUi: { view: 'inbox', ...options.initialUi } })
  const listbox = screen.getByRole('listbox', { name: 'Conversations' })
  return { ...rendered, listbox }
}

function options(listbox: HTMLElement): HTMLElement[] {
  return within(listbox).getAllByRole('option')
}

/** The sidebar's Inbox button reads its count once, exactly "Inbox, N unread" (spec card 05). */
function inboxNav(unread: number): string {
  return `Inbox, ${unread} unread`
}

function readingPane(): HTMLElement {
  return screen.getByRole('region', { name: 'Reading pane' })
}

function withDraft(): Workspace {
  const workspace = createSeedWorkspace(FIXED_NOW)
  workspace.drafts = [
    {
      id: 'd-reply',
      conversationId: 'c-home-monitoring',
      patientId: patientIdFor('Avery Park'),
      to: 'Avery Park',
      subject: 'Re: Home monitoring readings',
      body: 'Thanks for sending these.',
      attachments: [],
      updatedAt: new Date(FIXED_NOW.getTime() - 4 * 60_000).toISOString()
    }
  ]
  return workspace
}

beforeEach(() => {
  probe.state = null
})

describe('InboxView', () => {
  it('lists six conversations newest first, four unread, each unread one marked with a "New" chip', async () => {
    const { listbox } = await renderInbox()
    const all = options(listbox)
    expect(all.map((option) => computeAccessibleName(option))).toEqual([
      'Morgan Chen, Question about my care plan, 08:05, unread',
      'Dr. Sam Okafor, Lab results: Riley Singh, 07:48, unread',
      'North Coast Pharmacy, Refill authorization: Jamie Wu, Yesterday, unread',
      'Avery Park, Home monitoring readings, Yesterday, unread',
      'Front desk, Schedule change for Friday, Oct 3',
      'Taylor Lane, Referral paperwork, Sep 28'
    ])
    const unread = all.filter((option) => computeAccessibleName(option).endsWith(', unread'))
    expect(unread).toHaveLength(4)
    for (const option of unread) expect(within(option).getByText('New')).toBeInTheDocument()
    expect(within(all[4]).queryByText('New')).not.toBeInTheDocument()
    expect(all[5]).toHaveAccessibleDescription('You: Please bring a photo ID and a list of your current medicines.')
  })

  it('selects nothing on arrival, so nothing is marked read and Reply explains why it is unavailable', async () => {
    const { listbox, user } = await renderInbox()
    expect(options(listbox).filter((option) => option.getAttribute('aria-selected') === 'true')).toHaveLength(0)
    expect(options(listbox)[0]).toHaveAttribute('tabindex', '0')
    expect(within(readingPane()).getByText('Select a conversation to read it.')).toBeInTheDocument()

    const reply = screen.getByRole('button', { name: 'Reply' })
    expect(reply).toHaveAttribute('aria-disabled', 'true')
    expect(reply).toHaveAccessibleDescription('Select a conversation to reply.')
    await user.click(reply)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: inboxNav(4) })).toBeInTheDocument()
  })

  it('selecting a conversation shows it, marks it read and updates the sidebar count', async () => {
    const { listbox, user } = await renderInbox()
    await user.click(options(listbox)[0])

    const first = options(listbox)[0]
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(first).toHaveAccessibleName('Morgan Chen, Question about my care plan, 08:05')
    expect(screen.getByRole('button', { name: inboxNav(3) })).toBeInTheDocument()

    const pane = readingPane()
    expect(within(pane).getByRole('heading', { level: 2, name: 'Question about my care plan' })).toBeInTheDocument()
    const message = within(pane).getByRole('article', { name: 'Morgan Chen Today · 08:05' })
    expect(message).toHaveTextContent('Can we go over the new exercise goals at the next visit?')
    expect(current().ui.selectedConversationId).toBe('c-care-plan-question')

    // Selecting an already-read conversation is not an unsaved change.
    const revision = current().revision
    await user.click(options(listbox)[0])
    expect(current().revision).toBe(revision)
  })

  it('moves focus and selection with the arrow keys, Home and End', async () => {
    const { listbox, user } = await renderInbox()
    await user.click(options(listbox)[0])
    await user.keyboard('{ArrowDown}')
    expect(options(listbox)[1]).toHaveFocus()
    expect(options(listbox)[1]).toHaveAttribute('aria-selected', 'true')
    expect(options(listbox)[0]).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('button', { name: inboxNav(2) })).toBeInTheDocument()
    expect(within(readingPane()).getByRole('heading', { level: 2 })).toHaveTextContent('Lab results: Riley Singh')

    await user.keyboard('{End}')
    expect(options(listbox)[5]).toHaveFocus()
    expect(options(listbox)[5]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(options(listbox)[5]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(options(listbox)[0]).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(options(listbox)[0]).toHaveFocus()
    await user.keyboard('{PageDown}')
    expect(options(listbox)[5]).toHaveFocus()
    await user.keyboard('{PageUp}')
    expect(options(listbox)[0]).toHaveFocus()
    expect(options(listbox)[0]).toHaveAttribute('tabindex', '0')
    expect(options(listbox)[5]).toHaveAttribute('tabindex', '-1')
  })

  it.each(['{ArrowDown}', '{ArrowUp}'])(
    'with nothing selected, the first %s selects the focused conversation instead of skipping past it',
    async (key) => {
      const { listbox, user } = await renderInbox()
      // Arriving in the list (Tab or F6) focuses the first option without selecting it or marking it read.
      options(listbox)[0].focus()
      expect(options(listbox)[0]).toHaveAttribute('aria-selected', 'false')
      expect(screen.getByRole('button', { name: inboxNav(4) })).toBeInTheDocument()

      await user.keyboard(key)
      expect(options(listbox)[0]).toHaveFocus()
      expect(options(listbox)[0]).toHaveAttribute('aria-selected', 'true')
      expect(current().ui.selectedConversationId).toBe('c-care-plan-question')
      expect(screen.getByRole('button', { name: inboxNav(3) })).toBeInTheDocument()

      // From there the arrows move focus and selection together.
      await user.keyboard('{ArrowDown}')
      expect(options(listbox)[1]).toHaveFocus()
      expect(options(listbox)[1]).toHaveAttribute('aria-selected', 'true')
      expect(options(listbox)[0]).toHaveAttribute('aria-selected', 'false')
    }
  )

  it('Space selects the focused conversation and Enter moves to the reading pane heading', async () => {
    const { listbox, user } = await renderInbox()
    options(listbox)[0].focus()
    await user.keyboard(' ')
    expect(options(listbox)[0]).toHaveAttribute('aria-selected', 'true')

    options(listbox)[3].focus()
    await user.keyboard('{Enter}')
    const heading = within(readingPane()).getByRole('heading', { level: 2, name: 'Home monitoring readings' })
    expect(heading).toHaveFocus()
    expect(current().ui.selectedConversationId).toBe('c-home-monitoring')
  })

  it('R opens a reply titled "Reply" with a "Re:" subject', async () => {
    const { listbox, user } = await renderInbox()
    await user.click(options(listbox)[0])
    await user.keyboard('r')
    const dialog = await screen.findByRole('dialog', { name: 'Reply' })
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveValue('Re: Question about my care plan')
    expect(dialog).toHaveTextContent('To: Morgan Chen')
  })

  it('names the reading pane’s actions for the conversation; Reply there and in the toolbar both open compose', async () => {
    const { listbox, user } = await renderInbox()
    await user.click(options(listbox)[1])
    const actions = within(readingPane()).getByRole('toolbar', { name: 'Actions for Lab results: Riley Singh' })
    await user.click(within(actions).getByRole('button', { name: 'Reply to Dr. Sam Okafor' }))
    expect(await screen.findByRole('dialog', { name: 'Reply' })).toHaveTextContent('To: Dr. Sam Okafor')
    await user.keyboard('{Escape}')

    const toolbarReply = screen.getByRole('button', { name: 'Reply' })
    expect(toolbarReply).not.toHaveAttribute('aria-disabled')
    await user.click(toolbarReply)
    expect(await screen.findByRole('dialog', { name: 'Reply' })).toBeInTheDocument()
  })

  it('refuses to open a reply on top of another dialog', async () => {
    const { listbox, user, api } = await renderInbox()
    await user.click(options(listbox)[0])
    act(() => api.emitCommand({ id: 'message.new' }))
    expect(await screen.findByRole('dialog', { name: 'New message' })).toBeInTheDocument()
    act(() => api.emitCommand({ id: 'message.reply' }))
    expect(screen.getByRole('dialog', { name: 'New message' })).toBeInTheDocument()
    expect(current().ui.status?.text).toBe('Close the open dialog first.')
  })

  it('Mark as unread puts the conversation back, and the button turns into Mark as read', async () => {
    const { listbox, user } = await renderInbox()
    await user.click(options(listbox)[0])
    expect(screen.getByRole('button', { name: inboxNav(3) })).toBeInTheDocument()

    await user.click(within(readingPane()).getByRole('button', { name: 'Mark as unread' }))
    expect(options(listbox)[0]).toHaveAccessibleName('Morgan Chen, Question about my care plan, 08:05, unread')
    expect(screen.getByRole('button', { name: inboxNav(4) })).toBeInTheDocument()
    expect(current().ui.status?.text).toBe('Conversation marked as unread.')
    await waitFor(() => expect(liveRegionText()).toBe('Conversation marked as unread.'))

    const markRead = within(readingPane()).getByRole('button', { name: 'Mark as read' })
    expect(markRead).toHaveFocus()
    await user.click(markRead)
    expect(screen.getByRole('button', { name: inboxNav(3) })).toBeInTheDocument()
    expect(current().ui.status?.text).toBe('Conversation marked as read.')
  })

  it('lists saved drafts above the conversations and opens them in compose', async () => {
    const { user } = await renderInbox({ api: createMemoryApi({ workspace: withDraft() }) })
    const drafts = screen.getByRole('list', { name: 'Drafts (1)' })
    const draft = within(drafts).getByRole('button', { name: 'Draft to Avery Park, Re: Home monitoring readings, saved 4 minutes ago' })
    expect(draft).toHaveTextContent('Thanks for sending these.')
    await user.click(draft)
    const dialog = await screen.findByRole('dialog', { name: 'Reply' })
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue('Thanks for sending these.')
  })

  it('hides the drafts list when there are none', async () => {
    await renderInbox()
    expect(screen.queryByRole('heading', { name: /^Drafts/ })).not.toBeInTheDocument()
  })

  it('shows outgoing messages, attachments with their sizes, and opens the linked patient record', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    const referral = workspace.conversations.find((conversation) => conversation.id === 'c-referral')
    if (!referral) throw new Error('missing seed conversation')
    referral.messages[1].attachments = [{ name: 'what-to-bring.pdf', size: 12_400 }]
    const { listbox, user } = await renderInbox({ api: createMemoryApi({ workspace }) })
    await user.click(options(listbox)[5])

    const pane = readingPane()
    const messages = within(pane).getAllByRole('article')
    expect(messages).toHaveLength(2)
    expect(messages[1]).toHaveAccessibleName('Jordan Lee, RN Sep 28 · 11:02')
    expect(within(messages[1]).getByRole('list', { name: 'Attachments' })).toHaveTextContent('what-to-bring.pdf 12 KB')
    expect(within(pane).getByText(/With Taylor Lane · Care ID CC-1061 · 2 messages/)).toBeInTheDocument()

    await user.click(within(pane).getByRole('button', { name: 'Open patient record for Taylor Lane' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeInTheDocument()
    expect(current().ui.selectedPatientId).toBe(patientIdFor('Taylor Lane'))
  })

  it('offers no patient record for a conversation with a colleague or team', async () => {
    const { listbox, user } = await renderInbox()
    await user.click(options(listbox)[4])
    expect(within(readingPane()).queryByRole('button', { name: /Open patient record/ })).not.toBeInTheDocument()
  })

  it('treats a selection that no longer exists as no selection', async () => {
    await renderInbox({ initialUi: { selectedConversationId: 'c-deleted' } })
    expect(within(readingPane()).getByText('Select a conversation to read it.')).toBeInTheDocument()
  })

  it('exposes list and detail regions for F6, and no main region inside them', async () => {
    const { container } = await renderInbox()
    const regions = Array.from(container.querySelectorAll<HTMLElement>('main [data-region]'), (element) => element.dataset.region)
    expect(regions).toEqual(['list', 'detail'])
  })

  it('has no axe violations, with and without a conversation open', async () => {
    const { listbox, user, container } = await renderInbox({ api: createMemoryApi({ workspace: withDraft() }) })
    const rules = { rules: { 'color-contrast': { enabled: false } } }
    expect(await axe(container, rules)).toHaveNoViolations()
    await user.click(options(listbox)[0])
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
