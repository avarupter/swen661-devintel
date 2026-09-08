import 'package:careconnect_mobile/screens/patient_appointments_screen.dart';
import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/care_test_harness.dart';

void main() {
  group('PatientAppointmentsScreen', () {
    testWidgets('groups appointments into Today, Coming up and Already '
        'happened', (tester) async {
      await pumpCareScreen(tester, const PatientAppointmentsScreen());

      // The seed puts one appointment today, three in the future and one in
      // the past, all relative to the injected clock.
      expect(find.text('My appointments'), findsOneWidget);
      expect(find.text('Today'), findsOneWidget);
      expect(find.text('Coming up'), findsOneWidget);
      expect(find.text('Already happened'), findsOneWidget);
    });

    testWidgets('shows who is taking you on the row itself, without a tap',
        (tester) async {
      await pumpCareScreen(tester, const PatientAppointmentsScreen());

      expect(find.textContaining('is taking you'), findsWidgets);
    });

    testWidgets('leads each row with the day word rather than a raw date',
        (tester) async {
      await pumpCareScreen(tester, const PatientAppointmentsScreen());

      // "Today at 10:30 AM" — a date like 08/09 would first have to be
      // anchored against a remembered today.
      expect(find.text('Today at 10:30 AM'), findsOneWidget);
      expect(find.textContaining('In 2 days'), findsWidgets);
    });

    testWidgets('a cancelled appointment stays visible under Cancelled',
        (tester) async {
      final harness =
          await pumpCareScreen(tester, const PatientAppointmentsScreen());

      expect(find.text('Cancelled'), findsNothing);
      expect(find.textContaining('Hearing aid fitting'), findsWidgets);

      await harness.appts().cancelAppointment('apt-hearing');
      await tester.pumpAndSettle();

      // It must NOT disappear: a row that silently vanishes is
      // indistinguishable from one the patient has forgotten.
      expect(find.text('Cancelled'), findsOneWidget);
      expect(find.text('You do not need to go to these.'), findsOneWidget);
      expect(find.textContaining('Hearing aid fitting'), findsWidgets);
      expect(find.text('This appointment was cancelled.'), findsOneWidget);
    });

    testWidgets('warns when transport has not been arranged', (tester) async {
      // A single appointment with no transport plan at all.
      const json = '''
      [{"id":"apt-solo","title":"Dentist","clinician":"Dr Vale",
        "clinicianRole":"Dentist","location":"High Street Dental",
        "dateTime":"2026-09-10T09:00:00.000","durationMinutes":30,
        "notes":"","preparation":[],"isCancelled":false}]
      ''';
      await pumpCareScreen(
        tester,
        const PatientAppointmentsScreen(),
        store: InMemoryJsonStore({'appointments.json': json}),
      );

      expect(find.text('Transport is not arranged yet.'), findsOneWidget);
    });

    testWidgets('shows an empty state when there are no appointments',
        (tester) async {
      await pumpCareScreen(
        tester,
        const PatientAppointmentsScreen(),
        store: InMemoryJsonStore({'appointments.json': '[]'}),
      );

      expect(find.text('You have no appointments coming up.'), findsOneWidget);
      expect(find.text('Coming up'), findsNothing);
    });
  });
}
