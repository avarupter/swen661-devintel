import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { act, screen, within } from '@testing-library/react';
import Layout from './Layout';
import { renderWithProviders } from '../test/test-utils';
import type { RenderWithProvidersOptions } from '../test/test-utils';
import type { AppView } from '../types';

// jest.config.js pins TZ=UTC, so these instants are also the local times.
const MONDAY_MORNING = new Date('2026-11-02T09:05:30Z');

function renderLayout(view: AppView, options: RenderWithProvidersOptions = {}) {
  const onSwitchRole = jest.fn();
  const onSignOut = jest.fn();
  const result = renderWithProviders(
    <Layout view={view} onSwitchRole={onSwitchRole} onSignOut={onSignOut}>
      <p>Screen content</p>
    </Layout>,
    { route: '/app', role: view, ...options },
  );
  return { ...result, onSwitchRole, onSignOut };
}

function navLinks() {
  const nav = screen.getByRole('navigation', { name: 'Main navigation' });
  return within(nav).getAllByRole('link');
}

beforeEach(() => {
  jest.useFakeTimers({ now: MONDAY_MORNING });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('orientation bar', () => {
  test('shows the date, the time, a greeting and the current screen', () => {
    renderLayout('patient', { route: '/app/schedule' });

    const banner = screen.getByRole('banner');
    expect(within(banner).getByText('Monday 2 November')).toHaveAttribute('datetime', '2026-11-02T09:05');
    expect(within(banner).getByLabelText(/^Current time: 9:05\sAM$/)).toBeInTheDocument();
    expect(within(banner).getByText('Good morning, Sam')).toBeInTheDocument();
    expect(within(banner).getByLabelText('Current screen: My Day')).toHaveTextContent('My Day');
  });

  test.each([
    ['11:59', 'Good morning'],
    ['12:00', 'Good afternoon'],
    ['16:59', 'Good afternoon'],
    ['17:00', 'Good evening'],
  ])('at %s it says "%s"', (time, greeting) => {
    jest.setSystemTime(new Date(`2026-11-02T${time}:00Z`));

    renderLayout('patient');

    expect(screen.getByText(`${greeting}, Sam`)).toBeInTheDocument();
  });

  test('greets without a name when no user is signed in', () => {
    renderLayout('patient', { role: undefined, signedIn: false });

    expect(screen.getByText('Good morning')).toBeInTheDocument();
  });

  test.each([
    ['/app', 'Home'],
    ['/app/appointments', 'My Appointments'],
    ['/app/caregiver', 'Caregiver Notes'],
    ['/app/manage-medications', 'Manage Medications'],
    ['/app/not-a-screen', 'CareConnect'],
  ])('names %s as "%s"', (route, title) => {
    renderLayout('caregiver', { route });

    expect(screen.getByLabelText(`Current screen: ${title}`)).toBeInTheDocument();
  });

  test('the clock moves on at the next minute and then every minute', () => {
    renderLayout('patient');
    expect(screen.getByLabelText(/^Current time: 9:05\sAM$/)).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(29_999));
    expect(screen.getByLabelText(/^Current time: 9:05\sAM$/)).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.getByLabelText(/^Current time: 9:06\sAM$/)).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(60_000));
    expect(screen.getByLabelText(/^Current time: 9:07\sAM$/)).toBeInTheDocument();
  });

  test('unmounting before the first tick cancels the clock', () => {
    const { unmount } = renderLayout('patient');
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });

  test('after the first tick, the clock keeps running when Layout unmounts', () => {
    const { unmount } = renderLayout('patient');
    act(() => jest.advanceTimersByTime(30_000));

    unmount();

    // BUG: useLiveClock (Layout.tsx:75-80) starts its 60 s interval inside the
    // setTimeout callback and *returns* the clearInterval cleanup from that
    // callback, where it is thrown away; the effect cleanup only clears the
    // timeout. The interval outlives Layout (e.g. after signing out) and keeps
    // setting state on an unmounted component every minute.
    expect(jest.getTimerCount()).toBe(1);
  });
});

describe('page structure', () => {
  test('the skip link is first and leads to the main content', () => {
    renderLayout('patient');

    const skip = screen.getAllByRole('link')[0];
    expect(skip).toHaveAccessibleName('Skip to main content');
    const target = document.querySelector(skip.getAttribute('href') ?? '');
    expect(target).toBe(screen.getByRole('main', { name: 'Main content' }));
    expect(target).toHaveAttribute('tabindex', '-1');
    expect(within(target as HTMLElement).getByText('Screen content')).toBeInTheDocument();
  });

  test('the footer links to the contacts screen', () => {
    renderLayout('patient');

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'View contacts' })).toHaveAttribute(
      'href',
      '/app/contacts',
    );
    expect(footer).toHaveTextContent('CareConnect © 2026');
  });

  test('the logo links home', () => {
    renderLayout('patient');

    expect(screen.getByRole('link', { name: 'CareConnect — go to home' })).toHaveAttribute('href', '/app');
  });

  test('signing out is offered in the header', async () => {
    const { user, onSignOut } = renderLayout('caregiver');

    await user.click(screen.getByRole('button', { name: 'Sign out of CareConnect' }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('care-recipient (patient) view', () => {
  test('navigation lists the care-recipient screens', () => {
    renderLayout('patient');

    expect(navLinks().map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Home', '/app'],
      ['My Day', '/app/schedule'],
      ['Appointments', '/app/appointments'],
      ['Medicines', '/app/medications'],
      ['Memories', '/app/memories'],
      ['Contacts', '/app/contacts'],
    ]);
  });

  test('marks only the current screen in the navigation', () => {
    renderLayout('patient', { route: '/app/medications' });

    const current = navLinks().filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual(['Medicines']);
  });

  test('following a navigation link changes the screen', async () => {
    const { user, location } = renderLayout('patient');

    await user.click(screen.getByRole('link', { name: 'My Day' }));

    expect(location().pathname).toBe('/app/schedule');
    expect(screen.getByLabelText('Current screen: My Day')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Day' })).toHaveAttribute('aria-current', 'page');
  });

  test('offers a one-tap call to the caregiver', () => {
    renderLayout('patient');

    expect(
      screen.getByRole('link', { name: 'Call your caregiver: Joyce — 07700 900 456' }),
    ).toHaveAttribute('href', 'tel:07700900456');
  });

  test('shows the care-recipient role and switches to the caregiver role', async () => {
    const { user, onSwitchRole } = renderLayout('patient');

    expect(within(screen.getByRole('banner')).getByText('Care recipient')).toBeInTheDocument();
    expect(screen.queryByText(/care plan$/)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Switch to caregiver role' }));

    expect(onSwitchRole).toHaveBeenCalledTimes(1);
  });
});

describe('caregiver view', () => {
  test('navigation lists the caregiver screens', () => {
    renderLayout('caregiver');

    expect(navLinks().map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Dashboard', '/app'],
      ['Medications', '/app/manage-medications'],
      ['Appointments', '/app/manage-appointments'],
      ['Activity', '/app/activity'],
      ['Notes', '/app/caregiver'],
    ]);
  });

  test('says whose care plan is being viewed', () => {
    renderLayout('caregiver', { patient: { name: 'Dorothy' } });

    expect(screen.getByText("Viewing Dorothy's care plan")).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByText('Caregiver')).toBeInTheDocument();
  });

  test('has no call-my-caregiver button', () => {
    renderLayout('caregiver');

    expect(screen.queryByRole('link', { name: /Call your caregiver/ })).toBeNull();
  });

  test('both the header and the sidebar switch back to the care-recipient role', async () => {
    const { user, onSwitchRole } = renderLayout('caregiver');

    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Switch to care recipient role' }),
    );
    await user.click(
      within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', {
        name: 'Switch to care recipient role',
      }),
    );

    expect(onSwitchRole).toHaveBeenCalledTimes(2);
  });
});
