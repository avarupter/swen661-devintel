// src/__tests__/CaregiverScreens.test.tsx
//
// The caregiver screens were converted from the Flutter build and are still
// presentational — they render a fixed care plan and their controls are not yet
// wired to state. These tests pin what they actually render today, so the
// conversion cannot regress silently while it is being wired up.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import CaregiverMedicationsScreen from '../screens/CaregiverMedicationsScreen';
import CaregiverAppointmentsScreen from '../screens/CaregiverAppointmentsScreen';
import CaregiverActivityScreen from '../screens/CaregiverActivityScreen';
import CaregiverMedicationFormsScreen from '../screens/CaregiverMedicationFormsScreen';
import { mockGoBack, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('CaregiverMedicationsScreen', () => {
  test('shows whose care plan is being viewed', async () => {
    await render(<CaregiverMedicationsScreen />);

    expect(screen.getByText('Manage Medications')).toBeTruthy();
    expect(screen.getByText("Viewing Margaret's care plan")).toBeTruthy();
  });

  test('every medication row offers edit and delete', async () => {
    await render(<CaregiverMedicationsScreen />);

    const edits = screen.getAllByLabelText('Edit this medication');
    expect(edits.length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Delete this medication')).toHaveLength(
      edits.length
    );
  });

  test('back returns to the previous screen', async () => {
    await render(<CaregiverMedicationsScreen />);

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('CaregiverAppointmentsScreen', () => {
  test('shows the appointments heading and care plan context', async () => {
    await render(<CaregiverAppointmentsScreen />);

    expect(screen.getByText('Manage Appointments')).toBeTruthy();
    expect(screen.getByText("Viewing Margaret's care plan")).toBeTruthy();
  });

  test('every appointment row offers edit and delete', async () => {
    await render(<CaregiverAppointmentsScreen />);

    const edits = screen.getAllByLabelText('Edit this appointment');
    expect(edits.length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Delete this appointment')).toHaveLength(
      edits.length
    );
  });

  test('back returns to the previous screen', async () => {
    await render(<CaregiverAppointmentsScreen />);

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('CaregiverActivityScreen', () => {
  test('renders the activity log', async () => {
    await render(<CaregiverActivityScreen />);

    expect(screen.getAllByText(/Activity log/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Viewing Margaret's care plan")).toBeTruthy();
  });

  test('shows an explicit empty state rather than a blank area', async () => {
    await render(<CaregiverActivityScreen />);

    expect(screen.getByText('No activity yet')).toBeTruthy();
  });

  test('back returns to the previous screen', async () => {
    await render(<CaregiverActivityScreen />);

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('CaregiverMedicationFormsScreen', () => {
  test('renders every required field', async () => {
    await render(<CaregiverMedicationFormsScreen />);

    expect(screen.getByText('Add new medication')).toBeTruthy();
    expect(screen.getByText('Medication name (required) *')).toBeTruthy();
    expect(screen.getByText('Dose (required) *')).toBeTruthy();
    expect(screen.getByText('Schedule times (required) *')).toBeTruthy();
  });

  test('typing a medication name updates the field', async () => {
    await render(<CaregiverMedicationFormsScreen />);

    const name = screen.getByPlaceholderText('e.g. Amlodipine');
    await fireEvent.changeText(name, 'Memantine');

    expect(
      screen.getByPlaceholderText('e.g. Amlodipine').props.value
    ).toBe('Memantine');
  });

  test('saving returns to the previous screen', async () => {
    await render(<CaregiverMedicationFormsScreen />);

    await fireEvent.press(screen.getByLabelText('Save Medication'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});
