// ── Types ──────────────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'caregiver';

export interface MockUser {
  id: string;
  name: string;
  email: string;
}

export interface MockSession {
  user: MockUser;
  role: UserRole | null;
}

// ── Storage keys ───────────────────────────────────────────────────────────────

const USERS_KEY   = 'careconnect_users';
const SESSION_KEY = 'careconnect_session';

// ── Internal helpers ───────────────────────────────────────────────────────────

function getStoredUsers(): MockUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveStoredUsers(users: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

export function persistSession(session: MockSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export type AuthResult =
  | { user: MockUser; error?: never }
  | { user?: never; error: string };

/** Creates a new account. Email must not already exist. */
export async function signUp(
  name: string,
  email: string,
  _password: string,
): Promise<AuthResult> {
  const users = getStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: 'An account with this email already exists. Try signing in instead.' };
  }
  const user: MockUser = {
    id: `user_${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
  };
  saveStoredUsers([...users, user]);
  return { user };
}

/** Signs in an existing account. Returns error if email not found. */
export async function signIn(
  email: string,
  _password: string,
): Promise<AuthResult> {
  const users = getStoredUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return { error: "We couldn't find an account with that email. Please sign up first." };
  }
  return { user };
}

export function signOut() {
  clearSession();
}

/** Updates the role on the current persisted session. */
export function persistRole(role: UserRole) {
  const session = getSession();
  if (session) {
    persistSession({ ...session, role });
  }
}
