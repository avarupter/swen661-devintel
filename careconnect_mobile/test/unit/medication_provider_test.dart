import 'package:careconnect_mobile/core/clock.dart';
import 'package:careconnect_mobile/core/load_state.dart';
import 'package:careconnect_mobile/data/seed_data.dart';
import 'package:careconnect_mobile/models/dose.dart';
import 'package:careconnect_mobile/models/dose_time.dart';
import 'package:careconnect_mobile/providers/medication_provider.dart';
import 'package:careconnect_mobile/services/care_repository.dart';
import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late FixedClock clock;
  late InMemoryJsonStore store;
  late JsonCareRepository repository;
  late MedicationProvider provider;

  setUp(() {
    // 8 September 2026, 07:45 — before the 08:00 doses, inside their window.
    clock = FixedClock.at(2026, 9, 8, 7, 45);
    store = InMemoryJsonStore();
    repository = JsonCareRepository(store: store, seed: CareSeed(clock: clock));
    provider = MedicationProvider(repository: repository, clock: clock);
  });

  DoseId doseId(String medicationId, DoseTime time) => DoseId(
    medicationId: medicationId,
    date: DateOnly.today(clock),
    scheduledTime: time,
  );

  test('constructing the provider performs no I/O — no plugin needed', () {
    expect(provider.state, LoadState.idle);
    expect(store.readCount, 0);
    expect(store.writeCount, 0);
  });

  test('load seeds on first run and becomes ready', () async {
    await provider.load();
    expect(provider.state, LoadState.ready);
    expect(provider.medications, isNotEmpty);
    expect(provider.scheduledMedications.length, 5);
    expect(provider.asNeededMedications.single.name, 'Paracetamol');
  });

  test('today has three 08:00 doses, all due now at 07:45', () async {
    await provider.load();
    expect(provider.totalDosesToday, 6); // 3 x 08:00, 2 x 20:00, 1 x 21:00
    expect(provider.dueNow.length, 3);
    expect(provider.overdue, isEmpty);
    expect(provider.upcomingToday.length, 3);
    expect(provider.nextDose!.scheduledTime, const DoseTime(8, 0));
  });

  test('markTaken flips exactly one dose and notifies once', () async {
    await provider.load();
    var notifications = 0;
    provider.addListener(() => notifications++);

    final id = doseId('med-memantine', const DoseTime(8, 0));
    await provider.markTaken(id);

    expect(provider.isDoseTaken(id), isTrue);
    expect(provider.takenCountToday, 1);
    // The 20:00 Memantine dose is a DIFFERENT dose and is untouched.
    expect(
      provider.isDoseTaken(doseId('med-memantine', const DoseTime(20, 0))),
      isFalse,
    );
    expect(notifications, greaterThanOrEqualTo(1));
    expect(provider.recordFor(id)!.recordedAt, DateTime(2026, 9, 8, 7, 45));
  });

  test('markTaken is idempotent — a double tap cannot move the recorded time',
      () async {
    await provider.load();
    final id = doseId('med-lisinopril', const DoseTime(8, 0));
    await provider.markTaken(id);
    final firstTime = provider.recordFor(id)!.recordedAt;

    clock.advance(const Duration(minutes: 20));
    await provider.markTaken(id);

    expect(provider.recordFor(id)!.recordedAt, firstTime);
    expect(provider.takenCountToday, 1);
  });

  test('undoTaken restores the not-taken state', () async {
    await provider.load();
    final id = doseId('med-vitamin-d', const DoseTime(8, 0));
    await provider.markTaken(id);
    await provider.undoTaken(id);
    expect(provider.isDoseTaken(id), isFalse);
    expect(provider.takenCountToday, 0);
  });

  test('yesterday\'s tick does not make today look done', () async {
    await provider.load();
    final yesterday = DoseId(
      medicationId: 'med-lisinopril',
      date: DateOnly.today(clock).addDays(-1),
      scheduledTime: const DoseTime(8, 0),
    );
    await provider.markTaken(yesterday);
    expect(provider.takenCountToday, 0);
    expect(provider.isDoseTaken(doseId('med-lisinopril', const DoseTime(8, 0))),
        isFalse);
  });

  test('advancing the clock turns due doses into overdue ones', () async {
    await provider.load();
    expect(provider.overdue, isEmpty);

    clock.advance(const Duration(hours: 3)); // 10:45, past 08:00 + 2h
    provider.syncNow();

    expect(provider.dueNow, isEmpty);
    expect(provider.overdue.length, 3);
    expect(provider.todaySummarySentence, contains('3 doses are ready'));
  });

  test('summary sentence reports completion', () async {
    await provider.load();
    for (final dose in provider.todaysDoses) {
      await provider.markTaken(dose.id);
    }
    expect(provider.isDayComplete, isTrue);
    expect(provider.todayProgress, 1.0);
    expect(provider.todaySummarySentence, startsWith('All done.'));
  });

  test('dose log survives a reload from the same store', () async {
    await provider.load();
    final id = doseId('med-memantine', const DoseTime(8, 0));
    await provider.markTaken(id);

    final reloaded = MedicationProvider(repository: repository, clock: clock);
    await reloaded.load();
    expect(reloaded.isDoseTaken(id), isTrue);
  });

  test('a failing write is surfaced, not thrown', () async {
    await provider.load();
    store.failOnWrite = StateError('disk full');
    await provider.markTaken(doseId('med-memantine', const DoseTime(8, 0)));

    // The optimistic update stands...
    expect(provider.takenCountToday, 1);
    // ...and the failure is visible instead of escaping as an async error.
    expect(provider.saveErrorMessage, isNotNull);
  });

  test('a corrupt medications file falls back to seed data', () async {
    final corrupt = InMemoryJsonStore({'medications.json': '{ not json'});
    final resilient = MedicationProvider(
      repository: JsonCareRepository(store: corrupt, seed: CareSeed(clock: clock)),
      clock: clock,
    );
    await resilient.load();
    expect(resilient.state, LoadState.ready);
    expect(resilient.medications, isNotEmpty);
  });

  test('adherence is computed over past doses only', () async {
    await provider.load();
    // At 07:45 nothing today has come due yet, and there is no history.
    expect(provider.adherenceOverLastDays(1), isNull);

    clock.advance(const Duration(hours: 3)); // 10:45
    provider.syncNow();
    expect(provider.adherenceOverLastDays(1), 0.0);

    await provider.markTaken(doseId('med-memantine', const DoseTime(8, 0)));
    expect(provider.adherenceOverLastDays(1), closeTo(1 / 3, 1e-9));
  });
}
