import { describe, test, expect } from '@jest/globals';
import { getAppointments, saveAppointments } from './apptStore';
import { appointments as defaults } from './appointmentsData';
import type { Appointment } from './appointmentsData';

const LS_KEY = 'careconnect_appointments_list';

const dentist: Appointment = {
  id: 'x1',
  title: 'Dentist — check-up',
  date: '2026-12-01',
  time: '09:00',
  location: { name: 'Smile Dental', address: '1 High Street', type: 'clinic' },
  isInMyDay: false,
};

describe('getAppointments', () => {
  test('returns the demo appointments until a caregiver saves a list', () => {
    expect(getAppointments()).toEqual(defaults);
  });

  test('returns a copy, so changing the list does not change the demo data', () => {
    const list = getAppointments();

    list.push(dentist);

    expect(getAppointments()).toEqual(defaults);
    expect(defaults).not.toContain(dentist);
  });

  test('falls back to the demo appointments when the stored list is corrupt', () => {
    localStorage.setItem(LS_KEY, '[{"id": ');

    expect(getAppointments()).toEqual(defaults);
  });
});

describe('saveAppointments', () => {
  test('stores the list that getAppointments returns from then on', () => {
    saveAppointments([dentist]);

    expect(getAppointments()).toEqual([dentist]);
    expect(JSON.parse(localStorage.getItem(LS_KEY) ?? 'null')).toEqual([dentist]);
  });

  test('an empty saved list stays empty', () => {
    saveAppointments([]);

    expect(getAppointments()).toEqual([]);
  });
});
