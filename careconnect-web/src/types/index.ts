// ── Shared domain types ───────────────────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high';
export type StatusBadge = 'success' | 'warning' | 'alert' | 'calm' | 'neutral';

// ── Schedule ─────────────────────────────────────────────────────────────

export interface ScheduleItem {
  id: string;
  time: string;        // "HH:MM" 24h
  label: string;
  description?: string;
  category: 'meal' | 'medication' | 'activity' | 'appointment' | 'rest';
  done: boolean;
}

// ── Medications ──────────────────────────────────────────────────────────

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];     // ["08:00", "20:00"]
  instructions?: string;
  colour: string;      // Tailwind bg class for pill visualisation
  taken: Record<string, boolean>; // date "YYYY-MM-DD" → taken?
}

// ── Memories ─────────────────────────────────────────────────────────────

export interface MemoryCard {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  category: 'family' | 'place' | 'event' | 'hobby' | 'pet';
  pinned: boolean;
}

// ── Contacts ─────────────────────────────────────────────────────────────

export type ContactRole = 'caregiver' | 'family' | 'doctor' | 'emergency';

export interface Contact {
  id: string;
  name: string;
  role: ContactRole;
  phone: string;
  avatarInitials: string;
  avatarColour: string; // Tailwind bg class
  notes?: string;
  isEmergency: boolean;
}

// ── Caregiver notes ───────────────────────────────────────────────────────

export interface CaregiverNote {
  id: string;
  date: string;        // "YYYY-MM-DD"
  author: string;
  note: string;
  priority: Priority;
}

// ── App user context ──────────────────────────────────────────────────────

export type AppView = 'patient' | 'caregiver';
