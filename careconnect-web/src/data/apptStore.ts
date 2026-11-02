/**
 * Shared appointment store backed by localStorage.
 * Caregiver management screens write here; patient Appointments screen reads from here.
 */
import { appointments as defaultAppts } from './appointmentsData';
import type { Appointment } from './appointmentsData';

const LS_KEY = 'careconnect_appointments_list';

export function getAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Appointment[]) : [...defaultAppts];
  } catch {
    return [...defaultAppts];
  }
}

export function saveAppointments(appts: Appointment[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(appts));
}
