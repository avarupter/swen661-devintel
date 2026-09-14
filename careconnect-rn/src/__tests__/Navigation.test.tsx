// src/__tests__/Navigation.test.tsx
//
// Integration test over the real navigator. Deliberately does NOT mock
// @react-navigation/native: the point is to prove the route names the screens
// call actually exist in the navigator, which a mocked useNavigation cannot tell
// you — a typo'd or missing route only shows up when the real navigator resolves it.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Navigation } from '../navigation';
import { AuthProvider } from '../context/AuthContext';

async function renderApp() {
  return render(
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

describe('Navigation', () => {
  test('opens on the landing screen', async () => {
    await renderApp();

    await waitFor(() => {
      expect(screen.getByText('CareConnect')).toBeTruthy();
    });
  });

  test('Sign In on the landing screen reaches the sign-in form', async () => {
    await renderApp();

    await fireEvent.press(
      screen.getByLabelText('Sign in to your existing account')
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeTruthy();
      expect(screen.getByLabelText('Password')).toBeTruthy();
    });
  });

  test('Create Account reaches the sign-up form', async () => {
    await renderApp();

    await fireEvent.press(screen.getByLabelText('Create a new account'));

    await waitFor(() => {
      expect(screen.getByText('Create your account')).toBeTruthy();
    });
  });

  test('signing in reaches role selection', async () => {
    await renderApp();

    await fireEvent.press(
      screen.getByLabelText('Sign in to your existing account')
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Sign in to your account')).toBeTruthy()
    );
    await fireEvent.press(screen.getByLabelText('Sign in to your account'));

    await waitFor(() => {
      expect(screen.getByText("I'm a Patient")).toBeTruthy();
      expect(screen.getByText("I'm a Caregiver")).toBeTruthy();
    });
  });

  test('choosing the patient role reaches the patient tabs', async () => {
    await renderApp();

    await fireEvent.press(
      screen.getByLabelText('Sign in to your existing account')
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Sign in to your account')).toBeTruthy()
    );
    await fireEvent.press(screen.getByLabelText('Sign in to your account'));
    await waitFor(() =>
      expect(
        screen.getByLabelText('Select patient role, manage your own care')
      ).toBeTruthy()
    );
    await fireEvent.press(
      screen.getByLabelText('Select patient role, manage your own care')
    );

    // PatientTabs must exist and land on the Today tab.
    await waitFor(() => {
      expect(screen.getByText('Take these now')).toBeTruthy();
    });
  });

  test('choosing the caregiver role reaches the caregiver tabs', async () => {
    await renderApp();

    await fireEvent.press(
      screen.getByLabelText('Sign in to your existing account')
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Sign in to your account')).toBeTruthy()
    );
    await fireEvent.press(screen.getByLabelText('Sign in to your account'));
    await waitFor(() =>
      expect(
        screen.getByLabelText(
          'Select caregiver role, manage patients you care for'
        )
      ).toBeTruthy()
    );
    await fireEvent.press(
      screen.getByLabelText(
        'Select caregiver role, manage patients you care for'
      )
    );

    // "Patients" is both the tab label and the screen heading.
    await waitFor(() => {
      expect(screen.getAllByText('Patients').length).toBeGreaterThan(0);
      expect(screen.getByText('Margaret Smith')).toBeTruthy();
    });
  });

  test('KNOWN GAP: the patient rows point at routes that do not exist', async () => {
    // PatientListScreen navigates to 'PatientDetail' and 'AddPatient', but
    // neither is declared in src/navigation/index.tsx, so React Navigation
    // cannot handle the action and the screen simply does not change.
    //
    // This test pins the current behaviour so the gap is visible rather than
    // silent. When the two routes are added, this test should start failing —
    // that is the signal to replace it with a real navigation assertion.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await renderApp();
    await fireEvent.press(
      screen.getByLabelText('Sign in to your existing account')
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Sign in to your account')).toBeTruthy()
    );
    await fireEvent.press(screen.getByLabelText('Sign in to your account'));
    await waitFor(() =>
      expect(
        screen.getByLabelText(
          'Select caregiver role, manage patients you care for'
        )
      ).toBeTruthy()
    );
    await fireEvent.press(
      screen.getByLabelText(
        'Select caregiver role, manage patients you care for'
      )
    );
    await waitFor(() =>
      expect(screen.getByText('Margaret Smith')).toBeTruthy()
    );

    await fireEvent.press(
      screen.getByLabelText('View details for Margaret Smith')
    );

    // Still on the list: the navigation action went nowhere.
    expect(screen.getByText('Margaret Smith')).toBeTruthy();

    consoleError.mockRestore();
  });
});
