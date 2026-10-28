/**
 * Every user-visible string on the Medications screen, and the medicines and
 * doses the demo starts with (content-meds-appointments.md §3).
 *
 * Synthetic: the medicines, strengths and notes come from careconnect-rn and
 * the Flutter app, and no real person's record is described. Statuses are never
 * stored here; doseModel.js computes them from the dose log and the demo clock.
 */
import { patientToday } from './patientToday.js';

// Read from Today so the two screens cannot disagree (R1).
const evening = patientToday.later.items.find((i) => i.id === 'evening-medication');

export const DOSE_SLOTS = [
  { id: 'morning', time: '05:30', timeLabel: '5:30 am', label: 'Morning' },
  { id: 'evening', time: '18:00', timeLabel: evening.time, label: 'Evening', instruction: evening.detail },
  //                                          '6:00 pm'                       'Take with a glass of water'
];

export const MEDICATIONS = [
  { id: 'memantine', name: 'Memantine', strength: '10 mg', amount: '1 tablet',
    purpose: 'Helps with memory and thinking', appearance: 'White oval tablet',
    when: 'Morning and evening', notes: 'Take with or without food. Swallow whole with water.',
    prescriber: 'Dr. Anita Sharma', slots: ['morning', 'evening'] },
  { id: 'lisinopril', name: 'Lisinopril', strength: '10 mg', amount: '1 tablet',
    purpose: 'Lowers blood pressure', appearance: 'Round pink tablet',
    when: 'Every morning', notes: 'Take in the morning, with or without food.',
    prescriber: 'Dr. Anita Sharma', slots: ['morning'] },
  { id: 'vitamin-d3', name: 'Vitamin D3', strength: '1000 IU', amount: '1 capsule',
    purpose: 'Keeps bones strong', appearance: 'Small yellow capsule',
    when: 'Morning with breakfast', notes: 'Take with food for best absorption.',
    prescriber: 'Dr. Anita Sharma', slots: ['morning'] },
  { id: 'atorvastatin', name: 'Atorvastatin', strength: '20 mg', amount: '1 tablet',
    purpose: 'Lowers cholesterol', appearance: 'Small white round tablet',
    when: 'Every evening', notes: 'Avoid grapefruit juice while taking this medicine.',
    prescriber: 'Dr. Anita Sharma', slots: ['evening'] },
  { id: 'paracetamol', name: 'Paracetamol', strength: '500 mg', amount: '1–2 tablets',
    purpose: 'For pain or fever', appearance: 'White caplet',
    when: 'Only if you need it', notes: 'Do not exceed 8 tablets in 24 hours.',
    prescriber: 'Dr. Anita Sharma', asNeeded: true, slots: [] },
];

/** Doses already logged when the demo opens. Key: `${medicationId}|${date}|${slot time}`. */
export const SEED_DOSE_LOG = {
  'memantine|2026-06-04|05:30': { taken: true, at: '05:31' },
  'lisinopril|2026-06-04|05:30': { taken: true, at: '05:31' },
  'vitamin-d3|2026-06-04|05:30': { taken: true, at: '05:31' },
};

export const medicationsPage = {
  header: {
    meta: patientToday.header.meta,
    heading: 'Your medicines, Joyce',
    breadcrumb: ['Patient account', 'Medications'],
    callAction: patientToday.header.callAction,
  },
  progress: {
    heading: "Today's progress",
    label: (taken, total) => `${taken} of ${total} taken today`,
    onTrack: "You're on track for today.",
  },
  // D4: the STML sections replace the prototype's hero card (and its `next` eyebrows).
  sections: {
    now: 'Take these now',
    nowEmpty: 'Nothing due right now.',
    later: 'Later today',
    done: 'Already done',
  },
  laterHeading: 'Later today',
  doneHeading: 'Already done',
  list: {
    intro: 'Every medicine you take, and what it is for.',
    regularHeading: 'Regular medicines',
    asNeededHeading: 'Only if you need it',
    labels: { dose: 'Dose', when: 'When', looksLike: 'Looks like', notes: 'Important notes', prescriber: 'Prescribed by' },
    todayStatus: {
      all: 'Taken today',
      some: (taken, total) => `${taken} of ${total} taken today`,
      none: 'Not yet taken',
      asNeeded: 'Not needed today',
    },
  },
  dose: {
    badge: { due: 'Due now', upcoming: 'Coming up', taken: 'Taken', missed: 'Missed' },
    takenLine: (at) => `You took this at ${at} today.`,
    notTakenLine: 'Not taken yet.',
    mark: "I've taken it",
    // D3: what the mark button becomes once pressed (aria-disabled; Undo sits beside it).
    marked: 'Taken',
    undo: "Undo — I haven't taken it",
    target: (med, slot) => `${med.name} ${med.strength}, ${slot.timeLabel}`,
    announceTaken: (target) => `${target}: marked as taken.`,
    announceUndone: (target) => `${target}: marked as not taken.`,
  },
  support: {
    heading: 'Medication support',
    body: 'Questions about a dose? Your caregiver can help.',
    action: 'Call my caregiver',
  },
};

/**
 * Patient Today's counts, derived from the dose log (D10, the spec's Option A):
 * "N remaining", "N things done" and "N of 10 things done today". At seed they
 * equal the literals in patientToday.js exactly, so Week 10's parity strings
 * hold until something is marked.
 */
export const todayProgress = {
  /** The day's plan has 10 things in it: the "of 10" in patientToday.plan.progressLabel. */
  total: 10,
  remaining: (n) => `${n} remaining`,
  thingsDone: (n) => (n === 1 ? '1 thing done' : `${n} things done`),
  plan: (done, total) => `${done} of ${total} things done today`,
};
