import 'package:flutter/foundation.dart';

import '../core/clock.dart';
import '../core/load_state.dart';
import '../models/dose.dart';
import '../models/medication.dart';
import '../services/care_repository.dart';

/// Shared state for the Patient Today and Patient Medications screens.
///
/// Contract with the UI layer:
///  * widgets NEVER call `DateTime.now()`, never compute a status, never
///    decide what "due" means and never build a semantics sentence;
///  * every derived list below is computed from one cached instant [now], so
///    a single frame is always internally consistent;
///  * that instant comes from an injected [Clock], which is what makes all of
///    this deterministically unit testable.
class MedicationProvider extends ChangeNotifier {
  MedicationProvider({
    required MedicationRepository repository,
    Clock clock = const SystemClock(),
    DoseWindowPolicy policy = DoseWindowPolicy.standard,
  }) : _repository = repository,
       _clock = clock,
       _policy = policy,
       _now = clock.now();

  final MedicationRepository _repository;
  final Clock _clock;
  final DoseWindowPolicy _policy;

  List<Medication> _medications = const [];

  /// Dose log keyed by [DoseId.value]. A missing key means "nothing logged".
  final Map<String, DoseRecord> _log = {};

  DateTime _now;
  LoadState _state = LoadState.idle;
  String? _errorMessage;
  String? _saveErrorMessage;
  bool _disposed = false;

  // Cache invalidation: bumped by every mutation.
  int _revision = 0;
  int _cachedRevision = -1;
  DateTime? _cachedNow;
  List<ScheduledDose>? _cachedToday;

  // ---------------------------------------------------------------- state

  LoadState get state => _state;
  bool get isLoading => _state.isLoading;
  bool get isReady => _state.isReady;
  String? get errorMessage => _errorMessage;

  /// Non-null when the last write failed. The screens surface this as a
  /// non-blocking banner: the in-memory tick still stands.
  String? get saveErrorMessage => _saveErrorMessage;

  DoseWindowPolicy get policy => _policy;

  /// The instant every derived getter is evaluated against.
  DateTime get now => _now;
  DateOnly get today => DateOnly.from(_now);

  List<Medication> get medications => List.unmodifiable(_medications);

  /// Medications that generate scheduled doses.
  List<Medication> get scheduledMedications =>
      _medications.where((m) => m.isActive && !m.isAsNeeded).toList();

  /// "Take only if you need it" medicines, listed separately on the
  /// Medications screen so they can never be mistaken for a missed dose.
  List<Medication> get asNeededMedications =>
      _medications.where((m) => m.isActive && m.isAsNeeded).toList();

  Medication? medicationById(String id) {
    for (final m in _medications) {
      if (m.id == id) return m;
    }
    return null;
  }

  // ------------------------------------------------------------- lifecycle

  /// Explicit, awaitable load. Deliberately NOT called from the constructor:
  /// constructor I/O cannot be awaited, cannot be error-handled by the caller
  /// and turns any test that merely builds the provider into a plugin test.
  Future<void> load() async {
    _state = LoadState.loading;
    _errorMessage = null;
    _safeNotify();
    try {
      final results = await Future.wait([
        _repository.loadMedications(),
        _repository.loadDoseLog(),
      ]);
      _medications = results[0] as List<Medication>;
      _log
        ..clear()
        ..addEntries(
          (results[1] as List<DoseRecord>).map((r) => MapEntry(r.doseId.value, r)),
        );
      _state = LoadState.ready;
    } catch (error) {
      // The repository already falls back to seed data, so reaching here means
      // something genuinely unexpected. We record it instead of re-throwing:
      // an un-awaited throw from here would become an unhandled async error.
      _errorMessage = 'We could not open your medicine list. $error';
      _state = LoadState.error;
    }
    _touch();
  }

  /// Re-reads the clock so "Due now" turns over.
  ///
  /// Deliberately pull-based rather than a `Timer.periodic` inside the
  /// provider. A live timer makes every widget test that merely builds this
  /// provider fail with "A Timer is still pending", and it is untestable
  /// besides. Patient Today calls this from `didChangeAppDependencies` /
  /// `AppLifecycleState.resumed` and from its visible Refresh button, which
  /// covers every case a 30-second poll would have.
  void syncNow() {
    _now = _clock.now();
    _safeNotify();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  // ---------------------------------------------------------- derived data

  /// Every scheduled dose for [date], sorted by time then medication name.
  List<ScheduledDose> dosesOn(DateOnly date) {
    final doses = <ScheduledDose>[];
    for (final medication in scheduledMedications) {
      for (final time in medication.schedule) {
        final id = DoseId(
          medicationId: medication.id,
          date: date,
          scheduledTime: time,
        );
        doses.add(
          ScheduledDose(
            medication: medication,
            id: id,
            now: _now,
            record: _log[id.value],
            policy: _policy,
          ),
        );
      }
    }
    doses.sort((a, b) {
      final byTime = a.scheduledTime.compareTo(b.scheduledTime);
      return byTime != 0 ? byTime : a.medication.name.compareTo(b.medication.name);
    });
    return List.unmodifiable(doses);
  }

  /// Today's full schedule. Memoised per (revision, now).
  List<ScheduledDose> get todaysDoses {
    if (_cachedToday != null &&
        _cachedRevision == _revision &&
        _cachedNow == _now) {
      return _cachedToday!;
    }
    final computed = dosesOn(today);
    _cachedToday = computed;
    _cachedRevision = _revision;
    _cachedNow = _now;
    return computed;
  }

  /// Inside the take-it-now window and not yet logged. The Today screen's
  /// primary card list.
  List<ScheduledDose> get dueNow =>
      todaysDoses.where((d) => d.isDueNow).toList();

  /// Past the window and still not logged.
  List<ScheduledDose> get overdue =>
      todaysDoses.where((d) => d.isOverdue).toList();

  /// Needs action right now: overdue first, then due.
  List<ScheduledDose> get needsAction =>
      todaysDoses.where((d) => d.isOverdue || d.isDueNow).toList()
        ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));

  List<ScheduledDose> get upcomingToday =>
      todaysDoses.where((d) => d.isUpcoming).toList();

  List<ScheduledDose> get takenToday =>
      todaysDoses.where((d) => d.isTaken).toList();

  List<ScheduledDose> get skippedToday =>
      todaysDoses.where((d) => d.isSkipped).toList();

  /// Everything still un-logged today, in time order.
  List<ScheduledDose> get remainingToday =>
      todaysDoses.where((d) => !d.isLogged).toList();

  /// The next dose the patient has to think about, or null when the day is
  /// finished. Overdue beats upcoming.
  ScheduledDose? get nextDose {
    final actionable = needsAction;
    if (actionable.isNotEmpty) return actionable.first;
    final upcoming = upcomingToday;
    return upcoming.isEmpty ? null : upcoming.first;
  }

  int get totalDosesToday => todaysDoses.length;
  int get takenCountToday => takenToday.length;

  /// 0.0 .. 1.0 for a progress indicator. 1.0 on a day with no doses so the
  /// UI reads "all done" rather than "0%".
  double get todayProgress =>
      totalDosesToday == 0 ? 1 : takenCountToday / totalDosesToday;

  bool get isDayComplete => remainingToday.isEmpty;

  /// The headline sentence on Patient Today. Built here, not in the widget,
  /// because it is logic — and because one sentence keeps an STML user
  /// oriented better than four separate numbers.
  String get todaySummarySentence {
    if (totalDosesToday == 0) {
      return 'You have no scheduled medicines today.';
    }
    if (isDayComplete) {
      return 'All done. You have taken all $totalDosesToday of '
          'today’s doses.';
    }
    final actionable = needsAction.length;
    if (actionable > 0) {
      return 'You have taken $takenCountToday of $totalDosesToday doses today. '
          '$actionable ${actionable == 1 ? 'dose is' : 'doses are'} ready to take now.';
    }
    return 'You have taken $takenCountToday of $totalDosesToday doses today. '
        'Nothing to take right now.';
  }

  bool isDoseTaken(DoseId id) => _log[id.value]?.isTaken ?? false;
  DoseRecord? recordFor(DoseId id) => _log[id.value];

  /// Today's doses for one medication — the Medication Detail screen.
  List<ScheduledDose> dosesForMedication(String medicationId, {DateOnly? date}) =>
      dosesOn(date ?? today)
          .where((d) => d.medication.id == medicationId)
          .toList();

  /// Fraction of expected doses actually taken over the last [days] days,
  /// counting only doses whose time has already passed. Null when nothing was
  /// expected. Pure arithmetic, fully unit testable with a [FixedClock].
  double? adherenceOverLastDays(int days) {
    assert(days > 0);
    var expected = 0;
    var taken = 0;
    for (var offset = 0; offset < days; offset++) {
      for (final dose in dosesOn(today.addDays(-offset))) {
        if (dose.scheduledAt.isAfter(_now)) continue;
        expected++;
        if (dose.isTaken) taken++;
      }
    }
    return expected == 0 ? null : taken / expected;
  }

  // ------------------------------------------------------------- mutations

  /// Marks a dose taken. Idempotent: marking an already-taken dose is a no-op,
  /// so a double tap (very likely with STML) cannot create a duplicate row or
  /// move the recorded time.
  Future<void> markTaken(
    DoseId id, {
    DoseActor actor = DoseActor.patient,
    String? note,
  }) async {
    // Re-read the clock before writing. Every derived getter uses the cached
    // `_now`, but `recordedAt` uses the live clock. If the app has sat open
    // across midnight those two disagree, and the tick lands on yesterday's
    // DoseId — a card the patient can no longer see.
    _now = _clock.now();
    if (medicationById(id.medicationId) == null) return;
    final existing = _log[id.value];
    if (existing != null && existing.isTaken) return;
    _log[id.value] = DoseRecord(
      doseId: id,
      outcome: DoseOutcome.taken,
      recordedAt: _clock.now(),
      actor: actor,
      note: note,
    );
    _touch();
    await _persistLog();
  }

  /// Removes the log entry entirely, returning the dose to "not taken yet".
  /// Backs the undo affordance that stops a mis-tap becoming a wrong belief.
  Future<void> undoTaken(DoseId id) async {
    // Re-read the clock before writing. Every derived getter uses the cached
    // `_now`, but `recordedAt` uses the live clock. If the app has sat open
    // across midnight those two disagree, and the tick lands on yesterday's
    // DoseId — a card the patient can no longer see.
    _now = _clock.now();
    if (_log.remove(id.value) == null) return;
    _touch();
    await _persistLog();
  }

  Future<void> markSkipped(
    DoseId id, {
    DoseActor actor = DoseActor.patient,
    String? reason,
  }) async {
    // Re-read the clock before writing. Every derived getter uses the cached
    // `_now`, but `recordedAt` uses the live clock. If the app has sat open
    // across midnight those two disagree, and the tick lands on yesterday's
    // DoseId — a card the patient can no longer see.
    _now = _clock.now();
    if (medicationById(id.medicationId) == null) return;
    _log[id.value] = DoseRecord(
      doseId: id,
      outcome: DoseOutcome.skipped,
      recordedAt: _clock.now(),
      actor: actor,
      note: reason,
    );
    _touch();
    await _persistLog();
  }

  /// Convenience for a toggle control.
  Future<void> toggleTaken(DoseId id, {DoseActor actor = DoseActor.patient}) =>
      isDoseTaken(id) ? undoTaken(id) : markTaken(id, actor: actor);

  Future<void> addMedication(Medication medication) async {
    _medications = [..._medications, medication];
    _touch();
    await _persistMedications();
  }

  Future<void> updateMedication(Medication updated) async {
    final index = _medications.indexWhere((m) => m.id == updated.id);
    if (index == -1) return;
    final next = [..._medications];
    next[index] = updated;
    _medications = next;
    _touch();
    await _persistMedications();
  }

  Future<void> removeMedication(String id) async {
    final before = _medications.length;
    _medications = _medications.where((m) => m.id != id).toList();
    if (_medications.length == before) return;
    _log.removeWhere((key, record) => record.doseId.medicationId == id);
    _touch();
    await Future.wait([_persistMedications(), _persistLog()]);
  }

  /// Keeps the log from growing forever. Safe to call on every load.
  Future<void> pruneLog({int keepDays = 90}) async {
    final cutoff = today.addDays(-keepDays);
    final removed = _log.length;
    _log.removeWhere((key, record) => record.doseId.date.isBefore(cutoff));
    if (_log.length == removed) return;
    _touch();
    await _persistLog();
  }

  // --------------------------------------------------------------- private

  /// Bumps the cache revision and notifies. Every mutation ends here.
  void _touch() {
    _revision++;
    _safeNotify();
  }

  void _safeNotify() {
    if (_disposed) return;
    notifyListeners();
  }

  Future<void> _persistLog() =>
      _guardSave(() => _repository.saveDoseLog(_log.values));

  Future<void> _persistMedications() =>
      _guardSave(() => _repository.saveMedications(_medications));

  /// Writes never escape as exceptions. The optimistic in-memory update has
  /// already been shown; a failed write becomes a visible, recoverable banner
  /// instead of an unhandled async error that crashes a test run.
  Future<void> _guardSave(Future<void> Function() action) async {
    try {
      await action();
      if (_saveErrorMessage != null) {
        _saveErrorMessage = null;
        _safeNotify();
      }
    } catch (error) {
      _saveErrorMessage = 'We could not save that just now. It is still shown here.';
      _safeNotify();
    }
  }
}
