// src/__tests__/RoleSelectionScreen.test.tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import {
  renderWithAuth,
  renderWithSignedInUser,
} from './helpers/renderWithAuth';
import { mockNavigate, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('RoleSelectionScreen', () => {
  test('offers both roles with their descriptions', async () => {
    await renderWithAuth(<RoleSelectionScreen />);

    expect(screen.getByText("I'm a Patient")).toBeTruthy();
    expect(screen.getByText('Manage your own care')).toBeTruthy();
    expect(screen.getByText("I'm a Caregiver")).toBeTruthy();
    expect(screen.getByText('Manage patients you care for')).toBeTruthy();
  });

  test('greets the signed-in user by name', async () => {
    await renderWithSignedInUser(<RoleSelectionScreen />, {
      name: 'Dorothy',
    });

    expect(screen.getByText('Welcome, Dorothy!')).toBeTruthy();
  });

  test('greets without a name when nobody is signed in', async () => {
    // Guards the template literal: a missing user must not render
    // "Welcome, undefined!".
    await renderWithAuth(<RoleSelectionScreen />);

    expect(screen.getByText('Welcome!')).toBeTruthy();
  });

  test('choosing patient opens the patient tabs', async () => {
    await renderWithAuth(<RoleSelectionScreen />);

    await fireEvent.press(
      screen.getByLabelText('Select patient role, manage your own care')
    );

    expect(mockNavigate).toHaveBeenCalledWith('PatientTabs');
  });

  test('choosing caregiver opens the caregiver tabs', async () => {
    await renderWithAuth(<RoleSelectionScreen />);

    await fireEvent.press(
      screen.getByLabelText(
        'Select caregiver role, manage patients you care for'
      )
    );

    // The two roles must not both land on the same stack.
    expect(mockNavigate).toHaveBeenCalledWith('CaregiverTabs');
    expect(mockNavigate).not.toHaveBeenCalledWith('PatientTabs');
  });
});
