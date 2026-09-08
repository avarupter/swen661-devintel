import 'package:careconnect_mobile/core/clock.dart';
import 'package:careconnect_mobile/models/dose.dart';
import 'package:careconnect_mobile/models/dose_time.dart';
import 'package:careconnect_mobile/models/medication.dart';
import 'package:flutter_test/flutter_test.dart';

Medication _memantine() => Medication(
  id: 'med-memantine',
  name: 'Memantine',
  dosage: '10 mg',
  form: MedicationForm.tablet,
  instructions: 'Take with food.',
  schedule: const [DoseTime(20, 0), DoseTime(8, 0)],
);

void main() {
  group('DateOnly', () {
    test('is usable as a map key, unlike DateTime', () {
      final a = DateOnly.from(DateTime(2026, 9, 8, 7, 15));
      final b = DateOnly.from(DateTime(2026, 9, 8, 22, 45));
      expect(a, b);
      expect({a: 1}[b], 1);
      expect(DateTime(2026, 9, 8, 7, 15) == DateTime(2026, 9, 8, 22, 45), isFalse);
    });

    test('daysFrom is DST safe and addDays normalises month overflow', () {
      expect(DateOnly(2026, 9, 30).addDays(1), DateOnly(2026, 10, 1));
      expect(DateOnly(2026, 3, 10).daysFrom(DateOnly(2026, 3, 7)), 3);
      expect(DateOnly(2026, 1, 1).daysFrom(DateOnly(2025, 12, 31)), 1);
    });
  });

  group('Medication', () {
    test('sorts its schedule and round-trips through JSON', () {
      final med = _memantine();
      expect(med.schedule.map((t) => t.key), ['08:00', '20:00']);
      expect(Medication.fromJson(med.toJson()), med);
      expect(med.dosesPerDay, 2);
    });
  });

  group('DoseId', () {
    test('distinguishes the same medicine at two times on the same day', () {
      final morning = DoseId(
        medicationId: 'med-memantine',
        date: const DateOnly(2026, 9, 8),
        scheduledTime: const DoseTime(8, 0),
      );
      final evening = DoseId(
        medicationId: 'med-memantine',
        date: const DateOnly(2026, 9, 8),
        scheduledTime: const DoseTime(20, 0),
      );
      expect(morning, isNot(evening));
      expect(morning.value, 'med-memantine|2026-09-08|08:00');
      expect(DoseId.parse(morning.value), morning);
    });

    test('yesterday and today are different doses', () {
      final today = DoseId(
        medicationId: 'med-memantine',
        date: const DateOnly(2026, 9, 8),
        scheduledTime: const DoseTime(8, 0),
      );
      final yesterday = DoseId(
        medicationId: 'med-memantine',
        date: const DateOnly(2026, 9, 7),
        scheduledTime: const DoseTime(8, 0),
      );
      expect(today, isNot(yesterday));
    });
  });

  group('ScheduledDose status', () {
    final med = _memantine();
    final id = DoseId(
      medicationId: med.id,
      date: const DateOnly(2026, 9, 8),
      scheduledTime: const DoseTime(8, 0),
    );

    ScheduledDose at(DateTime now, {DoseRecord? record}) => ScheduledDose(
      medication: med,
      id: id,
      now: now,
      record: record,
    );

    test('upcoming outside the early window', () {
      expect(at(DateTime(2026, 9, 8, 6, 30)).status, DoseStatus.upcoming);
    });

    test('due now inside the window', () {
      expect(at(DateTime(2026, 9, 8, 7, 30)).status, DoseStatus.dueNow);
      expect(at(DateTime(2026, 9, 8, 9, 59)).status, DoseStatus.dueNow);
    });

    test('overdue after the late window', () {
      expect(at(DateTime(2026, 9, 8, 10, 30)).status, DoseStatus.overdue);
    });

    test('missed once the calendar day has passed', () {
      expect(at(DateTime(2026, 9, 9, 8, 0)).status, DoseStatus.missed);
    });

    test('taken beats every time-based status and names who logged it', () {
      final dose = at(
        DateTime(2026, 9, 8, 23, 0),
        record: DoseRecord(
          doseId: id,
          outcome: DoseOutcome.taken,
          recordedAt: DateTime(2026, 9, 8, 8, 12),
          actor: DoseActor.caregiver,
        ),
      );
      expect(dose.status, DoseStatus.taken);
      expect(dose.statusLabel, 'Taken 8:12 AM');
      expect(dose.reassuranceLine, 'Your caregiver marked this taken at 8:12 AM today.');
      expect(dose.semanticLabel, contains('Memantine'));
      expect(dose.canMarkTaken, isFalse);
    });
  });

  group('DoseRecord', () {
    test('round-trips through JSON', () {
      final record = DoseRecord(
        doseId: DoseId(
          medicationId: 'med-donepezil',
          date: const DateOnly(2026, 9, 8),
          scheduledTime: const DoseTime(21, 0),
        ),
        outcome: DoseOutcome.skipped,
        recordedAt: DateTime(2026, 9, 8, 21, 40),
        actor: DoseActor.caregiver,
        note: 'Felt sick',
      );
      expect(DoseRecord.fromJson(record.toJson()), record);
    });
  });
}
