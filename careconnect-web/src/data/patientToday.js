/**
 * Every user-visible string on the Patient Today screen.
 *
 * Kept in one place so the three layouts cannot drift apart: the content-parity
 * table on the Figma board requires the same content to be present at mobile,
 * tablet and desktop, and the surest way to honour that is for all three to
 * render from one object rather than from three hand-written copies.
 *
 * These are the example values from the design board. No medical or personal
 * facts have been added.
 */

export const DESTINATIONS = [
  // `label` is what shows on tablet and desktop. `shortLabel` is the mobile
  // abbreviation from the board. `label` is always the accessible name, so a
  // mobile tab reading "Meds" still announces "Medications".
  { id: 'home', label: 'Home', shortLabel: 'Home', icon: 'home' },
  { id: 'medications', label: 'Medications', shortLabel: 'Meds', icon: 'pill' },
  { id: 'appointments', label: 'Appointments', shortLabel: 'Visits', icon: 'calendar' },
  { id: 'messages', label: 'Messages', shortLabel: 'Inbox', icon: 'chat', badgeCount: 2 },
  { id: 'help', label: 'Help', shortLabel: 'Help', icon: 'help' },
];

export const CURRENT_DESTINATION = 'home';

export const patientToday = {
  appName: 'Patient Today',
  account: { name: 'Joyce Harper', role: 'Patient account', initials: 'JH' },

  header: {
    meta: 'Thursday, June 4 · 5:38 AM',
    greeting: 'Good morning, Joyce',
    breadcrumb: ['Patient account', 'Home'],
    callAction: 'Call my caregiver',
  },

  plan: {
    heading: "Here's your day, Joyce",
    progressLabel: '3 of 10 things done today',
    progressPercent: 30,
    encouragement: 'A good start to your morning',
  },

  next: {
    eyebrow: 'Next thing to do',
    badge: 'Coming up',
    kindLabel: 'Appointment',
    time: '3:00 pm',
    title: 'Video call with Maria',
    detail: 'Your daughter — she will call you',
    readiness: 'Everything is set',
    action: "I'm ready",
    // D3: once "I'm ready" is pressed the badge reads readyBadge, the button
    // becomes the aria-disabled readyAction, and undo appears beside it.
    // Appointments reads these too, so the two screens share one wording (R5).
    readyBadge: 'Ready',
    readyAction: 'Ready',
    undo: "Undo — I'm not ready",
  },

  later: {
    heading: 'Later today',
    items: [
      {
        id: 'evening-medication',
        time: '6:00 pm',
        title: 'Evening medication',
        detail: 'Take with a glass of water',
        icon: 'pill',
      },
      {
        id: 'evening-check-in',
        time: '8:00 pm',
        title: 'Evening check-in',
        detail: 'A quick wellness check',
        icon: 'check',
      },
    ],
  },

  glance: {
    heading: 'Today at a glance',
    items: [
      { id: 'next-appointment', icon: 'calendar', label: 'Next appointment', value: '3:00 pm' },
      { id: 'medications', icon: 'pill', label: 'Medications', value: '2 remaining' },
      { id: 'completed', icon: 'check', label: 'Completed', value: '3 things done' },
    ],
  },

  careTeam: {
    heading: 'Your care team',
    availability: 'Available today',
    body: 'Questions about your day? Send a message and your care team will get back to you.',
    action: 'Message care team',
  },

  privacy: 'Your information is private and secure.',
};
