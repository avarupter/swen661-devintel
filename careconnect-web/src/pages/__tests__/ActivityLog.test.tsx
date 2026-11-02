/**
 * ActivityLog — the caregiver's full timeline of what the care recipient did
 * (/app/activity): medicines ticked and un-ticked, tasks finished, check-ins.
 * Events come from the activity log the care recipient's screens append to
 * localStorage; the page re-reads it on Refresh and on window focus.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { act, screen, within } from '@testing-library/react';
import ActivityLog from '../ActivityLog';
import { renderWithProviders } from '../../test/test-utils';
import { activityEvent, dayFromToday, longDate, seedActivity, todayAt } from '../../test/caregiverFixtures';

function renderActivityLog() {
  return renderWithProviders(<ActivityLog />, { route: '/app/activity', role: 'caregiver' });
}

/** The day sections ("Activity for Today", …) in page order. */
function daySections() {
  return screen.queryAllByRole('region', { name: /^Activity for / });
}

const THREE_DAYS_AGO = dayFromToday(-3);

const EVENTS = [
  activityEvent('e1', 'check_in', 'Checked in at 8:45 AM', todayAt('08:45')),
  activityEvent('e2', 'med_taken', 'Marked Amlodipine as taken', todayAt('08:31')),
  activityEvent('e3', 'med_skipped', 'Unmarked Atorvastatin (not taken)', todayAt('20:05', dayFromToday(-1))),
  activityEvent('e4', 'schedule_done', 'Finished: Walk in the garden', todayAt('10:20', THREE_DAYS_AGO)),
];

beforeEach(() => {
  jest.useFakeTimers({ now: todayAt('09:00') });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ActivityLog', () => {
  test('names the screen and explains what it shows', () => {
    renderActivityLog();

    expect(screen.getByRole('heading', { level: 1, name: 'Activity log' })).toBeInTheDocument();
    expect(
      screen.getByText("Margaret's recent actions — medications taken, check-ins, and tasks"),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh activity log' })).toHaveTextContent('Refresh');
  });

  test('has a legend of the four kinds of event', () => {
    renderActivityLog();

    const legend = screen.getByRole('list', { name: 'Activity type legend' });
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Medication taken',
      'Medication unmarked',
      'Task completed',
      'Checked in',
    ]);
  });

  test('says when nothing has been recorded yet', () => {
    renderActivityLog();

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(
      screen.getByText('Events will appear here when Margaret takes medications, completes tasks, or checks in.'),
    ).toBeInTheDocument();
    expect(daySections()).toEqual([]);
  });

  test('groups events by day: Today, Yesterday, then the date', () => {
    seedActivity(EVENTS);
    renderActivityLog();

    expect(daySections().map((section) => section.getAttribute('aria-label'))).toEqual([
      'Activity for Today',
      'Activity for Yesterday',
      `Activity for ${longDate(THREE_DAYS_AGO)}`,
    ]);
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(3);
    expect(headings[0]).toHaveTextContent(/^Today\s*— 2 events$/);
    expect(headings[1]).toHaveTextContent(/^Yesterday\s*— 1 event$/);
    expect(headings[2]).toHaveTextContent(new RegExp(`^${longDate(THREE_DAYS_AGO)}\\s*— 1 event$`));
    expect(screen.queryByText('No activity yet')).toBeNull();
  });

  test('each event says what happened, what kind of event it was and when', () => {
    seedActivity(EVENTS);
    renderActivityLog();

    const today = screen.getByRole('list', { name: 'Events for Today' });
    const [checkIn, medTaken] = within(today).getAllByRole('listitem');

    expect(within(checkIn).getByText('Checked in at 8:45 AM')).toBeInTheDocument();
    expect(within(checkIn).getByText('Checked in')).toBeInTheDocument();
    expect(within(checkIn).getByText(/^8:45\sAM$/)).toHaveAttribute('datetime', EVENTS[0].timestamp);

    expect(within(medTaken).getByText('Marked Amlodipine as taken')).toBeInTheDocument();
    expect(within(medTaken).getByText('Medication taken')).toBeInTheDocument();
    expect(within(medTaken).getByText(/^8:31\sAM$/)).toBeInTheDocument();

    const yesterday = screen.getByRole('list', { name: 'Events for Yesterday' });
    expect(within(yesterday).getByText('Medication unmarked')).toBeInTheDocument();
    expect(within(yesterday).getByText(/^8:05\sPM$/)).toBeInTheDocument();

    const older = screen.getByRole('list', { name: `Events for ${longDate(THREE_DAYS_AGO)}` });
    expect(within(older).getByText('Finished: Walk in the garden')).toBeInTheDocument();
    expect(within(older).getByText('Task completed')).toBeInTheDocument();
  });

  test('Refresh picks up events recorded since the page opened', async () => {
    const { user } = renderActivityLog();
    seedActivity(EVENTS.slice(0, 1));
    expect(screen.getByText('No activity yet')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh activity log' }));

    expect(screen.getByText('Checked in at 8:45 AM')).toBeInTheDocument();
    expect(screen.queryByText('No activity yet')).toBeNull();
  });

  test('coming back to the window refreshes it too', () => {
    renderActivityLog();
    seedActivity(EVENTS);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(daySections()).toHaveLength(3);
  });
});
