/**
 * Shared medication store backed by localStorage.
 * Caregiver management screens write here; patient Medications screen reads from here.
 */
import { medications as defaultMeds } from './mockData';
import type { Medication } from '../types';

const LS_KEY = 'careconnect_medications_list';

export function getMedications(): Medication[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Medication[]) : [...defaultMeds];
  } catch {
    return [...defaultMeds];
  }
}

export function saveMedications(meds: Medication[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(meds));
}

// Colour palette cycled for new medications
const COLOURS = [
  'bg-calm-200',
  'bg-warm-200',
  'bg-success-200',
  'bg-warning-200',
  'bg-alert-200',
  'bg-neutral-200',
];

export function pickColour(existingCount: number): string {
  return COLOURS[existingCount % COLOURS.length];
}
