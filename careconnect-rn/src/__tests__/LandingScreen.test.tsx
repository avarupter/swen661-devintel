// src/__tests__/LandingScreen.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import LandingScreen from '../screens/LandingScreen';
import {
  mockNavigate,
  resetNavigationMock,
} from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('LandingScreen', () => {
  test('shows the app name and both ways in', async () => {
    await render(<LandingScreen />);

    expect(screen.getByText('CareConnect')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByText('Your daily companion')).toBeTruthy();
  });

  test('Sign In goes to the sign-in screen', async () => {
    await render(<LandingScreen />);

    await fireEvent.press(screen.getByLabelText('Sign in to your existing account'));

    expect(mockNavigate).toHaveBeenCalledWith('SignIn');
  });

  test('Create Account goes to the sign-up screen', async () => {
    await render(<LandingScreen />);

    await fireEvent.press(screen.getByLabelText('Create a new account'));

    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

  test('both actions expose a button role for screen readers', async () => {
    await render(<LandingScreen />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
