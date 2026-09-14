// src/__tests__/PatientListScreen.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PatientListScreen from '../screens/PatientListScreen';
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
  test('lists every patient with their age and condition', async () => {
    await render(<PatientListScreen />);

    expect(screen.getByText('Patients')).toBeTruthy();
    expect(screen.getByText('Margaret Smith')).toBeTruthy();
    expect(screen.getByText('Arthur Pendelton')).toBeTruthy();
    expect(screen.getByText('Eleanor Vance')).toBeTruthy();
  });

  test('each row is labelled with the patient it opens', async () => {
    await render(<PatientListScreen />);

    expect(
      screen.getByLabelText('View details for Margaret Smith')
    ).toBeTruthy();
  });

  test('tapping a patient opens that patient, passing their id', async () => {
    await render(<PatientListScreen />);

    await fireEvent.press(
      screen.getByLabelText('View details for Arthur Pendelton')
    );

    expect(mockNavigate).toHaveBeenCalledWith('PatientDetail', { id: '2' });
  });

  test('the add button goes to the add-patient screen', async () => {
    await render(<PatientListScreen />);

    await fireEvent.press(screen.getByLabelText('Add new patient'));

    expect(mockNavigate).toHaveBeenCalledWith('AddPatient');
  });

  test('the back button goes back rather than navigating somewhere new', async () => {
    await render(<PatientListScreen />);

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
