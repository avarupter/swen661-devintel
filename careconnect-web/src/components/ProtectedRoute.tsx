import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

// ── Loading spinner ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-neutral-50"
      role="status"
      aria-label="Loading, please wait"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-calm-200 border-t-calm-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading…</p>
      </div>
    </div>
  );
}

// ── Route guards ───────────────────────────────────────────────────────────────

/**
 * Protects app routes that require both authentication and a chosen role.
 * - No user → redirect to landing "/"
 * - User but no role → redirect to "/role"
 * - User + role → render children
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/" replace />;
  if (!role)   return <Navigate to="/role" replace />;

  return <>{children}</>;
}

/**
 * Protects the role-chooser route: needs auth but no role yet.
 * - No user → redirect to landing "/"
 * - Already has a role → redirect into the app "/app"
 */
export function RoleRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/" replace />;
  if (role)    return <Navigate to="/app" replace />;

  return <>{children}</>;
}

/**
 * Wraps public auth screens (sign in / sign up).
 * If the user is already authenticated, skip straight to the next step.
 * - Has user + role → go to app
 * - Has user, no role → go to role chooser
 */
export function AuthRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user && role)  return <Navigate to="/app" replace />;
  if (user && !role) return <Navigate to="/role" replace />;

  return <>{children}</>;
}
