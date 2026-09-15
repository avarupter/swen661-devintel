// src/__tests__/AuthContext.test.tsx
import React, { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  test('starts signed out with no role', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  test('signIn stores the email and flips isLoggedIn', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      result.current.signIn('dorothy@example.com', 'password123');
    });

    expect(result.current.user).toEqual({
      name: 'Mary',
      email: 'dorothy@example.com',
    });
    expect(result.current.isLoggedIn).toBe(true);
  });

  test('signUp keeps the name the user actually typed', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      result.current.signUp('Dorothy Smith', 'dorothy@example.com', 'pw');
    });

    // signIn hard-codes "Mary"; signUp must not, or the greeting on every
    // patient screen would address the wrong person.
    expect(result.current.user).toEqual({
      name: 'Dorothy Smith',
      email: 'dorothy@example.com',
    });
  });

  test('setRole records the chosen role without touching the user', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      result.current.signUp('Dorothy', 'd@example.com', 'pw');
    });
    await act(async () => {
      result.current.setRole('caregiver');
    });

    expect(result.current.role).toBe('caregiver');
    expect(result.current.user?.name).toBe('Dorothy');
  });

  test('signOut clears both the user and the role', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      result.current.signUp('Dorothy', 'd@example.com', 'pw');
    });
    await act(async () => {
      result.current.setRole('patient');
    });
    await act(async () => {
      result.current.signOut();
    });

    // Leaving the role behind would send the next signed-in user straight into
    // the previous user's tab layout.
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  test('useAuth outside a provider fails loudly instead of returning undefined', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used inside an AuthProvider');

    consoleError.mockRestore();
  });
});