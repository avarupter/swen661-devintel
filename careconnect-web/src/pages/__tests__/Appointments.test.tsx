/**
 * Appointments — "My Appointments" at /app/appointments: upcoming visits
 * grouped into Today / Later this week / Coming up, each with the date in
 * words, the place, who is taking you, notes, directions and "Add to My Day".
 *
 * The page reads the caregiver-managed list (apptStore), so edge cases are
 * seeded with saveAppointments(), exactly as ManageAppointments saves them.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Appointments from '../Appointments';
import { appointments } from '../../data/appointmentsData';
import type { Appointment } from '../../data/appointmentsData';
import { getAppointments, saveAppointments } from '../../data/apptStore';
import { renderWithProviders } from '../../test/test-utils';

// The demo appointments are dated relative to the day they are imported;
// keep that day and fix the time of day (jest.config.js pins TZ=UTC).
const TODAY = appointments[0].date;
const DAY_MS = 24 * 60 * 60 * 1000;

function dayOffset(days: number) {
  return new Date(Date.parse(TODAY) + days * DAY_MS).toISOString().split('T')[0];
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(`${TODAY}T09:00:00Z`) });
});

afterEach(() => {
  jest.useRealTimers();
});

function renderAppointments() {
  return renderWithProviders(<Appointments />, { route: '/app/appointments', role: 'patient' });
}

/** A day group ("Today", "Later this week", "Coming up") or an appointment card. */
const region = (name: string) => screen.getByRole('region', { name });

function cardTitles(group: string) {
  return within(region(group))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

function appointment(fields: Pick<Appointment, 'id' | 'title' | 'date'> & Partial<Appointment>): Appointment {
  return {
    time: '10:00',
    location: { name: 'Westfield Clinic', address: '1 High Street, Westfield', type: 'clinic' },
    isInMyDay: false,
    ...fields,
  };
}

describe('the demo appointments', () => {
  test('are headed My Appointments', () => {
    renderAppointments();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Appointments');
    expect(screen.getByText('Upcoming visits, tests, and calls — all in one place')).toBeInTheDocument();
  });

  test('are grouped into Today, Later this week and Coming up, soonest first', () => {
    renderAppointments();

    expect(cardTitles('Today')).toEqual(['Blood pressure check — Dr. Sharma', 'Heart checkup — Dr. Lee']);
    expect(cardTitles('Later this week')).toEqual([
      'Blood test — fasting needed',
      'Memory clinic follow-up — Dr. Patel',
      'GP telephone review — Dr. Sharma',
    ]);
    expect(cardTitles('Coming up')).toEqual([
      'Physiotherapy — shoulder exercises',
      'Eye test — routine annual check',
      'Annual health review — Dr. Sharma',
    ]);
  });

  test("a card says when, where, who is taking you and what to remember", () => {
    renderAppointments();

    const card = region('Blood pressure check — Dr. Sharma');
    expect(within(card).getByText('Today')).toBeInTheDocument();
    expect(within(card).getByText(/ — 10:30 am$/)).toHaveAttribute('datetime', `${TODAY}T10:30`);
    expect(within(card).getByText('Greenfield Surgery')).toBeInTheDocument();
    expect(within(card).getByText('12 Greenfield Road, Westfield')).toBeInTheDocument();
    expect(within(card).getByText('Clinic visit')).toBeInTheDocument();
    expect(card).toHaveTextContent('Joyce is taking you to this appointment');
    expect(
      within(card).getByText('Joyce will collect you at 10:00. Remember to bring your medicines list with you.'),
    ).toBeInTheDocument();
  });

  test('only appointments on the day itself carry a "Today" badge', () => {
    renderAppointments();

    expect(within(region('Heart checkup — Dr. Lee')).getByText('Today')).toBeInTheDocument();
    expect(within(region('Blood test — fasting needed')).queryByText('Today')).toBeNull();
    expect(within(region('Eye test — routine annual check')).queryByText('Today')).toBeNull();
  });

  test('Get directions opens the place in Google Maps, in a new tab', async () => {
    const { user } = renderAppointments();

    const card = region('Heart checkup — Dr. Lee');
    expect(within(card).getByText('Hospital visit')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Get directions to City Heart Clinic' }));

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=City%20Heart%20Clinic%2C%2045%20Hospital%20Way%2C%20Westfield',
      '_blank',
      'noopener,noreferrer',
    );
  });

  test('a telephone appointment needs no travel', () => {
    renderAppointments();

    const card = region('GP telephone review — Dr. Sharma');
    expect(within(card).getByText('Telephone — Dr. Sharma will call you')).toBeInTheDocument();
    expect(within(card).getByText('Telephone — no travel needed')).toBeInTheDocument();
    expect(within(card).getByText('No travel needed')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /^Get directions/ })).toBeNull();
    expect(card).not.toHaveTextContent('is taking you'); // nobody assigned
  });

  test('appointments already in My Day say so instead of offering the button', () => {
    renderAppointments();

    const card = region('Blood pressure check — Dr. Sharma');
    expect(within(card).getByText('In My Day')).toBeInTheDocument();
    expect(
      within(card).getByLabelText('This appointment is already in your My Day schedule'),
    ).toHaveTextContent('In My Day');
    expect(within(card).queryByRole('button', { name: /to My Day schedule$/ })).toBeNull();
  });

  test('Add to My Day marks the appointment as in My Day', async () => {
    const { user } = renderAppointments();
    const card = region('Blood test — fasting needed');
    const add = within(card).getByRole('button', { name: 'Add "Blood test — fasting needed" to My Day schedule' });
    expect(add).toHaveTextContent('Add to My Day');

    await user.click(add);

    expect(within(card).queryByRole('button', { name: /to My Day schedule$/ })).toBeNull();
    expect(within(card).getByText('In My Day')).toBeInTheDocument();
    // Other appointments are unaffected.
    expect(
      within(region('Memory clinic follow-up — Dr. Patel')).getByRole('button', { name: /to My Day schedule$/ }),
    ).toBeInTheDocument();
    // BUG: Appointments.tsx:238-255 swaps the focused button for a plain <span>,
    // so keyboard and screen-reader focus falls back to <body> (WCAG 2.4.3).
    // Focus should move to the new "In My Day" status, or the button should stay.
    expect(document.body).toHaveFocus();
  });

  test('Add to My Day is forgotten when the screen is opened again', async () => {
    const first = renderAppointments();
    await first.user.click(
      screen.getByRole('button', { name: 'Add "Blood test — fasting needed" to My Day schedule' }),
    );
    first.unmount();

    renderAppointments();

    // BUG: Appointments.tsx:268-274 only updates component state. Nothing is
    // saved (the stored appointment keeps isInMyDay: false) and nothing is added
    // to the My Day schedule, so the button is back on the next visit.
    expect(
      screen.getByRole('button', { name: 'Add "Blood test — fasting needed" to My Day schedule' }),
    ).toBeInTheDocument();
    expect(getAppointments().find((appt) => appt.id === 'a3')?.isInMyDay).toBe(false);
  });

  test('end with a reassurance note', () => {
    renderAppointments();

    expect(
      screen.getByText(/^Your caregiver can add or update appointments for you\.CareConnect never gives medical advice\.$/),
    ).toBeInTheDocument();
  });
});

describe("the caregiver's saved list", () => {
  test('is grouped by day and sorted by date, then time', () => {
    saveAppointments([
      appointment({ id: 'b4', title: 'Dentist', date: dayOffset(4), time: '11:00' }),
      appointment({ id: 'b1', title: 'Podiatry', date: dayOffset(0), time: '15:00' }),
      appointment({ id: 'b7', title: 'Optician', date: dayOffset(7) }),
      appointment({ id: 'b2', title: 'Hearing test', date: dayOffset(2), time: '16:00' }),
      appointment({ id: 'b0', title: 'Flu jab', date: dayOffset(0), time: '09:30' }),
      appointment({ id: 'b6', title: 'Pharmacy review', date: dayOffset(6) }),
    ]);
    renderAppointments();

    expect(cardTitles('Today')).toEqual(['Flu jab', 'Podiatry']);
    // "This week" means the next six days; a week or more ahead is "Coming up".
    expect(cardTitles('Later this week')).toEqual(['Hearing test', 'Dentist', 'Pharmacy review']);
    expect(cardTitles('Coming up')).toEqual(['Optician']);
  });

  test('dates and times are written out in full words', () => {
    jest.setSystemTime(new Date('2026-11-02T09:00:00Z')); // a Monday
    saveAppointments([
      appointment({ id: 'b1', title: 'Flu jab', date: '2026-11-02', time: '09:30' }),
      appointment({ id: 'b2', title: 'Hairdresser', date: '2026-11-03', time: '12:00' }),
      appointment({ id: 'b3', title: 'Dentist', date: '2026-11-05', time: '14:00' }),
    ]);
    renderAppointments();

    // The Today group repeats the date beside its label.
    expect(within(region('Today')).getByText('Monday 2 November')).toBeInTheDocument();
    expect(within(region('Flu jab')).getByText('Monday 2 November — 9:30 am')).toHaveAttribute(
      'datetime',
      '2026-11-02T09:30',
    );
    expect(within(region('Hairdresser')).getByText('Tuesday 3 November — 12:00 pm')).toHaveAttribute(
      'datetime',
      '2026-11-03T12:00',
    );
    expect(within(region('Dentist')).getByText('Thursday 5 November — 2:00 pm')).toHaveAttribute(
      'datetime',
      '2026-11-05T14:00',
    );
  });

  test('a home visit needs no travel, and a card without a helper or notes leaves them out', () => {
    saveAppointments([
      appointment({
        id: 'h1',
        title: 'District nurse visit',
        date: TODAY,
        time: '16:00',
        location: { name: 'Nurse Kemi Okafor', type: 'home' },
      }),
    ]);
    renderAppointments();

    const card = region('District nurse visit');
    expect(within(card).getByText('Nurse Kemi Okafor')).toBeInTheDocument();
    expect(within(card).getByText('Home visit — they come to you')).toBeInTheDocument();
    expect(within(card).getByText('No travel needed')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /^Get directions/ })).toBeNull();
    expect(card).not.toHaveTextContent('is taking you');
    expect(within(card).getByRole('button', { name: 'Add "District nurse visit" to My Day schedule' })).toBeInTheDocument();
  });

  test('a clinic visit saved without an address says "No travel needed"', () => {
    // ManageAppointments makes the address optional for clinic and hospital visits.
    saveAppointments([
      appointment({ id: 'c1', title: 'Hearing test', date: TODAY, location: { name: 'Westfield Clinic', type: 'clinic' } }),
    ]);
    renderAppointments();

    const card = region('Hearing test');
    // BUG: Appointments.tsx:130-139 and 219-234 — with no address there are no
    // directions, and the fallback is the telephone/home "No travel needed"
    // note, so a clinic visit tells the patient they need not travel. The
    // fallback should depend on the location type, not on a missing address.
    expect(within(card).getByText('Clinic visit')).toBeInTheDocument();
    expect(within(card).getByText('No travel needed')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /^Get directions/ })).toBeNull();
  });

  test('past appointments are left out, which can leave nothing to show', () => {
    saveAppointments([appointment({ id: 'p1', title: 'Old check-up', date: dayOffset(-1) })]);
    renderAppointments();

    expect(screen.queryByRole('heading', { level: 3, name: 'Old check-up' })).toBeNull();
    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
  });

  test('with no appointments, says you are all clear', () => {
    saveAppointments([]);
    renderAppointments();

    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
    expect(
      screen.getByText("You're all clear. New appointments will appear here when they are booked."),
    ).toBeInTheDocument();
    for (const group of ['Today', 'Later this week', 'Coming up']) {
      expect(screen.queryByRole('region', { name: group })).toBeNull();
    }
    expect(screen.queryByText(/Your caregiver can add or update appointments/)).toBeNull();
  });

  test('an unreadable saved list falls back to the demo appointments', () => {
    localStorage.setItem('careconnect_appointments_list', 'not json');
    renderAppointments();

    expect(cardTitles('Today')).toEqual(['Blood pressure check — Dr. Sharma', 'Heart checkup — Dr. Lee']);
  });
});
