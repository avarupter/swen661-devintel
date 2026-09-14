// src/__tests__/authUtils.test.ts
import {
  createSignedInUser,
  createSignedUpUser,
  isLoggedIn,
  isValidRole,
} from '../utils/authUtils';

describe('createSignedInUser', () => {
  test('creates a user with the name Mary', () => {
    const user = createSignedInUser('test@example.com');
    expect(user.name).toBe('Mary');
    expect(user.email).toBe('test@example.com');
  });
});

describe('createSignedUpUser', () => {
  test('creates a user with the provided name and email', () => {
    const user = createSignedUpUser('Dorothy', 'dorothy@example.com');
    expect(user.name).toBe('Dorothy');
    expect(user.email).toBe('dorothy@example.com');
  });
});

describe('isLoggedIn', () => {
  test('returns true when user is not null', () => {
    const user = createSignedUpUser('Dorothy', 'dorothy@example.com');
    expect(isLoggedIn(user)).toBe(true);
  });

  test('returns false when user is null', () => {
    expect(isLoggedIn(null)).toBe(false);
  });
});

describe('isValidRole', () => {
  test('accepts "patient"', () => {
    expect(isValidRole('patient')).toBe(true);
  });

  test('accepts "caregiver"', () => {
    expect(isValidRole('caregiver')).toBe(true);
  });

  test('rejects invalid role strings', () => {
    expect(isValidRole('doctor')).toBe(false);
    expect(isValidRole('')).toBe(false);
    expect(isValidRole('PATIENT')).toBe(false);
  });
});