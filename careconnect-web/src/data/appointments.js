/**
 * Every user-visible string on the Appointments screen, and the appointments
 * the demo starts with (content-meds-appointments.md §3).
 *
 * Synthetic. Records hold `date` and `time` only, never a hand-written "when"
 * string (D5): "Tomorrow at 5:30 pm" is computed by whenLabel() in time.js
 * against the demo clock, so a label cannot disagree with its date. Status
 * (today, upcoming, cancelled, past) is computed by appointmentModel.js.
 */
import { patientToday } from './patientToday.js';
import { formatClock } from './time.js';

const call = patientToday.next; // R5: single source for the 3:00 pm call

export const APPOINTMENTS = [
  { id: 'video-call-maria', icon: 'video', date: '2026-06-04', time: '15:00',
    title: call.title, detail: call.detail,
    readiness: call.readiness, action: call.action,
    where: 'This is a video call — stay at home.' },
  { id: 'pharmacy-delivery', icon: 'pill', date: '2026-06-05', time: '17:30',
    title: 'Pharmacy delivery', detail: 'They will come to you' },
  { id: 'dr-chen', icon: 'calendar', date: '2026-06-08', time: '10:00',
    title: 'Dr. Chen', detail: 'Maria will drive you' },
  { id: 'annual-review', icon: 'calendar', date: '2026-06-22', time: '14:00',
    title: 'Annual health review — Dr. Sharma',
    detail: 'Maria will drive you', location: 'Greenfield Surgery — 12 Greenfield Road, Westfield',
    howLong: 'About 45 minutes', bring: ['All your current medicines', 'A list of any symptoms'],
    notes: 'Your yearly health check. Dr. Sharma will review all your medicines.' },
  { id: 'eye-screening', icon: 'calendar', date: '2026-06-10', time: '15:00',
    title: 'Eye screening',
    location: 'Westfield Hospital', cancelled: true },
  { id: 'blood-test', icon: 'calendar', date: '2026-05-05', time: '09:00',
    title: 'Blood test', location: 'Greenfield Surgery',
    howLong: 'About 10 minutes', bring: ['Your appointment letter'], notes: 'Routine blood test. Completed.' },
];

export const appointmentsPage = {
  header: {
    meta: patientToday.header.meta,
    heading: 'Your appointments, Joyce',
    breadcrumb: ['Patient account', 'Appointments'],
    callAction: patientToday.header.callAction,
  },
  todaySummary: (n) => (n === 1 ? '1 appointment today' : `${n} appointments today`),
  // Only what differs from Today's card. The badge, readyBadge, readyAction,
  // action and undo are read from patientToday.next (R5), so "I'm ready" has
  // one wording on both screens.
  next: {
    eyebrow: 'Next appointment',
    kindLabel: 'Today',
    target: (a) => `${a.title}, ${formatClock(a.time)}`,
    announceReady: (t) => `${t}: marked as ready.`,
    announceNotReady: (t) => `${t}: no longer marked as ready.`,
  },
  sections: { upcoming: 'Coming up', cancelled: 'Cancelled', cancelledNote: 'You do not need to go to these.', past: 'Already happened' },
  cancelledLine: 'This appointment was cancelled.',
  empty: 'You have no appointments coming up.',
  details: {
    show: 'Show details', hide: 'Hide details',
    labels: { where: 'Where to go', who: 'Who is taking you', howLong: 'How long', bring: 'What to bring', notes: 'Notes' },
  },
};
