import 'package:flutter/foundation.dart';

import 'dose_time.dart';

/// Physical form of the medicine. Stored by [storageKey] so renaming an enum
/// value later cannot silently corrupt saved JSON.
enum MedicationForm {
  tablet('tablet', 'Tablet'),
  capsule('capsule', 'Capsule'),
  liquid('liquid', 'Liquid'),
  inhaler('inhaler', 'Inhaler'),
  patch('patch', 'Patch'),
  drops('drops', 'Drops'),
  injection('injection', 'Injection'),
  cream('cream', 'Cream');

  const MedicationForm(this.storageKey, this.label);
  final String storageKey;
  final String label;

  static MedicationForm fromKey(String? key) => MedicationForm.values.firstWhere(
    (f) => f.storageKey == key,
    orElse: () => MedicationForm.tablet,
  );
}

/// One prescribed medicine plus the times of day it is scheduled for.
///
/// Immutable value object: mutations go through [copyWith] so the provider can
/// diff old/new state and so tests can compare by value.
@immutable
class Medication {
  Medication({
    required this.id,
    required this.name,
    required this.dosage,
    required this.form,
    required List<DoseTime> schedule,
    this.instructions = '',
    this.purpose = '',
    this.appearance = '',
    this.prescriber,
    this.isActive = true,
    this.isAsNeeded = false,
  }) : assert(!id.contains(DoseIdSeparator.value),
           'Medication id must not contain "${DoseIdSeparator.value}"'),
       schedule = List<DoseTime>.unmodifiable(
         [...schedule]..sort(),
       );

  factory Medication.fromJson(Map<String, dynamic> json) => Medication(
    id: json['id'] as String,
    name: json['name'] as String,
    dosage: json['dosage'] as String? ?? '',
    form: MedicationForm.fromKey(json['form'] as String?),
    instructions: json['instructions'] as String? ?? '',
    purpose: json['purpose'] as String? ?? '',
    appearance: json['appearance'] as String? ?? '',
    prescriber: json['prescriber'] as String?,
    isActive: json['isActive'] as bool? ?? true,
    isAsNeeded: json['isAsNeeded'] as bool? ?? false,
    schedule: ((json['schedule'] as List<dynamic>?) ?? const <dynamic>[])
        .map((t) => DoseTime.parse(t as String))
        .toList(),
  );

  final String id;
  final String name;

  /// "10 mg", "2 puffs".
  final String dosage;
  final MedicationForm form;

  /// "Take with a full glass of water."
  final String instructions;

  /// STML driver: the *reason* this medicine exists, in plain language —
  /// "Helps your memory stay steady." Answers the recurring question
  /// "what is this one for again?" without a phone call to the caregiver.
  final String purpose;

  /// STML driver: what the pill physically looks like — "small white oval
  /// tablet" — so the patient can confirm they are holding the right thing.
  final String appearance;

  final String? prescriber;
  final bool isActive;

  /// PRN / "take only when needed": never generates scheduled doses.
  final bool isAsNeeded;

  /// Times of day, always sorted ascending and unmodifiable.
  final List<DoseTime> schedule;

  /// Doses expected per day; 0 for as-needed medicines.
  int get dosesPerDay => isAsNeeded ? 0 : schedule.length;

  /// "Donepezil 10 mg tablet".
  String get displayTitle => '$name $dosage ${form.label}'.trim();

  /// One sentence for TalkBack on a medication row.
  String get spokenSummary {
    final when = isAsNeeded
        ? 'Taken only when needed'
        : 'Scheduled ${schedule.map((t) => t.label12h).join(' and ')}';
    return '$name, $dosage, ${form.label}. $when.'
        '${purpose.isEmpty ? '' : ' $purpose'}';
  }

  Medication copyWith({
    String? id,
    String? name,
    String? dosage,
    MedicationForm? form,
    String? instructions,
    String? purpose,
    String? appearance,
    String? prescriber,
    bool? isActive,
    bool? isAsNeeded,
    List<DoseTime>? schedule,
  }) => Medication(
    id: id ?? this.id,
    name: name ?? this.name,
    dosage: dosage ?? this.dosage,
    form: form ?? this.form,
    instructions: instructions ?? this.instructions,
    purpose: purpose ?? this.purpose,
    appearance: appearance ?? this.appearance,
    prescriber: prescriber ?? this.prescriber,
    isActive: isActive ?? this.isActive,
    isAsNeeded: isAsNeeded ?? this.isAsNeeded,
    schedule: schedule ?? this.schedule,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'dosage': dosage,
    'form': form.storageKey,
    'instructions': instructions,
    'purpose': purpose,
    'appearance': appearance,
    'prescriber': prescriber,
    'isActive': isActive,
    'isAsNeeded': isAsNeeded,
    'schedule': schedule.map((t) => t.key).toList(),
  };

  @override
  bool operator ==(Object other) =>
      other is Medication &&
      other.id == id &&
      other.name == name &&
      other.dosage == dosage &&
      other.form == form &&
      other.instructions == instructions &&
      other.purpose == purpose &&
      other.appearance == appearance &&
      other.prescriber == prescriber &&
      other.isActive == isActive &&
      other.isAsNeeded == isAsNeeded &&
      listEquals(other.schedule, schedule);

  @override
  int get hashCode => Object.hash(
    id,
    name,
    dosage,
    form,
    instructions,
    purpose,
    appearance,
    prescriber,
    isActive,
    isAsNeeded,
    Object.hashAll(schedule),
  );

  @override
  String toString() => 'Medication($id, $name $dosage)';
}

/// Separator used inside a composite dose key. Kept in one place so the
/// `Medication` assert and `DoseId.parse` can never disagree.
abstract final class DoseIdSeparator {
  static const String value = '|';
}
