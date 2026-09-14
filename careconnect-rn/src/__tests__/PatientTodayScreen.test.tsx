// src/__tests__/PatientTodayScreen.test.tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import PatientTodayScreen from '../screens/PatientTodayScreen';
import {
  renderWithAuth,
  renderWithSignedInUser,
} from './helpers/renderWithAuth';
import { mockNavigate, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('PatientTodayScreen', () => {
  test('groups the day into due, later and done', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    expect(screen.getByText('Take these now')).toBeTruthy();
    expect(screen.getByText('Later today')).toBeTruthy();
    expect(screen.getByText('Already done')).toBeTruthy();
  });

  test('puts each medicine in the right section', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    // Memantine is due, Amlodipine is later, Vitamin D3 is already taken.
    expect(screen.getByLabelText(/Memantine .*due now/)).toBeTruthy();
    expect(screen.getByLabelText(/Amlodipine .*later today/)).toBeTruthy();
    expect(screen.getByLabelText(/Vitamin D3 .*taken/)).toBeTruthy();
  });

  test('counts only the taken doses in the progress summary', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    // One of the four mock doses has status 'taken'.
    expect(screen.getByText("Today's progress")).toBeTruthy();
    expect(screen.getByText('1 of 4')).toBeTruthy();
    expect(screen.getByText('doses taken')).toBeTruthy();
  });

  test('greets the signed-in patient by name', async () => {
    await renderWithSignedInUser(<PatientTodayScreen />, { name: 'Dorothy' });

    expect(screen.getByText('Good morning, Dorothy')).toBeTruthy();
  });

  test('greets generically when nobody is signed in', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    expect(screen.getByText('Good morning, there')).toBeTruthy();
  });

  test('only the due dose offers a Mark as taken button', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    // The button is rendered for 'due' doses only — an already-taken dose
    // offering "Mark as taken" would be the most confusing control on the screen.
    expect(screen.getAllByText('Mark as taken')).toHaveLength(1);
    expect(screen.getByLabelText('Mark Memantine as taken')).toBeTruthy();
  });

  test('a taken dose is labelled as taken rather than actionable', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    expect(screen.getByText('✓ Taken')).toBeTruthy();
    expect(screen.getByText('You took this earlier today.')).toBeTruthy();
  });

  test('tapping a dose opens that medicine, passing its id', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    await fireEvent.press(screen.getByLabelText(/Memantine .*due now/));

    expect(mockNavigate).toHaveBeenCalledWith('MedicationDetail', {
      medId: '1',
    });
  });

  test('tapping a later dose passes that dose id, not the first one', async () => {
    await renderWithAuth(<PatientTodayScreen />);

    await fireEvent.press(screen.getByLabelText(/Amlodipine .*later today/));

    expect(mockNavigate).toHaveBeenCalledWith('MedicationDetail', {
      medId: '3',
    });
  });

  test("shows today's appointment with who is driving", async () => {
    await renderWithAuth(<PatientTodayScreen />);

    expect(screen.getByText('Vision Plus Opticians')).toBeTruthy();
    expect(screen.getByText('Maria Thompson is driving you')).toBeTruthy();
  });
});
