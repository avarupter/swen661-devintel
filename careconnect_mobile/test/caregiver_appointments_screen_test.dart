import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/screens/caregiver_appointments_screen.dart';

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: CaregiverAppointmentsScreen(),
    );
  }

  group('CaregiverAppointmentsScreen Widget Tests', () {
    testWidgets('renders screen header and greeting elements', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Caregiver'), findsOneWidget);
      expect(find.text('Joyce'), findsOneWidget);
      expect(
        find.byWidgetPredicate(
          (w) => w is RichText && w.text.toPlainText().contains('Thursday 4 June'),
        ),
        findsOneWidget,
      );
      expect(
        find.text('Good morning, Joyce · Manage Appointments'),
        findsOneWidget,
      );
      expect(find.text("Viewing Margaret's care plan"), findsOneWidget);
    });

    testWidgets('renders vision opticians appointment card and details', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Vision Plus Opticians'), findsOneWidget);
      expect(find.text('22 High Street, Westfield'), findsOneWidget);
      expect(
        find.textContaining('Routine yearly eye test. Your glasses prescription may be updated.'),
        findsOneWidget,
      );
    });

    testWidgets('renders annual health review appointment card and details', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Annual health review — Dr. Sharma'), findsOneWidget);
      expect(find.text('Monday 22 June — 2:00 pm'), findsOneWidget);
      expect(
        find.text('Greenfield Surgery — 12 Greenfield Road, Westfield'),
        findsOneWidget,
      );
    });

    testWidgets('renders edit and delete action buttons on appointment cards', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Edit'), findsNWidgets(2));
      expect(find.text('Delete'), findsNWidgets(2));
      expect(find.byType(OutlinedButton), findsNWidgets(2));
      expect(find.byType(ElevatedButton), findsNWidgets(2));
    });

    testWidgets('verifies accessibility semantics for back button and cards', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(
        find.byWidgetPredicate(
          (w) => w is Semantics && w.properties.label == 'Go back',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (w) => w is Semantics && w.properties.label == 'Vision Plus Opticians',
        ),
        findsOneWidget,
      );
    });
  });
}
