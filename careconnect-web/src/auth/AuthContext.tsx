import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import {
  getSession,
  persistSession,
  clearSession,
  persistRole,
  signIn as mockSignIn,
  signUp as mockSignUp,
  signOut as mockSignOut,
} from './mockAuth';
import type { MockUser, UserRole } from './mockAuth';

// ── Context shape ──────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: MockUser | null;
  role: UserRole | null;
  /** True only on the initial mount while reading localStorage */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<MockUser | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      setRoleState(session.role);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await mockSignIn(email, password);
    if (result.error) return { error: result.error };
    const user = result.user as MockUser;
    persistSession({ user, role: null });
    setUser(user);
    setRoleState(null);
    return {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await mockSignUp(name, email, password);
    if (result.error) return { error: result.error };
    const user = result.user as MockUser;
    persistSession({ user, role: null });
    setUser(user);
    setRoleState(null);
    return {};
  }, []);

  const signOut = useCallback(() => {
    mockSignOut();
    clearSession();
    setUser(null);
    setRoleState(null);
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    persistRole(newRole);
    setRoleState(newRole);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
