import '../core/clock.dart';
import '../models/appointment.dart';
import '../models/dose_time.dart';
import '../models/medication.dart';

/// First-run demo content for CareConnect Daily Compass.
///
/// The patient is Margaret Whitfield, 82, living with early-stage Alzheimer's;
/// her daughter Joyce is the caregiver already named on the teammate's
/// caregiver screens, so the two halves of the app tell one consistent story.
///
/// Appointments are generated RELATIVE to the injected clock, so the Today
/// screen always has something on it — screenshots taken in week 4 or week 14
/// both look real, and no seed date ever goes stale.
class CareSeed {
  const CareSeed({this.clock = const SystemClock(), this.patientName = 'Margaret'});

  final Clock clock;
  final String patientName;

  static const String caregiverName = 'Joyce';

  List<Medication> medications() => [
    Medication(
      id: 'med-donepezil',
      name: 'Donepezil',
      dosage: '10 mg',
      form: MedicationForm.tablet,
      purpose: 'Helps your memory and thinking stay steady.',
      appearance: 'Small white oval tablet',
      instructions: 'Take at bedtime with a glass of water.',
      prescriber: 'Dr. Alan Reyes',
      schedule: const [DoseTime(21, 0)],
    ),
    Medication(
      id: 'med-memantine',
      name: 'Memantine',
      dosage: '10 mg',
      form: MedicationForm.tablet,
      purpose: 'Works with Donepezil to protect your memory.',
      appearance: 'Oval pale-yellow tablet',
      instructions: 'Take with breakfast and with dinner.',
      prescriber: 'Dr. Alan Reyes',
      schedule: const [DoseTime(8, 0), DoseTime(20, 0)],
    ),
    Medication(
      id: 'med-lisinopril',
      name: 'Lisinopril',
      dosage: '10 mg',
      form: MedicationForm.tablet,
      purpose: 'Keeps your blood pressure in a safe range.',
      appearance: 'Round pink tablet',
      instructions: 'Take in the morning, with or without food.',
      prescriber: 'Dr. Priya Raman',
      schedule: const [DoseTime(8, 0)],
    ),
    Medication(
      id: 'med-atorvastatin',
      name: 'Atorvastatin',
      dosage: '20 mg',
      form: MedicationForm.tablet,
      purpose: 'Lowers your cholesterol.',
      appearance: 'Small white round tablet',
      instructions: 'Take in the evening.',
      prescriber: 'Dr. Priya Raman',
      schedule: const [DoseTime(20, 0)],
    ),
    Medication(
      id: 'med-vitamin-d',
      name: 'Vitamin D3',
      dosage: '1000 IU',
      form: MedicationForm.capsule,
      purpose: 'Keeps your bones strong.',
      appearance: 'Clear golden softgel capsule',
      instructions: 'Take with breakfast.',
      schedule: const [DoseTime(8, 0)],
    ),
    Medication(
      id: 'med-paracetamol',
      name: 'Paracetamol',
      dosage: '500 mg',
      form: MedicationForm.tablet,
      purpose: 'For aches and pains, only if you need it.',
      appearance: 'White capsule-shaped tablet',
      instructions: 'No more than 2 tablets, 4 times in one day.',
      isAsNeeded: true,
      schedule: const [],
    ),
  ];

  List<Appointment> appointments() {
    final today = DateOnly.today(clock);
    return [
      Appointment(
        id: 'apt-memory-clinic',
        title: 'Memory Clinic follow-up',
        clinician: 'Dr. Alan Reyes',
        clinicianRole: 'Neurologist',
        location: 'Riverside Memory Clinic, Suite 204',
        dateTime: today.at(10, 30),
        duration: const Duration(minutes: 45),
        notes: 'Six-month review of your memory medicines.',
        transport: const TransportPlan(
          mode: TransportMode.drivenByCompanion,
          companionName: '$caregiverName, your daughter,',
          pickupTime: DoseTime(9, 45),
          notes: 'She will wait with you and drive you home afterwards.',
        ),
        preparation: const [
          'Bring your medication list',
          'Bring your reading glasses',
          'Write down any questions before you go',
        ],
      ),
      Appointment(
        id: 'apt-blood-pressure',
        title: 'Blood pressure check',
        clinician: 'Nurse Beatrice Olu',
        clinicianRole: 'Practice nurse',
        location: 'Elmwood Family Practice',
        dateTime: today.addDays(2).at(14, 15),
        duration: const Duration(minutes: 20),
        notes: 'Quick check after the change to your Lisinopril.',
        transport: const TransportPlan(
          mode: TransportMode.taxi,
          companionName: 'A taxi',
          pickupTime: DoseTime(13, 40),
          notes: 'Joyce has already booked and paid for it.',
        ),
        preparation: const [
          'Wear a short-sleeved top',
          'Take your morning tablets as normal',
        ],
      ),
      Appointment(
        id: 'apt-hearing',
        title: 'Hearing aid fitting',
        clinician: 'Sam Whitcombe',
        clinicianRole: 'Audiologist',
        location: 'Northgate Hearing Centre',
        dateTime: today.addDays(6).at(11, 0),
        duration: const Duration(minutes: 60),
        transport: const TransportPlan(
          mode: TransportMode.drivenByCompanion,
          companionName: 'Your son David',
          pickupTime: DoseTime(10, 15),
        ),
        preparation: const ['Bring your old hearing aid'],
      ),
      Appointment(
        id: 'apt-telehealth-pharmacy',
        title: 'Pharmacy medicine review',
        clinician: 'Ravi Kapoor',
        clinicianRole: 'Pharmacist',
        location: 'Video call',
        dateTime: today.addDays(9).at(9, 30),
        duration: const Duration(minutes: 25),
        transport: const TransportPlan(mode: TransportMode.telehealth),
        preparation: const ['Have all your medicine boxes on the table'],
      ),
      // One past appointment so the History tab is not empty.
      Appointment(
        id: 'apt-podiatry-past',
        title: 'Foot care appointment',
        clinician: 'Nina Alvarez',
        clinicianRole: 'Podiatrist',
        location: 'Elmwood Family Practice',
        dateTime: today.addDays(-6).at(15, 0),
        duration: const Duration(minutes: 30),
        notes: 'Toenails trimmed. Come back in three months.',
        transport: const TransportPlan(
          mode: TransportMode.drivenByCompanion,
          companionName: '$caregiverName, your daughter,',
        ),
      ),
    ];
  }
}
