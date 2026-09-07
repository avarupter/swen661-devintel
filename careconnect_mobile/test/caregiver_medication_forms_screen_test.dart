import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/screens/caregiver_medication_forms_screen.dart';

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: CaregiverMedicationFormsScreen(),
    );
  }

  group('CaregiverMedicationFormsScreen Widget Tests', () {
    testWidgets('renders app bar title and header elements', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Add Medication'), findsOneWidget);
      expect(find.text('Caregiver'), findsOneWidget);
      expect(find.text('Joyce'), findsOneWidget);
      expect(
        find.byWidgetPredicate(
          (w) => w is RichText && w.text.toPlainText().contains('Thursday 4 June'),
        ),
        findsOneWidget,
      );
      expect(
        find.text('Good morning, Joyce · Manage Medications'),
        findsOneWidget,
      );
    });

    testWidgets('renders form labels, text fields, and save button', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Add new medication'), findsOneWidget);
      expect(find.text('Medication name (required) *'), findsOneWidget);
      expect(find.text('Dose (required) *'), findsOneWidget);
      expect(find.text('Schedule times (required) *'), findsOneWidget);
      expect(find.byType(TextField), findsNWidgets(3));
      expect(find.text('Save Medication'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('renders sidebar navigation items', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Medications'), findsOneWidget);
      expect(find.text('Appointments'), findsOneWidget);
      expect(find.text('Activity'), findsOneWidget);
      expect(find.text('Notes'), findsOneWidget);
    });
  });
}
