/// Time abstraction.
///
/// Nothing in the domain layer, the services or the providers is allowed to
/// call `DateTime.now()` directly. Everything reads the current instant from an
/// injected [Clock]. That is the single change that makes every piece of
/// date-dependent logic in CareConnect deterministically unit testable.
library;

import 'package:flutter/foundation.dart';

/// Source of the current instant.
abstract interface class Clock {
  DateTime now();
}

/// Production implementation. `const` so it costs nothing as a default value.
class SystemClock implements Clock {
  const SystemClock();

  @override
  DateTime now() => DateTime.now();
}

/// Test implementation: time only moves when a test moves it.
class FixedClock implements Clock {
  FixedClock(this._now);

  /// Convenience for readable tests: `FixedClock.at(2026, 9, 8, 7, 45)`.
  FixedClock.at(
    int year, [
    int month = 1,
    int day = 1,
    int hour = 0,
    int minute = 0,
  ]) : _now = DateTime(year, month, day, hour, minute);

  DateTime _now;

  @override
  DateTime now() => _now;

  /// Jump forward (or backward with a negative duration).
  void advance(Duration delta) => _now = _now.add(delta);

  /// Jump to an absolute instant.
  void setTo(DateTime value) => _now = value;
}

/// A calendar day with no time-of-day and no timezone drift.
///
/// Why this exists instead of using `DateTime`:
///  * two `DateTime`s on the same calendar day are not `==`, so `DateTime`
///    cannot be used as a map key for "which day is this dose for";
///  * `DateTime.difference(...).inDays` is wrong across a daylight-saving
///    boundary (a 23-hour day truncates to 0 days);
///  * "today" is a *local calendar* concept, never a UTC instant.
@immutable
class DateOnly implements Comparable<DateOnly> {
  const DateOnly(this.year, this.month, this.day);

  /// The local calendar day that [dateTime] falls on.
  factory DateOnly.from(DateTime dateTime) =>
      DateOnly(dateTime.year, dateTime.month, dateTime.day);

  /// "Today" is always derived from an injected clock, never from
  /// `DateTime.now()`.
  factory DateOnly.today(Clock clock) => DateOnly.from(clock.now());

  /// Parses `yyyy-MM-dd`. Throws [FormatException] on malformed input.
  factory DateOnly.parse(String iso) {
    final parts = iso.split('-');
    if (parts.length != 3) {
      throw FormatException('Expected yyyy-MM-dd', iso);
    }
    return DateOnly(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]),
    );
  }

  final int year;
  final int month;
  final int day;

  /// Storage / map-key form: `2026-09-08`.
  String get iso =>
      '${year.toString().padLeft(4, '0')}-'
      '${month.toString().padLeft(2, '0')}-'
      '${day.toString().padLeft(2, '0')}';

  /// Local midnight at the start of this day.
  DateTime get startOfDay => DateTime(year, month, day);

  /// Local instant of [hour]:[minute] on this day. Uses the `DateTime`
  /// constructor (not arithmetic) so DST shifts resolve correctly.
  DateTime at(int hour, int minute) => DateTime(year, month, day, hour, minute);

  /// Calendar arithmetic that normalises overflow (Sep 31 -> Oct 1).
  DateOnly addDays(int days) => DateOnly.from(DateTime(year, month, day + days));

  /// Whole calendar days from [other] to this day. DST-safe because both ends
  /// are anchored to UTC midnight purely for the subtraction.
  int daysFrom(DateOnly other) =>
      DateTime.utc(year, month, day)
          .difference(DateTime.utc(other.year, other.month, other.day))
          .inDays;

  bool isBefore(DateOnly other) => compareTo(other) < 0;
  bool isAfter(DateOnly other) => compareTo(other) > 0;

  /// Weekday constant matching `DateTime.monday` .. `DateTime.sunday`.
  int get weekday => startOfDay.weekday;

  @override
  int compareTo(DateOnly other) {
    if (year != other.year) return year.compareTo(other.year);
    if (month != other.month) return month.compareTo(other.month);
    return day.compareTo(other.day);
  }

  @override
  bool operator ==(Object other) =>
      other is DateOnly &&
      other.year == year &&
      other.month == month &&
      other.day == day;

  @override
  int get hashCode => Object.hash(year, month, day);

  @override
  String toString() => iso;
}
