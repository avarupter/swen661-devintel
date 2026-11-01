import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

export interface PatientProfile {
  name: string;
  dateOfBirth: string;
  homeAddress: string;
  caregiverName: string;
  caregiverPhone: string;
  importantPeople: string;
  importantFacts: string;
}

interface AppContextValue {
  patient: PatientProfile;
  setPatient: (profile: PatientProfile) => void;
}

const PATIENT_KEY = 'careconnect_patient';

const DEFAULT_PATIENT: PatientProfile = {
  name: 'Patient',
  dateOfBirth: '',
  homeAddress: '',
  caregiverName: '',
  caregiverPhone: '',
  importantPeople: '',
  importantFacts: '',
};

function loadPatient(): PatientProfile {
  try {
    const raw = localStorage.getItem(PATIENT_KEY);

    if (!raw) {
      return DEFAULT_PATIENT;
    }

    const stored = JSON.parse(raw) as Partial<PatientProfile>;

    return {
      ...DEFAULT_PATIENT,
      ...stored,
      name: stored.name?.trim() || DEFAULT_PATIENT.name,
    };
  } catch {
    return DEFAULT_PATIENT;
  }
}

function savePatient(profile: PatientProfile) {
  localStorage.setItem(PATIENT_KEY, JSON.stringify(profile));
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [patient, setPatientState] =
    useState<PatientProfile>(loadPatient);

  // In patient mode, the patient identity always follows
  // the signed-in account name.
  useEffect(() => {
    if (
      role === 'patient' &&
      user?.name &&
      patient.name !== user.name
    ) {
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