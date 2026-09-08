/// Date wording, in one place.
///
/// [Appointment] and the Patient Today header both need "Monday" and
/// "September". Duplicating the arrays is how the two drift apart.
library;

import 'clock.dart';

const List<String> _weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const List<String> _months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/// [weekday] uses `DateTime.monday`..`DateTime.sunday` (1..7).
String weekdayName(int weekday) => _weekdays[weekday - 1];

/// [month] is 1..12.
String monthName(int month) => _months[month - 1];

/// "Monday, 8 September".
///
/// Deliberately no year. A patient with short-term memory loss reads the day
/// name to orient themselves; the year is noise they have to skip past every
/// single time they look at the screen.
String fullDateLabel(DateOnly date) =>
    '${weekdayName(date.weekday)}, ${date.day} ${monthName(date.month)}';

/// "Good morning" / "Good afternoon" / "Good evening".
String greetingFor(DateTime now) {
  if (now.hour < 12) return 'Good morning';
  if (now.hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/// "Good morning, Mary." — or "Good morning." when there is no name, rather
/// than a dangling comma.
String greetingLine(DateTime now, String? name) {
  final greeting = greetingFor(now);
  final trimmed = name?.trim();
  return (trimmed == null || trimmed.isEmpty)
      ? '$greeting.'
      : '$greeting, $trimmed.';
}
