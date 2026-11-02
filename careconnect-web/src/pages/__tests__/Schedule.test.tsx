/**
 * Schedule — "My Day" at /app/schedule: the whole day as a checklist, with a
 * progress bar, a celebration when everything is done, and a category key.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Schedule from '../Schedule';
import { appointments } from '../../data/appointmentsData';
import { getScheduleAdherence } from '../../data/caregiverStore';
import { renderWithProviders } from '../../test/test-utils';

// The data modules stamp "today" when they are imported; keep that date.
const TODAY = appointments[0].date;

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(`${TODAY}T09:00:00Z`) });
});

afterEach(() => {
  jest.useRealTimers();
});

function renderSchedule() {
  return renderWithProviders(<Schedule />, { route: '/app/schedule', role: 'patient' });
}

// Each task is an <article> named "<time>: <task>", plus " — done" once done.
const THE_DAY = [
  '7:30 am: Wake up & stretch — done',
  '8:00 am: Breakfast — done',
  '8:30 am: Morning medications — done',
  '10:00 am: Walk in the garden',
  '12:00 pm: Lunch',
  '1:00 pm: Rest time',
  '3:00 pm: Video call with Maria',
  '5:30 pm: Evening medications',
  '6:00 pm: Dinner',
  '8:30 pm: Bedtime',
];

const dayList = () => screen.getByRole('region', { name: "Today's schedule" });
const task = (name: string) => screen.getByRole('article', { name });
const progressBar = () => screen.getByRole('progressbar');

function expectProgress(done: number, percent: number) {
  expect(screen.getByText(`${done} of 10 tasks complete`)).toBeInTheDocument();
  expect(screen.getByText(`${percent}%`)).toBeInTheDocument();
  expect(progressBar()).toHaveAccessibleName(`${percent}% of today's tasks complete`);
  expect(progressBar()).toHaveAttribute('aria-valuenow', String(percent));
}

describe('page', () => {
  test("is headed My Day, with today's date", () => {
    jest.setSystemTime(new Date('2026-11-02T09:00:00Z'));
    renderSchedule();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Day');
    expect(screen.getByText('Monday 2 November')).toBeInTheDocument();
  });

  test('lists the whole day in time order, saying which tasks are done', () => {
    renderSchedule();

    const tasks = within(dayList()).getAllByRole('article');
    expect(tasks).toHaveLength(THE_DAY.length);
    tasks.forEach((article, i) => expect(article).toHaveAccessibleName(THE_DAY[i]));
  });

  test('each task shows its time, name, category and description', () => {
    renderSchedule();

    const walk = task('10:00 am: Walk in the garden');
    expect(within(walk).getByText('10:00 am')).toHaveAttribute('datetime', '10:00');
    expect(within(walk).getByText('Walk in the garden')).toBeInTheDocument();
    expect(within(walk).getByText('Activity')).toBeInTheDocument();
    expect(within(walk).getByText('20 minutes of fresh air')).toBeInTheDocument();

    // Without a description, the name is the task's only paragraph.
    const meds = task('5:30 pm: Evening medications');
    expect(within(meds).getAllByRole('paragraph').map((p) => p.textContent)).toEqual(['Evening medications']);
    expect(within(meds).getByText('Medicine')).toBeInTheDocument();
  });

  test('shows progress as words, a percentage and an accessible progress bar', () => {
    renderSchedule();

    expectProgress(3, 30);
    expect(progressBar()).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar()).toHaveAttribute('aria-valuemax', '100');
  });

  test('explains the category labels and how to tick a task off', () => {
    renderSchedule();

    const legend = screen.getByRole('region', { name: 'Category legend' });
    expect(within(legend).getByRole('heading', { level: 2 })).toHaveTextContent('Category key');
    for (const label of ['Meal', 'Medicine', 'Activity', 'Appointment', 'Rest']) {
      expect(within(legend).getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Tap the circle to mark a task done')).toBeInTheDocument();
  });
});

describe('ticking tasks off', () => {
  test('the circle marks a task done, and pressing it again marks it not done', async () => {
    const { user } = renderSchedule();
    const toggle = screen.getByRole('button', { name: 'Mark "Walk in the garden" as done' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName('Mark "Walk in the garden" as not done');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(task('10:00 am: Walk in the garden — done')).toBeInTheDocument();
    expectProgress(4, 40);

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName('Mark "Walk in the garden" as done');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(task('10:00 am: Walk in the garden')).toBeInTheDocument();
    expectProgress(3, 30);
  });

  test('a task that started the day done can be marked not done', async () => {
    const { user } = renderSchedule();
    const toggle = screen.getByRole('button', { name: 'Mark "Breakfast" as not done' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName('Mark "Breakfast" as done');
    expect(task('8:00 am: Breakfast')).toBeInTheDocument();
    expectProgress(2, 20);
  });

  test('finishing the last task celebrates, in a polite status message', async () => {
    const { user } = renderSchedule();
    expect(screen.queryByRole('status')).toBeNull();

    for (const toggle of screen.getAllByRole('button', { name: / as done$/ })) {
      await user.click(toggle);
    }

    const celebration = screen.getByRole('status');
    expect(celebration).toHaveAttribute('aria-live', 'polite');
    expect(within(celebration).getByText('Wonderful job today!')).toBeInTheDocument();
    expect(within(celebration).getByText('Every task is complete. Enjoy your evening.')).toBeInTheDocument();
    expectProgress(10, 100);

    // Un-ticking any task takes the celebration away again.
    await user.click(screen.getByRole('button', { name: 'Mark "Bedtime" as not done' }));

    expect(screen.queryByRole('status')).toBeNull();
    expectProgress(9, 90);
  });
});

describe('sharing progress with Today and the caregiver', () => {
  test('does not show tasks marked done on the Today screen', () => {
    // What Today.tsx saves after "I'm ready: Video call with Maria"
    localStorage.setItem('careconnect_schedule_done', JSON.stringify({ date: TODAY, ids: ['s7'] }));
    renderSchedule();

    // BUG: Schedule.tsx:29 starts from the static mock items and never reads
    // careconnect_schedule_done, which Today writes and the caregiver dashboard
    // reads — so a task done on Today still shows as not done on My Day.
    expect(task('3:00 pm: Video call with Maria')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark "Video call with Maria" as done' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expectProgress(3, 30);
  });

  test('ticks are not saved: the caregiver never sees them, and they are gone on return', async () => {
    const first = renderSchedule();
    await first.user.click(screen.getByRole('button', { name: 'Mark "Walk in the garden" as done' }));
    expectProgress(4, 40);

    // BUG: Schedule.tsx:34-38 keeps ticks in component state only — nothing is
    // written to careconnect_schedule_done (or the activity log, although
    // caregiverStore defines a 'schedule_done' event), so the caregiver's
    // adherence count stays at 3 and the tick is lost when the screen unmounts.
    expect(localStorage.getItem('careconnect_schedule_done')).toBeNull();
    expect(getScheduleAdherence()).toEqual({ doneCount: 3, totalCount: 10 });

    first.unmount();
    renderSchedule();

    expect(task('10:00 am: Walk in the garden')).toBeInTheDocument();
    expectProgress(3, 30);
  });
});
