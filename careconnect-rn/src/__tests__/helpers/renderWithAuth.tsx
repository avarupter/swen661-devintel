// src/__tests__/helpers/renderWithAuth.tsx
import React, { ReactElement, ReactNode, useEffect } from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { PatientProvider } from '../../context/PatientContext';

/**
 * Renders a screen inside a real AuthProvider.
 *
 * Note the `await`: @testing-library/react-native v14 made `render` async, so an
 * un-awaited call returns a promise and every query against it fails with
 * "render function has not been called".
 */
export async function renderWithAuth(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    ),
  });
}

/**
 * Renders a screen inside an AuthProvider already driven into a signed-in state,
 * so screens that read `user` can be checked against a real context rather than a
 * stubbed one. Seeding happens in an effect — calling signUp during render would
 * be a state update during another component's render.
 */
export async function renderWithSignedInUser(
  ui: ReactElement,
  {
    name = 'Mary',
    email = 'mary@example.com',
  }: { name?: string; email?: string } = {}
) {
  function Seed({ children }: { children: ReactNode }) {
    const { signUp } = useAuth();
    useEffect(() => {
      signUp(name, email, 'password123');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <>{children}</>;
  }

  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthProvider>
        <Seed>{children}</Seed>
      </AuthProvider>
    ),
  });
}

/**
 * Renders a screen inside both app providers. PatientListScreen and
 * AddEditPatientScreen read the patient list from PatientContext, so they throw
 * "usePatients must be used within a PatientProvider" without this.
 */
export async function renderWithProviders(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthProvider>
        <PatientProvider>{children}</PatientProvider>
      </AuthProvider>
    ),
  });
}
