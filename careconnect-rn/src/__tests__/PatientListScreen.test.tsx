// src/__tests__/PatientListScreen.test.tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import PatientListScreen from '../screens/PatientListScreen';
import { renderWithProviders } from './helpers/renderWithAuth';
import {
  mockGoBack,
  mockNavigate,
  resetNavigationMock,
} from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('PatientListScreen', () => {
  test('lists every patient from the shared patient context', async () => {
    await renderWithProviders(<PatientListScreen />);

    expect(screen.getByText('Margaret Smith')).toBeTruthy();
    expect(screen.getByText('Arthur Pendelton')).toBeTruthy();
    expect(screen.getByText('Eleanor Vance')).toBeTruthy();
  });

  test('each row reads as one sentence for a screen reader', async () => {
    await renderWithProviders(<PatientListScreen />);

    expect(
      screen.getByLabelText(
        'Patient Margaret Smith, age 78, condition: Routine care & Vision'
      )
    ).toBeTruthy();
  });

  test('tapping a patient opens the edit form for that patient', async () => {
    await renderWithProviders(<PatientListScreen />);

    await fireEvent.press(
      screen.getByLabelText(/^Patient Arthur Pendelton/)
    );

    // The whole patient object is handed over, not just an id.
    expect(mockNavigate).toHaveBeenCalledWith('AddEditPatient', {
      patient: expect.objectContaining({ id: '2', name: 'Arthur Pendelton' }),
    });
  });

  test('the add button opens the blank add-patient form', async () => {
    await renderWithProviders(<PatientListScreen />);

    await fireEvent.press(screen.getByLabelText('Add new patient'));

    expect(mockNavigate).toHaveBeenCalledWith('AddPatient');
  });

  test('the back button goes back rather than navigating somewhere new', async () => {
    await renderWithProviders(<PatientListScreen />);

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('the header is exposed as a header to assistive technology', async () => {
    await renderWithProviders(<PatientListScreen />);

    expect(screen.getByLabelText('Patients Header')).toBeTruthy();
  });
});
