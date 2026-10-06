import type { Conversation, Draft } from '../../../../../shared/model'
import { createSeedWorkspace } from '../../../../../shared/seed'
import { conversationLabel, conversationPreview, conversationTime, draftLabel, sortedDrafts } from '../inboxModel'

const NOW = new Date(2026, 9, 5, 9, 42)

function seedConversation(id: string): Conversation {
  const found = createSeedWorkspace(NOW).conversations.find((conversation) => conversation.id === id)
  if (!found) throw new Error(id)
  return found
}

function draft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'd-1',
    conversationId: 'c-home-monitoring',
    patientId: 'p-avery-park',
    to: 'Avery Park',
    subject: 'Re: Home monitoring readings',
    body: 'Thanks',
    attachments: [],
    updatedAt: new Date(2026, 9, 5, 9, 38).toISOString(),
    ...overrides
  }
}

describe('conversationTime', () => {
  it('shows the time for today, otherwise the day', () => {
    expect(conversationTime(new Date(2026, 9, 5, 8, 5).toISOString(), NOW)).toBe('08:05')
    expect(conversationTime(new Date(2026, 9, 4, 17, 10).toISOString(), NOW)).toBe('Yesterday')
    expect(conversationTime(new Date(2026, 8, 28, 11, 2).toISOString(), NOW)).toBe('Sep 28')
  })
})

describe('conversationLabel', () => {
  it('reads "<with>, <subject>, <time>" and adds "unread" only when unread', () => {
    expect(conversationLabel(seedConversation('c-care-plan-question'), NOW)).toBe('Morgan Chen, Question about my care plan, 08:05, unread')
    expect(conversationLabel(seedConversation('c-referral'), NOW)).toBe('Taylor Lane, Referral paperwork, Sep 28')
  })

  it('copes with a conversation that has no messages', () => {
    const empty: Conversation = { id: 'c-x', patientId: null, subject: 'Empty', with: 'Front desk', messages: [], unread: false }
    expect(conversationLabel(empty, NOW)).toBe('Front desk, Empty')
    expect(conversationPreview(empty)).toBe('')
  })
})

describe('conversationPreview', () => {
  it('previews the latest message, marking my own replies', () => {
    expect(conversationPreview(seedConversation('c-lab-results'))).toBe(
      'Riley’s results are back and within range. Please let them know and close the review task.'
    )
    expect(conversationPreview(seedConversation('c-referral'))).toBe('You: Please bring a photo ID and a list of your current medicines.')
  })

  it('collapses line breaks so the preview stays on one line', () => {
    const conversation = seedConversation('c-lab-results')
    conversation.messages[0].body = 'Line one\n\nLine   two'
    expect(conversationPreview(conversation)).toBe('Line one Line two')
  })
})

describe('draftLabel', () => {
  it('names the recipient, the subject and when it was saved', () => {
    expect(draftLabel(draft(), NOW)).toBe('Draft to Avery Park, Re: Home monitoring readings, saved 4 minutes ago')
  })

  it('fills in a missing recipient or subject and keeps "yesterday" lower case', () => {
    expect(draftLabel(draft({ to: '', subject: ' ', updatedAt: new Date(2026, 9, 4, 18, 0).toISOString() }), NOW)).toBe(
      'Draft to no recipient yet, no subject, saved yesterday'
    )
  })
})

describe('sortedDrafts', () => {
  it('lists the most recently saved first without changing the input', () => {
    const older = draft({ id: 'd-old', updatedAt: new Date(2026, 9, 4, 8, 0).toISOString() })
    const newer = draft({ id: 'd-new' })
    const input = [older, newer]
    expect(sortedDrafts(input).map((entry) => entry.id)).toEqual(['d-new', 'd-old'])
    expect(input.map((entry) => entry.id)).toEqual(['d-old', 'd-new'])
  })
})
