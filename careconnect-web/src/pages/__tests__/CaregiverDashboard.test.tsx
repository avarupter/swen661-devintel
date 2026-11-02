/**
 * CaregiverDashboard — the caregiver's home screen (/app as a caregiver).
 *
 * It reads what the care recipient's screens saved to localStorage (medicines
 * ticked off, the check-in, finished tasks, the activity log) and the shared
 * appointment list, and refreshes on window focus and every 30 seconds.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { act, screen, within } from '@testing-library/react';
import CaregiverDashboard from '../CaregiverDashboard';
import { renderWithProviders } from '../../test/test-utils';
import {
  TODAY,
  activityEvent,
  appointment,
  dayFromToday,
  longDate,
  seedActivity,
  seedAppointments,
  seedCheckIn,
  seedMedications,
  seedMedsTaken,
  seedScheduleDone,
  todayAt,
} from '../../test/caregiverFixtures';

const ALL_MEDS_TAKEN = { m1: true, m2: true, m3: true, m4: true };

/** Renders the dashboard at "HH:MM" today (default 09:00). */
function renderDashboard(time = '09:00') {
  jest.setSystemTime(todayAt(time));
  return renderWithProviders(<CaregiverDashboard />, { route: '/app', role: 'caregiver' });
}

const statusCard = () => screen.getByRole('region', { name: "Margaret's status today" });
const alertsRegion = () => screen.getByRole('region', { name: 'Alerts' });
const activityRegion = () => screen.getByRole('region', { name: 'Recent activity' });

/** The alert list items, each as "title | detail". */
function alertItems(): string[] {
  const list = within(alertsRegion()).queryByRole('list');
  if (!list) return [];
  return within(list)
    .getAllByRole('listitem')
    .map((item) => Array.from(item.querySelectorAll('p'), (p) => p.textContent).join(' | '));
}

beforeEach(() => {
  jest.useFakeTimers({ now: todayAt('09:00') });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('heading', () => {
  test('names the screen and today’s date', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText(`Margaret's care overview — ${longDate(TODAY)}`)).toBeInTheDocument();
  });

  test('counts the schedule tasks done today (3 of 10 in the mock day)', () => {
    renderDashboard();

    expect(screen.getByLabelText('Schedule: 3 of 10 tasks done')).toHaveTextContent('3/10 tasks done');
  });

  test('includes the tasks the care recipient ticked off today, but not on another day', () => {
    seedScheduleDone(['s4', 's5', 's6', 's7', 's8', 's9', 's10']);
    const { unmount } = renderDashboard();

    expect(screen.getByLabelText('Schedule: 10 of 10 tasks done')).toHaveTextContent('10/10 tasks done');
    unmount();

    seedScheduleDone(['s4', 's5'], dayFromToday(-1));
    renderDashboard();

    expect(screen.getByLabelText('Schedule: 3 of 10 tasks done')).toBeInTheDocument();
  });
});

describe('status card', () => {
  test('medications: how many of today’s medicines have been taken', () => {
    renderDashboard();

    const card = statusCard();
    expect(within(card).getByRole('heading', { level: 2 })).toHaveTextContent("Margaret's status today");
    expect(within(card).getByText('2 of 4')).toBeInTheDocument();
    expect(within(card).getByText('taken today')).toBeInTheDocument();
  });

  test('medications: says so when everything has been taken', () => {
    seedMedsTaken(ALL_MEDS_TAKEN);
    renderDashboard();

    expect(within(statusCard()).getByText('4 of 4')).toBeInTheDocument();
    expect(within(statusCard()).getByText('All taken today')).toBeInTheDocument();
  });

  test('check-in: waiting until the care recipient checks in', () => {
    renderDashboard();

    expect(within(statusCard()).getByText('Not yet')).toBeInTheDocument();
    expect(within(statusCard()).getByText('Awaiting check-in')).toBeInTheDocument();
  });

  test('check-in: shows the time of today’s check-in', () => {
    seedCheckIn('9:15 AM');
    renderDashboard();

    expect(within(statusCard()).getByText('Done')).toBeInTheDocument();
    expect(within(statusCard()).getByText('at 9:15 AM')).toBeInTheDocument();
  });

  test('check-in: yesterday’s check-in does not count for today', () => {
    seedCheckIn('8:00 AM', dayFromToday(-1));
    renderDashboard();

    expect(within(statusCard()).getByText('Not yet')).toBeInTheDocument();
  });

  test('next appointment: the next one still to come today', () => {
    renderDashboard('09:00');

    const card = statusCard();
    expect(within(card).getByText('Blood pressure check — Dr. Sharma')).toBeInTheDocument();
    expect(within(card).getByText('Today — 10:30 am')).toBeInTheDocument();
    expect(within(card).getByText('Greenfield Surgery')).toBeInTheDocument();
  });

  test('next appointment: tomorrow’s, once today’s have passed', () => {
    renderDashboard('15:00');

    expect(within(statusCard()).getByText('Blood test — fasting needed')).toBeInTheDocument();
    expect(within(statusCard()).getByText('Tomorrow — 8:45 am')).toBeInTheDocument();
  });

  test('next appointment: a later one is shown with its date', () => {
    seedAppointments([
      appointment({ id: 'x1', title: 'Hearing test', date: dayFromToday(3), time: '14:00', location: { name: 'Westfield Audiology', type: 'clinic' } }),
    ]);
    renderDashboard();

    expect(within(statusCard()).getByText('Hearing test')).toBeInTheDocument();
    expect(within(statusCard()).getByText(`${longDate(dayFromToday(3))} — 2:00 pm`)).toBeInTheDocument();
    expect(within(statusCard()).getByText('Westfield Audiology')).toBeInTheDocument();
  });

  test('next appointment: all clear when nothing is booked', () => {
    seedAppointments([]);
    renderDashboard();

    expect(within(statusCard()).getByText('All clear')).toBeInTheDocument();
    expect(within(statusCard()).getByText('No upcoming appointments')).toBeInTheDocument();
  });
});

describe('alerts', () => {
  test('lists an overdue medicine and the appointments due today and tomorrow', () => {
    renderDashboard('09:00');

    const region = alertsRegion();
    expect(within(region).getByRole('heading', { level: 2, name: /^Alerts/ })).toBeInTheDocument();
    expect(within(region).getByLabelText('4 alerts')).toHaveTextContent('4');
    expect(alertItems()).toEqual([
      'Vitamin D3 — overdue | 1000 IU — 1 capsule was due at 8:30 am and has not been taken',
      'Appointment today | Blood pressure check — Dr. Sharma at 10:30 am',
      'Appointment today | Heart checkup — Dr. Lee at 2:30 pm',
      'Appointment tomorrow | Blood test — fasting needed at 8:45 am',
    ]);
  });

  test('the region is a polite live region, so new alerts are announced', () => {
    renderDashboard();

    expect(alertsRegion()).toHaveAttribute('aria-live', 'polite');
  });

  test('a medicine only becomes overdue once its time has passed', () => {
    const { unmount } = renderDashboard('08:00');
    expect(alertItems().filter((a) => a.includes('overdue'))).toEqual([]);
    unmount();

    renderDashboard('21:00');
    expect(alertItems().filter((a) => a.includes('overdue'))).toEqual([
      'Atorvastatin — overdue | 20 mg — 1 tablet was due at 8:00 pm and has not been taken',
      'Vitamin D3 — overdue | 1000 IU — 1 capsule was due at 8:30 am and has not been taken',
    ]);
  });

  test('a medicine the care recipient un-ticked today is overdue again', () => {
    seedMedsTaken({ m1: false });
    renderDashboard('09:00');

    expect(alertItems()).toContain(
      'Amlodipine — overdue | 5 mg — 1 tablet was due at 8:30 am and has not been taken',
    );
  });

  test('with no medicines prescribed and nothing booked there is nothing to flag', () => {
    seedMedications([]);
    seedAppointments([]);
    renderDashboard();

    expect(within(alertsRegion()).getByText('No alerts right now')).toBeInTheDocument();
    expect(within(statusCard()).getByText('0 of 0')).toBeInTheDocument();
    // BUG (minor): with no medicines on the list at all, the status card
    // (CaregiverDashboard.tsx:75, 102) still reports "All taken today", which
    // reads as confirmation that medicines were taken. It should say that no
    // medicines are scheduled.
    expect(within(statusCard()).getByText('All taken today')).toBeInTheDocument();
  });

  test('all clear: no overdue medicines and nothing in the next day', () => {
    seedMedsTaken(ALL_MEDS_TAKEN);
    seedAppointments([appointment({ id: 'x1', date: dayFromToday(5) })]);
    renderDashboard('21:00');

    const region = alertsRegion();
    expect(within(region).getByRole('heading', { level: 2, name: 'Alerts' })).toBeInTheDocument();
    expect(within(region).queryByRole('list')).toBeNull();
    expect(within(region).getByText('No alerts right now')).toBeInTheDocument();
    expect(
      within(region).getByText('All medications on track and no urgent appointments in the next 24 hours.'),
    ).toBeInTheDocument();
  });

  test('appointments earlier today still raise an alert after they have passed', () => {
    renderDashboard('16:00');

    // The status card knows both of today's appointments are over …
    expect(within(statusCard()).getByText('Tomorrow — 8:45 am')).toBeInTheDocument();
    // BUG: … but getUpcomingAlerts (caregiverStore.ts:184-196) keeps every
    // appointment dated today or tomorrow, whatever the time. At 4 pm the
    // 10:30 am and 2:30 pm visits are still flagged "Appointment today", and
    // the quick link claims "3 in the next 24 h" (it also counts tomorrow up
    // to 23:59, which can be up to 48 h away). It should keep only
    // appointments between now and now + 24 h.
    expect(alertItems()).toEqual(
      expect.arrayContaining([
        'Appointment today | Blood pressure check — Dr. Sharma at 10:30 am',
        'Appointment today | Heart checkup — Dr. Lee at 2:30 pm',
      ]),
    );
    expect(screen.getByRole('link', { name: 'Manage appointments' })).toHaveTextContent('3 in the next 24 h');
  });
});

describe('recent activity', () => {
  test('says when nothing has happened yet', () => {
    renderDashboard();

    const region = activityRegion();
    expect(within(region).getByText('No activity recorded yet.')).toBeInTheDocument();
    expect(
      within(region).getByText('Activity appears here when Margaret takes medications or checks in.'),
    ).toBeInTheDocument();
    expect(within(region).queryByRole('list')).toBeNull();
    expect(screen.getByRole('link', { name: 'View full activity log' })).toHaveTextContent('No events yet today');
  });

  test('lists the latest events with what happened and how long ago', () => {
    const now = todayAt('09:00').getTime();
    const events = [
      activityEvent('e1', 'check_in', 'Checked in at 8:59 AM', new Date(now - 30_000)),
      activityEvent('e2', 'med_taken', 'Marked Amlodipine as taken', new Date(now - 5 * 60_000)),
      activityEvent('e3', 'schedule_done', 'Finished: Breakfast', new Date(now - 3 * 3_600_000)),
      activityEvent('e4', 'med_skipped', 'Unmarked Sertraline (not taken)', new Date(now - 2 * 86_400_000)),
    ];
    seedActivity(events);
    renderDashboard();

    const timeline = within(activityRegion()).getByRole('list', { name: 'Recent activity timeline' });
    const rows = within(timeline).getAllByRole('listitem');
    // Each row: what happened | the kind of event | how long ago
    expect(rows.map((row) => Array.from(row.querySelectorAll('p, time'), (el) => el.textContent))).toEqual([
      ['Checked in at 8:59 AM', 'Checked in', 'just now'],
      ['Marked Amlodipine as taken', 'Medication taken', '5m ago'],
      ['Finished: Breakfast', 'Task completed', '3h ago'],
      ['Unmarked Sertraline (not taken)', 'Medication unmarked', '2d ago'],
    ]);
    expect(within(rows[1]).getByText('5m ago')).toHaveAttribute('datetime', events[1].timestamp);
  });

  test('shows the 8 most recent events; the full log link counts them all', () => {
    const now = todayAt('09:00').getTime();
    seedActivity(
      Array.from({ length: 10 }, (_, i) =>
        activityEvent(`e${i}`, 'med_taken', `Event ${i + 1}`, new Date(now - (i + 1) * 60_000)),
      ),
    );
    renderDashboard();

    const timeline = within(activityRegion()).getByRole('list', { name: 'Recent activity timeline' });
    const rows = within(timeline).getAllByRole('listitem');
    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveTextContent('Event 1');
    expect(rows[7]).toHaveTextContent('Event 8');
    expect(screen.getByRole('link', { name: 'View full activity log' })).toHaveTextContent('10 events recorded');
  });
});

describe('quick links', () => {
  test('summarise each area', () => {
    renderDashboard();

    const quickLinks = screen.getByRole('region', { name: 'Quick links' });
    expect(within(quickLinks).getByRole('link', { name: 'Manage medications' })).toHaveTextContent('2/4 taken today');
    expect(within(quickLinks).getByRole('link', { name: 'Manage appointments' })).toHaveTextContent('3 in the next 24 h');
    expect(within(quickLinks).getByRole('link', { name: 'View caregiver notes' })).toHaveTextContent(
      'Daily observations log',
    );
  });

  test('with nothing due in the next day, the appointments link offers the full list', () => {
    seedAppointments([appointment({ id: 'x1', date: dayFromToday(4) })]);
    renderDashboard();

    expect(screen.getByRole('link', { name: 'Manage appointments' })).toHaveTextContent('View upcoming visits');
  });

  test.each([
    ['View all', '/app/activity'],
    ['Manage medications', '/app/manage-medications'],
    ['Manage appointments', '/app/manage-appointments'],
    ['View caregiver notes', '/app/caregiver'],
    ['View full activity log', '/app/activity'],
  ])('"%s" opens %s', async (name, path) => {
    const { user, location } = renderDashboard();

    await user.click(screen.getByRole('link', { name }));

    expect(location().pathname).toBe(path);
  });
});

describe('keeping up to date', () => {
  function patientActsOnTheirScreens() {
    seedMedsTaken(ALL_MEDS_TAKEN);
    seedCheckIn('9:20 AM');
    seedActivity([activityEvent('e1', 'check_in', 'Checked in at 9:20 AM', todayAt('09:20'))]);
  }

  test('refreshes when the caregiver comes back to the window', () => {
    renderDashboard();
    patientActsOnTheirScreens();
    expect(within(statusCard()).getByText('Not yet')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(within(statusCard()).getByText('Done')).toBeInTheDocument();
    expect(within(statusCard()).getByText('4 of 4')).toBeInTheDocument();
    expect(within(activityRegion()).getByText('Checked in at 9:20 AM')).toBeInTheDocument();
    expect(alertItems().filter((a) => a.includes('overdue'))).toEqual([]);
  });

  test('refreshes every 30 seconds while it is open', () => {
    renderDashboard();
    patientActsOnTheirScreens();

    act(() => jest.advanceTimersByTime(29_999));
    expect(within(statusCard()).getByText('Not yet')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(within(statusCard()).getByText('Done')).toBeInTheDocument();
    expect(within(statusCard()).getByText('at 9:20 AM')).toBeInTheDocument();
  });

  test('stops polling once it is closed', () => {
    const { unmount } = renderDashboard();
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
