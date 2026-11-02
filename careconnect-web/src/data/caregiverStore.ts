/**
 * Caregiver-side read utilities for patient-written localStorage data.
 *
 * Keys written by patient screens:
 *   careconnect_meds_taken    — Record<medId, boolean> for today
 *   careconnect_schedule_done — { date: string; ids: string[] }
 *   careconnect_checkin       — { date: string; time: string }
 *   careconnect_activity_log  — ActivityEvent[]
 */

import { scheduleItems } from './mockData';
import { getMedications } from './medsStore';
import { getAppointments } from './apptStore';

const TODAY = new Date().toISOString().split('T')[0];

// ── Activity log ───────────────────────────────────────────────────────────────

export type ActivityEventKind =
  | 'med_taken'
  | 'med_skipped'
  | 'schedule_done'
  | 'check_in';

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  label: string;
  timestamp: string; // ISO
}

const LS_ACTIVITY_KEY = 'careconnect_activity_log';

export function getActivityLog(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(LS_ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendActivityEvent(event: Omit<ActivityEvent, 'id'>): void {
  const log = getActivityLog();
  const newEvent: ActivityEvent = { ...event, id: `evt-${Date.now()}-${Math.random()}` };
  localStorage.setItem(LS_ACTIVITY_KEY, JSON.stringify([newEvent, ...log].slice(0, 100)));
}

// ── Medication adherence ────────────────────────────────────────────────────────

export interface MedAdherence {
  takenCount: number;
  totalCount: number;
  missedMeds: { id: string; name: string; dosage: string; scheduledTime: string }[];
}

export function getMedAdherence(): MedAdherence {
  let storedTaken: Record<string, boolean> = {};
  try {
    const raw = localStorage.getItem('careconnect_meds_taken');
    if (raw) storedTaken = JSON.parse(raw);
  } catch { /* empty */ }

  const medications = getMedications();
  const totalCount = medications.length;
  let takenCount = 0;
  const missedMeds: MedAdherence['missedMeds'] = [];

  for (const med of medications) {
    // Use localStorage value if present, else fall back to static mock value
    const taken =
      storedTaken[med.id] !== undefined ? storedTaken[med.id] : (med.taken[TODAY] ?? false);

    if (taken) {
      takenCount++;
    } else {
      // Only flag as missed if the scheduled time has passed
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      for (const t of med.times) {
        const [h, m] = t.split(':').map(Number);
        const schedMin = h * 60 + m;
        if (schedMin <= nowMin) {
          missedMeds.push({
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            scheduledTime: t,
          });
          break;
        }
      }
    }
  }

  return { takenCount, totalCount, missedMeds };
}

// ── Schedule adherence ─────────────────────────────────────────────────────────

export interface ScheduleAdherence {
  doneCount: number;
  totalCount: number;
}

export function getScheduleAdherence(): ScheduleAdherence {
  let localDoneIds: string[] = [];
  try {
    const raw = localStorage.getItem('careconnect_schedule_done');
    const stored: { date: string; ids: string[] } = raw ? JSON.parse(raw) : null;
    if (stored?.date === TODAY) localDoneIds = stored.ids;
  } catch { /* empty */ }

  const totalCount = scheduleItems.length;
  const doneCount = scheduleItems.filter(
    (i) => i.done || localDoneIds.includes(i.id),
  ).length;

  return { doneCount, totalCount };
}

// ── Check-in ───────────────────────────────────────────────────────────────────

export interface CheckInStatus {
  checkedIn: boolean;
  time: string;
}

export function getCheckInStatus(): CheckInStatus {
  try {
    const raw = localStorage.getItem('careconnect_checkin');
    const stored: { date: string; time: string } = raw ? JSON.parse(raw) : null;
    if (stored?.date === TODAY) return { checkedIn: true, time: stored.time };
  } catch { /* empty */ }
  return { checkedIn: false, time: '' };
}

// ── Next appointment ────────────────────────────────────────────────────────────

export interface NextAppointment {
  title: string;
  date: string;
  time: string;
  locationName: string;
}

export function getNextAppointment(): NextAppointment | null {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const future = getAppointments()
    .filter((a) => {
      if (a.date > todayStr) return true;
      if (a.date === todayStr) {
        const [h, m] = a.time.split(':').map(Number);
        return h * 60 + m > nowMin;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time < b.time ? -1 : 1;
    });

  if (!future.length) return null;
  const appt = future[0];
  return {
    title: appt.title,
    date: appt.date,
    time: appt.time,
    locationName: appt.location.name,
  };
}

// ── Upcoming appointment alerts (within 24 h) ─────────────────────────────────

export interface UpcomingAlert {
  id: string;
  title: string;
  date: string;
  time: string;
}

export function getUpcomingAlerts(): UpcomingAlert[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toISOString().split('T')[0];

  return getAppointments()
    .filter((a) => a.date === todayStr || a.date === tomorrowStr)
    .map((a) => ({ id: a.id, title: a.title, date: a.date, time: a.time }))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time < b.time ? -1 : 1;
    });
}
