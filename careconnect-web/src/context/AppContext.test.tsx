import { describe, test, expect, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

const PATIENT_KEY = 'careconnect_patient';

function renderApp() {
  return renderHook(() => useApp(), { wrapper: AppProvider });
}

function storedPatient() {
  return JSON.parse(localStorage.getItem(PATIENT_KEY) ?? 'null');
}

describe('useApp', () => {
  test('throws a helpful error outside an AppProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useApp())).toThrow('useApp must be used inside AppProvider');
  });
});

describe('AppProvider', () => {
  test('defaults the care recipient to Margaret and stores that default', () => {
    const { result } = renderApp();

    expect(result.current.patient).toEqual({ name: 'Margaret' });
    expect(storedPatient()).toEqual({ name: 'Margaret' });
  });

  test('loads a stored care-recipient profile', () => {
    localStorage.setItem(PATIENT_KEY, JSON.stringify({ name: 'Dorothy' }));

    const { result } = renderApp();

    expect(result.current.patient).toEqual({ name: 'Dorothy' });
  });

  test('falls back to Margaret when the stored profile is corrupt', () => {
    localStorage.setItem(PATIENT_KEY, '{oops');

    const { result } = renderApp();

    expect(result.current.patient).toEqual({ name: 'Margaret' });
    expect(storedPatient()).toEqual({ name: 'Margaret' });
  });

  test('setPatient updates the profile and persists it', () => {
    const { result } = renderApp();

    act(() => result.current.setPatient({ name: 'Robert' }));

    expect(result.current.patient).toEqual({ name: 'Robert' });
    expect(storedPatient()).toEqual({ name: 'Robert' });
  });
});
