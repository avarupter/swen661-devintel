import 'package:flutter/foundation.dart';

import '../core/clock.dart';
import '../core/day_labels.dart';
import 'dose_time.dart';

/// How the patient gets to the appointment.
enum TransportMode {
  drivenByCompanion('driven', 'Being driven'),
  taxi('taxi', 'Taxi'),
  patientTransport('patient_transport', 'Hospital transport'),
  publicTransport('public', 'Bus'),
  walking('walking', 'Walking'),
  telehealth('telehealth', 'Video call at home'),
  notArranged('not_arranged', 'Not arranged yet');

  const TransportMode(this.storageKey, this.label);
  final String storageKey;
  final String label;

  static TransportMode fromKey(String? key) => TransportMode.values.firstWhere(
    (m) => m.storageKey == key,
    orElse: () => TransportMode.notArranged,
  );
}

/// "Who is taking me?" — an STML user's first question about any appointment,
/// and the one most likely to be re-asked. Modelled as a first-class value so
/// it can be shown identically on the Today card and the detail screen.
@immutable
class TransportPlan {
  const TransportPlan({
    this.mode = TransportMode.notArranged,
    this.companionName,
    this.pickupTime,
    this.notes,
  });

  factory TransportPlan.fromJson(Map<String, dynamic> json) => TransportPlan(
    mode: TransportMode.fromKey(json['mode'] as String?),
    companionName: json['companionName'] as String?,
    pickupTime: json['pickupTime'] == null
        ? null
        : DoseTime.parse(json['pickupTime'] as String),
    notes: json['notes'] as String?,
  );

  final TransportMode mode;

  /// "Joyce (your daughter)".
  final String? companionName;

  /// Time of day the ride arrives.
  final DoseTime? pickupTime;
  final String? notes;

  bool get isArranged => mode != TransportMode.notArranged;

  /// "Joyce (your daughter) is driving you. She arrives at 9:45 AM."
  String get summary {
    if (!isArranged) return 'Transport is not arranged yet.';
    final who = companionName;
    final when = pickupTime == null ? '' : ' Arrives at ${pickupTime!.label12h}.';
    if (mode == TransportMode.telehealth) {
      return 'This is a video call — stay at home.$when';
    }
    if (who != null && who.isNotEmpty) {
      return '$who is taking you (${mode.label.toLowerCase()}).$when';
    }
    return '${mode.label}.$when';
  }

  TransportPlan copyWith({
    TransportMode? mode,
    String? companionName,
    DoseTime? pickupTime,
    String? notes,
  }) => TransportPlan(
    mode: mode ?? this.mode,
    companionName: companionName ?? this.companionName,
    pickupTime: pickupTime ?? this.pickupTime,
    notes: notes ?? this.notes,
  );

  Map<String, dynamic> toJson() => {
    'mode': mode.storageKey,
    'companionName': companionName,
    'pickupTime': pickupTime?.key,
    'notes': notes,
  };

  @override
  bool operator ==(Object other) =>
      other is TransportPlan &&
      other.mode == mode &&
      other.companionName == companionName &&
      other.pickupTime == pickupTime &&
      other.notes == notes;

  @override
  int get hashCode => Object.hash(mode, companionName, pickupTime, notes);
}

/// A clinical appointment.
///
/// Every date-dependent helper takes `now` as a PARAMETER. The model therefore
/// has no hidden dependency on the system clock and can be unit tested with
/// nothing but literal `DateTime`s; the provider is the only place that
/// supplies `now`, and it gets it from an injected [Clock].
@immutable
class Appointment {
  Appointment({
    required this.id,
    required this.title,
    required this.clinician,
    required this.dateTime,
    this.clinicianRole = '',
    this.location = '',
    this.duration = const Duration(minutes: 30),
    this.notes = '',
    this.transport = const TransportPlan(),
    List<String> preparation = const <String>[],
    this.isCancelled = false,
  }) : preparation = List<String>.unmodifiable(preparation);

  factory Appointment.fromJson(Map<String, dynamic> json) => Appointment(
    id: json['id'] as String,
    title: json['title'] as String,
    clinician: json['clinician'] as String? ?? '',
    clinicianRole: json['clinicianRole'] as String? ?? '',
    location: json['location'] as String? ?? '',
    dateTime: DateTime.parse(json['dateTime'] as String),
    duration: Duration(minutes: json['durationMinutes'] as int? ?? 30),
    notes: json['notes'] as String? ?? '',
    transport: json['transport'] == null
        ? const TransportPlan()
        : TransportPlan.fromJson(
            Map<String, dynamic>.from(json['transport'] as Map),
          ),
    preparation: ((json['preparation'] as List<dynamic>?) ?? const <dynamic>[])
        .map((e) => e as String)
        .toList(),
    isCancelled: json['isCancelled'] as bool? ?? false,
  );

  final String id;

  /// "Memory Clinic follow-up".
  final String title;

  /// "Dr. Alan Reyes".
  final String clinician;

  /// "Neurologist".
  final String clinicianRole;

  /// "Riverside Memory Clinic, Suite 204".
  final String location;

  /// Local start instant.
  final DateTime dateTime;
  final Duration duration;
  final String notes;
  final TransportPlan transport;

  /// STML driver: an explicit checklist — "Bring your medication list",
  /// "Do not eat after 8 pm" — rather than prose the patient must re-read.
  final List<String> preparation;

  final bool isCancelled;

  DateTime get endsAt => dateTime.add(duration);
  DateOnly get date => DateOnly.from(dateTime);
  DoseTime get timeOfDay => DoseTime(dateTime.hour, dateTime.minute);

  /// "10:30 AM".
  String get timeLabel => timeOfDay.label12h;

  bool get hasPreparation => preparation.isNotEmpty;

  // ---- Derived, time-relative helpers. `now` is always injected. ----

  bool isToday(DateTime now) => date == DateOnly.from(now);
  bool isPast(DateTime now) => !isCancelled && endsAt.isBefore(now);
  bool isUpcoming(DateTime now) => !isCancelled && !endsAt.isBefore(now);
  bool isInProgress(DateTime now) =>
      !isCancelled && !now.isBefore(dateTime) && now.isBefore(endsAt);
  bool isTomorrow(DateTime now) => date == DateOnly.from(now).addDays(1);
  bool isWithinNextDays(int days, DateTime now) {
    final delta = date.daysFrom(DateOnly.from(now));
    return delta >= 0 && delta <= days;
  }

  Duration timeUntil(DateTime now) => dateTime.difference(now);

  /// Calendar days from today; negative for past.
  int daysFromToday(DateTime now) => date.daysFrom(DateOnly.from(now));

  /// "Today", "Tomorrow", "In 3 days", "Yesterday", "12 days ago".
  /// STML driver: relative day words beat a bare date, which an STML user
  /// cannot anchor without first remembering what today's date is.
  String relativeDayLabel(DateTime now) {
    final delta = daysFromToday(now);
    if (delta == 0) return 'Today';
    if (delta == 1) return 'Tomorrow';
    if (delta == -1) return 'Yesterday';
    if (delta > 1 && delta <= 6) return 'In $delta days (${weekdayName(date.weekday)})';
    if (delta < -1 && delta >= -6) return '${-delta} days ago';
    return '${weekdayName(date.weekday)} ${date.day} ${monthName(date.month)}';
  }

  /// Full sentence for TalkBack on an appointment card.
  String semanticLabel(DateTime now) {
    final buffer = StringBuffer()
      ..write('$title with $clinician')
      ..write(clinicianRole.isEmpty ? '' : ', $clinicianRole')
      ..write('. ${relativeDayLabel(now)} at $timeLabel.');
    if (location.isNotEmpty) buffer.write(' At $location.');
    if (transport.isArranged) buffer.write(' ${transport.summary}');
    if (isCancelled) buffer.write(' This appointment is cancelled.');
    return buffer.toString();
  }

  Appointment copyWith({
    String? id,
    String? title,
    String? clinician,
    String? clinicianRole,
    String? location,
    DateTime? dateTime,
    Duration? duration,
    String? notes,
    TransportPlan? transport,
    List<String>? preparation,
    bool? isCancelled,
  }) => Appointment(
    id: id ?? this.id,
    title: title ?? this.title,
    clinician: clinician ?? this.clinician,
    clinicianRole: clinicianRole ?? this.clinicianRole,
    location: location ?? this.location,
    dateTime: dateTime ?? this.dateTime,
    duration: duration ?? this.duration,
    notes: notes ?? this.notes,
    transport: transport ?? this.transport,
    preparation: preparation ?? this.preparation,
    isCancelled: isCancelled ?? this.isCancelled,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'clinician': clinician,
    'clinicianRole': clinicianRole,
    'location': location,
    'dateTime': dateTime.toIso8601String(),
    'durationMinutes': duration.inMinutes,
    'notes': notes,
    'transport': transport.toJson(),
    'preparation': preparation,
    'isCancelled': isCancelled,
  };

  @override
  bool operator ==(Object other) =>
      other is Appointment &&
      other.id == id &&
      other.title == title &&
      other.clinician == clinician &&
      other.clinicianRole == clinicianRole &&
      other.location == location &&
      other.dateTime == dateTime &&
      other.duration == duration &&
      other.notes == notes &&
      other.transport == transport &&
      other.isCancelled == isCancelled &&
      listEquals(other.preparation, preparation);

  @override
  int get hashCode => Object.hash(
    id,
    title,
    clinician,
    clinicianRole,
    location,
    dateTime,
    duration,
    notes,
    transport,
    isCancelled,
    Object.hashAll(preparation),
  );

  @override
  String toString() => 'Appointment($id, $title, $dateTime)';
}
