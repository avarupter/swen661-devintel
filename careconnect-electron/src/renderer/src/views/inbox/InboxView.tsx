import { flushSync } from 'react-dom'
import { formatActivityTime, formatBytes, formatTimeAgo, pluralize } from '../../../../shared/format'
import type { Conversation, Patient } from '../../../../shared/model'
import { useCommandHandler, useCommands } from '../../commands/CommandProvider'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { Toolbar, ToolbarButton } from '../../components/Toolbar'
import { useAppDispatch, useAppState, useStatus, useWorkspace } from '../../state/AppStateProvider'
import { blocksNewModal } from '../../state/appState'
import { useNow } from '../../state/clock'
import { conversationById, patientById, sortedConversations } from '../../state/selectors'
import { conversationLabel, conversationPreview, conversationTime, draftLabel, sortedDrafts } from './inboxModel'
import './inbox.css'

const SUBJECT_HEADING_ID = 'conversation-subject-heading'
/** How far PageUp and PageDown move in the conversation list. */
const PAGE_SIZE = 10

function optionId(conversationId: string): string {
  return `conversation-option-${conversationId}`
}

function ConversationDetail({
  conversation,
  patient,
  now,
  onToggleUnread,
  onOpenPatient
}: {
  conversation: Conversation
  patient: Patient | null
  now: Date
  onToggleUnread(): void
  onOpenPatient(patient: Patient): void
}): React.JSX.Element {
  return (
    <>
      <header className="reading-pane__header">
        <h2 id={SUBJECT_HEADING_ID} className="reading-pane__subject" tabIndex={-1}>
          {conversation.subject}
        </h2>
        <p className="reading-pane__meta">
          With {conversation.with}
          {patient ? ` · Care ID ${patient.careId}` : ''} · {pluralize(conversation.messages.length, 'message')}
        </p>
        <Toolbar label={`Actions for ${conversation.subject}`} className="reading-pane__actions">
          <ToolbarButton id="inbox-reply" command="message.reply" label={`Reply to ${conversation.with}`} icon="reply">
            Reply
          </ToolbarButton>
          <ToolbarButton
            id="inbox-toggle-unread"
            label={conversation.unread ? 'Mark as read' : 'Mark as unread'}
            icon={conversation.unread ? 'checkCircle' : 'inbox'}
            onClick={onToggleUnread}
          />
          {patient && (
            <ToolbarButton id="inbox-open-patient" label={`Open patient record for ${patient.name}`} icon="users" onClick={() => onOpenPatient(patient)}>
              Open patient record
            </ToolbarButton>
          )}
        </Toolbar>
      </header>

      <ol className="message-list">
        {conversation.messages.map((message) => {
          const authorId = `message-${message.id}-author`
          const timeId = `message-${message.id}-time`
          return (
            <li key={message.id}>
              <article className={`message${message.outgoing ? ' message--outgoing' : ''}`} aria-labelledby={`${authorId} ${timeId}`}>
                <div className="message__header">
                  <Avatar name={message.author} size="small" tone={message.outgoing ? 'brand' : 'neutral'} />
                  <h3 id={authorId} className="message__author">
                    {message.author}
                  </h3>
                  <time id={timeId} className="message__time" dateTime={message.at}>
                    {formatActivityTime(message.at, now)}
                  </time>
                </div>
                <p className="message__body">{message.body}</p>
                {message.attachments.length > 0 && (
                  <ul className="message__attachments" aria-label="Attachments">
                    {message.attachments.map((attachment) => (
                      <li key={`${attachment.name}-${attachment.size}`} className="message__attachment">
                        <Icon name="paperclip" />
                        <span className="message__attachment-name">{attachment.name}</span>{' '}
                        <span className="message__attachment-size">{formatBytes(attachment.size)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          )
        })}
      </ol>
    </>
  )
}

/**
 * Inbox: saved drafts and the conversation listbox (selection follows focus)
 * on the left, the reading pane on the right. Selecting a conversation marks
 * it read; R or Reply answers it in the compose dialog.
 */
export function InboxView(): React.JSX.Element {
  const workspace = useWorkspace()
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const { run, openModal } = useCommands()
  const setStatus = useStatus()
  const now = useNow()

  const conversations = sortedConversations(workspace.conversations)
  const drafts = sortedDrafts(workspace.drafts)
  const selected = conversationById(workspace, ui.selectedConversationId)
  const activeId = selected?.id ?? conversations[0]?.id ?? null
  const selectedPatient = selected ? patientById(workspace, selected.patientId) : null

  const select = (conversation: Conversation): void => {
    if (ui.selectedConversationId !== conversation.id) dispatch({ type: 'ui/selectConversation', conversationId: conversation.id })
    if (conversation.unread) dispatch({ type: 'conversation/setUnread', conversationId: conversation.id, unread: false })
  }

  useCommandHandler(
    'message.reply',
    () => {
      if (!selected) return
      // Like every other dialog command, never stack on top of an open dialog.
      if (blocksNewModal(ui.modal)) {
        setStatus('Close the open dialog first.', 'info')
        return
      }
      openModal({ kind: 'compose', patientId: selected.patientId, conversationId: selected.id, draftId: null })
    },
    selected !== null
  )

  const onOptionKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const last = conversations.length - 1
    // Arriving by Tab or F6 focuses an option without selecting it (nothing is marked read on the way
    // past), so the first arrow press selects the focused option rather than skipping over it.
    const step = conversations[index].id === selected?.id ? 1 : 0
    let target: number
    switch (event.key) {
      case 'ArrowDown':
        target = Math.min(index + step, last)
        break
      case 'ArrowUp':
        target = Math.max(index - step, 0)
        break
      case 'Home':
        target = 0
        break
      case 'End':
        target = last
        break
      case 'PageDown':
        target = Math.min(index + PAGE_SIZE, last)
        break
      case 'PageUp':
        target = Math.max(index - PAGE_SIZE, 0)
        break
      case ' ':
        event.preventDefault()
        select(conversations[index])
        return
      case 'Enter':
        event.preventDefault()
        flushSync(() => select(conversations[index]))
        document.getElementById(SUBJECT_HEADING_ID)?.focus()
        return
      default:
        return
    }
    event.preventDefault()
    const next = conversations[target]
    document.getElementById(optionId(next.id))?.focus()
    select(next)
  }

  const toggleUnread = (): void => {
    if (!selected) return
    const unread = !selected.unread
    dispatch({ type: 'conversation/setUnread', conversationId: selected.id, unread })
    setStatus(unread ? 'Conversation marked as unread.' : 'Conversation marked as read.', 'info')
  }

  return (
    <div className="view inbox">
      <section className="card inbox__pane inbox__list" data-region="list" aria-label="Message list">
        {drafts.length > 0 && (
          <div className="inbox__group">
            <h2 id="inbox-drafts-heading" className="inbox__heading">
              Drafts ({drafts.length})
            </h2>
            <ul className="draft-list" aria-labelledby="inbox-drafts-heading">
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <button
                    type="button"
                    className="draft-item focus-inset"
                    onClick={() => openModal({ kind: 'compose', patientId: draft.patientId, conversationId: draft.conversationId, draftId: draft.id })}
                  >
                    <Icon name="edit" className="draft-item__icon" />
                    <span className="visually-hidden">{draftLabel(draft, now)}</span>
                    <span className="draft-item__text" aria-hidden="true">
                      <span className="draft-item__top">
                        <span className="draft-item__to">To {draft.to.trim() || 'no recipient yet'}</span>
                        <time className="draft-item__time" dateTime={draft.updatedAt}>
                          {formatTimeAgo(draft.updatedAt, now)}
                        </time>
                      </span>
                      <span className="draft-item__subject">{draft.subject.trim() || 'No subject'}</span>
                      {draft.body.trim() && <span className="draft-item__preview">{draft.body.replace(/\s+/g, ' ').trim()}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="inbox__group">
          <h2 id="inbox-conversations-heading" className="inbox__heading">
            Conversations
          </h2>
          {conversations.length === 0 ? (
            <p className="empty-state">No conversations yet.</p>
          ) : (
            <div role="listbox" aria-labelledby="inbox-conversations-heading" className="conversation-list">
              {conversations.map((conversation, index) => {
                const isSelected = conversation.id === selected?.id
                const latest = conversation.messages[conversation.messages.length - 1]
                const previewId = `conversation-preview-${conversation.id}`
                return (
                  <div
                    key={conversation.id}
                    role="option"
                    id={optionId(conversation.id)}
                    aria-selected={isSelected}
                    aria-describedby={previewId}
                    tabIndex={conversation.id === activeId ? 0 : -1}
                    className={`conversation-option focus-inset${conversation.unread ? ' conversation-option--unread' : ''}`}
                    onClick={() => select(conversation)}
                    onKeyDown={(event) => onOptionKeyDown(event, index)}
                  >
                    <Avatar name={conversation.with} tone={isSelected ? 'brand' : 'neutral'} />
                    {/* One exact spoken name; the visible parts are hidden from screen readers rather than
                        overridden with aria-label (WCAG 2.5.3). The preview stays the description. */}
                    <span className="visually-hidden">{conversationLabel(conversation, now)}</span>
                    <span className="conversation-option__text" aria-hidden="true">
                      <span className="conversation-option__with">{conversation.with}</span>
                      <span className="conversation-option__subject">{conversation.subject}</span>
                      <span id={previewId} className="conversation-option__preview">
                        {conversationPreview(conversation)}
                      </span>
                    </span>
                    <span className="conversation-option__meta" aria-hidden="true">
                      {latest && (
                        <time className="conversation-option__time" dateTime={latest.at}>
                          {conversationTime(latest.at, now)}
                        </time>
                      )}
                      {conversation.unread && <span className="chip chip--info">New</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="card inbox__pane inbox__detail" data-region="detail" aria-label="Reading pane">
        {selected ? (
          <ConversationDetail
            conversation={selected}
            patient={selectedPatient}
            now={now}
            onToggleUnread={toggleUnread}
            onOpenPatient={(patient) => run({ id: 'patient.open', patientId: patient.id })}
          />
        ) : (
          <p className="empty-state inbox__empty">Select a conversation to read it.</p>
        )}
      </section>
    </div>
  )
}
