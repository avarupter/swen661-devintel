import 'package:flutter/foundation.dart';

/// Coarse part of the day. Short-Term Memory Loss design driver: an STML user
/// orients far better on "Morning / Lunchtime / Evening / Bedtime" than on a
/// bare 24-hour clock, so the *model* exposes the human bucket and the screens
/// simply render it.
enum DayPart {
  morning('Morning'),
  lunchtime('Lunchtime'),
  evening('Evening'),
  bedtime('Bedtime');

  const DayPart(this.label);
  final String label;
}

/// A time of day on the medication schedule.
///
/// Deliberately NOT Flutter's `TimeOfDay`: this must live in a pure model that
/// serialises to JSON and sorts, without dragging in `material.dart`.
@immutable
class DoseTime implements Comparable<DoseTime> {
  const DoseTime(this.hour, this.minute)
    : assert(hour >= 0 && hour <= 23, 'hour must be 0..23'),
      assert(minute >= 0 && minute <= 59, 'minute must be 0..59');

  /// Parses the storage form `HH:mm` (24-hour, zero padded).
  factory DoseTime.parse(String value) {
    final parts = value.split(':');
    if (parts.length != 2) {
      throw FormatException('Expected HH:mm', value);
    }
    return DoseTime(int.parse(parts[0]), int.parse(parts[1]));
  }

  final int hour;
  final int minute;

  /// Storage / dose-key form: `08:00`.
  String get key =>
      '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';

  int get minutesFromMidnight => hour * 60 + minute;

  DayPart get dayPart {
    if (hour < 11) return DayPart.morning;
    if (hour < 16) return DayPart.lunchtime;
    if (hour < 20) return DayPart.evening;
    return DayPart.bedtime;
  }

  /// `8:00 AM`. Written by hand so the project needs no `intl` dependency and
  /// so screens never format times themselves (rubric: logic out of widgets).
  String get label12h {
    final period = hour < 12 ? 'AM' : 'PM';
    final h = hour % 12 == 0 ? 12 : hour % 12;
    return '$h:${minute.toString().padLeft(2, '0')} $period';
  }

  /// What TalkBack should read: "Morning, 8:00 AM".
  String get spokenLabel => '${dayPart.label}, $label12h';

  @override
  int compareTo(DoseTime other) =>
      minutesFromMidnight.compareTo(other.minutesFromMidnight);

  @override
  bool operator ==(Object other) =>
      other is DoseTime && other.hour == hour && other.minute == minute;

  @override
  int get hashCode => Object.hash(hour, minute);

  @override
  String toString() => key;
}
