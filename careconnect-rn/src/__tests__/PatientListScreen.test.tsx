// src/__tests__/PatientListScreen.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PatientListScreen from '../screens/PatientListScreen';
import { PatientProvider } from '../context/PatientContext';
import {
  mockGoBack,
  mockNavigate,
  resetNavigationMock,
} from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

// PatientListScreen reads its rows from PatientContext, so it has to be rendered
// inside a PatientProvider exactly as App.tsx does — a bare render throws.
async function renderScreen() {
  return render(
    <PatientProvider>
      <PatientListScreen />
    </PatientProvider>
  );
}

describe('PatientListScreen', () => {
  test('lists every patient with their age and condition', async () => {
    await renderScreen();

    expect(screen.getByText('Patients')).toBeTruthy();
    expect(screen.getByText('Margaret Smith')).toBeTruthy();
    expect(screen.getByText('Arthur Pendelton')).toBeTruthy();
    expect(screen.getByText('Eleanor Vance')).toBeTruthy();
  });

  test('each row is labelled with the patient it opens', async () => {
    await renderScreen();

    expect(
      screen.getByLabelText('Edit details for Margaret Smith')
    ).toBeTruthy();
  });

  test('tapping a patient opens that patient for editing, passing the record', async () => {
    await renderScreen();

    await fireEvent.press(
      screen.getByLabelText('Edit details for Arthur Pendelton')
    );

    // The row hands the whole record to the edit screen, which prefills its
    // form from route.params.patient — passing only an id would render blank.
    expect(mockNavigate).toHaveBeenCalledWith('AddEditPatient', {
      patient: {
        id: '2',
        name: 'Arthur Pendelton',
        age: 82,
        condition: 'Hypertension monitoring',
      },
    });
  });

  test('the add button goes to the add-patient screen', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByLabelText('Add new patient'));

    expect(mockNavigate).toHaveBeenCalledWith('AddPatient');
  });

  test('the back button goes back rather than navigating somewhere new', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
