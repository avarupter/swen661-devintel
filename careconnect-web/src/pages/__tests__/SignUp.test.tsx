/**
 * SignUp — the account form (/signup). The mock auth stores the account in
 * localStorage, signs it in and the page goes on to the role chooser (/role).
 */
import { describe, test, expect, jest } from '@jest/globals';
import { act, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import SignUp from '../SignUp';
import * as mockAuth from '../../auth/mockAuth';
import type { AuthResult, MockUser } from '../../auth/mockAuth';
import { registerAccount, renderWithProviders, STORAGE_KEYS, storedSession } from '../../test/test-utils';

function renderSignUp() {
  return renderWithProviders(<SignUp />, { route: '/signup' });
}

const nameField = () => screen.getByRole('textbox', { name: /^Your name/ });
const emailField = () => screen.getByRole('textbox', { name: /^Email address/ });
const passwordField = () => screen.getByLabelText(/^Password/);
const confirmField = () => screen.getByLabelText(/^Confirm password/);
const createButton = () => screen.getByRole('button', { name: 'Create account' });

function storedUsers(): MockUser[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) ?? '[]');
}

/** The message box above the form (the inline field errors are alerts too). */
function errorSummary(): HTMLElement {
  const [summary] = screen.getAllByRole('alert');
  return summary;
}

interface Entry {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

const VALID: Required<Entry> = {
  name: 'Dorothy Smith',
  email: 'dorothy@example.com',
  password: 'secret1',
  confirm: 'secret1',
};

async function fillIn(user: UserEvent, entry: Entry) {
  if (entry.name) await user.type(nameField(), entry.name);
  if (entry.email) await user.type(emailField(), entry.email);
  if (entry.password) await user.type(passwordField(), entry.password);
  if (entry.confirm) await user.type(confirmField(), entry.confirm);
}

describe('the form', () => {
  test('asks for a name, an email address and a password twice', () => {
    renderSignUp();

    expect(screen.getByRole('main', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Create your account' })).toBeInTheDocument();
    expect(nameField()).toBeRequired();
    expect(nameField()).toHaveAttribute('autocomplete', 'name');
    expect(nameField()).toHaveAccessibleDescription('This is how CareConnect will greet you.');
    expect(emailField()).toHaveAttribute('autocomplete', 'email');
    expect(passwordField()).toHaveAttribute('autocomplete', 'new-password');
    expect(passwordField()).toHaveAccessibleDescription('At least 6 characters.');
    expect(confirmField()).toHaveAttribute('type', 'password');
    expect(
      screen.getByText('CareConnect never gives medical advice and never shares your information with third parties.'),
    ).toBeInTheDocument();
  });

  test('"Sign in" goes to the sign-in form', async () => {
    const { user, location } = renderSignUp();

    await user.click(screen.getByRole('link', { name: 'Sign in' }));

    expect(location().pathname).toBe('/signin');
  });

  test('the logo goes back to the home page', async () => {
    const { user, location } = renderSignUp();

    await user.click(screen.getByRole('link', { name: 'CareConnect home' }));

    expect(location().pathname).toBe('/');
  });
});

describe('creating an account', () => {
  test('stores the account, signs it in and goes on to choose a role', async () => {
    const { user, location } = renderSignUp();

    await fillIn(user, { ...VALID, name: '  Dorothy Smith ', email: 'Dorothy@Example.com' });
    await user.click(createButton());

    expect(location().pathname).toBe('/role');
    const expected = { id: expect.stringMatching(/^user_/), name: 'Dorothy Smith', email: 'dorothy@example.com' };
    expect(storedUsers()).toEqual([expected]);
    expect(storedSession()).toEqual({ user: expected, role: null });
  });

  test('the button says it is busy, and cannot be pressed again, until the account is made', async () => {
    let finish: (result: AuthResult) => void = () => {};
    const signUp = jest
      .spyOn(mockAuth, 'signUp')
      .mockImplementation(() => new Promise<AuthResult>((resolve) => (finish = resolve)));
    const { user, location } = renderSignUp();

    await fillIn(user, VALID);
    await user.click(createButton());

    const busy = screen.getByRole('button', { name: 'Creating account…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    expect(signUp).toHaveBeenCalledWith('Dorothy Smith', 'dorothy@example.com', 'secret1');

    await act(async () => finish({ user: { id: 'user_new', name: 'Dorothy Smith', email: 'dorothy@example.com' } }));

    expect(location().pathname).toBe('/role');
  });
});

describe('problems', () => {
  test('an empty form says what is missing, at the top and by each field', async () => {
    const { user, location } = renderSignUp();

    await user.click(createButton());

    expect(errorSummary()).toHaveTextContent('Please correct the errors below to continue.');
    expect(nameField()).toHaveAttribute('aria-invalid', 'true');
    // The error replaces the hint.
    expect(nameField()).toHaveAccessibleDescription('Please enter your name.');
    expect(emailField()).toHaveAccessibleDescription('Please enter your email address.');
    expect(passwordField()).toHaveAccessibleDescription('Please create a password.');
    expect(confirmField()).toHaveAccessibleDescription('Please confirm your password.');
    expect(screen.getAllByRole('alert')).toHaveLength(5);
    expect(location().pathname).toBe('/signup');
    expect(storedUsers()).toEqual([]);
  });

  test.each([
    ['a blank name', { name: '   ' }, nameField, 'Please enter your name.'],
    ['an email without an @ and a dot', { email: 'dorothy.example.com' }, emailField, 'Please enter a valid email address.'],
    ['a password under 6 characters', { password: 'abc', confirm: 'abc' }, passwordField, 'Password must be at least 6 characters.'],
    ['passwords that do not match', { confirm: 'secret2' }, confirmField, 'Passwords do not match.'],
  ] as const)('%s is flagged on its own field', async (_case, change, field, message) => {
    const { user } = renderSignUp();

    await fillIn(user, { ...VALID, ...change });
    await user.click(createButton());

    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAccessibleDescription(message);
    // the summary plus this one field
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(storedUsers()).toEqual([]);
  });

  test('an email that already has an account is turned away with a message', async () => {
    registerAccount({ email: 'dorothy@example.com' });
    const { user, location } = renderSignUp();

    await fillIn(user, { ...VALID, email: 'DOROTHY@example.com' });
    await user.click(createButton());

    expect(screen.getByRole('alert')).toHaveTextContent(
      'An account with this email already exists. Try signing in instead.',
    );
    expect(emailField()).not.toHaveAttribute('aria-invalid');
    expect(location().pathname).toBe('/signup');
    expect(storedSession()).toBeNull();
  });

  test('the messages clear once a corrected form is sent', async () => {
    const { user, location } = renderSignUp();
    await fillIn(user, { ...VALID, confirm: 'secret2' });
    await user.click(createButton());
    expect(confirmField()).toHaveAttribute('aria-invalid', 'true');

    await user.clear(confirmField());
    await user.type(confirmField(), VALID.password);
    await user.click(createButton());

    expect(location().pathname).toBe('/role');
  });
});
