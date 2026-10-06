/** Text for the Inbox lists: option names (spec card 05), times and one-line previews. */
import { formatRelativeDay, formatTime, formatTimeAgo, isSameDay } from '../../../../shared/format'
import type { Conversation, Draft } from '../../../../shared/model'

function latestMessage(conversation: Conversation) {
  return conversation.messages[conversation.messages.length - 1] ?? null
}

/** "08:05" for today, otherwise "Yesterday" or "Sep 28", as mail clients show it. */
export function conversationTime(at: string, now: Date): string {
  return isSameDay(at, now) ? formatTime(at) : formatRelativeDay(at, now)
}

/** The option's accessible name: "<with>, <subject>, <time>[, unread]". */
export function conversationLabel(conversation: Conversation, now: Date): string {
  const latest = latestMessage(conversation)
  const parts = [conversation.with, conversation.subject]
  if (latest) parts.push(conversationTime(latest.at, now))
  if (conversation.unread) parts.push('unread')
  return parts.join(', ')
}

/** The latest message on one line, prefixed "You:" when it is our own reply. */
export function conversationPreview(conversation: Conversation): string {
  const latest = latestMessage(conversation)
  if (!latest) return ''
  const text = latest.body.replace(/\s+/g, ' ').trim()
  return latest.outgoing ? `You: ${text}` : text
}

/** "Draft to Avery Park, Re: Home monitoring readings, saved 4 minutes ago" */
export function draftLabel(draft: Draft, now: Date): string {
  const saved = formatTimeAgo(draft.updatedAt, now)
  return `Draft to ${draft.to.trim() || 'no recipient yet'}, ${draft.subject.trim() || 'no subject'}, saved ${saved === 'Yesterday' ? 'yesterday' : saved}`
}

export function sortedDrafts(drafts: readonly Draft[]): Draft[] {
  return [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
