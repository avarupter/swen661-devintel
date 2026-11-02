/**
 * App.tsx routing: the real <App /> (BrowserRouter, every route and guard)
 * rendered at a URL, signed in through the app's mock auth.
 */
import { describe, test, expect } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import { renderApp } from './test/renderApp';
import { registerAccount, storedSession, TEST_ACCOUNT } from './test/test-utils';

function pageHeading() {
  return screen.getByRole('heading', { level: 1 });
}

function banner() {
  return screen.getByRole('banner');
}

describe('signed-out visitors', () => {
  test('see the landing page at /', () => {
    renderApp({ route: '/' });

    expect(pageHeading()).toHaveTextContent('Your daily companion for calm, confident care.');
  });

  test.each([
    ['/signin', 'Welcome back'],
    ['/signup', 'Create your account'],
  ])('can open %s', (route, heading) => {
    renderApp({ route });

    expect(pageHeading()).toHaveTextContent(heading);
    expect(window.location.pathname).toBe(route);
  });

  test.each(['/app', '/app/schedule', '/app/manage-medications', '/role'])(
    'are sent from %s to the landing page',
    (route) => {
      renderApp({ route });

      expect(window.location.pathname).toBe('/');
      expect(pageHeading()).toHaveTextContent('Your daily companion');
    },
  );

  test('an old path still ends at the landing page (/schedule → /app/schedule → /)', () => {
    renderApp({ route: '/schedule' });

    expect(window.location.pathname).toBe('/');
  });

  test('an unknown URL goes to the landing page', () => {
    renderApp({ route: '/no-such-page' });

    expect(window.location.pathname).toBe('/');
    expect(pageHeading()).toHaveTextContent('Your daily companion');
  });
});

describe('signed in, no role chosen yet', () => {
  test.each(['/app', '/app/medications', '/signin', '/signup'])(
    '%s leads to the role chooser',
    (route) => {
      renderApp({ route, signedIn: true });

      expect(window.location.pathname).toBe('/role');
      expect(pageHeading()).toHaveTextContent('Welcome, Sam!');
    },
  );

  test('choosing a role opens that role’s home screen', async () => {
    const { user } = renderApp({ route: '/role', signedIn: true });

    await user.click(screen.getByRole('button', { name: /^I am the Caregiver/ }));

    expect(window.location.pathname).toBe('/app');
    expect(pageHeading()).toHaveTextContent('Dashboard');
    expect(storedSession()?.role).toBe('caregiver');
  });
});

describe('role routing', () => {
  test('a care recipient lands on Today, with the patient navigation', () => {
    renderApp({ route: '/app', role: 'patient' });

    expect(pageHeading()).toHaveTextContent("Here's your day, Margaret");
    expect(within(banner()).getByText('Care recipient')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Day' })).toHaveAttribute('href', '/app/schedule');
  });

  test('a caregiver lands on the dashboard, with the caregiver navigation', () => {
    renderApp({ route: '/app', role: 'caregiver' });

    expect(pageHeading()).toHaveTextContent('Dashboard');
    expect(within(banner()).getByText('Caregiver')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notes' })).toHaveAttribute('href', '/app/caregiver');
  });

  test('a caregiver opening a caregiver screen directly gets the caregiver layout', () => {
    renderApp({ route: '/app/activity', role: 'caregiver' });

    expect(pageHeading()).toHaveTextContent('Activity log');
    expect(screen.getByRole('link', { name: 'Activity' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: /Call your caregiver/ })).toBeNull();
  });

  test.each([
    ['/signin', 'patient'],
    ['/signup', 'caregiver'],
    ['/role', 'patient'],
  ] as const)('a signed-in %s is sent from %s into the app', (route, role) => {
    renderApp({ route, role });

    expect(window.location.pathname).toBe('/app');
  });

  test.each([
    ['patient', '/app/schedule', 'My Day'],
    ['patient', '/app/appointments', 'My Appointments'],
    ['patient', '/app/medications', 'Medicines'],
    ['patient', '/app/memories', 'Memories'],
    ['patient', '/app/contacts', 'Contacts'],
    ['caregiver', '/app/caregiver', 'Caregiver Notes'],
    ['caregiver', '/app/activity', 'Activity log'],
    ['caregiver', '/app/manage-medications', 'Manage medications'],
    ['caregiver', '/app/manage-appointments', 'Manage appointments'],
  ] as const)('as %s, %s shows the "%s" screen', (role, route, heading) => {
    renderApp({ route, role });

    expect(window.location.pathname).toBe(route);
    expect(pageHeading()).toHaveTextContent(heading);
  });

  test('screens are not limited by role — a caregiver can still open a patient screen', () => {
    renderApp({ route: '/app/medications', role: 'caregiver' });

    expect(pageHeading()).toHaveTextContent('Medicines');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  test('an unknown screen inside the app goes to the app home', () => {
    renderApp({ route: '/app/no-such-screen', role: 'patient' });

    expect(window.location.pathname).toBe('/app');
    expect(pageHeading()).toHaveTextContent("Here's your day");
  });
});

describe('old paths from before the /app namespace', () => {
  test.each([
    ['/schedule', '/app/schedule', 'My Day'],
    ['/medications', '/app/medications', 'Medicines'],
    ['/memories', '/app/memories', 'Memories'],
    ['/contacts', '/app/contacts', 'Contacts'],
    ['/caregiver', '/app/caregiver', 'Caregiver Notes'],
  ])('%s redirects to %s', (oldPath, newPath, heading) => {
    renderApp({ route: oldPath, role: 'patient' });

    expect(window.location.pathname).toBe(newPath);
    expect(pageHeading()).toHaveTextContent(heading);
  });
});

describe('inside the app', () => {
  test('switching role swaps the home screen and remembers the new role', async () => {
    const { user } = renderApp({ route: '/app', role: 'patient' });

    await user.click(within(banner()).getByRole('button', { name: 'Switch to caregiver role' }));

    expect(pageHeading()).toHaveTextContent('Dashboard');
    expect(storedSession()?.role).toBe('caregiver');

    await user.click(within(banner()).getByRole('button', { name: 'Switch to care recipient role' }));

    expect(pageHeading()).toHaveTextContent("Here's your day");
    expect(storedSession()?.role).toBe('patient');
  });

  test('signing out ends the session and returns to the landing page', async () => {
    const { user } = renderApp({ route: '/app/schedule', role: 'patient' });

    await user.click(screen.getByRole('button', { name: 'Sign out of CareConnect' }));

    expect(window.location.pathname).toBe('/');
    expect(pageHeading()).toHaveTextContent('Your daily companion');
    expect(storedSession()).toBeNull();
  });
});

describe('a full sign-in', () => {
  test('sign in → choose a role → that role’s home screen', async () => {
    registerAccount();
    const { user } = renderApp({ route: '/signin' });

    await user.type(screen.getByLabelText(/^Email address/), TEST_ACCOUNT.email);
    await user.type(screen.getByLabelText(/^Password/), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome, Sam!' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/role');

    await user.click(screen.getByRole('button', { name: /^I am the Care Recipient/ }));

    expect(window.location.pathname).toBe('/app');
    expect(pageHeading()).toHaveTextContent("Here's your day, Margaret");
  });
});
