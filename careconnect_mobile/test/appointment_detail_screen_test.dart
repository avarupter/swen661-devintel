import 'package:careconnect_mobile/screens/appointment_detail_screen.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/care_test_harness.dart';

void main() {
  group('AppointmentDetailScreen', () {
    testWidgets('shows the day, transport and what to bring for the given id',
        (tester) async {
      await pumpCareScreen(
        tester,
        const AppointmentDetailScreen(appointmentId: 'apt-memory-clinic'),
      );

      expect(find.text('Memory Clinic follow-up'), findsOneWidget);
      expect(find.text('Today at 10:30 AM'), findsOneWidget);
      expect(find.text('Dr. Alan Reyes, Neurologist'), findsOneWidget);
      expect(find.text('Riverside Memory Clinic, Suite 204'), findsOneWidget);

      expect(find.text('Who is taking you'), findsOneWidget);
      expect(find.textContaining('Joyce'), findsWidgets);

      expect(find.text('What to bring'), findsOneWidget);
      expect(find.text('Bring your medication list'), findsOneWidget);
      expect(find.text('Bring your reading glasses'), findsOneWidget);
      expect(
        find.text('Write down any questions before you go'),
        findsOneWidget,
      );

      expect(find.text('About 45 minutes'), findsOneWidget);
    });

    testWidgets('the whole bring-list is one screen-reader sentence',
        (tester) async {
      await pumpCareScreen(
        tester,
        const AppointmentDetailScreen(appointmentId: 'apt-memory-clinic'),
      );

      // Three orphaned items would be read as three unrelated nodes.
      expect(
        find.bySemanticsLabel(
          'What to bring: Bring your medication list, '
          'Bring your reading glasses, '
          'Write down any questions before you go',
        ),
        findsOneWidget,
      );
    });

    testWidgets('a video appointment says to stay at home', (tester) async {
      await pumpCareScreen(
        tester,
        const AppointmentDetailScreen(
          appointmentId: 'apt-telehealth-pharmacy',
        ),
      );

      expect(
        find.textContaining('This is a video call — stay at home.'),
        findsOneWidget,
      );
    });

    testWidgets('a cancelled appointment leads with a plain-language banner',
        (tester) async {
      final harness = await pumpCareScreen(
        tester,
        const AppointmentDetailScreen(appointmentId: 'apt-hearing'),
      );

      await harness.appts().cancelAppointment('apt-hearing');
      await tester.pumpAndSettle();

      expect(
        find.text(
          'This appointment was cancelled. You do not need to go.',
        ),
        findsOneWidget,
      );
    });

    testWidgets('an unknown id gives a friendly message, not a crash',
        (tester) async {
      await pumpCareScreen(
        tester,
        const AppointmentDetailScreen(appointmentId: 'no-such-appointment'),
      );

      expect(find.text('We could not find that appointment.'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
