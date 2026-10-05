// src/__tests__/PatientContext.test.tsx
import React, { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { PatientProvider, usePatients } from '../context/PatientContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <PatientProvider>{children}</PatientProvider>
);

describe('PatientContext', () => {
  test('starts with the seeded patients', async () => {
    const { result } = await renderHook(() => usePatients(), { wrapper });

    expect(result.current.patients).toHaveLength(3);
    expect(result.current.patients[0].name).toBe('Margaret Smith');
  });

  test('addPatient puts the new patient at the top of the list', async () => {
    const { result } = await renderHook(() => usePatients(), { wrapper });

    await act(async () => {
      result.current.addPatient({
        name: 'Dorothy Hughes',
        age: 81,
        condition: 'Memory support',
      });
    });

    // Newest first, so the caregiver sees what they just added without scrolling.
    expect(result.current.patients).toHaveLength(4);
    expect(result.current.patients[0].name).toBe('Dorothy Hughes');
  });

  test('addPatient assigns an id the caller did not supply', async () => {
    const { result } = await renderHook(() => usePatients(), { wrapper });

    await act(async () => {
      result.current.addPatient({ name: 'Dorothy', age: 81, condition: '' });
    });

    const added = result.current.patients[0];
    expect(added.id).toBeTruthy();
    // Ids must be unique or the FlatList keyExtractor collides.
    const ids = result.current.patients.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('updatePatient edits in place without reordering or duplicating', async () => {
    const { result } = await renderHook(() => usePatients(), { wrapper });

    await act(async () => {
      result.current.updatePatient({
        id: '2',
        name: 'Arthur Pendelton',
        age: 83,
        condition: 'Hypertension monitoring',
      });
    });

    expect(result.current.patients).toHaveLength(3);
    expect(result.current.patients[1]).toEqual({
      id: '2',
      name: 'Arthur Pendelton',
      age: 83,
      condition: 'Hypertension monitoring',
    });
  });

  test('updatePatient ignores an id that is not in the list', async () => {
    const { result } = await renderHook(() => usePatients(), { wrapper });
    const before = result.current.patients;

    await act(async () => {
      result.current.updatePatient({
        id: 'does-not-exist',
        name: 'Nobody',
        age: 1,
        condition: '',
      });
    });

    expect(result.current.patients).toEqual(before);
  });

  test('usePatients outside a provider fails loudly', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePatients());
    }).toThrow('usePatients must be used within a PatientProvider');

    consoleError.mockRestore();
  });
});
