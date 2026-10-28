/**
 * Every user-visible string on the Messages screen, and the conversations the
 * demo starts with. Synthetic: everyone here is made up. Maria is the daughter
 * on Patient Today ("Video call with Maria"); Dr. Sharma, Greenfield Surgery,
 * Westfield Dental and their dates come from careconnect-rn's appointments.
 *
 * Times are local wall-clock strings with no zone, so "7:42 pm" reads the same
 * on every device. DEMO_NOW (demo.js) is the moment the Patient Today header
 * shows, and a message sent in the demo is stamped with it (D6).
 *
 * The storage key and version live with the store (src/store/demoStore.js),
 * which persists these conversations together with the rest of the demo.
 */

export { DEMO_NOW } from './demo.js';

/** The Electron app's limits (careconnect-electron/src/shared/validate.ts). */
export const SUBJECT_MAX_LENGTH = 200;
export const BODY_MAX_LENGTH = 10000;

/** Who a new message can go to, in radio order. */
export const RECIPIENTS = [
  { id: 'care-team', name: 'Your care team', detail: "Dr. Sharma's team at Greenfield Surgery" },
  { id: 'maria', name: 'Maria Thompson', detail: 'Your daughter' },
  { id: 'greenfield', name: 'Greenfield Surgery', detail: 'Appointments and reception' },
];
export const DEFAULT_RECIPIENT_ID = 'care-team';

export const messagesPage = {
  heading: 'Messages',
  unreadSummary: (count) =>
    count === 0
      ? 'No unread messages.'
      : count === 1
        ? 'You have 1 unread message.'
        : `You have ${count} unread messages.`,
  newMessage: 'New message',
  listHeading: 'Conversations',
  unreadBadge: 'New',
  unreadSuffix: 'unread',
  ownPreviewPrefix: 'You: ',
  empty: 'No conversations yet.',
  noSelection: 'Select a conversation to read it.',
};

export const thread = {
  back: 'Back to messages',
  withPrefix: 'With',
  you: 'You',
  sent: 'Sent',
  replyLabel: (name) => `Reply to ${name}`,
  replyHelper: 'Not for emergencies. In an emergency, call 911.',
  send: 'Send message',
  notFound: {
    heading: "We couldn't find that conversation.",
    body: 'It may have been removed when the demo was reset.',
  },
};

export const compose = {
  heading: 'New message',
  intro: 'Questions about your day? Send a message and your care team will get back to you.',
  instructions: "Choose who it's for, add a subject, and write your message.",
  toLegend: 'Who is this message for?',
  subject: {
    label: 'Message subject',
    placeholder: 'Question about my day',
    helper: 'Give your care team a short summary.',
  },
  body: { label: 'Message', helper: 'Not for emergencies. In an emergency, call 911.' },
  send: 'Send message',
  cancel: 'Cancel',
};

export const ERRORS = {
  recipient: 'Error: Choose a recipient before sending.',
  subject: 'Error: Enter a subject before sending.',
  body: 'Error: Enter a message before sending.',
};

export const ANNOUNCEMENTS = {
  /** `name` goes through sentenceName(): "Your care team" -> "your care team". */
  sent: (name) => `Message sent to ${name}.`,
  reset: 'The demo has been reset.',
};

/** Oldest message first, as in Electron. Exactly two unread: the nav badge is 2. */
export const SEED_CONVERSATIONS = [
  {
    id: 'video-call',
    with: 'Maria Thompson',
    withDetail: 'Your daughter',
    subject: 'Video call on Thursday',
    unread: true,
    messages: [
      {
        id: 'video-call-1',
        author: 'Maria Thompson',
        at: '2026-06-03T19:42',
        outgoing: false,
        body: "I'll call you on video on Thursday at 3:00 pm. You don't need to set anything up. Just answer when it rings. Love, Maria",
      },
    ],
  },
  {
    id: 'health-review',
    with: 'Greenfield Surgery',
    withDetail: 'Appointments and reception',
    subject: 'Your annual health review',
    unread: true,
    messages: [
      {
        id: 'health-review-1',
        author: 'Greenfield Surgery',
        at: '2026-06-03T11:05',
        outgoing: false,
        body: 'Your annual health review with Dr. Sharma is on Monday, June 22 at 2:00 pm, at Greenfield Surgery, 12 Greenfield Road. It takes about 45 minutes. Please bring all your current medicines and a list of any symptoms.',
      },
    ],
  },
  {
    id: 'evening-check-ins',
    with: 'Your care team',
    withDetail: "Dr. Sharma's team at Greenfield Surgery",
    subject: 'Evening check-ins',
    unread: false,
    messages: [
      {
        id: 'evening-check-ins-1',
        author: 'Nurse Kim Ellis',
        at: '2026-06-01T16:20',
        outgoing: false,
        body: "We've added a short evening check-in at 8:00 pm each day. It's a few quick questions about how your day went. Reply here if another time suits you better.",
      },
      {
        id: 'evening-check-ins-2',
        author: 'Joyce Harper',
        at: '2026-06-01T18:02',
        outgoing: true,
        body: 'Thank you. 8:00 pm is a good time for me.',
      },
    ],
  },
  {
    id: 'dentist',
    with: 'Westfield Dental',
    withDetail: 'Your dentist',
    subject: 'Your dentist check-up',
    unread: false,
    messages: [
      {
        id: 'dentist-1',
        author: 'Westfield Dental',
        at: '2026-05-28T09:00',
        outgoing: false,
        body: "Your dentist check-up is booked for Friday, July 3 at 10:00 am, at Westfield Dental, 8 Park Lane. It's a regular check-up and clean, and takes about 30 minutes. You don't need to bring anything.",
      },
    ],
  },
];
