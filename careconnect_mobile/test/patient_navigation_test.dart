import 'package:careconnect_mobile/router/app_router.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/care_test_harness.dart';

/// Navigation tests for the patient flow.
///
/// These mount the app's **real** route table from `app_router.dart` rather
/// than a test-local copy, so a typo in a route path or a route name fails
/// here instead of at runtime in the demo.
void main() {
  group('Patient navigation', () {
    testWidgets('tapping a medicine opens the detail for THAT medicine, '
        'and back returns to the list', (tester) async {
      await pumpRoutedApp(
        tester,
        initialLocation: '/home',
        routes: router.configuration.routes,
      );

      // Move to the Medications tab.
      await tester.tap(find.text('Medications').last);
      await tester.pumpAndSettle();
      expect(find.text('My medicines'), findsOneWidget);

      // Forward: open one specific medicine.
      await tester.tap(find.text('Lisinopril 10 mg Tablet'));
      await tester.pumpAndSettle();

      // The right item's data arrived — and only that item's.
      expect(
        find.text('Keeps your blood pressure in a safe range.'),
        findsOneWidget,
      );
      expect(
        find.text('Helps your memory and thinking stay steady.'),
        findsNothing,
      );

      // Backward: return to where we came from. Assert on a heading unique to
      // the detail screen — the purpose sentence also appears on the list row,
      // which is deliberate.
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('My medicines'), findsOneWidget);
      expect(find.text('What it is for'), findsNothing);
      expect(find.text("Today's doses"), findsNothing);
    });

    testWidgets('tapping an appointment opens that appointment, and back '
        'returns to the list', (tester) async {
      await pumpRoutedApp(
        tester,
        initialLocation: '/home',
        routes: router.configuration.routes,
      );

      await tester.tap(find.text('Appointments').last);
      await tester.pumpAndSettle();
      expect(find.text('My appointments'), findsOneWidget);

      await tester.tap(find.textContaining('Memory Clinic follow-up').first);
      await tester.pumpAndSettle();

      expect(find.text('Where to go'), findsOneWidget);
      expect(find.text('Riverside Memory Clinic, Suite 204'), findsOneWidget);

      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('My appointments'), findsOneWidget);
    });

    testWidgets('the "What is this medicine for?" link on Today reaches the '
        'right detail screen', (tester) async {
      await pumpRoutedApp(
        tester,
        initialLocation: '/home',
        routes: router.configuration.routes,
      );

      // Today is the patient's landing tab.
      expect(find.text('Take these now'), findsOneWidget);

      await tester.tap(find.text('What is this medicine for?').first);
      await tester.pumpAndSettle();

      expect(find.text('What it is for'), findsOneWidget);
      expect(find.text("Today's doses"), findsOneWidget);
    });

    testWidgets('a detail route can be entered directly by URL',
        (tester) async {
      await pumpRoutedApp(
        tester,
        initialLocation: '/medications/med-donepezil',
        routes: router.configuration.routes,
      );

      // Proves the id lives in the route, not in ephemeral widget state — so
      // the screen survives a restart and a deep link.
      expect(
        find.text('Helps your memory and thinking stay steady.'),
        findsOneWidget,
      );
      expect(find.text('Take at bedtime with a glass of water.'),
          findsOneWidget);
    });

    testWidgets('an appointment detail route can be entered directly by URL',
        (tester) async {
      await pumpRoutedApp(
        tester,
        initialLocation: '/appointments/apt-blood-pressure',
        routes: router.configuration.routes,
      );

      expect(find.text('Blood pressure check'), findsOneWidget);
      expect(find.text('Wear a short-sleeved top'), findsOneWidget);
    });
  });
}
