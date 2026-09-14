// src/__tests__/PatientProfileScreen.test.tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import PatientProfileScreen from '../screens/PatientProfileScreen';
import {
  renderWithAuth,
  renderWithSignedInUser,
} from './helpers/renderWithAuth';
import { mockNavigate, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('PatientProfileScreen', () => {
  test('shows the signed-in name and email', async () => {
    await renderWithSignedInUser(<PatientProfileScreen />, {
      name: 'Dorothy Smith',
      email: 'dorothy@example.com',
    });

    expect(screen.getByText('Dorothy Smith')).toBeTruthy();
    expect(screen.getByText('dorothy@example.com')).toBeTruthy();
  });

  test('falls back to a generic label when there is no user', async () => {
    await renderWithAuth(<PatientProfileScreen />);

    expect(screen.getByText('Patient')).toBeTruthy();
  });

  test('signing out returns to the landing screen', async () => {
    await renderWithSignedInUser(<PatientProfileScreen />);

    await fireEvent.press(screen.getByLabelText('Sign out of your account'));

    expect(mockNavigate).toHaveBeenCalledWith('Landing');
  });

  test('signing out clears the name from the screen', async () => {
    // Proves sign-out actually mutates shared state rather than only navigating.
    await renderWithSignedInUser(<PatientProfileScreen />, { name: 'Dorothy' });
    expect(screen.getByText('Dorothy')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Sign out of your account'));

    expect(screen.queryByText('Dorothy')).toBeNull();
    expect(screen.getByText('Patient')).toBeTruthy();
  });
});
