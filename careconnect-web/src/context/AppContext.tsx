import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

export interface PatientProfile {
  name: string;
}

interface AppContextValue {
  patient: PatientProfile;
  setPatient: (profile: PatientProfile) => void;
}

const PATIENT_KEY = 'careconnect_patient';

function loadPatient(): PatientProfile {
  try {
    const raw = localStorage.getItem(PATIENT_KEY);
    return raw ? (JSON.parse(raw) as PatientProfile) : { name: 'Margaret' };
  } catch {
    return { name: 'Margaret' };
  }
}

function savePatient(profile: PatientProfile) {
  localStorage.setItem(PATIENT_KEY, JSON.stringify(profile));
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [patient, setPatientState] = useState<PatientProfile>(loadPatient);

  // In patient mode, the care-recipient identity is the signed-in account.
  // Caregiver mode can retain a separate care-recipient profile.
  useEffect(() => {
    if (role === 'patient' && user?.name && patient.name !== user.name) {
      setPatientState((current) => ({
        ...current,
        name: user.name,
      }));
    }
  }, [role, user?.name, patient.name]);

  useEffect(() => {
    savePatient(patient);
  }, [patient]);

  function setPatient(profile: PatientProfile) {
    setPatientState(profile);
  }

  return (
    <AppContext.Provider value={{ patient, setPatient }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return ctx;
}