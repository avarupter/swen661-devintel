import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PatientProfile {
  name: string;
}

interface AppContextValue {
  /** The care-recipient profile — always "Margaret" in the mock */
  patient: PatientProfile;
  /** Overwrite the patient profile and persist to localStorage */
  setPatient: (profile: PatientProfile) => void;
}

// ── Storage ────────────────────────────────────────────────────────────────────

const PATIENT_KEY = 'careconnect_patient';

function loadPatient(): PatientProfile {
  try {
    const raw = localStorage.getItem(PATIENT_KEY);
    return raw ? (JSON.parse(raw) as PatientProfile) : { name: 'Margaret' };
  } catch {
    return { name: 'Margaret' };
  }
}

function savePatient(p: PatientProfile) {
  localStorage.setItem(PATIENT_KEY, JSON.stringify(p));
}

// ── Context ────────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [patient, setPatientState] = useState<PatientProfile>(loadPatient);

  // Persist every time the profile changes
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
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
