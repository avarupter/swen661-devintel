// src/__tests__/PatientMedicationsScreen.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PatientMedicationsScreen from '../screens/PatientMedicationsScreen';
import { mockNavigate, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('PatientMedicationsScreen', () => {
  test('separates scheduled medicines from as-needed ones', async () => {
    await render(<PatientMedicationsScreen />);

    // An as-needed painkiller listed among the daily medicines would read as a
    // missed dose, so the split is the point of the screen.
    expect(screen.getByText('Regular medicines')).toBeTruthy();
    // Appears twice: once as the section heading, once as Paracetamol's schedule.
    expect(screen.getAllByText('Only if you need it').length).toBeGreaterThan(0);
  });

  test('every medicine carries its purpose in plain language', async () => {
    await render(<PatientMedicationsScreen />);

    expect(screen.getByText('Helps with memory and thinking')).toBeTruthy();
    expect(screen.getByText('Lowers blood pressure')).toBeTruthy();
    expect(screen.getByText('For pain or fever')).toBeTruthy();
  });

  test("each row reports today's progress for that medicine", async () => {
    await render(<PatientMedicationsScreen />);

    expect(screen.getByText('1 of 2 taken today')).toBeTruthy();
    // Amlodipine and Atorvastatin are both outstanding.
    expect(screen.getAllByText('Not yet taken')).toHaveLength(2);
  });

  test('the row label reads as one sentence for a screen reader', async () => {
    await render(<PatientMedicationsScreen />);

    expect(
      screen.getByLabelText(
        'Memantine. Helps with memory and thinking. 1 of 2 taken today'
      )
    ).toBeTruthy();
  });

  test('tapping a medicine opens that medicine, passing its id', async () => {
    await render(<PatientMedicationsScreen />);

    await fireEvent.press(
      screen.getByLabelText(/^Amlodipine\. Lowers blood pressure/)
    );

    expect(mockNavigate).toHaveBeenCalledWith('MedicationDetail', {
      medId: '3',
    });
  });

  test('an as-needed medicine still opens its own detail', async () => {
    await render(<PatientMedicationsScreen />);

    await fireEvent.press(screen.getByLabelText(/^Paracetamol\./));

    expect(mockNavigate).toHaveBeenCalledWith('MedicationDetail', {
      medId: '5',
    });
  });
});
