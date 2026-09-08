import 'package:flutter/foundation.dart';

import '../core/clock.dart';
import '../core/load_state.dart';
import '../models/appointment.dart';
import '../services/care_repository.dart';

/// Shared state for the Patient Appointments screen and the appointment card
/// on Patient Today.
///
/// Same rules as [MedicationProvider]: one injected clock, one cached instant,
/// zero date logic in widgets.
class AppointmentProvider extends ChangeNotifier {
  AppointmentProvider({
    required AppointmentRepository repository,
    Clock clock = const SystemClock(),
  }) : _repository = repository,
       _clock = clock,
       _now = clock.now();

  final AppointmentRepository _repository;
  final Clock _clock;

  List<Appointment> _appointments = const [];
  DateTime _now;
  LoadState _state = LoadState.idle;
  String? _errorMessage;
  String? _saveErrorMessage;
  bool _disposed = false;

  // ---------------------------------------------------------------- state

  LoadState get state => _state;
  bool get isLoading => _state.isLoading;
  bool get isReady => _state.isReady;
  String? get errorMessage => _errorMessage;
  String? get saveErrorMessage => _saveErrorMessage;

  DateTime get now => _now;
  DateOnly get today => DateOnly.from(_now);

  /// All appointments, soonest first.
  List<Appointment> get appointments {
    final sorted = [..._appointments]
      ..sort((a, b) => a.dateTime.compareTo(b.dateTime));
    return List.unmodifiable(sorted);
  }

  Appointment? appointmentById(String id) {
    for (final a in _appointments) {
      if (a.id == id) return a;
    }
    return null;
  }

  // ------------------------------------------------------------- lifecycle

  Future<void> load() async {
    _state = LoadState.loading;
    _errorMessage = null;
    _safeNotify();
    try {
      _appointments = await _repository.loadAppointments();
      _state = LoadState.ready;
    } catch (error) {
      _errorMessage = 'We could not open your appointments. $error';
      _state = LoadState.error;
    }
    _safeNotify();
  }

  /// Re-reads the clock. See [MedicationProvider.syncNow] for why this is
  /// pull-based rather than a timer.
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

  List<Appointment> get todaysAppointments =>
      appointments.where((a) => a.isToday(_now) && !a.isCancelled).toList();

  /// Not finished yet, soonest first. Includes one in progress.
  List<Appointment> get upcoming =>
      appointments.where((a) => a.isUpcoming(_now)).toList();

  /// Finished, most recent first.
  List<Appointment> get past {
    final list = appointments.where((a) => a.isPast(_now)).toList()
      ..sort((a, b) => b.dateTime.compareTo(a.dateTime));
    return List.unmodifiable(list);
  }

  List<Appointment> get cancelled =>
      appointments.where((a) => a.isCancelled).toList();

  Appointment? get nextAppointment =>
      upcoming.isEmpty ? null : upcoming.first;

  Appointment? get inProgress {
    for (final a in appointments) {
      if (a.isInProgress(_now)) return a;
    }
    return null;
  }

  List<Appointment> appointmentsOn(DateOnly date) =>
      appointments.where((a) => a.date == date && !a.isCancelled).toList();

  List<Appointment> withinNextDays(int days) =>
      upcoming.where((a) => a.isWithinNextDays(days, _now)).toList();

  /// Upcoming appointments grouped by day, in day order, for section headers.
  /// `LinkedHashMap` preserves insertion order, so the screen just iterates.
  Map<DateOnly, List<Appointment>> get upcomingByDay {
    final grouped = <DateOnly, List<Appointment>>{};
    for (final appointment in upcoming) {
      grouped.putIfAbsent(appointment.date, () => <Appointment>[]).add(appointment);
    }
    return Map.unmodifiable(grouped);
  }

  bool get hasAppointmentToday => todaysAppointments.isNotEmpty;

  /// Headline sentence for the Today screen. STML driver: it answers "am I
  /// going anywhere today, and who is taking me?" in one read, with no dates
  /// to decode.
  String get nextAppointmentSentence {
    final next = nextAppointment;
    if (next == null) return 'You have no appointments coming up.';
    // Not lower-cased: relativeDayLabel can return "In 3 days (Thursday)",
    // and a lower-cased proper noun is the sort of thing that gets read out
    // loud by a screen reader.
    final transport = next.transport.isArranged
        ? ' ${next.transport.summary}'
        : ' Transport is not arranged yet.';
    return '${next.title} with ${next.clinician}: '
        '${next.relativeDayLabel(_now)} at ${next.timeLabel}.$transport';
  }

  /// A short "leave by" hint. Null when there is nothing to leave for today.
  Duration? get timeUntilNextAppointment {
    final next = nextAppointment;
    if (next == null || !next.isToday(_now)) return null;
    final delta = next.timeUntil(_now);
    return delta.isNegative ? Duration.zero : delta;
  }

  // ------------------------------------------------------------- mutations

  Future<void> addAppointment(Appointment appointment) async {
    _appointments = [..._appointments, appointment];
    _safeNotify();
    await _persist();
  }

  Future<void> updateAppointment(Appointment updated) async {
    final index = _appointments.indexWhere((a) => a.id == updated.id);
    if (index == -1) return;
    final next = [..._appointments];
    next[index] = updated;
    _appointments = next;
    _safeNotify();
    await _persist();
  }

  /// Soft cancel: the row stays visible and struck through, because silently
  /// vanishing a remembered appointment is exactly the wrong behaviour for an
  /// STML user.
  Future<void> cancelAppointment(String id) async {
    final appointment = appointmentById(id);
    if (appointment == null || appointment.isCancelled) return;
    await updateAppointment(appointment.copyWith(isCancelled: true));
  }

  Future<void> removeAppointment(String id) async {
    final before = _appointments.length;
    _appointments = _appointments.where((a) => a.id != id).toList();
    if (_appointments.length == before) return;
    _safeNotify();
    await _persist();
  }

  // --------------------------------------------------------------- private

  void _safeNotify() {
    if (_disposed) return;
    notifyListeners();
  }

  Future<void> _persist() async {
    try {
      await _repository.saveAppointments(_appointments);
      if (_saveErrorMessage != null) {
        _saveErrorMessage = null;
        _safeNotify();
      }
    } catch (error) {
      _saveErrorMessage = 'We could not save that change just now.';
      _safeNotify();
    }
  }
}
