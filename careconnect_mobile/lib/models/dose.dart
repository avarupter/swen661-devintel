import 'package:flutter/foundation.dart';

import '../core/clock.dart';
import 'dose_time.dart';
import 'medication.dart';

/// Identity of ONE dose: medication + calendar day + scheduled time.
///
/// This is the heart of the STML feature. "Has this dose been taken today?"
/// is only answerable if state is stored per dose, not per medication —
/// Memantine at 08:00 and Memantine at 20:00 on the same day are different
/// facts, and yesterday's 08:00 must not make today's 08:00 look done.
///
/// The day component is a [DateOnly], i.e. a LOCAL calendar day. Keying on a
/// UTC instant would file a 9pm dose in a UTC-5 timezone under tomorrow.
@immutable
class DoseId {
  const DoseId({
    required this.medicationId,
    required this.date,
    required this.scheduledTime,
  });

  /// Round-trips [value]. Throws [FormatException] on malformed input.
  factory DoseId.parse(String value) {
    final parts = value.split(DoseIdSeparator.value);
    if (parts.length != 3) {
      throw FormatException('Expected medicationId|yyyy-MM-dd|HH:mm', value);
    }
    return DoseId(
      medicationId: parts[0],
      date: DateOnly.parse(parts[1]),
      scheduledTime: DoseTime.parse(parts[2]),
    );
  }

  final String medicationId;
  final DateOnly date;
  final DoseTime scheduledTime;

  /// Stable, sortable, JSON-safe key: `med-donepezil|2026-09-08|21:00`.
  /// Used as the Map key in the dose log and as the JSON object key on disk.
  String get value => [
    medicationId,
    date.iso,
    scheduledTime.key,
  ].join(DoseIdSeparator.value);

  /// The concrete local instant this dose is due.
  DateTime get scheduledAt => date.at(scheduledTime.hour, scheduledTime.minute);

  @override
  bool operator ==(Object other) =>
      other is DoseId &&
      other.medicationId == medicationId &&
      other.date == date &&
      other.scheduledTime == scheduledTime;

  @override
  int get hashCode => Object.hash(medicationId, date, scheduledTime);

  @override
  String toString() => value;
}

/// What actually happened to a dose. Absence of a record means "nothing logged
/// yet" — we never write a row for a dose that has not been acted on, which
/// keeps the log small and makes "not taken" the safe default.
enum DoseOutcome {
  taken('taken'),
  skipped('skipped');

  const DoseOutcome(this.storageKey);
  final String storageKey;

  static DoseOutcome fromKey(String? key) => DoseOutcome.values.firstWhere(
    (o) => o.storageKey == key,
    orElse: () => DoseOutcome.taken,
  );
}

/// Who logged it. STML driver: "Joyce marked this taken at 8:12 AM" is far
/// more reassuring than an unattributed tick.
enum DoseActor {
  patient('patient', 'You'),
  caregiver('caregiver', 'Your caregiver');

  const DoseActor(this.storageKey, this.label);
  final String storageKey;
  final String label;

  static DoseActor fromKey(String? key) => DoseActor.values.firstWhere(
    (a) => a.storageKey == key,
    orElse: () => DoseActor.patient,
  );
}

/// A logged fact about one dose. Immutable and JSON round-trippable.
@immutable
class DoseRecord {
  const DoseRecord({
    required this.doseId,
    required this.outcome,
    required this.recordedAt,
    this.actor = DoseActor.patient,
    this.note,
  });

  factory DoseRecord.fromJson(Map<String, dynamic> json) => DoseRecord(
    doseId: DoseId.parse(json['doseId'] as String),
    outcome: DoseOutcome.fromKey(json['outcome'] as String?),
    // Stored as a local ISO-8601 string with no offset, so it re-reads as a
    // local DateTime on the same device. Documented tradeoff: moving the
    // device across timezones shifts historical "taken at" labels.
    recordedAt: DateTime.parse(json['recordedAt'] as String),
    actor: DoseActor.fromKey(json['actor'] as String?),
    note: json['note'] as String?,
  );

  final DoseId doseId;
  final DoseOutcome outcome;
  final DateTime recordedAt;
  final DoseActor actor;
  final String? note;

  bool get isTaken => outcome == DoseOutcome.taken;
  bool get isSkipped => outcome == DoseOutcome.skipped;

  /// `8:12 AM`.
  String get recordedAtLabel =>
      DoseTime(recordedAt.hour, recordedAt.minute).label12h;

  DoseRecord copyWith({
    DoseOutcome? outcome,
    DateTime? recordedAt,
    DoseActor? actor,
    String? note,
  }) => DoseRecord(
    doseId: doseId,
    outcome: outcome ?? this.outcome,
    recordedAt: recordedAt ?? this.recordedAt,
    actor: actor ?? this.actor,
    note: note ?? this.note,
  );

  Map<String, dynamic> toJson() => {
    'doseId': doseId.value,
    'outcome': outcome.storageKey,
    'recordedAt': recordedAt.toIso8601String(),
    'actor': actor.storageKey,
    'note': note,
  };

  @override
  bool operator ==(Object other) =>
      other is DoseRecord &&
      other.doseId == doseId &&
      other.outcome == outcome &&
      other.recordedAt == recordedAt &&
      other.actor == actor &&
      other.note == note;

  @override
  int get hashCode => Object.hash(doseId, outcome, recordedAt, actor, note);

  @override
  String toString() => 'DoseRecord(${doseId.value}, ${outcome.storageKey})';
}

/// Status of a dose relative to a given instant. Ordered from "needs action"
/// to "settled" so a screen can sort on `status.index` if it wants to.
enum DoseStatus { overdue, dueNow, upcoming, taken, skipped, missed }

/// How wide the "you can take this now" window is around a scheduled time.
/// Extracted from the status logic so the numbers are named, tunable and
/// assertable in tests instead of being magic constants inside a widget.
@immutable
class DoseWindowPolicy {
  const DoseWindowPolicy({
    this.earlyWindow = const Duration(hours: 1),
    this.lateWindow = const Duration(hours: 2),
  });

  /// How long before the scheduled time the dose starts showing as "due now".
  final Duration earlyWindow;

  /// How long after the scheduled time before it flips to "overdue".
  final Duration lateWindow;

  static const DoseWindowPolicy standard = DoseWindowPolicy();
}

/// A medication + a dose slot + whatever has been logged for it, evaluated
/// against one fixed instant.
///
/// This is the object the three screens actually render. Every question a
/// widget could ask ("is it taken?", "what colour chip?", "what should
/// TalkBack say?") is answered here, so the widgets stay dumb — which is
/// exactly what the rubric grades under logic/UI separation.
@immutable
class ScheduledDose {
  const ScheduledDose({
    required this.medication,
    required this.id,
    required this.now,
    this.record,
    this.policy = DoseWindowPolicy.standard,
  });

  final Medication medication;
  final DoseId id;

  /// The instant this dose was evaluated against — injected, never
  /// `DateTime.now()`. Two doses in one frame therefore always agree on "now".
  final DateTime now;
  final DoseRecord? record;
  final DoseWindowPolicy policy;

  DateTime get scheduledAt => id.scheduledAt;
  DoseTime get scheduledTime => id.scheduledTime;
  DateOnly get date => id.date;

  bool get isTaken => record?.isTaken ?? false;
  bool get isSkipped => record?.isSkipped ?? false;
  bool get isLogged => record != null;
  DateTime? get takenAt => isTaken ? record!.recordedAt : null;

  DateTime get windowOpensAt => scheduledAt.subtract(policy.earlyWindow);
  DateTime get windowClosesAt => scheduledAt.add(policy.lateWindow);

  /// Positive while the dose is still in the future.
  Duration get untilDue => scheduledAt.difference(now);

  DoseStatus get status {
    if (isTaken) return DoseStatus.taken;
    if (isSkipped) return DoseStatus.skipped;
    if (date.isBefore(DateOnly.from(now))) return DoseStatus.missed;
    if (now.isBefore(windowOpensAt)) return DoseStatus.upcoming;
    if (now.isAfter(windowClosesAt)) return DoseStatus.overdue;
    return DoseStatus.dueNow;
  }

  bool get isDueNow => status == DoseStatus.dueNow;
  bool get isOverdue => status == DoseStatus.overdue;
  bool get isUpcoming => status == DoseStatus.upcoming;
  bool get isMissed => status == DoseStatus.missed;

  /// True while the patient is allowed to tick it off (we still allow marking
  /// an overdue or missed dose — the point is honesty, not blocking).
  bool get canMarkTaken => !isTaken;
  bool get canUndo => isLogged;

  /// Short chip text: "Taken 8:12 AM", "Due now", "In 2 hours".
  String get statusLabel {
    switch (status) {
      case DoseStatus.taken:
        return 'Taken ${record!.recordedAtLabel}';
      case DoseStatus.skipped:
        return 'Skipped';
      case DoseStatus.dueNow:
        return 'Due now';
      case DoseStatus.overdue:
        return 'Overdue';
      case DoseStatus.missed:
        return 'Not taken';
      case DoseStatus.upcoming:
        return _relativeFuture(untilDue);
    }
  }

  /// The reassurance line. This is the single most important string in the app
  /// for a Short-Term Memory Loss user: it answers "did I already take it?"
  /// with WHO logged it and WHEN, not just a checkmark.
  String get reassuranceLine {
    if (isTaken) {
      final who = record!.actor == DoseActor.patient
          ? 'You took this'
          : '${record!.actor.label} marked this taken';
      return '$who at ${record!.recordedAtLabel} today.';
    }
    if (isSkipped) {
      return 'This dose was skipped${record?.note == null ? '' : ' — ${record!.note}'}.';
    }
    return 'Not taken yet.';
  }

  /// Full sentence for TalkBack / VoiceOver on the dose card.
  String get semanticLabel =>
      '${medication.name}, ${medication.dosage}, '
      '${scheduledTime.spokenLabel}. $reassuranceLine'
      '${medication.instructions.isEmpty ? '' : ' ${medication.instructions}'}';

  /// Semantic label for the primary action button.
  String get actionSemanticLabel => isTaken
      ? 'Undo. Mark ${medication.name} at ${scheduledTime.label12h} as not taken'
      : 'Mark ${medication.name} ${medication.dosage} at '
            '${scheduledTime.label12h} as taken';

  ScheduledDose copyWith({DoseRecord? record, DateTime? now, bool clearRecord = false}) =>
      ScheduledDose(
        medication: medication,
        id: id,
        now: now ?? this.now,
        record: clearRecord ? null : (record ?? this.record),
        policy: policy,
      );

  static String _relativeFuture(Duration d) {
    if (d.inMinutes < 1) return 'Due now';
    if (d.inMinutes < 60) return 'In ${d.inMinutes} minutes';
    final hours = d.inHours;
    if (hours < 24) return 'In $hours hour${hours == 1 ? '' : 's'}';
    final days = d.inDays;
    return 'In $days day${days == 1 ? '' : 's'}';
  }

  @override
  bool operator ==(Object other) =>
      other is ScheduledDose &&
      other.id == id &&
      other.medication == medication &&
      other.record == record &&
      other.now == now;

  @override
  int get hashCode => Object.hash(id, medication, record, now);

  @override
  String toString() => 'ScheduledDose(${id.value}, ${status.name})';
}
