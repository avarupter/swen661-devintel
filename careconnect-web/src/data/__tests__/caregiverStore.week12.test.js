import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { scheduleItems } from '../mockData';
import { getMedications } from '../medsStore';
import { getAppointments } from '../apptStore';

import {
  getActivityLog,
  appendActivityEvent,
  getMedAdherence,
  getScheduleAdherence,
  getCheckInStatus,
  getNextAppointment,
  getUpcomingAlerts,
} from '../caregiverStore';


jest.mock('../mockData', () => ({
  scheduleItems: [
    {
      id: 'schedule-1',
      title: 'Breakfast',
      done: false,
    },
    {
      id: 'schedule-2',
      title: 'Walk',
      done: true,
    },
    {
      id: 'schedule-3',
      title: 'Lunch',
      done: false,
    },
  ],
}));

jest.mock('../medsStore', () => ({
  getMedications: jest.fn(),
}));

jest.mock('../apptStore', () => ({
  getAppointments: jest.fn(),
}));


const TODAY =
  new Date().toISOString().split('T')[0];


describe('caregiverStore', () => {

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    getMedications.mockReturnValue([]);
    getAppointments.mockReturnValue([]);
  });


  // ==========================================================
  // ACTIVITY LOG
  // ==========================================================

  it('returns an empty activity log when none exists', () => {
    expect(getActivityLog()).toEqual([]);
  });


  it('returns stored activity events', () => {
    const events = [
      {
        id: 'evt-1',
        kind: 'check_in',
        label: 'Checked in',
        timestamp: '2026-11-02T12:00:00.000Z',
      },
    ];

    localStorage.setItem(
      'careconnect_activity_log',
      JSON.stringify(events),
    );

    expect(getActivityLog()).toEqual(events);
  });


  it('returns empty activity log for malformed JSON', () => {
    localStorage.setItem(
      'careconnect_activity_log',
      '{broken',
    );

    expect(getActivityLog()).toEqual([]);
  });


  it('adds a new activity event to the beginning', () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(123456);

    jest
      .spyOn(Math, 'random')
      .mockReturnValue(0.5);

    localStorage.setItem(
      'careconnect_activity_log',
      JSON.stringify([
        {
          id: 'old-event',
          kind: 'check_in',
          label: 'Old event',
          timestamp: '2026-11-01T10:00:00.000Z',
        },
      ]),
    );

    appendActivityEvent({
      kind: 'med_taken',
      label: 'Morning medicine taken',
      timestamp: '2026-11-02T08:00:00.000Z',
    });

    const log = getActivityLog();

    expect(log[0]).toEqual({
      id: 'evt-123456-0.5',
      kind: 'med_taken',
      label: 'Morning medicine taken',
      timestamp: '2026-11-02T08:00:00.000Z',
    });

    expect(log[1].id).toBe('old-event');
  });


  it('limits activity history to 100 events', () => {
    const existing = Array.from(
      { length: 100 },
      (_, index) => ({
        id: `evt-${index}`,
        kind: 'check_in',
        label: `Event ${index}`,
        timestamp: new Date().toISOString(),
      }),
    );

    localStorage.setItem(
      'careconnect_activity_log',
      JSON.stringify(existing),
    );

    appendActivityEvent({
      kind: 'check_in',
      label: 'Newest',
      timestamp: new Date().toISOString(),
    });

    expect(getActivityLog()).toHaveLength(100);

    expect(
      getActivityLog()[0].label,
    ).toBe('Newest');
  });


  // ==========================================================
  // MEDICATION ADHERENCE
  // ==========================================================

  it('returns zero medication counts when no medicines exist', () => {
    getMedications.mockReturnValue([]);

    expect(getMedAdherence()).toEqual({
      takenCount: 0,
      totalCount: 0,
      missedMeds: [],
    });
  });


  it('counts medication marked taken in local storage', () => {
    getMedications.mockReturnValue([
      {
        id: 'med-1',
        name: 'Medicine One',
        dosage: '10 mg',
        times: ['00:00'],
        taken: {},
      },
    ]);

    localStorage.setItem(
      'careconnect_meds_taken',
      JSON.stringify({
        'med-1': true,
      }),
    );

    const result = getMedAdherence();

    expect(result.takenCount).toBe(1);
    expect(result.totalCount).toBe(1);
    expect(result.missedMeds).toEqual([]);
  });


  it('uses medication record when local override is absent', () => {
    getMedications.mockReturnValue([
      {
        id: 'med-2',
        name: 'Medicine Two',
        dosage: '5 mg',
        times: ['00:00'],
        taken: {
          [TODAY]: true,
        },
      },
    ]);

    const result = getMedAdherence();

    expect(result.takenCount).toBe(1);
    expect(result.missedMeds).toEqual([]);
  });


  it('reports an untaken medicine as missed after scheduled time', () => {
    getMedications.mockReturnValue([
      {
        id: 'med-3',
        name: 'Morning Medicine',
        dosage: '20 mg',
        times: ['00:00'],
        taken: {},
      },
    ]);

    const result = getMedAdherence();

    expect(result.takenCount).toBe(0);

    expect(result.missedMeds).toEqual([
      {
        id: 'med-3',
        name: 'Morning Medicine',
        dosage: '20 mg',
        scheduledTime: '00:00',
      },
    ]);
  });


  it('handles malformed medication adherence storage', () => {
    localStorage.setItem(
      'careconnect_meds_taken',
      '{invalid',
    );

    getMedications.mockReturnValue([
      {
        id: 'med-4',
        name: 'Medicine Four',
        dosage: '1 mg',
        times: ['00:00'],
        taken: {
          [TODAY]: true,
        },
      },
    ]);

    expect(
      getMedAdherence().takenCount,
    ).toBe(1);
  });


  // ==========================================================
  // SCHEDULE ADHERENCE
  // ==========================================================

  it('counts schedule items completed in static data', () => {
    const result = getScheduleAdherence();

    expect(result.totalCount).toBe(
      scheduleItems.length,
    );

    expect(result.doneCount).toBe(1);
  });


  it('includes locally completed schedule items for today', () => {
    localStorage.setItem(
      'careconnect_schedule_done',
      JSON.stringify({
        date: TODAY,
        ids: ['schedule-1'],
      }),
    );

    const result = getScheduleAdherence();

    expect(result.doneCount).toBe(2);
  });


  it('ignores locally completed items from another date', () => {
    localStorage.setItem(
      'careconnect_schedule_done',
      JSON.stringify({
        date: '2000-01-01',
        ids: [
          'schedule-1',
          'schedule-3',
        ],
      }),
    );

    expect(
      getScheduleAdherence().doneCount,
    ).toBe(1);
  });


  it('handles malformed schedule storage', () => {
    localStorage.setItem(
      'careconnect_schedule_done',
      '{broken',
    );

    expect(
      getScheduleAdherence().doneCount,
    ).toBe(1);
  });


  // ==========================================================
  // CHECK-IN
  // ==========================================================

  it('returns unchecked status when no check-in exists', () => {
    expect(getCheckInStatus()).toEqual({
      checkedIn: false,
      time: '',
    });
  });


  it('returns todays check-in', () => {
    localStorage.setItem(
      'careconnect_checkin',
      JSON.stringify({
        date: TODAY,
        time: '09:30',
      }),
    );

    expect(getCheckInStatus()).toEqual({
      checkedIn: true,
      time: '09:30',
    });
  });


  it('ignores an old check-in', () => {
    localStorage.setItem(
      'careconnect_checkin',
      JSON.stringify({
        date: '2000-01-01',
        time: '09:30',
      }),
    );

    expect(getCheckInStatus()).toEqual({
      checkedIn: false,
      time: '',
    });
  });


  it('handles malformed check-in storage', () => {
    localStorage.setItem(
      'careconnect_checkin',
      '{bad',
    );

    expect(getCheckInStatus()).toEqual({
      checkedIn: false,
      time: '',
    });
  });


  // ==========================================================
  // NEXT APPOINTMENT
  // ==========================================================

  it('returns null when there are no future appointments', () => {
    getAppointments.mockReturnValue([]);

    expect(getNextAppointment()).toBeNull();
  });


  it('returns the earliest future appointment', () => {
    getAppointments.mockReturnValue([
      {
        id: 'later',
        title: 'Later Visit',
        date: '2099-12-31',
        time: '14:00',
        location: {
          name: 'Clinic B',
        },
      },
      {
        id: 'earlier',
        title: 'Earlier Visit',
        date: '2099-01-01',
        time: '09:00',
        location: {
          name: 'Clinic A',
        },
      },
    ]);

    expect(getNextAppointment()).toEqual({
      title: 'Earlier Visit',
      date: '2099-01-01',
      time: '09:00',
      locationName: 'Clinic A',
    });
  });


  it('sorts appointments on the same date by time', () => {
    getAppointments.mockReturnValue([
      {
        id: 'late',
        title: 'Late Visit',
        date: '2099-05-01',
        time: '15:00',
        location: {
          name: 'Late Clinic',
        },
      },
      {
        id: 'early',
        title: 'Early Visit',
        date: '2099-05-01',
        time: '08:00',
        location: {
          name: 'Early Clinic',
        },
      },
    ]);

    expect(
      getNextAppointment().title,
    ).toBe('Early Visit');
  });


  it('filters past appointments out', () => {
    getAppointments.mockReturnValue([
      {
        id: 'past',
        title: 'Past Visit',
        date: '2000-01-01',
        time: '09:00',
        location: {
          name: 'Old Clinic',
        },
      },
      {
        id: 'future',
        title: 'Future Visit',
        date: '2099-01-01',
        time: '09:00',
        location: {
          name: 'Future Clinic',
        },
      },
    ]);

    expect(
      getNextAppointment().title,
    ).toBe('Future Visit');
  });


  // ==========================================================
  // UPCOMING ALERTS
  // ==========================================================

  it('returns only appointments today or tomorrow', () => {
    const now = new Date();

    const today =
      now.toISOString().split('T')[0];

    const tomorrow =
      new Date(
        now.getTime() + 86400000,
      )
        .toISOString()
        .split('T')[0];

    getAppointments.mockReturnValue([
      {
        id: 'today-1',
        title: 'Today Visit',
        date: today,
        time: '12:00',
        location: {
          name: 'Clinic',
        },
      },
      {
        id: 'tomorrow-1',
        title: 'Tomorrow Visit',
        date: tomorrow,
        time: '09:00',
        location: {
          name: 'Clinic',
        },
      },
      {
        id: 'future',
        title: 'Far Future',
        date: '2099-12-31',
        time: '09:00',
        location: {
          name: 'Clinic',
        },
      },
    ]);

    const alerts = getUpcomingAlerts();

    expect(alerts).toHaveLength(2);

    expect(
      alerts.map((item) => item.id),
    ).toEqual([
      'today-1',
      'tomorrow-1',
    ]);
  });


  it('sorts same-day upcoming alerts by time', () => {
    const today =
      new Date()
        .toISOString()
        .split('T')[0];

    getAppointments.mockReturnValue([
      {
        id: 'late',
        title: 'Late',
        date: today,
        time: '17:00',
        location: {
          name: 'Clinic',
        },
      },
      {
        id: 'early',
        title: 'Early',
        date: today,
        time: '08:00',
        location: {
          name: 'Clinic',
        },
      },
    ]);

    expect(
      getUpcomingAlerts().map(
        (item) => item.id,
      ),
    ).toEqual([
      'early',
      'late',
    ]);
  });

});