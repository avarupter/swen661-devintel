import {
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  getAppointments,
  saveAppointments,
} from '../apptStore.ts';


describe('apptStore', () => {

  beforeEach(() => {
    localStorage.clear();
  });


  it('returns default appointments when storage is empty', () => {
    const result = getAppointments();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });


  it('returns stored appointments', () => {
    const appointments = [
      {
        id: 'appt-test',
        title: 'Test Visit',
        date: '2030-01-01',
        time: '09:00',
        location: {
          name: 'Clinic',
        },
      },
    ];

    localStorage.setItem(
      'careconnect_appointments_list',
      JSON.stringify(appointments),
    );

    expect(getAppointments()).toEqual(appointments);
  });


  it('falls back to defaults for malformed storage', () => {
    localStorage.setItem(
      'careconnect_appointments_list',
      '{broken',
    );

    const result = getAppointments();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });


  it('saves appointments', () => {
    const appointments = [
      {
        id: 'saved',
        title: 'Saved Visit',
        date: '2030-02-01',
        time: '10:00',
        location: {
          name: 'Office',
        },
      },
    ];

    saveAppointments(appointments);

    expect(
      JSON.parse(
        localStorage.getItem(
          'careconnect_appointments_list',
        ),
      ),
    ).toEqual(appointments);
  });

});