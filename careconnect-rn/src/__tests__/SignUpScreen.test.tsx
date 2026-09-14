// src/__tests__/SignUpScreen.test.tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import SignUpScreen from '../screens/SignUpScreen';
import { renderWithAuth } from './helpers/renderWithAuth';
import { mockNavigate, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('SignUpScreen', () => {
  test('renders the whole form', async () => {
    await renderWithAuth(<SignUpScreen />);

    expect(screen.getByText('Create your account')).toBeTruthy();
    expect(
      screen.getByText('Free, private, and takes under two minutes.')
    ).toBeTruthy();
    expect(screen.getByLabelText('Your name')).toBeTruthy();
    expect(screen.getByLabelText('Email address')).toBeTruthy();
  });

  test('typing a name updates the field', async () => {
    await renderWithAuth(<SignUpScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Your name'),
      'Dorothy Smith'
    );

    expect(screen.getByLabelText('Your name').props.value).toBe(
      'Dorothy Smith'
    );
  });

  test('creating an account moves on to role selection', async () => {
    await renderWithAuth(<SignUpScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Your name'),
      'Dorothy Smith'
    );
    await fireEvent.changeText(
      screen.getByLabelText('Email address'),
      'dorothy@example.com'
    );
    await fireEvent.press(screen.getByLabelText('Create your new account'));

    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });

  test('there is a link back to sign in', async () => {
    await renderWithAuth(<SignUpScreen />);

    await fireEvent.press(screen.getByLabelText('Already have an account, tap to sign in'));

    expect(mockNavigate).toHaveBeenCalledWith('SignIn');
  });
});
