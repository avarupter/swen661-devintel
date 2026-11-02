/**
 * Today — the care recipient's home screen at /app: the next thing to do,
 * the rest of the day, and four quick actions (medicines, appointments,
 * check in, call the caregiver).
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Today from '../Today';
import { appointments } from '../../data/appointmentsData';
import { getActivityLog, getCheckInStatus, getScheduleAdherence } from '../../data/caregiverStore';
import { renderWithProviders } from '../../test/test-utils';

// Today.tsx and the data modules stamp "today" when they are imported. Keep
// that date and move only the time of day (jest.config.js pins TZ=UTC).
const TODAY = appointments[0].date;
const DAY_MS = 24 * 60 * 60 * 1000;
const YESTERDAY = new Date(Date.parse(TODAY) - DAY_MS).toISOString().split('T')[0];
const TOMORROW = new Date(Date.parse(TODAY) + DAY_MS).toISOString().split('T')[0];

// localStorage keys Today shares with the caregiver dashboard (caregiverStore)
const DONE_KEY = 'careconnect_schedule_done';
const CHECKIN_KEY = 'careconnect_checkin';

// Every s* id that starts the day not done (s1–s3 are done in the mock data).
const UNDONE_IDS = ['s4', 's5', 's6', 's7', 's8', 's9', 's10'];

function at(time: string) {
  jest.setSystemTime(new Date(`${TODAY}T${time}:00Z`));
}

beforeEach(() => {
  // Before rendering, so the render helper's user-event drives the fake clock.
  jest.useFakeTimers({ now: new Date(`${TODAY}T09:00:00Z`) });
});

afterEach(() => {
  jest.useRealTimers();
});

function renderToday() {
  return renderWithProviders(<Today />, { route: '/app', role: 'patient' });
}

function saveDone(ids: string[], date = TODAY) {
  localStorage.setItem(DONE_KEY, JSON.stringify({ date, ids }));
}

const nextThing = () => screen.getByRole('region', { name: 'Next thing to do' });
const laterToday = () => screen.getByRole('region', { name: 'Later today' });
const quickActions = () => screen.getByRole('region', { name: 'Quick actions' });
const checkInTile = () => within(quickActions()).getByRole('button', { name: /^Check(ed)? In — / });

function cardTitles(container: HTMLElement) {
  return within(container)
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

describe('heading', () => {
  test('greets Margaret and counts what is already done today', () => {
    renderToday();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Here's your day, Margaret");
    expect(screen.getByText('3 of 10 things done today')).toBeInTheDocument();
  });
});

describe('next thing to do', () => {
  test('features the first medicine or appointment still to do', () => {
    renderToday();

    const card = nextThing();
    expect(within(card).getByText('Video call with Maria')).toBeInTheDocument();
    expect(within(card).getByText('Your daughter — she will call you')).toBeInTheDocument();
    expect(within(card).getByText('Appointment')).toBeInTheDocument();
    expect(within(card).getByText('3:00 pm')).toHaveAttribute('datetime', '15:00');
    expect(within(card).getByText('Coming up')).toBeInTheDocument();
    expect(
      within(card).getByRole('button', { name: "I'm ready: Video call with Maria" }),
    ).toHaveTextContent("I'm ready");
  });

  test.each([
    ['13:59', 'Coming up'], // more than an hour before the 3:00 pm call
    ['14:00', 'Now'], // an hour before
    ['15:00', 'Now'],
    ['15:30', 'Now'], // half an hour after
  ])('at %s the 3:00 pm call is badged "%s"', (time, status) => {
    at(time);
    renderToday();

    expect(within(nextThing()).getByText(status)).toBeInTheDocument();
  });

  test('a task more than half an hour late is badged "Coming up"', () => {
    at('16:00');
    renderToday();

    // BUG: Today.tsx:49-54 — computeStatus knows only done / now / upcoming, so
    // anything more than 30 minutes overdue falls through to "upcoming" and is
    // badged "Coming up". At 4 pm the 3 pm call, and the 10 am walk below it,
    // read as still ahead. Overdue tasks need their own status (e.g. "Missed").
    expect(within(nextThing()).getByText('Coming up')).toBeInTheDocument();
    const walk = within(laterToday()).getByRole('region', { name: 'Walk in the garden' });
    expect(within(walk).getByText('Coming up')).toBeInTheDocument();
  });

  test('marking it done features the next medicine, counts it, and saves it for the caregiver', async () => {
    const { user } = renderToday();

    await user.click(screen.getByRole('button', { name: "I'm ready: Video call with Maria" }));

    const card = nextThing();
    expect(within(card).getByText('Evening medications')).toBeInTheDocument();
    expect(within(card).getByText('Medicine')).toBeInTheDocument();
    expect(within(card).getByText('5:30 pm')).toHaveAttribute('datetime', '17:30');
    expect(
      within(card).getByRole('button', { name: 'Mark as taken: Evening medications' }),
    ).toHaveTextContent('Mark as taken');
    expect(screen.getByText('4 of 10 things done today')).toBeInTheDocument();
    // The featured medicine left "Later today", and the next task moved up.
    expect(cardTitles(laterToday())).toEqual(['Walk in the garden', 'Lunch', 'Rest time', 'Dinner']);
    // The caregiver dashboard reads the same saved list.
    expect(JSON.parse(localStorage.getItem(DONE_KEY) ?? 'null')).toEqual({ date: TODAY, ids: ['s7'] });
    expect(getScheduleAdherence()).toEqual({ doneCount: 4, totalCount: 10 });
  });

  test('says "All done for today!" once the medicines and appointments are done, with other tasks left', async () => {
    const { user } = renderToday();

    await user.click(screen.getByRole('button', { name: "I'm ready: Video call with Maria" }));
    await user.click(screen.getByRole('button', { name: 'Mark as taken: Evening medications' }));

    // BUG: Today.tsx:332-334 and 394-402 — only a medicine or an appointment can
    // be featured, and when none is left the card switches to "All done for
    // today! You've completed everything on your list" while the count says
    // 5 of 10 and "Later today" still lists four tasks (a walk, lunch, rest,
    // dinner). It should feature the next task of any kind, and celebrate only
    // when every task is done.
    expect(within(nextThing()).getByText('All done for today!')).toBeInTheDocument();
    expect(within(nextThing()).queryByRole('button')).toBeNull();
    expect(screen.getByText('5 of 10 things done today')).toBeInTheDocument();
    expect(within(laterToday()).getAllByRole('listitem')).toHaveLength(4);
  });

  test('celebrates when every task is done, and leaves out "Later today"', () => {
    saveDone(UNDONE_IDS);
    renderToday();

    expect(within(nextThing()).getByText('All done for today!')).toBeInTheDocument();
    expect(
      within(nextThing()).getByText(
        "You've completed everything on your list. What a wonderful day, Margaret.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('10 of 10 things done today')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Later today' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'See full day schedule' })).toBeNull();
  });
});

describe('later today', () => {
  test('lists the next four other tasks, each with its time, type and status', () => {
    renderToday();

    const later = laterToday();
    expect(within(later).getByRole('heading', { level: 2 })).toHaveTextContent('Later today');
    expect(within(later).getAllByRole('listitem')).toHaveLength(4);
    expect(cardTitles(later)).toEqual(['Walk in the garden', 'Lunch', 'Rest time', 'Evening medications']);

    const walk = within(later).getByRole('region', { name: 'Walk in the garden' });
    expect(within(walk).getByText('10:00 am')).toHaveAttribute('datetime', '10:00');
    expect(within(walk).getByText('Activity')).toBeInTheDocument();
    expect(within(walk).getByText('20 minutes of fresh air')).toBeInTheDocument();
    expect(within(walk).getByText('Now')).toBeInTheDocument(); // within the hour

    const lunch = within(later).getByRole('region', { name: 'Lunch' });
    expect(within(lunch).getByText('12:00 pm')).toBeInTheDocument();
    expect(within(lunch).getByText('Meal')).toBeInTheDocument();
    expect(within(lunch).getByText('Chicken soup and bread roll')).toBeInTheDocument();
    expect(within(lunch).getByText('Coming up')).toBeInTheDocument();

    // A task without a description shows its name, time, type and status only.
    const meds = within(later).getByRole('region', { name: 'Evening medications' });
    expect(within(meds).getByText('5:30 pm')).toBeInTheDocument();
    expect(within(meds).getByText('Medicine')).toBeInTheDocument();
    expect(within(meds).queryByRole('paragraph')).toBeNull();
  });

  test('links to the full day schedule', async () => {
    const { user, location } = renderToday();

    await user.click(within(laterToday()).getByRole('link', { name: 'See full day schedule' }));

    expect(location().pathname).toBe('/app/schedule');
  });

  test('is left out when the featured task is the only one left', () => {
    saveDone(UNDONE_IDS.filter((id) => id !== 's7'));
    renderToday();

    expect(within(nextThing()).getByText('Video call with Maria')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Later today' })).toBeNull();
  });
});

describe('quick actions', () => {
  test('offers four large buttons', () => {
    renderToday();

    expect(within(quickActions()).getByRole('heading', { level: 2 })).toHaveTextContent('Quick actions');
    expect(
      within(quickActions())
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Medications', 'Appointments', 'Check In', 'Call Caregiver']);
  });

  test.each([
    ["Medications — View and mark today's medicines", '/app/medications'],
    ['Appointments — See your upcoming visits and calls', '/app/appointments'],
  ])('"%s" opens %s', async (name, path) => {
    const { user, location } = renderToday();

    await user.click(within(quickActions()).getByRole('button', { name }));

    expect(location().pathname).toBe(path);
  });

  test('Check In lets the caregiver know, and says so politely', async () => {
    const { user } = renderToday();
    expect(screen.queryByRole('status')).toBeNull();
    expect(checkInTile()).toHaveAccessibleName("Check In — Let your caregiver know you're well");

    await user.click(checkInTile());

    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(within(banner).getByText('Checked in')).toBeInTheDocument();
    expect(
      within(banner).getByText(/^You checked in at 9:00\sAM\. Your caregiver can see you're doing well\.$/),
    ).toBeInTheDocument();
    expect(checkInTile()).toHaveAccessibleName(/^Checked In — Checked in at 9:00\sAM$/);
    expect(checkInTile()).toBeDisabled();
    // What the caregiver dashboard and activity log read
    expect(getCheckInStatus()).toEqual({ checkedIn: true, time: expect.stringMatching(/^9:00\sAM$/) });
    expect(getActivityLog()).toEqual([
      expect.objectContaining({
        kind: 'check_in',
        label: expect.stringMatching(/^Checked in at 9:00\sAM$/),
        timestamp: `${TODAY}T09:00:00.000Z`,
      }),
    ]);
  });

  test('a check-in is remembered for the rest of the day, and cannot be repeated', async () => {
    const morning = renderToday();
    await morning.user.click(checkInTile());
    morning.unmount();

    at('15:00');
    const { user } = renderToday();

    expect(screen.getByRole('status')).toHaveTextContent(/You checked in at 9:00\sAM\./);
    expect(checkInTile()).toBeDisabled();
    await user.click(checkInTile());
    expect(getActivityLog()).toHaveLength(1);
  });

  test("yesterday's check-in does not count", () => {
    localStorage.setItem(CHECKIN_KEY, JSON.stringify({ date: YESTERDAY, time: '8:00 AM' }));
    renderToday();

    expect(screen.queryByRole('status')).toBeNull();
    expect(checkInTile()).toHaveAccessibleName("Check In — Let your caregiver know you're well");
    expect(checkInTile()).toBeEnabled();
  });

  test('Call Caregiver phones Joyce', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { user, location } = renderToday();

    await user.click(
      within(quickActions()).getByRole('button', { name: 'Call Caregiver — Call Joyce — 07700 900 456' }),
    );

    // The tile sets window.location.href = 'tel:07700900456'. jsdom cannot
    // navigate, so it reports "Not implemented: navigation" (without the URL).
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'not implemented',
        message: expect.stringContaining('navigation'),
      }),
    );
    expect(location().pathname).toBe('/app');
  });
});

describe('saved progress', () => {
  test('tasks marked done earlier today are restored', () => {
    saveDone(['s7']);
    renderToday();

    expect(screen.getByText('4 of 10 things done today')).toBeInTheDocument();
    expect(within(nextThing()).getByText('Evening medications')).toBeInTheDocument();
  });

  test("yesterday's list is ignored, and replaced with today's", () => {
    saveDone(['s7'], YESTERDAY);
    renderToday();

    expect(screen.getByText('3 of 10 things done today')).toBeInTheDocument();
    expect(within(nextThing()).getByText('Video call with Maria')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DONE_KEY) ?? 'null')).toEqual({ date: TODAY, ids: [] });
  });

  test('unreadable saved data is ignored', () => {
    localStorage.setItem(DONE_KEY, 'not json');
    localStorage.setItem(CHECKIN_KEY, 'not json');
    renderToday();

    expect(screen.getByText('3 of 10 things done today')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
    expect(checkInTile()).toBeEnabled();
  });

  test('after midnight, until the page is reloaded, yesterday still counts as today', async () => {
    at('23:30');
    const lateEvening = renderToday();
    await lateEvening.user.click(screen.getByRole('button', { name: "I'm ready: Video call with Maria" }));
    await lateEvening.user.click(checkInTile());
    lateEvening.unmount();

    // The next morning, in the same browser session (no reload).
    jest.setSystemTime(new Date(`${TOMORROW}T08:00:00Z`));
    renderToday();

    // BUG: Today.tsx:22 — TODAY_DATE is computed once, when the module loads, so
    // until a reload the new day reuses yesterday's list and check-in: the call
    // is still done, the banner says "You checked in at 11:30 PM", and the Check
    // In tile stays disabled (an installed PWA left open overnight never resets).
    // The date should be read when the screen renders.
    expect(screen.getByText('4 of 10 things done today')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/You checked in at 11:30\sPM\./);
    expect(checkInTile()).toBeDisabled();
  });
});
