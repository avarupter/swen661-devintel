/**
 * Shared render helpers for component and page tests.
 *
 *   renderWithProviders(<Today />, { route: '/app', role: 'patient' })
 *
 * wraps the UI the way App.tsx composes the app — router → AuthProvider →
 * AppProvider — with a MemoryRouter at `route`, and signs in through the
 * app's own mock auth by seeding localStorage before the first render
 * (AuthProvider rehydrates the session from there on mount).
 *
 * To render the whole app (real BrowserRouter, every route and guard) use
 * renderApp from ./renderApp instead.
 */
import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Options as UserEventOptions, UserEvent } from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import type { MockUser, MockSession, UserRole } from '../auth/mockAuth';
import { AppProvider } from '../context/AppContext';
import type { PatientProfile } from '../context/AppContext';

// localStorage keys owned by src/auth/mockAuth.ts and src/context/AppContext.tsx
export const STORAGE_KEYS = {
  users: 'careconnect_users',
  session: 'careconnect_session',
  patient: 'careconnect_patient',
} as const;

/** The account a signed-in test uses unless `account` overrides it. */
export const TEST_ACCOUNT: Readonly<MockUser> = Object.freeze({
  id: 'user_test',
  name: 'Sam Taylor',
  email: 'sam@example.com',
});

export interface SessionOptions {
  /** Sign in with this role chosen. Implies `signedIn: true`. */
  role?: UserRole;
  /**
   * Whether a user is signed in. Defaults to true when `role` is given,
   * otherwise false. `{ signedIn: true }` alone = signed in, no role chosen
   * yet (the state that shows the /role chooser).
   */
  signedIn?: boolean;
  /** Overrides fields of TEST_ACCOUNT for the signed-in user. */
  account?: Partial<MockUser>;
  /** Care-recipient profile for AppContext (the app defaults to "Margaret"). */
  patient?: PatientProfile;
}

/**
 * Registers an account the way sign-up stores it, without signing it in —
 * so the sign-in form (or signIn()) will accept its email.
 */
export function registerAccount(account: Partial<MockUser> = {}): MockUser {
  const user: MockUser = { ...TEST_ACCOUNT, ...account };
  const users: MockUser[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) ?? '[]');
  localStorage.setItem(
    STORAGE_KEYS.users,
    JSON.stringify([...users.filter((u) => u.email !== user.email), user]),
  );
  return user;
}

/**
 * Writes the mock-auth session (and optionally the patient profile) to
 * localStorage exactly as the app stores them. Returns the signed-in user,
 * or null when signed out. The user is also registered, so signing out and
 * back in with the same email works.
 */
export function seedSession({
  role,
  signedIn = role !== undefined,
  account,
  patient,
}: SessionOptions = {}): MockUser | null {
  if (patient) localStorage.setItem(STORAGE_KEYS.patient, JSON.stringify(patient));

  if (!signedIn) {
    if (role) throw new Error('seedSession: a role needs a signed-in user (drop signedIn: false)');
    localStorage.removeItem(STORAGE_KEYS.session);
    return null;
  }

  const user = registerAccount(account);
  const session: MockSession = { user, role: role ?? null };
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  return user;
}

/** Reads the mock-auth session the app has persisted (null when signed out). */
export function storedSession(): MockSession | null {
  const raw = localStorage.getItem(STORAGE_KEYS.session);
  return raw ? (JSON.parse(raw) as MockSession) : null;
}

function usingFakeTimers(): boolean {
  const timer = globalThis.setTimeout as unknown as { clock?: unknown; _isMockFunction?: boolean };
  return Boolean(timer.clock) || timer._isMockFunction === true;
}

/**
 * A user-event instance. Under jest.useFakeTimers() it advances Jest's clock
 * itself — without that, every user-event call waits on a real timer and the
 * test hangs.
 */
export function setupUser(options: UserEventOptions = {}): UserEvent {
  return userEvent.setup({
    ...(usingFakeTimers() ? { advanceTimers: jest.advanceTimersByTime } : {}),
    ...options,
  });
}

export interface RenderWithProvidersOptions
  extends SessionOptions,
    Omit<RenderOptions, 'wrapper' | 'queries' | 'container' | 'baseElement'> {
  /** Initial URL of the MemoryRouter. Default '/'. */
  route?: string;
  /** Options for the returned user-event instance. */
  userEventOptions?: UserEventOptions;
}

export interface RenderWithProvidersResult extends RenderResult {
  /** user-event instance, already set up for this render. */
  user: UserEvent;
  /** The signed-in user (null when signed out). */
  account: MockUser | null;
  /** The router's current location — follows navigation the UI performs. */
  location: () => Location;
}

// Test-only component (never hot-reloaded), so the fast-refresh rule does not apply.
// eslint-disable-next-line react-refresh/only-export-components
function LocationProbe({ onChange }: { onChange: (location: Location) => void }) {
  const location = useLocation();
  useEffect(() => onChange(location), [location, onChange]);
  return null;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    role,
    signedIn,
    account: accountOverrides,
    patient,
    userEventOptions,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const account = seedSession({ role, signedIn, account: accountOverrides, patient });

  let current: Location | undefined;
  const track = (location: Location) => {
    current = location;
  };

  function Providers({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <AppProvider>
            {children}
            <LocationProbe onChange={track} />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  const user = setupUser(userEventOptions);
  const result = render(ui, { wrapper: Providers, ...renderOptions });

  return {
    ...result,
    user,
    account,
    location: () => {
      if (!current) throw new Error('renderWithProviders: the router has not rendered yet');
      return current;
    },
  };
}
