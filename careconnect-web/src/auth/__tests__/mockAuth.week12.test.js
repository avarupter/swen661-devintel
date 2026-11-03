import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  getSession,
  persistSession,
  clearSession,
  signUp,
  signIn,
  signOut,
  persistRole,
} from '../mockAuth';


describe('mockAuth TSX application', () => {

  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });


  it('returns null when no session exists', () => {
    expect(getSession()).toBeNull();
  });


  it('persists and reads a session', () => {
    const session = {
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'patient',
    };

    persistSession(session);

    expect(getSession()).toEqual(session);
  });


  it('returns null when stored session JSON is invalid', () => {
    localStorage.setItem(
      'careconnect_session',
      '{invalid-json',
    );

    expect(getSession()).toBeNull();
  });


  it('clears a stored session', () => {
    localStorage.setItem(
      'careconnect_session',
      JSON.stringify({
        user: {
          id: 'u1',
          name: 'Jojo',
          email: 'jojo@example.com',
        },
        role: null,
      }),
    );

    clearSession();

    expect(
      localStorage.getItem('careconnect_session'),
    ).toBeNull();
  });


  it('creates a new account with normalized values', async () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValue(0.123456789);

    const result = await signUp(
      '  Jojo  ',
      '  JOJO@EXAMPLE.COM  ',
      'ignored-password',
    );

    expect(result.error).toBeUndefined();

    expect(result.user).toEqual(
      expect.objectContaining({
        name: 'Jojo',
        email: 'jojo@example.com',
      }),
    );

    const users = JSON.parse(
      localStorage.getItem('careconnect_users'),
    );

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Jojo');
  });


  it('prevents duplicate email registration case-insensitively', async () => {
    await signUp(
      'Jojo',
      'jojo@example.com',
      'password',
    );

    const result = await signUp(
      'Second Jojo',
      'JOJO@example.com',
      'password',
    );

    expect(result.error).toMatch(
      /already exists/i,
    );

    const users = JSON.parse(
      localStorage.getItem('careconnect_users'),
    );

    expect(users).toHaveLength(1);
  });


  it('recovers from invalid stored users JSON', async () => {
    localStorage.setItem(
      'careconnect_users',
      '{broken-json',
    );

    const result = await signUp(
      'Jojo',
      'jojo@example.com',
      'password',
    );

    expect(result.user.name).toBe('Jojo');
  });


  it('signs in an existing account case-insensitively', async () => {
    await signUp(
      'Jojo',
      'jojo@example.com',
      'password',
    );

    const result = await signIn(
      'JOJO@EXAMPLE.COM',
      'anything',
    );

    expect(result.error).toBeUndefined();
    expect(result.user.name).toBe('Jojo');
  });


  it('returns an error when an account does not exist', async () => {
    const result = await signIn(
      'missing@example.com',
      'anything',
    );

    expect(result.error).toMatch(
      /couldn't find an account/i,
    );
  });


  it('signOut removes the active session', () => {
    persistSession({
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'patient',
    });

    signOut();

    expect(getSession()).toBeNull();
  });


  it('updates the role on an existing session', () => {
    persistSession({
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: null,
    });

    persistRole('caregiver');

    expect(getSession().role).toBe(
      'caregiver',
    );
  });


  it('does nothing when persisting a role without a session', () => {
    persistRole('patient');

    expect(getSession()).toBeNull();
  });

});