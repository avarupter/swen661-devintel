// src/utils/authUtils.ts

export interface User {
  name: string;
  email: string;
}

export type Role = 'patient' | 'caregiver' | null;

/**
 * Creates a User object from a sign-in (name is always "Mary" for mock auth)
 */
export function createSignedInUser(email: string): User {
  return { name: 'Mary', email };
}

/**
 * Creates a User object from a sign-up
 */
export function createSignedUpUser(name: string, email: string): User {
  return { name, email };
}

/**
 * Returns true if the given user is considered logged in
 */
export function isLoggedIn(user: User | null): boolean {
  return user !== null;
}

/**
 * Validates that a role value is valid
 */
export function isValidRole(role: string): role is 'patient' | 'caregiver' {
  return role === 'patient' || role === 'caregiver';
}