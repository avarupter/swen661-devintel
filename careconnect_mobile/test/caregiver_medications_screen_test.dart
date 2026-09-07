import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/screens/caregiver_medications_screen.dart';

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: CaregiverMedicationsScreen(),
    );
  }

  group('CaregiverMedicationsScreen Widget Tests', () {
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
        find.byWidgetPredicate(
          (w) => w is RichText && w.text.toPlainText().contains('Good morning, Joyce'),
        ),
        findsOneWidget,
      );
      expect(find.text("Viewing Margaret's care plan"), findsOneWidget);
    });

    testWidgets('renders medication list cards with dosages and schedule times', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('8:30 am'), findsNWidgets(2)); // Card time badge and title
      expect(find.text('Vitamin D3'), findsOneWidget);
      expect(find.text('1000 IU — 1 capsule'), findsOneWidget);
      expect(find.text('Take with or without food.'), findsOneWidget);
      expect(find.text('Take with breakfast.'), findsOneWidget);
    });

    testWidgets('renders edit and delete action buttons on medication cards', (WidgetTester tester) async {
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
          (w) => w is Semantics && w.properties.label == 'Vitamin D3 medication - 1000 IU — 1 capsule',
        ),
        findsOneWidget,
      );
    });
  });
}
