/**
 * Fixtures for the caregiver-page tests (src/pages/__tests__): dates derived
 * from the mock data's "today", and seeders for the localStorage records the
 * care recipient's screens write and the caregiver screens read.
 *
 * The data modules stamp "today" when they are imported, so every date here
 * is derived from that stamp. Freeze the clock on TODAY and only move the
 * time of day:
 *
 *   jest.useFakeTimers({ now: todayAt('09:00') });
 *
 * jest.config.js pins TZ=UTC, so these UTC instants are also the local times.
 */
import { appointments } from '../data/appointmentsData';
import type { Appointment } from '../data/appointmentsData';
import type { ActivityEvent, ActivityEventKind } from '../data/caregiverStore';
import { saveAppointments } from '../data/apptStore';
import { saveMedications } from '../data/medsStore';
import type { Medication } from '../types';

/** The date the mock data was stamped with when it was imported ("YYYY-MM-DD"). */
export const TODAY = appointments[0].date;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The ISO date `days` after TODAY (negative: before). */
export function dayFromToday(days: number): string {
  return new Date(Date.parse(`${TODAY}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** An instant on `date` (default TODAY) at "HH:MM". */
export function todayAt(hhmm: string, date: string = TODAY): Date {
  return new Date(`${date}T${hhmm}:00Z`);
}

/**
 * A date written the way the caregiver screens print it — "Monday 2 November".
 * TODAY moves with the calendar, so expected dates cannot be hard-coded.
 */
export function longDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// localStorage keys owned by src/data (caregiverStore, medsStore, apptStore)
// and written by the care recipient's screens (Today, Medications, Schedule).
export const CAREGIVER_KEYS = {
  activity: 'careconnect_activity_log',
  medsTaken: 'careconnect_meds_taken',
  scheduleDone: 'careconnect_schedule_done',
  checkIn: 'careconnect_checkin',
  medications: 'careconnect_medications_list',
  appointments: 'careconnect_appointments_list',
} as const;

/** One activity-log entry, as the care recipient's screens append them. */
export function activityEvent(
  id: string,
  kind: ActivityEventKind,
  label: string,
  at: Date,
): ActivityEvent {
  return { id, kind, label, timestamp: at.toISOString() };
}

/** Replaces the activity log (newest first, as appendActivityEvent keeps it). */
export function seedActivity(events: ActivityEvent[]): void {
  localStorage.setItem(CAREGIVER_KEYS.activity, JSON.stringify(events));
}

/** Today's taken / not-taken ticks from the Medicines screen, by medication id. */
export function seedMedsTaken(taken: Record<string, boolean>): void {
  localStorage.setItem(CAREGIVER_KEYS.medsTaken, JSON.stringify(taken));
}

/** The Today screen's check-in. `time` is stored as shown, e.g. "9:15 AM". */
export function seedCheckIn(time: string, date: string = TODAY): void {
  localStorage.setItem(CAREGIVER_KEYS.checkIn, JSON.stringify({ date, time }));
}

/** Schedule items the care recipient ticked off on `date` (default TODAY). */
export function seedScheduleDone(ids: string[], date: string = TODAY): void {
  localStorage.setItem(CAREGIVER_KEYS.scheduleDone, JSON.stringify({ date, ids }));
}

/** Stores the shared medication list, as the Manage medications screen saves it. */
export function seedMedications(meds: Medication[]): void {
  saveMedications(meds);
}

/** Stores the shared appointment list, as the Manage appointments screen saves it. */
export function seedAppointments(appts: Appointment[]): void {
  saveAppointments(appts);
}

/** The medication list a page saved, or null when it saved nothing. */
export function storedMedications(): Medication[] | null {
  const raw = localStorage.getItem(CAREGIVER_KEYS.medications);
  return raw ? (JSON.parse(raw) as Medication[]) : null;
}

/** The appointment list a page saved, or null when it saved nothing. */
export function storedAppointments(): Appointment[] | null {
  const raw = localStorage.getItem(CAREGIVER_KEYS.appointments);
  return raw ? (JSON.parse(raw) as Appointment[]) : null;
}

/** A clinic appointment with the given fields. */
export function appointment(fields: Partial<Appointment> & Pick<Appointment, 'id'>): Appointment {
  return {
    title: `Appointment ${fields.id}`,
    date: TODAY,
    time: '12:00',
    location: { name: 'Greenfield Surgery', type: 'clinic' },
    isInMyDay: false,
    ...fields,
  };
}

/** A medication with the given fields. */
export function medication(fields: Partial<Medication> & Pick<Medication, 'id' | 'name'>): Medication {
  return {
    dosage: '10 mg — 1 tablet',
    times: ['09:00'],
    colour: 'bg-calm-200',
    taken: {},
    ...fields,
  };
}
