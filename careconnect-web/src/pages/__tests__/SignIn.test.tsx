/**
 * SignIn — the sign-in form (/signin). The mock auth accepts any password
 * for an email that has signed up; a successful sign-in goes on to the role
 * chooser (/role).
 */
import { describe, test, expect, jest } from '@jest/globals';
import { act, screen } from '@testing-library/react';
import SignIn from '../SignIn';
import * as mockAuth from '../../auth/mockAuth';
import type { AuthResult } from '../../auth/mockAuth';
import { registerAccount, renderWithProviders, storedSession, TEST_ACCOUNT } from '../../test/test-utils';

function renderSignIn() {
  return renderWithProviders(<SignIn />, { route: '/signin' });
}

const emailField = () => screen.getByRole('textbox', { name: /^Email address/ });
const passwordField = () => screen.getByLabelText(/^Password/);
const signInButton = () => screen.getByRole('button', { name: 'Sign in' });

/** The message box above the form (the inline field errors are alerts too). */
function errorSummary(): HTMLElement {
  const [summary] = screen.getAllByRole('alert');
  return summary;
}

describe('the form', () => {
  test('asks for an email address and a password', () => {
    renderSignIn();

    expect(screen.getByRole('main', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to your CareConnect account.')).toBeInTheDocument();
    expect(emailField()).toBeRequired();
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(emailField()).toHaveAttribute('autocomplete', 'email');
    expect(passwordField()).toBeRequired();
    expect(passwordField()).toHaveAttribute('type', 'password');
    expect(passwordField()).toHaveAttribute('autocomplete', 'current-password');
    expect(passwordField()).toHaveAccessibleDescription('Any password works — this is a demonstration app.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('the logo goes back to the home page', async () => {
    const { user, location } = renderSignIn();

    await user.click(screen.getByRole('link', { name: 'CareConnect home' }));

    expect(location().pathname).toBe('/');
  });

  test('"Sign up for free" goes to the sign-up form', async () => {
    const { user, location } = renderSignIn();

    await user.click(screen.getByRole('link', { name: 'Sign up for free' }));

    expect(location().pathname).toBe('/signup');
  });
});

describe('signing in', () => {
  test('a registered account signs in and goes on to choose a role', async () => {
    registerAccount();
    const { user, location } = renderSignIn();

    await user.type(emailField(), TEST_ACCOUNT.email);
    await user.type(passwordField(), 'any password');
    await user.click(signInButton());

    expect(location().pathname).toBe('/role');
    expect(storedSession()).toEqual({ user: TEST_ACCOUNT, role: null });
  });

  test('the email is matched ignoring case and surrounding spaces', async () => {
    registerAccount();
    const { user, location } = renderSignIn();

    await user.type(emailField(), '  SAM@Example.com ');
    await user.type(passwordField(), 'x');
    await user.click(signInButton());

    expect(location().pathname).toBe('/role');
    expect(storedSession()?.user).toEqual(TEST_ACCOUNT);
  });

  test('pressing Enter in the password field submits the form', async () => {
    registerAccount();
    const { user, location } = renderSignIn();

    await user.type(emailField(), TEST_ACCOUNT.email);
    await user.type(passwordField(), 'secret{Enter}');

    expect(location().pathname).toBe('/role');
  });

  test('the button says it is busy, and cannot be pressed again, until the sign-in finishes', async () => {
    let finish: (result: AuthResult) => void = () => {};
    const signIn = jest
      .spyOn(mockAuth, 'signIn')
      .mockImplementation(() => new Promise<AuthResult>((resolve) => (finish = resolve)));
    const { user, location } = renderSignIn();

    await user.type(emailField(), TEST_ACCOUNT.email);
    await user.type(passwordField(), 'secret');
    await user.click(signInButton());

    const busy = screen.getByRole('button', { name: 'Signing in…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    expect(signIn).toHaveBeenCalledWith(TEST_ACCOUNT.email, 'secret');
    expect(location().pathname).toBe('/signin');

    await act(async () => finish({ user: TEST_ACCOUNT }));

    expect(location().pathname).toBe('/role');
  });
});

describe('problems', () => {
  test('an empty form says what is missing, at the top and by each field', async () => {
    const { user, location } = renderSignIn();

    await user.click(signInButton());

    expect(errorSummary()).toHaveTextContent('Please correct the errors below to continue.');
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(emailField()).toHaveAccessibleDescription('Please enter your email address.');
    expect(passwordField()).toHaveAttribute('aria-invalid', 'true');
    // The error replaces the hint.
    expect(passwordField()).toHaveAccessibleDescription('Please enter your password.');
    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(location().pathname).toBe('/signin');
    expect(storedSession()).toBeNull();
  });

  test('an email address without an @ and a dot is rejected', async () => {
    const { user } = renderSignIn();

    await user.type(emailField(), 'sam.example.com');
    await user.type(passwordField(), 'secret');
    await user.click(signInButton());

    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(emailField()).toHaveAccessibleDescription('Please enter a valid email address.');
    expect(passwordField()).not.toHaveAttribute('aria-invalid');
    expect(passwordField()).toHaveAccessibleDescription('Any password works — this is a demonstration app.');
  });

  test('an email that has not signed up is turned away with a message', async () => {
    const { user, location } = renderSignIn();

    await user.type(emailField(), 'nobody@example.com');
    await user.type(passwordField(), 'secret');
    await user.click(signInButton());

    expect(screen.getByRole('alert')).toHaveTextContent(
      "We couldn't find an account with that email. Please sign up first.",
    );
    expect(emailField()).not.toHaveAttribute('aria-invalid');
    expect(signInButton()).toBeEnabled();
    expect(location().pathname).toBe('/signin');
    expect(storedSession()).toBeNull();
  });

  test('the messages clear once a corrected form is sent', async () => {
    const { user, location } = renderSignIn();
    await user.click(signInButton());
    expect(screen.getAllByRole('alert')).toHaveLength(3);

    await user.type(emailField(), 'nobody@example.com');
    await user.type(passwordField(), 'secret');
    await user.click(signInButton());
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(emailField()).not.toHaveAttribute('aria-invalid');

    registerAccount({ email: 'nobody@example.com' });
    await user.click(signInButton());

    expect(location().pathname).toBe('/role');
  });
});
