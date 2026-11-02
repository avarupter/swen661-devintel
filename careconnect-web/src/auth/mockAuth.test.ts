import { describe, test, expect } from '@jest/globals';
import {
  clearSession,
  getSession,
  persistRole,
  persistSession,
  signIn,
  signOut,
  signUp,
} from './mockAuth';
import type { MockSession, MockUser } from './mockAuth';

const USERS_KEY = 'careconnect_users';
const SESSION_KEY = 'careconnect_session';

const margaret: MockUser = {
  id: 'user_margaret',
  name: 'Margaret Thompson',
  email: 'margaret@example.com',
};

function registerUsers(...users: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function storedUsers(): MockUser[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
}

describe('session storage', () => {
  test('there is no session until one is persisted', () => {
    expect(getSession()).toBeNull();
  });

  test('persistSession stores a session that getSession reads back', () => {
    const session: MockSession = { user: margaret, role: 'patient' };

    persistSession(session);

    expect(getSession()).toEqual(session);
  });

  test('a corrupt stored session reads as signed out instead of throwing', () => {
    localStorage.setItem(SESSION_KEY, '{not valid json');

    expect(getSession()).toBeNull();
  });

  test('clearSession forgets the session', () => {
    persistSession({ user: margaret, role: 'caregiver' });

    clearSession();

    expect(getSession()).toBeNull();
  });
});

describe('signUp', () => {
  test('registers an account with a trimmed name and a normalised email', async () => {
    const result = await signUp('  Margaret Thompson ', ' Margaret@Example.COM ', 'secret1');

    expect(result.error).toBeUndefined();
    expect(result.user).toEqual({
      id: expect.stringMatching(/^user_[a-z0-9]+$/),
      name: 'Margaret Thompson',
      email: 'margaret@example.com',
    });
    expect(storedUsers()).toEqual([result.user]);
  });

  test('adds to the existing accounts and gives each one its own id', async () => {
    const first = await signUp('Margaret', 'margaret@example.com', 'secret1');
    const second = await signUp('Joyce', 'joyce@example.com', 'secret2');

    expect(storedUsers()).toEqual([first.user, second.user]);
    expect(first.user?.id).not.toBe(second.user?.id);
  });

  test('only registers the account — it does not start a session', async () => {
    await signUp('Margaret', 'margaret@example.com', 'secret1');

    expect(getSession()).toBeNull();
  });

  test('refuses an email that is already registered, whatever its case', async () => {
    registerUsers(margaret);

    const result = await signUp('Another Margaret', 'MARGARET@example.com', 'secret1');

    expect(result).toEqual({
      error: 'An account with this email already exists. Try signing in instead.',
    });
    expect(storedUsers()).toEqual([margaret]);
  });

  test('a padded copy of a registered email creates a second account', async () => {
    registerUsers(margaret);

    const result = await signUp('Margaret', '  margaret@example.com  ', 'secret1');

    // BUG: mockAuth.ts:65 checks for duplicates with the raw email, but
    // mockAuth.ts:71 stores it trimmed, so two accounts end up with the same
    // email. Latent through the UI today: the sign-up field is type="email",
    // and browsers strip surrounding spaces from those.
    expect(result.error).toBeUndefined();
    expect(storedUsers().map((u) => u.email)).toEqual([
      'margaret@example.com',
      'margaret@example.com',
    ]);
  });

  test('a corrupt account list is treated as empty', async () => {
    localStorage.setItem(USERS_KEY, 'not json');

    const result = await signUp('Margaret', 'margaret@example.com', 'secret1');

    expect(result.user?.email).toBe('margaret@example.com');
    expect(storedUsers()).toHaveLength(1);
  });
});

describe('signIn', () => {
  test('finds a registered account regardless of case and surrounding spaces', async () => {
    registerUsers(margaret);

    await expect(signIn('  MARGARET@example.com ', 'whatever')).resolves.toEqual({
      user: margaret,
    });
  });

  test('accepts any password — the mock auth stores no passwords', async () => {
    registerUsers(margaret);

    const result = await signIn('margaret@example.com', 'not-the-password');

    expect(result.user).toEqual(margaret);
  });

  test('reports an email it does not know', async () => {
    registerUsers(margaret);

    await expect(signIn('nobody@example.com', 'secret1')).resolves.toEqual({
      error: "We couldn't find an account with that email. Please sign up first.",
    });
  });

  test('does not start a session by itself', async () => {
    registerUsers(margaret);

    await signIn('margaret@example.com', 'secret1');

    expect(getSession()).toBeNull();
  });
});

describe('signOut', () => {
  test('ends the session but keeps the registered accounts', () => {
    registerUsers(margaret);
    persistSession({ user: margaret, role: 'patient' });

    signOut();

    expect(getSession()).toBeNull();
    expect(storedUsers()).toEqual([margaret]);
  });
});

describe('persistRole', () => {
  test('records the chosen role on the current session', () => {
    persistSession({ user: margaret, role: null });

    persistRole('caregiver');

    expect(getSession()).toEqual({ user: margaret, role: 'caregiver' });
  });

  test('does nothing when nobody is signed in', () => {
    persistRole('patient');

    expect(getSession()).toBeNull();
  });
});
