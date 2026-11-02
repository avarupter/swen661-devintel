import { describe, test, expect, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { registerAccount, seedSession, storedSession, TEST_ACCOUNT } from '../test/test-utils';

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe('useAuth', () => {
  test('throws a helpful error outside an AuthProvider', () => {
    // React reports the render error on console.error as well; keep the output clean.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
  });
});

describe('AuthProvider', () => {
  test('starts signed out when no session is stored', () => {
    const { result } = renderAuth();

    expect(result.current).toMatchObject({ user: null, role: null, loading: false });
  });

  test('restores the stored session, including the chosen role', () => {
    seedSession({ role: 'caregiver' });

    const { result } = renderAuth();

    expect(result.current).toMatchObject({
      user: TEST_ACCOUNT,
      role: 'caregiver',
      loading: false,
    });
  });

  test('signUp registers the account and signs it in with no role yet', async () => {
    const { result } = renderAuth();

    let outcome: { error?: string } | undefined;
    await act(async () => {
      outcome = await result.current.signUp('Ada Lovelace', 'ada@example.com', 'secret1');
    });

    expect(outcome).toEqual({});
    expect(result.current.user).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(result.current.role).toBeNull();
    expect(storedSession()).toEqual({ user: result.current.user, role: null });
  });

  test('signUp reports an email that is taken and stays signed out', async () => {
    registerAccount();
    const { result } = renderAuth();

    let outcome: { error?: string } | undefined;
    await act(async () => {
      outcome = await result.current.signUp('Sam', TEST_ACCOUNT.email, 'secret1');
    });

    expect(outcome?.error).toMatch(/already exists/);
    expect(result.current.user).toBeNull();
    expect(storedSession()).toBeNull();
  });

  test('signIn signs a registered user in and asks for a role again', async () => {
    registerAccount();
    const { result } = renderAuth();

    let outcome: { error?: string } | undefined;
    await act(async () => {
      outcome = await result.current.signIn(TEST_ACCOUNT.email, 'secret1');
    });

    expect(outcome).toEqual({});
    expect(result.current.user).toEqual(TEST_ACCOUNT);
    expect(result.current.role).toBeNull();
    expect(storedSession()).toEqual({ user: TEST_ACCOUNT, role: null });
  });

  test('signIn reports an unknown email and stays signed out', async () => {
    const { result } = renderAuth();

    let outcome: { error?: string } | undefined;
    await act(async () => {
      outcome = await result.current.signIn('nobody@example.com', 'secret1');
    });

    expect(outcome?.error).toMatch(/couldn't find an account/);
    expect(result.current.user).toBeNull();
  });

  test('setRole records the role in state and in the stored session', () => {
    seedSession({ signedIn: true });
    const { result } = renderAuth();

    act(() => result.current.setRole('patient'));

    expect(result.current.role).toBe('patient');
    expect(storedSession()?.role).toBe('patient');
  });

  test('signOut clears the user, the role and the stored session', () => {
    seedSession({ role: 'patient' });
    const { result } = renderAuth();

    act(() => result.current.signOut());

    expect(result.current).toMatchObject({ user: null, role: null });
    expect(storedSession()).toBeNull();
  });

  test('signing in again forgets the role chosen last time', async () => {
    seedSession({ role: 'caregiver' });
    const { result } = renderAuth();

    act(() => result.current.signOut());
    await act(async () => {
      await result.current.signIn(TEST_ACCOUNT.email, 'secret1');
    });

    // BUG: App.tsx:45-46 says switching role persists it "so the next sign-in
    // skips the chooser", and RoleChooser.tsx:63 tells users "Your choice is
    // remembered". But the role lives on the session, signOut deletes the
    // session, and signIn (AuthContext.tsx:56) writes role: null — so every
    // sign-in goes back through the /role chooser.
    expect(result.current.role).toBeNull();
    expect(storedSession()?.role).toBeNull();
  });
});
