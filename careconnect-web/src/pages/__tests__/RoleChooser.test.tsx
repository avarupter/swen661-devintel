/**
 * RoleChooser — the step after signing in (/role): the user says whether they
 * are the care recipient or the caregiver. The choice is saved with the
 * session and decides which home screen /app shows.
 */
import { describe, test, expect } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import RoleChooser from '../RoleChooser';
import { renderWithProviders, STORAGE_KEYS, storedSession } from '../../test/test-utils';
import type { RenderWithProvidersOptions } from '../../test/test-utils';

function renderChooser(options: RenderWithProvidersOptions = { signedIn: true }) {
  return renderWithProviders(<RoleChooser />, { route: '/role', ...options });
}

const roles = () => within(screen.getByRole('group', { name: 'Choose your role' }));
const recipientTile = () => roles().getByRole('button', { name: /^I am the Care Recipient/ });
const caregiverTile = () => roles().getByRole('button', { name: /^I am the Caregiver/ });

function storedPatient(): unknown {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.patient) ?? 'null');
}

describe('RoleChooser', () => {
  test('welcomes the user by first name and asks how they use CareConnect', () => {
    renderChooser();

    expect(screen.getByRole('main', { name: 'Choose your role' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Sam!' })).toBeInTheDocument();
    expect(screen.getByText('How are you using CareConnect right now?')).toBeInTheDocument();
    expect(
      screen.getByText('Your choice is remembered. You can switch at any time from inside the app.'),
    ).toBeInTheDocument();
  });

  test.each([
    ['a one-word name', { signedIn: true, account: { name: 'Cher' } }, 'Welcome, Cher!'],
    ['no name', { signedIn: true, account: { name: '' } }, 'Welcome!'],
    ['nobody signed in', { signedIn: false }, 'Welcome!'],
  ] as const)('with %s it says "%s"', (_case, options, heading) => {
    renderChooser(options);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading);
  });

  test('offers two roles, each with a description of what it is for', () => {
    renderChooser();

    expect(roles().getAllByRole('button')).toHaveLength(2);
    expect(recipientTile()).toHaveAccessibleName(
      'I am the Care Recipient — View your daily schedule, medicines, memory aids, and contacts',
    );
    expect(caregiverTile()).toHaveAccessibleName(
      'I am the Caregiver — Manage the care plan, add shift notes, and track medicines',
    );
  });

  test.each([
    ['Care Recipient', recipientTile, 'patient'],
    ['Caregiver', caregiverTile, 'caregiver'],
  ] as const)('choosing "%s" saves the role and opens the app', async (_role, tile, role) => {
    const { user, location } = renderChooser({ signedIn: true, patient: { name: 'Dorothy' } });

    await user.click(tile());

    expect(location().pathname).toBe('/app');
    expect(storedSession()?.role).toBe(role);
    // The mock always looks after Margaret: choosing a role resets the
    // care-recipient profile to her (RoleChooser.tsx:13-14).
    expect(storedPatient()).toEqual({ name: 'Margaret' });
  });

  test('works from the keyboard: Tab past the skip link to a role, then Enter', async () => {
    const { user, location } = renderChooser();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to role selection' })).toHaveFocus();
    await user.tab();
    expect(recipientTile()).toHaveFocus();
    await user.tab();
    expect(caregiverTile()).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(location().pathname).toBe('/app');
    expect(storedSession()?.role).toBe('caregiver');
  });

  test('the skip link targets the role selection, which can take focus', () => {
    renderChooser();

    expect(screen.getByRole('link', { name: 'Skip to role selection' })).toHaveAttribute('href', '#role-chooser-main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'role-chooser-main');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });
});
