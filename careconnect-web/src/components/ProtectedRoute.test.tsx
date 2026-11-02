import { describe, test, expect, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import * as AuthContext from '../auth/AuthContext';
import { AuthRoute, ProtectedRoute, RoleRoute } from './ProtectedRoute';
import { renderWithProviders } from '../test/test-utils';
import type { SessionOptions } from '../test/test-utils';

// A miniature of App.tsx's route tree: each guard wraps a marker element, and
// every redirect target is guarded the same way the real app guards it.
function renderAt(route: string, session: SessionOptions = {}) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<p>Landing page</p>} />
      <Route path="/signin" element={<AuthRoute><p>Sign-in form</p></AuthRoute>} />
      <Route path="/role" element={<RoleRoute><p>Role chooser</p></RoleRoute>} />
      <Route path="/app" element={<ProtectedRoute><p>App home</p></ProtectedRoute>} />
    </Routes>,
    { route, ...session },
  );
}

describe('ProtectedRoute (the /app screens)', () => {
  test('sends a signed-out visitor to the landing page', () => {
    const { location } = renderAt('/app');

    expect(screen.getByText('Landing page')).toBeInTheDocument();
    expect(location().pathname).toBe('/');
  });

  test('sends a signed-in user who has not picked a role to the role chooser', () => {
    const { location } = renderAt('/app', { signedIn: true });

    expect(screen.getByText('Role chooser')).toBeInTheDocument();
    expect(location().pathname).toBe('/role');
  });

  test.each(['patient', 'caregiver'] as const)('lets a signed-in %s in', (role) => {
    const { location } = renderAt('/app', { role });

    expect(screen.getByText('App home')).toBeInTheDocument();
    expect(location().pathname).toBe('/app');
  });
});

describe('RoleRoute (the /role chooser)', () => {
  test('sends a signed-out visitor to the landing page', () => {
    const { location } = renderAt('/role');

    expect(location().pathname).toBe('/');
  });

  test('shows the chooser to a signed-in user with no role yet', () => {
    renderAt('/role', { signedIn: true });

    expect(screen.getByText('Role chooser')).toBeInTheDocument();
  });

  test('skips the chooser when a role is already chosen', () => {
    const { location } = renderAt('/role', { role: 'caregiver' });

    expect(screen.getByText('App home')).toBeInTheDocument();
    expect(location().pathname).toBe('/app');
  });
});

describe('AuthRoute (the sign-in and sign-up forms)', () => {
  test('shows the form to a signed-out visitor', () => {
    renderAt('/signin');

    expect(screen.getByText('Sign-in form')).toBeInTheDocument();
  });

  test('sends a signed-in user with no role to the role chooser', () => {
    const { location } = renderAt('/signin', { signedIn: true });

    expect(location().pathname).toBe('/role');
  });

  test('sends a fully signed-in user straight into the app', () => {
    const { location } = renderAt('/signin', { role: 'patient' });

    expect(screen.getByText('App home')).toBeInTheDocument();
    expect(location().pathname).toBe('/app');
  });
});

describe('while the session is still being read', () => {
  test.each([
    ['ProtectedRoute', '/app'],
    ['RoleRoute', '/role'],
    ['AuthRoute', '/signin'],
  ])('%s shows a loading status instead of its content', (_guard, route) => {
    // The real provider finishes loading inside the first effect, before RTL's
    // render() returns, so pin the loading state through the hook.
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      role: null,
      loading: true,
      signIn: jest.fn(async () => ({})),
      signUp: jest.fn(async () => ({})),
      signOut: jest.fn(),
      setRole: jest.fn(),
    });

    const { location } = renderAt(route);

    expect(screen.getByRole('status', { name: 'Loading, please wait' })).toBeInTheDocument();
    expect(screen.queryByText(/Landing page|Sign-in form|Role chooser|App home/)).toBeNull();
    expect(location().pathname).toBe(route);
  });
});
