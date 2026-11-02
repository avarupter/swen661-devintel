import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { getSession } from './auth/mockAuth';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute, RoleRoute, AuthRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Public pages (do not modify)
import Landing     from './pages/Landing';
import SignIn      from './pages/SignIn';
import SignUp      from './pages/SignUp';
import RoleChooser from './pages/RoleChooser';

// App pages (do not modify)
import Today        from './pages/Today';
import Schedule     from './pages/Schedule';
import Appointments from './pages/Appointments';
import Medications  from './pages/Medications';
import Memories     from './pages/Memories';
import Contacts     from './pages/Contacts';
import Caregiver    from './pages/Caregiver';
import CaregiverDashboard    from './pages/CaregiverDashboard';
import ActivityLog           from './pages/ActivityLog';
import ManageMedications     from './pages/ManageMedications';
import ManageAppointments    from './pages/ManageAppointments';

import type { AppView } from './types';

// ── Inner app shell ────────────────────────────────────────────────────────────

function AppShell() {
  const { setRole, signOut } = useAuth();

  // Initialise the view from the PERSISTED role (read synchronously from
  // storage). The auth context's `role` hydrates asynchronously and is null on
  // the first render, so deriving the view from it would default every fresh
  // load — including direct loads of caregiver screens — to the patient view.
  // Reading the persisted session here makes the caregiver chrome (sidebar +
  // role chip) render consistently on every caregiver screen.
  const [view, setView] = useState<AppView>(() =>
    getSession()?.role === 'caregiver' ? 'caregiver' : 'patient',
  );

  // Switch role: update local view state AND persist the new role so the
  // next sign-in skips the chooser and lands on the correct view.
  function handleSwitchRole() {
    const next: AppView = view === 'patient' ? 'caregiver' : 'patient';
    setView(next);
    setRole(next);           // persists via AuthContext → mockAuth
  }

  return (
    <ProtectedRoute>
      <Layout view={view} onSwitchRole={handleSwitchRole} onSignOut={signOut}>
        <Routes>
          {/* Patient sees the calm "Today" screen; caregiver sees the dashboard */}
          <Route index                        element={view === 'patient' ? <Today /> : <CaregiverDashboard />} />
          <Route path="schedule"              element={<Schedule />} />
          <Route path="appointments"          element={<Appointments />} />
          <Route path="medications"           element={<Medications />} />
          <Route path="memories"              element={<Memories />} />
          <Route path="contacts"              element={<Contacts />} />
          <Route path="caregiver"             element={<Caregiver />} />
          <Route path="activity"              element={<ActivityLog />} />
          <Route path="manage-medications"    element={<ManageMedications />} />
          <Route path="manage-appointments"   element={<ManageAppointments />} />
          <Route path="*"                     element={<Navigate to="/app" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

// ── Route tree ─────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"       element={<Landing />} />
      <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />

      {/* Post-auth role chooser */}
      <Route path="/role"   element={<RoleRoute><RoleChooser /></RoleRoute>} />

      {/* Protected app */}
      <Route path="/app/*"  element={<AppShell />} />

      {/* Legacy path shims — Home.tsx still links to these old paths.
          Redirect them into the /app/* namespace so they resolve correctly. */}
      <Route path="/schedule"    element={<Navigate to="/app/schedule"    replace />} />
      <Route path="/medications" element={<Navigate to="/app/medications" replace />} />
      <Route path="/memories"    element={<Navigate to="/app/memories"    replace />} />
      <Route path="/contacts"    element={<Navigate to="/app/contacts"    replace />} />
      <Route path="/caregiver"   element={<Navigate to="/app/caregiver"   replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
