import 'package:careconnect_mobile/screens/medication_detail_screen.dart';
import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/care_test_harness.dart';

void main() {
  group('MedicationDetailScreen', () {
    testWidgets('shows the medicine identified by the id it was given',
        (tester) async {
      await pumpCareScreen(
        tester,
        const MedicationDetailScreen(medicationId: 'med-memantine'),
      );

      expect(
        find.text('Works with Donepezil to protect your memory.'),
        findsOneWidget,
      );
      expect(find.text('What it is for'), findsOneWidget);
      expect(find.text('What it looks like'), findsOneWidget);
      // Appears in the "What it looks like" card and again on each dose tile:
      // the patient should be able to check the pill wherever they are looking.
      expect(find.text('Oval pale-yellow tablet'), findsWidgets);
      expect(find.text('Prescribed by'), findsOneWidget);

      // The id genuinely selects: another medicine's purpose is absent.
      expect(
        find.text('Keeps your blood pressure in a safe range.'),
        findsNothing,
      );
    });

    testWidgets('lists only that medicine\'s doses for today', (tester) async {
      await pumpCareScreen(
        tester,
        const MedicationDetailScreen(medicationId: 'med-memantine'),
      );

      expect(find.text("Today's doses"), findsOneWidget);
      // Memantine is 08:00 and 20:00 — two of the day's six doses.
      expect(find.text('Mark as taken'), findsNWidgets(2));
      expect(find.text('Morning — 8:00 AM'), findsOneWidget);
      expect(find.text('Bedtime — 8:00 PM'), findsOneWidget);
    });

    testWidgets('marking taken here updates the shared provider',
        (tester) async {
      final harness = await pumpCareScreen(
        tester,
        const MedicationDetailScreen(medicationId: 'med-memantine'),
      );

      await tester.tap(find.text('Mark as taken').first);
      await tester.pumpAndSettle();

      // Shared state, not local widget state.
      expect(harness.meds().takenCountToday, 1);
      expect(find.text('You took this at 7:45 AM today.'), findsOneWidget);
    });

    testWidgets('an as-needed medicine says so instead of listing doses',
        (tester) async {
      await pumpCareScreen(
        tester,
        const MedicationDetailScreen(medicationId: 'med-paracetamol'),
      );

      expect(find.text('Take only when you need it.'), findsOneWidget);
      expect(find.text("Today's doses"), findsNothing);
    });

    testWidgets('an unknown id gives a friendly message, not a crash',
        (tester) async {
      await pumpCareScreen(
        tester,
        const MedicationDetailScreen(medicationId: 'no-such-medicine'),
      );

      expect(find.text('We could not find that medicine.'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('shows loading rather than "not found" while the store is slow',
        (tester) async {
      final slowStore = InMemoryJsonStore()
        ..latency = const Duration(milliseconds: 80);
      final harness = CareHarness(store: slowStore, clock: newTestClock());

      await tester.binding.setSurfaceSize(const Size(500, 3600));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        harness.wrap(
          child: const MaterialApp(
            home: MedicationDetailScreen(medicationId: 'med-donepezil'),
          ),
        ),
      );
      await tester.pump();

      // Telling a patient with memory loss that their medicine is gone, when
      // the file is merely still opening, would be the worst possible lie.
      expect(find.text('Loading this medicine…'), findsOneWidget);
      expect(find.text('We could not find that medicine.'), findsNothing);

      await tester.pumpAndSettle();
      expect(find.text('Helps your memory and thinking stay steady.'),
          findsOneWidget);
    });
  });
}
