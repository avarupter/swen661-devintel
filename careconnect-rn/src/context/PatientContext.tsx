import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
}

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (patient: Patient) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const INITIAL_PATIENTS: Patient[] = [
  { id: '1', name: 'Margaret Smith', age: 78, condition: 'Routine care & Vision' },
  { id: '2', name: 'Arthur Pendelton', age: 82, condition: 'Hypertension monitoring' },
  { id: '3', name: 'Eleanor Vance', age: 74, condition: 'Post-operative recovery' },
];

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
    };
    setPatients((prev) => [newPatient, ...prev]);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
  };

  return (
    <PatientContext.Provider value={{ patients, addPatient, updatePatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
