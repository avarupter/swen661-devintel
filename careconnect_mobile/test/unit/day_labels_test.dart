import 'package:careconnect_mobile/core/clock.dart';
import 'package:careconnect_mobile/core/day_labels.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('fullDateLabel', () {
    test('names the weekday and the month, and omits the year', () {
      expect(fullDateLabel(const DateOnly(2026, 9, 8)), 'Tuesday, 8 September');
      // The missing year is a decision, not an oversight: a patient with
      // short-term memory loss orients on the day name, and the year is noise
      // they must skip past every time.
      expect(fullDateLabel(const DateOnly(2026, 9, 8)), isNot(contains('2026')));
    });

    test('handles the first and last months', () {
      expect(fullDateLabel(const DateOnly(2027, 1, 1)), 'Friday, 1 January');
      expect(fullDateLabel(const DateOnly(2026, 12, 25)), 'Friday, 25 December');
    });
  });

  group('greetingLine', () {
    test('changes across the day', () {
      expect(greetingLine(DateTime(2026, 9, 8, 7, 45), 'Mary'),
          'Good morning, Mary.');
      expect(greetingLine(DateTime(2026, 9, 8, 13, 0), 'Mary'),
          'Good afternoon, Mary.');
      expect(greetingLine(DateTime(2026, 9, 8, 19, 0), 'Mary'),
          'Good evening, Mary.');
    });

    test('boundaries fall on the right side', () {
      expect(greetingFor(DateTime(2026, 9, 8, 11, 59)), 'Good morning');
      expect(greetingFor(DateTime(2026, 9, 8, 12, 0)), 'Good afternoon');
      expect(greetingFor(DateTime(2026, 9, 8, 16, 59)), 'Good afternoon');
      expect(greetingFor(DateTime(2026, 9, 8, 17, 0)), 'Good evening');
    });

    test('a missing or blank name leaves no dangling comma', () {
      expect(greetingLine(DateTime(2026, 9, 8, 9, 0), null), 'Good morning.');
      expect(greetingLine(DateTime(2026, 9, 8, 9, 0), '   '), 'Good morning.');
      expect(greetingLine(DateTime(2026, 9, 8, 9, 0), ' Mary '),
          'Good morning, Mary.');
    });
  });

  group('weekdayName and monthName', () {
    test('cover every value', () {
      expect(weekdayName(DateTime.monday), 'Monday');
      expect(weekdayName(DateTime.sunday), 'Sunday');
      expect(monthName(1), 'January');
      expect(monthName(12), 'December');
    });
  });
}
