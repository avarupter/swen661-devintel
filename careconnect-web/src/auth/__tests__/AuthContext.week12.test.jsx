import { useState } from 'react';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  persistRole,
  signIn as mockSignIn,
  signUp as mockSignUp,
  signOut as mockSignOut,
} from '../mockAuth';

import {
  AuthProvider,
  useAuth,
} from '../AuthContext';


jest.mock('../mockAuth', () => ({
  getSession: jest.fn(),
  persistSession: jest.fn(),
  clearSession: jest.fn(),
  persistRole: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}));


function Harness() {
  const {
    user,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    setRole,
  } = useAuth();

  const [result, setResult] = useState('');

  return (
    <div>
      <div data-testid="loading">
        {loading ? 'loading' : 'ready'}
      </div>

      <div data-testid="user">
        {user?.name || 'none'}
      </div>

      <div data-testid="role">
        {role || 'none'}
      </div>

      <div data-testid="result">
        {result}
      </div>

      <button
        onClick={async () => {
          const response = await signIn(
            'jojo@example.com',
            'password',
          );

          setResult(response.error || 'ok');
        }}
      >
        Sign in
      </button>

      <button
        onClick={async () => {
          const response = await signUp(
            'Jojo',
            'jojo@example.com',
            'password',
          );

          setResult(response.error || 'ok');
        }}
      >
        Sign up
      </button>

      <button onClick={() => setRole('caregiver')}>
        Caregiver role
      </button>

      <button onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}


function renderAuth() {
  return render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
}


describe('AuthContext TSX application', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    getSession.mockReturnValue(null);
  });


  it('finishes initial loading with no stored session', async () => {
    renderAuth();

    await waitFor(() => {
      expect(
        screen.getByTestId('loading'),
      ).toHaveTextContent('ready');
    });

    expect(
      screen.getByTestId('user'),
    ).toHaveTextContent('none');

    expect(
      screen.getByTestId('role'),
    ).toHaveTextContent('none');
  });


  it('rehydrates an existing patient session', async () => {
    getSession.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'patient',
    });

    renderAuth();

    await waitFor(() => {
      expect(
        screen.getByTestId('user'),
      ).toHaveTextContent('Jojo');
    });

    expect(
      screen.getByTestId('role'),
    ).toHaveTextContent('patient');
  });


  it('signs in and persists a new session', async () => {
    const user = userEvent.setup();

    const signedInUser = {
      id: 'u2',
      name: 'Jojo',
      email: 'jojo@example.com',
    };

    mockSignIn.mockResolvedValue({
      user: signedInUser,
    });

    renderAuth();

    await user.click(
      screen.getByRole('button', {
        name: 'Sign in',
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('result'),
      ).toHaveTextContent('ok');
    });

    expect(mockSignIn).toHaveBeenCalledWith(
      'jojo@example.com',
      'password',
    );

    expect(persistSession).toHaveBeenCalledWith({
      user: signedInUser,
      role: null,
    });

    expect(
      screen.getByTestId('user'),
    ).toHaveTextContent('Jojo');
  });


  it('returns a sign-in error without persisting', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({
      error: 'Invalid credentials',
    });

    renderAuth();

    await user.click(
      screen.getByRole('button', {
        name: 'Sign in',
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('result'),
      ).toHaveTextContent('Invalid credentials');
    });

    expect(persistSession).not.toHaveBeenCalled();
  });


  it('signs up and persists the new user', async () => {
    const user = userEvent.setup();

    const newUser = {
      id: 'u3',
      name: 'Jojo',
      email: 'jojo@example.com',
    };

    mockSignUp.mockResolvedValue({
      user: newUser,
    });

    renderAuth();

    await user.click(
      screen.getByRole('button', {
        name: 'Sign up',
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('result'),
      ).toHaveTextContent('ok');
    });

    expect(persistSession).toHaveBeenCalledWith({
      user: newUser,
      role: null,
    });
  });


  it('returns a sign-up error without persisting', async () => {
    const user = userEvent.setup();

    mockSignUp.mockResolvedValue({
      error: 'Account already exists',
    });

    renderAuth();

    await user.click(
      screen.getByRole('button', {
        name: 'Sign up',
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('result'),
      ).toHaveTextContent(
        'Account already exists',
      );
    });

    expect(persistSession).not.toHaveBeenCalled();
  });


  it('persists a selected role', async () => {
    const user = userEvent.setup();

    renderAuth();

    await user.click(
      screen.getByRole('button', {
        name: 'Caregiver role',
      }),
    );

    expect(persistRole).toHaveBeenCalledWith(
      'caregiver',
    );

    expect(
      screen.getByTestId('role'),
    ).toHaveTextContent('caregiver');
  });


  it('signs out and clears the stored session', async () => {
    const user = userEvent.setup();

    getSession.mockReturnValue({
      user: {
        id: 'u4',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'caregiver',
    });

    renderAuth();

    await waitFor(() => {
      expect(
        screen.getByTestId('user'),
      ).toHaveTextContent('Jojo');
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out',
      }),
    );

    expect(mockSignOut).toHaveBeenCalled();
    expect(clearSession).toHaveBeenCalled();

    expect(
      screen.getByTestId('user'),
    ).toHaveTextContent('none');

    expect(
      screen.getByTestId('role'),
    ).toHaveTextContent('none');
  });

});