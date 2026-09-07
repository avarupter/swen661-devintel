import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/screens/caregiver_activity_screen.dart';

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: CaregiverActivityScreen(),
    );
  }

  group('CaregiverActivityScreen Widget Tests', () {
    testWidgets('renders header with caregiver information and date', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Caregiver'), findsOneWidget);
      expect(find.text('Joyce'), findsOneWidget);
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Thursday 4 June, 5:39 AM',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is RichText && widget.text.toPlainText().contains('Good morning, Joyce'),
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is RichText && widget.text.toPlainText().contains('Activity Log'),
        ),
        findsOneWidget,
      );
      expect(find.text("Viewing Margaret's care plan"), findsOneWidget);
    });

    testWidgets('renders activity log title, subtitle, and filter chips', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Activity log'), findsOneWidget);
      expect(
        find.text("Margaret's recent actions — medications taken, check-ins, and tasks"),
        findsOneWidget,
      );

      expect(find.text('Refresh'), findsOneWidget);
      expect(find.text('Medication taken'), findsOneWidget);
      expect(find.text('Medication unmarked'), findsOneWidget);
      expect(find.text('Task completed'), findsOneWidget);
      expect(find.text('Checked in'), findsOneWidget);
    });

    testWidgets('renders empty state message when no activity events exist', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('No activity yet'), findsOneWidget);
      expect(
        find.text('Events will appear here when Margaret takes medications, completes tasks, or checks in.'),
        findsOneWidget,
      );
      expect(find.byIcon(Icons.inbox), findsOneWidget);
    });

    testWidgets('verifies accessibility semantics for key interactive elements', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Go back',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Refresh activity log',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Filter by Medication taken',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Filter by Task completed',
        ),
        findsOneWidget,
      );
    });
  });
}
