// ── Type ──────────────────────────────────────────────────────────────────────

export type AppointmentLocationType = 'clinic' | 'hospital' | 'telephone' | 'home';

export interface AppointmentLocation {
  name: string;
  address?: string;
  type: AppointmentLocationType;
}

export interface Appointment {
  id: string;
  /** Plain-language title: "See Dr. Lee — heart checkup" */
  title: string;
  /** ISO date "YYYY-MM-DD" */
  date: string;
  /** 24-hour time "HH:MM" */
  time: string;
  location: AppointmentLocation;
  /** Name of the person taking the patient, if assigned */
  caregiver?: string;
  /** Plain-language note for the patient */
  notes?: string;
  /** Whether this appointment has been added to the daily schedule ("My Day") */
  isInMyDay: boolean;
}

// ── Date helpers ───────────────────────────────────────────────────────────────
// Dates are computed relative to today so the demo always looks current.

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ── Mock data ──────────────────────────────────────────────────────────────────

export const appointments: Appointment[] = [
  // ── Today ──────────────────────────────────────────────────────────────────
  {
    id: 'a1',
    title: 'Blood pressure check — Dr. Sharma',
    date: daysFromNow(0),
    time: '10:30',
    location: {
      name: 'Greenfield Surgery',
      address: '12 Greenfield Road, Westfield',
      type: 'clinic',
    },
    caregiver: 'Joyce Adeyemi',
    notes:
      'Joyce will collect you at 10:00. Remember to bring your medicines list with you.',
    isInMyDay: true,
  },
  {
    id: 'a2',
    title: 'Heart checkup — Dr. Lee',
    date: daysFromNow(0),
    time: '14:30',
    location: {
      name: 'City Heart Clinic',
      address: '45 Hospital Way, Westfield',
      type: 'hospital',
    },
    caregiver: 'Maria Thompson',
    notes:
      'Your daughter Maria will drive you. Allow 20 minutes travel time from home.',
    isInMyDay: true,
  },

  // ── Later this week (+1 to +6 days) ───────────────────────────────────────
  {
    id: 'a3',
    title: 'Blood test — fasting needed',
    date: daysFromNow(1),
    time: '08:45',
    location: {
      name: 'Greenfield Surgery',
      address: '12 Greenfield Road, Westfield',
      type: 'clinic',
    },
    caregiver: 'Joyce Adeyemi',
    notes:
      'Do not eat or drink anything except plain water from midnight the night before. Joyce will collect you at 8:15.',
    isInMyDay: false,
  },
  {
    id: 'a4',
    title: 'Memory clinic follow-up — Dr. Patel',
    date: daysFromNow(3),
    time: '14:00',
    location: {
      name: 'Meadow Memory Centre',
      address: '8 Meadow Lane, Westfield',
      type: 'clinic',
    },
    caregiver: 'Maria Thompson',
    notes:
      'This is your regular three-month check-in. Maria will bring you and stay with you.',
    isInMyDay: false,
  },
  {
    id: 'a5',
    title: 'GP telephone review — Dr. Sharma',
    date: daysFromNow(5),
    time: '11:00',
    location: {
      name: 'Telephone — Dr. Sharma will call you',
      type: 'telephone',
    },
    notes:
      'Dr. Sharma will ring your home phone at exactly 11:00. You do not need to go anywhere — just be near the phone.',
    isInMyDay: false,
  },

  // ── Coming up (7+ days) ────────────────────────────────────────────────────
  {
    id: 'a6',
    title: 'Physiotherapy — shoulder exercises',
    date: daysFromNow(9),
    time: '10:30',
    location: {
      name: 'Westfield Physiotherapy',
      address: '3 Riverside Walk, Westfield',
      type: 'clinic',
    },
    caregiver: 'Joyce Adeyemi',
    notes: 'Wear comfortable, loose-fitting clothing. The session lasts about 45 minutes.',
    isInMyDay: false,
  },
  {
    id: 'a7',
    title: 'Eye test — routine annual check',
    date: daysFromNow(14),
    time: '11:00',
    location: {
      name: 'Vision Plus Opticians',
      address: '22 High Street, Westfield',
      type: 'clinic',
    },
    notes:
      'Routine yearly eye test. Your glasses prescription may be updated. No special preparation needed.',
    isInMyDay: false,
  },
  {
    id: 'a8',
    title: 'Annual health review — Dr. Sharma',
    date: daysFromNow(18),
    time: '14:00',
    location: {
      name: 'Greenfield Surgery',
      address: '12 Greenfield Road, Westfield',
      type: 'clinic',
    },
    caregiver: 'Maria Thompson',
    notes:
      'Your yearly health check. Dr. Sharma will review all your medicines. Maria will drive you.',
    isInMyDay: false,
  },
];
