// src/__tests__/AddEditPatientScreen.test.tsx
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import AddEditPatientScreen from '../screens/AddEditPatientScreen';
import PatientListScreen from '../screens/PatientListScreen';
import { renderWithProviders } from './helpers/renderWithAuth';
import {
  mockGoBack,
  resetNavigationMock,
  routeParams,
} from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('AddEditPatientScreen — adding', () => {
  test('opens as a blank add form', async () => {
    await renderWithProviders(<AddEditPatientScreen />);

    expect(screen.getByLabelText('Add Patient Header')).toBeTruthy();
    expect(screen.getByLabelText('Patient Name').props.value).toBe('');
    expect(screen.getByLabelText('Patient Age').props.value).toBe('');
  });

  test('refuses to save without a name', async () => {
    await renderWithProviders(<AddEditPatientScreen />);

    await fireEvent.press(screen.getByLabelText('Add Patient'));

    expect(screen.getByText('Please enter a patient name')).toBeTruthy();
    // Must not navigate away on a failed save, or the entry is silently lost.
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('refuses to save a non-numeric age', async () => {
    await renderWithProviders(<AddEditPatientScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Patient Name'),
      'Dorothy Hughes'
    );
    await fireEvent.changeText(screen.getByLabelText('Patient Age'), 'eighty');
    await fireEvent.press(screen.getByLabelText('Add Patient'));

    expect(screen.getByText('Please enter a valid age')).toBeTruthy();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('refuses to save an empty age', async () => {
    await renderWithProviders(<AddEditPatientScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Patient Name'),
      'Dorothy Hughes'
    );
    await fireEvent.press(screen.getByLabelText('Add Patient'));

    expect(screen.getByText('Please enter a valid age')).toBeTruthy();
  });

  test('saves a valid patient and returns to the list', async () => {
    await renderWithProviders(<AddEditPatientScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Patient Name'),
      'Dorothy Hughes'
    );
    await fireEvent.changeText(screen.getByLabelText('Patient Age'), '81');
    await fireEvent.changeText(
      screen.getByLabelText('Medical Condition'),
      'Memory support'
    );
    await fireEvent.press(screen.getByLabelText('Add Patient'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  test('the error clears once the form is corrected', async () => {
    await renderWithProviders(<AddEditPatientScreen />);

    await fireEvent.press(screen.getByLabelText('Add Patient'));
    expect(screen.getByText('Please enter a patient name')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Patient Name'), 'Dorothy');
    await fireEvent.changeText(screen.getByLabelText('Patient Age'), '81');
    await fireEvent.press(screen.getByLabelText('Add Patient'));

    expect(screen.queryByText('Please enter a patient name')).toBeNull();
  });

  test('the back button leaves without saving', async () => {
    await renderWithProviders(<AddEditPatientScreen />);

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('AddEditPatientScreen — editing', () => {
  const existing = {
    id: '2',
    name: 'Arthur Pendelton',
    age: 82,
    condition: 'Hypertension monitoring',
  };

  test('pre-fills the form from the patient it was given', async () => {
    routeParams.current = { patient: existing };
    await renderWithProviders(<AddEditPatientScreen />);

    expect(screen.getByLabelText('Edit Patient Header')).toBeTruthy();
    expect(screen.getByLabelText('Patient Name').props.value).toBe(
      'Arthur Pendelton'
    );
    // Age is a number on the model and a string in the field.
    expect(screen.getByLabelText('Patient Age').props.value).toBe('82');
    expect(screen.getByLabelText('Medical Condition').props.value).toBe(
      'Hypertension monitoring'
    );
  });

  test('the save button is labelled as an update, not an add', async () => {
    routeParams.current = { patient: existing };
    await renderWithProviders(<AddEditPatientScreen />);

    expect(screen.getByLabelText('Update Patient')).toBeTruthy();
    expect(screen.queryByLabelText('Add Patient')).toBeNull();
  });

  test('saving an edit returns to the list', async () => {
    routeParams.current = { patient: existing };
    await renderWithProviders(<AddEditPatientScreen />);

    await fireEvent.changeText(screen.getByLabelText('Patient Age'), '83');
    await fireEvent.press(screen.getByLabelText('Update Patient'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('add then list', () => {
  test('a patient added through the form shows up in the list', async () => {
    // Both screens mounted under one provider, which is what proves the add
    // actually reaches shared state rather than only local form state.
    function Both() {
      return (
        <>
          <AddEditPatientScreen />
          <PatientListScreen />
        </>
      );
    }
    await renderWithProviders(<Both />);

    expect(screen.queryByText('Dorothy Hughes')).toBeNull();

    await fireEvent.changeText(
      screen.getByLabelText('Patient Name'),
      'Dorothy Hughes'
    );
    await fireEvent.changeText(screen.getByLabelText('Patient Age'), '81');
    await fireEvent.press(screen.getByLabelText('Add Patient'));

    expect(screen.getByText('Dorothy Hughes')).toBeTruthy();
  });
});
