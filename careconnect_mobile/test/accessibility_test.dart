import 'package:careconnect_mobile/screens/appointment_detail_screen.dart';
import 'package:careconnect_mobile/screens/medication_detail_screen.dart';
import 'package:careconnect_mobile/screens/patient_appointments_screen.dart';
import 'package:careconnect_mobile/screens/patient_medications_screen.dart';
import 'package:careconnect_mobile/screens/patient_today_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/care_test_harness.dart';

/// Accessibility assertions for the patient screens.
///
/// These are mechanical checks rather than claims: the tap-target and
/// text-scale tests measure the rendered widgets, so they fail if the layout
/// regresses.
void main() {
  /// Every interactive control on screen must clear 48 x 48 dp.
  void expectTapTargets(WidgetTester tester) {
    final finders = <Finder>[
      find.byType(ElevatedButton),
      find.byType(OutlinedButton),
      find.byType(TextButton),
      find.byType(InkWell),
    ];
    var checked = 0;
    for (final finder in finders) {
      final count = finder.evaluate().length;
      for (var i = 0; i < count; i++) {
        // Index into the finder rather than re-searching the tree per widget:
        // find.byWidget over a page this size is quadratic and very slow.
        final size = tester.getSize(finder.at(i));
        // Zero-size entries are collapsed decorations, not real controls.
        if (size.height == 0 || size.width == 0) continue;
        expect(
          size.height,
          greaterThanOrEqualTo(48.0),
          reason: 'a control is only ${size.height} dp tall',
        );
        expect(size.width, greaterThanOrEqualTo(48.0));
        checked++;
      }
    }
    expect(checked, greaterThan(0), reason: 'no controls were measured');
  }

  group('Touch targets are at least 48 dp', () {
    testWidgets('on Patient Today', (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());
      expectTapTargets(tester);
    });

    testWidgets('on Patient Medications', (tester) async {
      await pumpCareScreen(tester, const PatientMedicationsScreen());
      expectTapTargets(tester);
    });

    testWidgets('on Patient Appointments', (tester) async {
      await pumpCareScreen(tester, const PatientAppointmentsScreen());
      expectTapTargets(tester);
    });

    testWidgets('on Medication Detail', (tester) async {
      await pumpCareScreen(
        tester,
        const MedicationDetailScreen(medicationId: 'med-memantine'),
      );
      expectTapTargets(tester);
    });
  });

  group('Layout survives 200% system text size', () {
    // A RenderFlex overflow is reported to the test framework as an exception,
    // so takeException() being null is a genuine "nothing overflowed".
    Future<void> expectNoOverflowAt2x(WidgetTester tester, Widget screen) async {
      await pumpCareScreen(
        tester,
        screen,
        textScaler: const TextScaler.linear(2.0),
        surfaceSize: const Size(400, 6000),
      );
      expect(tester.takeException(), isNull);
    }

    testWidgets('Patient Today', (tester) async {
      await expectNoOverflowAt2x(tester, const PatientTodayScreen());
    });

    testWidgets('Patient Medications', (tester) async {
      await expectNoOverflowAt2x(tester, const PatientMedicationsScreen());
    });

    testWidgets('Patient Appointments', (tester) async {
      await expectNoOverflowAt2x(tester, const PatientAppointmentsScreen());
    });

    testWidgets('Medication Detail', (tester) async {
      await expectNoOverflowAt2x(
        tester,
        const MedicationDetailScreen(medicationId: 'med-memantine'),
      );
    });

    testWidgets('Appointment Detail', (tester) async {
      await expectNoOverflowAt2x(
        tester,
        const AppointmentDetailScreen(appointmentId: 'apt-memory-clinic'),
      );
    });
  });

  group('Screen-reader structure', () {
    testWidgets('a dose card is one sentence plus a separately labelled action',
        (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      // One node carries the whole story...
      expect(
        find.bySemanticsLabel(
          RegExp(r'Memantine, 10 mg, Morning, 8:00 AM\. Not taken yet\.'),
        ),
        findsOneWidget,
      );

      // ...and the button is a separate node with its own instruction, so it
      // stays independently focusable rather than being swallowed by the card.
      expect(
        find.bySemanticsLabel(
          'Mark Memantine 10 mg at 8:00 AM as taken',
        ),
        findsOneWidget,
      );
    });

    testWidgets('the action label changes to an undo instruction once taken',
        (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      await tester.tap(find.text('Mark as taken').first);
      await tester.pumpAndSettle();

      expect(
        find.bySemanticsLabel(RegExp('^Undo\\. Mark .* as not taken\$')),
        findsWidgets,
      );
    });

    testWidgets('sections are exposed as headers for the headings rotor',
        (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      final headers = tester
          .widgetList<Semantics>(find.byType(Semantics))
          .where((s) => s.properties.header == true);

      // "Today", "Take these now", "Later today", "Where you are going".
      expect(headers.length, greaterThanOrEqualTo(4));
    });

    testWidgets('meets the Material tap-target and text-contrast guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await pumpCareScreen(tester, const PatientMedicationsScreen());

      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));

      handle.dispose();
    });
  });
}
