import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../data/seed_data.dart';
import '../models/appointment.dart';
import '../models/dose.dart';
import '../models/medication.dart';
import 'json_store.dart';

/// Persistence contract for the medication feature.
///
/// The providers depend on this, not on files, not on path_provider and not on
/// `dart:io`. Swapping in a REST or SQLite implementation later touches
/// nothing above this line.
abstract interface class MedicationRepository {
  Future<List<Medication>> loadMedications();
  Future<void> saveMedications(List<Medication> medications);

  /// The dose log: only doses that have actually been acted on.
  Future<List<DoseRecord>> loadDoseLog();
  Future<void> saveDoseLog(Iterable<DoseRecord> records);
}

abstract interface class AppointmentRepository {
  Future<List<Appointment>> loadAppointments();
  Future<void> saveAppointments(List<Appointment> appointments);
}

/// JSON-file implementation of both contracts.
///
/// Design rules that fix the bugs in the existing `PatientProvider`:
///  1. No I/O in a constructor — loading is an explicit awaited method.
///  2. A failed load falls back to seed data and NEVER re-throws; in
///     particular the fallback path does not perform another I/O call that
///     can throw a second time out of a catch block.
///  3. Corrupt JSON is treated exactly like a missing file.
class JsonCareRepository implements MedicationRepository, AppointmentRepository {
  JsonCareRepository({required JsonStore store, CareSeed seed = const CareSeed()})
    : _store = store,
      _seed = seed;

  static const String medicationsFile = 'medications.json';
  static const String doseLogFile = 'dose_log.json';
  static const String appointmentsFile = 'appointments.json';

  final JsonStore _store;
  final CareSeed _seed;

  @override
  Future<List<Medication>> loadMedications() async {
    final decoded = await _readList(medicationsFile);
    if (decoded == null) {
      // First run (or unreadable file): seed, then try to persist the seed.
      // The persist is best-effort — a failure here must not blank the UI.
      final seeded = _seed.medications();
      await _trySave(medicationsFile, seeded.map((m) => m.toJson()).toList());
      return seeded;
    }
    return _mapOrSeed(
      decoded,
      Medication.fromJson,
      () => _seed.medications(),
      medicationsFile,
    );
  }

  @override
  Future<void> saveMedications(List<Medication> medications) =>
      _store.writeString(
        medicationsFile,
        jsonEncode(medications.map((m) => m.toJson()).toList()),
      );

  @override
  Future<List<DoseRecord>> loadDoseLog() async {
    final decoded = await _readList(doseLogFile);
    // A missing dose log is not an error: it means nothing has been taken yet.
    if (decoded == null) return <DoseRecord>[];
    return _mapOrSeed(
      decoded,
      DoseRecord.fromJson,
      () => <DoseRecord>[],
      doseLogFile,
    );
  }

  @override
  Future<void> saveDoseLog(Iterable<DoseRecord> records) => _store.writeString(
    doseLogFile,
    jsonEncode(records.map((r) => r.toJson()).toList()),
  );

  @override
  Future<List<Appointment>> loadAppointments() async {
    final decoded = await _readList(appointmentsFile);
    if (decoded == null) {
      final seeded = _seed.appointments();
      await _trySave(appointmentsFile, seeded.map((a) => a.toJson()).toList());
      return seeded;
    }
    return _mapOrSeed(
      decoded,
      Appointment.fromJson,
      () => _seed.appointments(),
      appointmentsFile,
    );
  }

  @override
  Future<void> saveAppointments(List<Appointment> appointments) =>
      _store.writeString(
        appointmentsFile,
        jsonEncode(appointments.map((a) => a.toJson()).toList()),
      );

  /// Reads and decodes; returns null for "absent, unreadable or not a list".
  Future<List<dynamic>?> _readList(String fileName) async {
    try {
      final raw = await _store.readString(fileName);
      if (raw == null || raw.trim().isEmpty) return null;
      final decoded = jsonDecode(raw);
      return decoded is List ? decoded : null;
    } catch (error, stack) {
      _report('read $fileName', error, stack);
      return null;
    }
  }

  List<T> _mapOrSeed<T>(
    List<dynamic> raw,
    T Function(Map<String, dynamic>) fromJson,
    List<T> Function() fallback,
    String fileName,
  ) {
    try {
      return raw
          .map((e) => fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (error, stack) {
      _report('decode $fileName', error, stack);
      return fallback();
    }
  }

  Future<void> _trySave(String fileName, Object payload) async {
    try {
      await _store.writeString(fileName, jsonEncode(payload));
    } catch (error, stack) {
      // Deliberately swallowed. Seeding the UI succeeded; not being able to
      // persist the seed is a degraded-but-usable state, not a crash.
      _report('save $fileName', error, stack);
    }
  }

  void _report(String operation, Object error, StackTrace stack) {
    assert(() {
      debugPrint('JsonCareRepository failed to $operation: $error');
      return true;
    }());
  }
}
