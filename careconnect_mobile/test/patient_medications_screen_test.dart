import 'package:careconnect_mobile/screens/patient_medications_screen.dart';
import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/care_test_harness.dart';

void main() {
  group('PatientMedicationsScreen', () {
    testWidgets('lists each medicine with the plain-language purpose',
        (tester) async {
      await pumpCareScreen(tester, const PatientMedicationsScreen());

      expect(find.text('My medicines'), findsOneWidget);
      // The STML payload belongs on the list, not only behind a tap.
      expect(
        find.text('Helps your memory and thinking stay steady.'),
        findsOneWidget,
      );
      expect(
        find.text('Keeps your blood pressure in a safe range.'),
        findsOneWidget,
      );
    });

    testWidgets('separates as-needed medicines under "Only if you need it"',
        (tester) async {
      await pumpCareScreen(tester, const PatientMedicationsScreen());

      expect(find.text('Taken every day'), findsOneWidget);
      expect(find.text('Only if you need it'), findsOneWidget);

      // Paracetamol is PRN. It must never sit among the scheduled medicines,
      // where an untaken row reads as a missed dose.
      final prnSection = find.text('Take only when you need it.');
      expect(prnSection, findsOneWidget);
      expect(find.textContaining('Paracetamol'), findsWidgets);
    });

    testWidgets('each scheduled row reports today\'s progress in its semantics',
        (tester) async {
      await pumpCareScreen(tester, const PatientMedicationsScreen());

      // Memantine is twice a day and nothing has been taken yet.
      expect(
        find.bySemanticsLabel(RegExp('Memantine.*Today: 0 of 2 taken\\.')),
        findsOneWidget,
      );
    });

    testWidgets('the row reflects a dose taken elsewhere in the app',
        (tester) async {
      final harness =
          await pumpCareScreen(tester, const PatientMedicationsScreen());

      final meds = harness.meds();
      final memantineDose = meds
          .dosesForMedication('med-memantine')
          .firstWhere((d) => d.scheduledTime.hour == 8);
      await meds.markTaken(memantineDose.id);
      await tester.pumpAndSettle();

      // Shared state, not per-screen state: the list updates without a reload.
      expect(
        find.bySemanticsLabel(RegExp('Memantine.*Today: 1 of 2 taken\\.')),
        findsOneWidget,
      );
    });

    testWidgets('shows an empty state when there are no medicines',
        (tester) async {
      await pumpCareScreen(
        tester,
        const PatientMedicationsScreen(),
        store: InMemoryJsonStore({'medications.json': '[]'}),
      );

      expect(find.text('No medicines are on your list yet.'), findsOneWidget);
      expect(find.text('Taken every day'), findsNothing);
    });
  });
}
