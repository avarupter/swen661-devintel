// src/__tests__/SignInScreen.test.tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import SignInScreen from '../screens/SignInScreen';
import { renderWithAuth } from './helpers/renderWithAuth';
import { mockNavigate, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('SignInScreen', () => {
  test('renders both credential fields and the actions', async () => {
    await renderWithAuth(<SignInScreen />);

    // "Sign In" is both the heading and the button, so query by role/label.
    expect(screen.getAllByText('Sign In')).toHaveLength(2);
    expect(screen.getByLabelText('Email address')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByText('New? Click here to sign up.')).toBeTruthy();
  });

  test('the password field is masked', async () => {
    await renderWithAuth(<SignInScreen />);

    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  test('typing updates the email field', async () => {
    await renderWithAuth(<SignInScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Email address'),
      'dorothy@example.com'
    );

    // Re-query: the previous node is a stale snapshot from before the re-render.
    expect(screen.getByLabelText('Email address').props.value).toBe(
      'dorothy@example.com'
    );
  });

  test('signing in moves on to role selection', async () => {
    await renderWithAuth(<SignInScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Email address'),
      'dorothy@example.com'
    );
    await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    await fireEvent.press(screen.getByLabelText('Sign in to your account'));

    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  test('an empty form still signs in, using the demo credentials', async () => {
    // The screen deliberately falls back to a demo account so the flow can be
    // walked without typing. Pinned so that adding validation later breaks this
    // test rather than surprising someone mid-demo.
    await renderWithAuth(<SignInScreen />);

    await fireEvent.press(screen.getByLabelText('Sign in to your account'));

    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  test('the sign-up link goes to sign up, not role selection', async () => {
    await renderWithAuth(<SignInScreen />);

    await fireEvent.press(screen.getByLabelText('New user, tap to sign up'));

    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
    expect(mockNavigate).not.toHaveBeenCalledWith('RoleSelection');
  });
});
