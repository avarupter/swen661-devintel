/**
 * Home — the original dashboard (greeting, today's summary, what's next,
 * quick links). App.tsx no longer routes to it — Today replaced it at /app —
 * and nothing imports it, so it is rendered directly with its `view` prop.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Home from '../Home';
import * as mockData from '../../data/mockData';
import { appointments } from '../../data/appointmentsData';
import { renderWithProviders } from '../../test/test-utils';
import type { AppView } from '../../types';

// mockData stamps "today" when it is imported; keep that date (TZ is UTC).
const TODAY = appointments[0].date;

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(`${TODAY}T09:00:00Z`) });
});

afterEach(() => {
  jest.useRealTimers();
});

function renderHome(view: AppView = 'patient') {
  return renderWithProviders(<Home view={view} />, { route: '/', role: view });
}

const summary = () => screen.getByRole('region', { name: "Today's summary" });
const whatsNext = () => screen.getByRole('region', { name: "What's next today" });

/**
 * The value shown on a summary card. A card is a label <span> (beside an icon)
 * above a value <span>; nothing in the markup ties the two together, so the
 * value is read from the element after the label's row.
 */
function stat(label: string) {
  return within(summary()).getByText(label).parentElement?.nextElementSibling?.textContent;
}

describe('greeting', () => {
  // Any day will do for the wording: Monday 2 November 2026.
  const MONDAY = '2026-11-02';

  test('greets the care recipient with the full date', () => {
    jest.setSystemTime(new Date(`${MONDAY}T09:00:00Z`));
    renderHome('patient');

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good morning, Dorothy!');
    expect(
      screen.getByText('Today is Monday, 2 November 2026. Here is your day at a glance.'),
    ).toBeInTheDocument();
  });

  test('greets the caregiver and says whose care plan this is', () => {
    jest.setSystemTime(new Date(`${MONDAY}T09:00:00Z`));
    renderHome('caregiver');

    // Home.tsx:58,63 hard-code "Dorothy" and "Joyce": the rest of the app calls
    // the care recipient Margaret (AppContext) and greets the signed-in user.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good morning, Joyce!');
    expect(screen.getByText("Viewing Dorothy's care plan for Monday, 2 November 2026.")).toBeInTheDocument();
  });

  test.each([
    ['11:59', 'Good morning'],
    ['12:00', 'Good afternoon'],
    ['16:59', 'Good afternoon'],
    ['17:00', 'Good evening'],
  ])('at %s it says "%s"', (time, greeting) => {
    jest.setSystemTime(new Date(`${MONDAY}T${time}:00Z`));
    renderHome('patient');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${greeting}, Dorothy!`);
  });
});

describe("today's summary", () => {
  test('shows tasks done, medicines left, appointments and memory cards', () => {
    renderHome();

    expect(stat('Tasks done')).toBe('3 / 10');
    expect(stat('Medicines left')).toBe('2'); // Atorvastatin and Vitamin D3
    // BUG: Home.tsx:88 hard-codes "1", but the data has two appointments today
    // (the blood pressure check and the heart checkup). "Memory cards"
    // (Home.tsx:94) is hard-coded too; it is right only because there are six.
    expect(stat('Appointments')).toBe('1');
    expect(stat('Memory cards')).toBe('6');
  });

  test('counts only the medicines not yet taken today', () => {
    jest.replaceProperty(
      mockData,
      'medications',
      mockData.medications.map((med) => ({ ...med, taken: { [TODAY]: true } })),
    );
    renderHome();

    expect(stat('Medicines left')).toBe('0');
  });
});

describe("what's next today", () => {
  test('lists the next three tasks still to do, with their times', () => {
    renderHome();

    const items = within(whatsNext()).getAllByRole('listitem');
    expect(items).toHaveLength(3);

    expect(within(items[0]).getByText('Walk in the garden')).toBeInTheDocument();
    expect(within(items[0]).getByText('20 minutes of fresh air')).toBeInTheDocument();
    expect(within(items[0]).getByText('10:00 am')).toHaveAttribute('datetime', '10:00');

    expect(within(items[1]).getByText('Lunch')).toBeInTheDocument();
    expect(within(items[1]).getByText('12:00 pm')).toHaveAttribute('datetime', '12:00');

    expect(within(items[2]).getByText('Rest time')).toBeInTheDocument();
    expect(within(items[2]).getByText('1:00 pm')).toHaveAttribute('datetime', '13:00');
  });

  test('a task without a description shows just its name and time', () => {
    jest.replaceProperty(mockData, 'scheduleItems', [
      { id: 'x1', time: '19:15', label: 'Phone Maria', category: 'appointment', done: false },
    ]);
    renderHome();

    const [item] = within(whatsNext()).getAllByRole('listitem');
    expect(within(item).getAllByRole('paragraph').map((p) => p.textContent)).toEqual(['Phone Maria']);
    expect(within(item).getByText('7:15 pm')).toBeInTheDocument();
  });

  test('says so when every task is done', () => {
    jest.replaceProperty(
      mockData,
      'scheduleItems',
      mockData.scheduleItems.map((item) => ({ ...item, done: true })),
    );
    renderHome();

    expect(within(whatsNext()).queryByRole('list')).toBeNull();
    expect(within(whatsNext()).getByText('All done for today!')).toBeInTheDocument();
    expect(within(whatsNext()).getByText('What a great day.')).toBeInTheDocument();
    expect(stat('Tasks done')).toBe('10 / 10');
  });
});

describe('links', () => {
  test('point at the old top-level paths, which App.tsx redirects into /app', () => {
    renderHome();

    expect(within(whatsNext()).getByRole('link', { name: 'See full day' })).toHaveAttribute('href', '/schedule');

    const quickLinks = screen.getByRole('region', { name: 'Quick links' });
    expect(within(quickLinks).getByRole('heading', { level: 2 })).toHaveTextContent('Quick links');
    expect(
      within(quickLinks)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['My Day', '/schedule'],
      ['Medicines', '/medications'],
      ['Memories', '/memories'],
      ['Contacts', '/contacts'],
    ]);
  });

  test.each([
    ['See full day', '/schedule'],
    ['Medicines', '/medications'],
    ['Contacts', '/contacts'],
  ])('"%s" navigates to %s', async (name, path) => {
    const { user, location } = renderHome();

    await user.click(screen.getByRole('link', { name }));

    expect(location().pathname).toBe(path);
  });
});
