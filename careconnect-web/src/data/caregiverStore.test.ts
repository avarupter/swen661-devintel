import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  appendActivityEvent,
  getActivityLog,
  getCheckInStatus,
  getMedAdherence,
  getNextAppointment,
  getScheduleAdherence,
  getUpcomingAlerts,
} from './caregiverStore';
import type { ActivityEvent } from './caregiverStore';
import { appointments } from './appointmentsData';
import { saveAppointments } from './apptStore';
import { saveMedications } from './medsStore';
import type { Appointment } from './appointmentsData';

// The data modules stamp "today" when they are imported. Freeze the clock on
// that same day and only move the time of day, so the stamps stay valid.
// (jest.config.js pins TZ=UTC, so these UTC times are also the local times.)
const TODAY = appointments[0].date; // daysFromNow(0) at import
const DAY = 24 * 60 * 60 * 1000;

function dayOffset(days: number) {
  return new Date(Date.parse(TODAY) + days * DAY).toISOString().split('T')[0];
}

function at(time: string) {
  jest.setSystemTime(new Date(`${TODAY}T${time}:00Z`));
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(`${TODAY}T12:00:00Z`) });
});

afterEach(() => {
  jest.useRealTimers();
});

function appointment(id: string, date: string, time: string): Appointment {
  return {
    id,
    title: `Appointment ${id}`,
    date,
    time,
    location: { name: `Clinic ${id}`, type: 'clinic' },
    isInMyDay: false,
  };
}

describe('activity log', () => {
  test('is empty until something happens', () => {
    expect(getActivityLog()).toEqual([]);
  });

  test('ignores a corrupt log', () => {
    localStorage.setItem('careconnect_activity_log', 'nope');

    expect(getActivityLog()).toEqual([]);
  });

  test('appendActivityEvent adds the newest event first, with an id', () => {
    appendActivityEvent({ kind: 'check_in', label: 'Checked in', timestamp: '2026-11-02T09:00:00Z' });
    appendActivityEvent({ kind: 'med_taken', label: 'Took Amlodipine', timestamp: '2026-11-02T09:05:00Z' });

    const log = getActivityLog();
    expect(log.map((event) => event.label)).toEqual(['Took Amlodipine', 'Checked in']);
    expect(log[0]).toMatchObject({ kind: 'med_taken', timestamp: '2026-11-02T09:05:00Z' });
    expect(log[0].id).toMatch(/^evt-\d+-/);
    expect(log[0].id).not.toBe(log[1].id);
  });

  test('keeps only the latest 100 events', () => {
    const old: ActivityEvent[] = Array.from({ length: 100 }, (_, i) => ({
      id: `old-${i}`,
      kind: 'schedule_done',
      label: `Old event ${i}`,
      timestamp: '2026-11-01T08:00:00Z',
    }));
    localStorage.setItem('careconnect_activity_log', JSON.stringify(old));

    appendActivityEvent({ kind: 'check_in', label: 'Newest', timestamp: '2026-11-02T08:00:00Z' });

    const log = getActivityLog();
    expect(log).toHaveLength(100);
    expect(log[0].label).toBe('Newest');
    expect(log[99].label).toBe('Old event 98');
  });
});

describe('getMedAdherence', () => {
  test("at noon: two of four taken, and only the 8:30 dose that wasn't taken is missed", () => {
    expect(getMedAdherence()).toEqual({
      takenCount: 2,
      totalCount: 4,
      missedMeds: [{ id: 'm4', name: 'Vitamin D3', dosage: '1000 IU — 1 capsule', scheduledTime: '08:30' }],
    });
  });

  test('a dose is not missed before its time', () => {
    at('08:29');

    expect(getMedAdherence().missedMeds).toEqual([]);
  });

  test('a dose counts as missed from its scheduled minute', () => {
    at('08:30');

    expect(getMedAdherence().missedMeds.map((med) => med.name)).toEqual(['Vitamin D3']);
  });

  test('in the evening the 20:00 dose is missed too', () => {
    at('21:00');

    expect(getMedAdherence().missedMeds.map((med) => [med.name, med.scheduledTime])).toEqual([
      ['Atorvastatin', '20:00'],
      ['Vitamin D3', '08:30'],
    ]);
  });

  test("what the patient ticked today overrides the demo data", () => {
    at('21:00');
    localStorage.setItem('careconnect_meds_taken', JSON.stringify({ m1: false, m2: true, m4: true }));

    expect(getMedAdherence()).toMatchObject({
      takenCount: 3,
      missedMeds: [{ id: 'm1', name: 'Amlodipine', scheduledTime: '08:30' }],
    });
  });

  test('ignores a corrupt taken record', () => {
    localStorage.setItem('careconnect_meds_taken', '{bad');

    expect(getMedAdherence().takenCount).toBe(2);
  });

  test("uses the caregiver's medicine list, reporting a medicine's first missed time", () => {
    at('19:00');
    saveMedications([
      { id: 'x1', name: 'Metformin', dosage: '500 mg', times: ['07:00', '18:00'], colour: 'bg-calm-200', taken: {} },
      { id: 'x2', name: 'Melatonin', dosage: '2 mg', times: ['22:00'], colour: 'bg-warm-200', taken: {} },
    ]);

    expect(getMedAdherence()).toEqual({
      takenCount: 0,
      totalCount: 2,
      missedMeds: [{ id: 'x1', name: 'Metformin', dosage: '500 mg', scheduledTime: '07:00' }],
    });
  });
});

describe('getScheduleAdherence', () => {
  test('counts the demo items already done', () => {
    expect(getScheduleAdherence()).toEqual({ doneCount: 3, totalCount: 10 });
  });

  test("adds the items the patient ticked off today, without double counting", () => {
    localStorage.setItem('careconnect_schedule_done', JSON.stringify({ date: TODAY, ids: ['s1', 's4', 's5'] }));

    expect(getScheduleAdherence()).toEqual({ doneCount: 5, totalCount: 10 });
  });

  test("ignores another day's ticks", () => {
    localStorage.setItem('careconnect_schedule_done', JSON.stringify({ date: dayOffset(-1), ids: ['s4', 's5'] }));

    expect(getScheduleAdherence().doneCount).toBe(3);
  });

  test('ignores a corrupt record', () => {
    localStorage.setItem('careconnect_schedule_done', '[');

    expect(getScheduleAdherence().doneCount).toBe(3);
  });
});

describe('getCheckInStatus', () => {
  test('is not checked in by default', () => {
    expect(getCheckInStatus()).toEqual({ checkedIn: false, time: '' });
  });

  test("reports today's check-in time", () => {
    localStorage.setItem('careconnect_checkin', JSON.stringify({ date: TODAY, time: '9:15 AM' }));

    expect(getCheckInStatus()).toEqual({ checkedIn: true, time: '9:15 AM' });
  });

  test("does not count yesterday's check-in", () => {
    localStorage.setItem('careconnect_checkin', JSON.stringify({ date: dayOffset(-1), time: '9:15 AM' }));

    expect(getCheckInStatus().checkedIn).toBe(false);
  });

  test('ignores a corrupt record', () => {
    localStorage.setItem('careconnect_checkin', 'x');

    expect(getCheckInStatus().checkedIn).toBe(false);
  });
});

describe('getNextAppointment', () => {
  test("in the morning it is today's first appointment", () => {
    at('09:00');

    expect(getNextAppointment()).toEqual({
      title: 'Blood pressure check — Dr. Sharma',
      date: TODAY,
      time: '10:30',
      locationName: 'Greenfield Surgery',
    });
  });

  test('an appointment that is starting now is no longer next', () => {
    at('10:30');

    expect(getNextAppointment()?.title).toBe('Heart checkup — Dr. Lee');
  });

  test("after today's appointments it is tomorrow's", () => {
    at('15:00');

    expect(getNextAppointment()).toMatchObject({ title: 'Blood test — fasting needed', date: dayOffset(1) });
  });

  test('picks the soonest one however the list is ordered', () => {
    saveAppointments([
      appointment('later-day', dayOffset(2), '08:00'),
      appointment('later-time', TODAY, '18:00'),
      appointment('soonest', TODAY, '13:00'),
      appointment('past', dayOffset(-1), '09:00'),
    ]);

    expect(getNextAppointment()?.title).toBe('Appointment soonest');
  });

  test('is null when nothing is coming up', () => {
    saveAppointments([appointment('past', dayOffset(-3), '09:00'), appointment('earlier', TODAY, '11:59')]);

    expect(getNextAppointment()).toBeNull();
  });
});

describe('getUpcomingAlerts', () => {
  test("lists today's and tomorrow's appointments in order", () => {
    saveAppointments([
      appointment('tomorrow-early', dayOffset(1), '08:00'),
      appointment('in-two-days', dayOffset(2), '09:00'),
      appointment('today-late', TODAY, '19:00'),
      appointment('today-early', TODAY, '13:00'),
    ]);

    expect(getUpcomingAlerts()).toEqual([
      { id: 'today-early', title: 'Appointment today-early', date: TODAY, time: '13:00' },
      { id: 'today-late', title: 'Appointment today-late', date: TODAY, time: '19:00' },
      { id: 'tomorrow-early', title: 'Appointment tomorrow-early', date: dayOffset(1), time: '08:00' },
    ]);
  });

  test("still lists today's appointments after they have happened", () => {
    at('15:00');

    // BUG: the dashboard shows these as "N in the next 24 h"
    // (CaregiverDashboard.tsx:490), but getUpcomingAlerts filters on the date
    // alone (caregiverStore.ts:190), so at 3 pm the 10:30 and 14:30
    // appointments — both over — are still raised as alerts.
    expect(getUpcomingAlerts().map((alert) => [alert.id, alert.time])).toEqual([
      ['a1', '10:30'],
      ['a2', '14:30'],
      ['a3', '08:45'],
    ]);
  });
});
