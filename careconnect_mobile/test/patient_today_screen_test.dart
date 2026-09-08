import 'package:careconnect_mobile/screens/patient_today_screen.dart';
import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/care_test_harness.dart';

void main() {
  group('PatientTodayScreen', () {
    testWidgets('shows the date, the greeting and the progress sentence',
        (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      // The header is data-driven from the injected clock, not hard-coded.
      expect(find.text('Today'), findsWidgets);
      expect(find.text('Tuesday, 8 September'), findsOneWidget);
      expect(find.text('Good morning, Mary.'), findsOneWidget);
      expect(find.text('0 of 6 doses taken today'), findsOneWidget);
    });

    testWidgets('groups doses into "Take these now" and "Later today"',
        (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      // At 07:45 the three 08:00 doses are inside the early window and the
      // 20:00/21:00 doses are not. Nothing has been taken, so there is no
      // "Already done" section at all.
      expect(find.text('Take these now'), findsOneWidget);
      expect(find.text('Later today'), findsOneWidget);
      expect(find.text('Already done'), findsNothing);
    });

    testWidgets('marking a dose taken confirms it where the patient is '
        'looking, without the card jumping away', (tester) async {
      final harness =
          await pumpCareScreen(tester, const PatientTodayScreen());

      expect(find.text('Already done'), findsNothing);

      await tester.tap(find.text('Mark as taken').first);
      await tester.pumpAndSettle();

      // The reassurance line is the whole point: not a tick, a sentence.
      expect(find.text('You took this at 7:45 AM today.'), findsOneWidget);
      expect(find.text('1 of 6 doses taken today'), findsOneWidget);

      // And it is still under "Take these now", where the patient just
      // pressed. A card that relocates hundreds of pixels down the page reads
      // as "nothing happened", and the natural next move is to tap again.
      expect(find.text('Take these now'), findsOneWidget);
      expect(find.text('Already done'), findsNothing);

      // It settles into "Already done" on the next refresh.
      harness.meds().syncNow();
      await tester.pumpAndSettle();
      expect(find.text('Already done'), findsOneWidget);
      expect(find.text('1 of 6 doses taken today'), findsOneWidget);
    });

    testWidgets('undo returns the dose to not taken', (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      await tester.tap(find.text('Mark as taken').first);
      await tester.pumpAndSettle();
      expect(find.text('You took this at 7:45 AM today.'), findsOneWidget);

      await tester.tap(find.text('Undo — I have not taken this'));
      await tester.pumpAndSettle();

      expect(find.text('You took this at 7:45 AM today.'), findsNothing);
      expect(find.text('0 of 6 doses taken today'), findsOneWidget);
      expect(find.text('Already done'), findsNothing);
    });

    testWidgets('shows today\'s appointment and who is taking her',
        (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      expect(find.text('Where you are going'), findsOneWidget);
      expect(find.textContaining('Memory Clinic follow-up'), findsWidgets);
      expect(find.textContaining('Joyce'), findsWidgets);
    });

    testWidgets('shows a loading state before the provider is ready',
        (tester) async {
      final slowStore = InMemoryJsonStore()
        ..latency = const Duration(milliseconds: 80);

      final harness = CareHarness(store: slowStore, clock: newTestClock());
      await tester.binding.setSurfaceSize(const Size(500, 3600));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        harness.wrap(
          child: const MaterialApp(home: PatientTodayScreen()),
        ),
      );
      await tester.pump();

      // Proves LoadState is actually wired rather than decorative.
      expect(find.text('Loading your day…'), findsOneWidget);

      await tester.pumpAndSettle();
      expect(find.text('Loading your day…'), findsNothing);
      expect(find.text('Take these now'), findsOneWidget);
    });

    testWidgets('a failed save is reported inline while the tick still stands',
        (tester) async {
      final store = InMemoryJsonStore();
      await pumpCareScreen(tester, const PatientTodayScreen(), store: store);

      store.failOnWrite = Exception('disk full');
      await tester.tap(find.text('Mark as taken').first);
      await tester.pumpAndSettle();

      // Optimistic UI plus an honest, persistent failure message — not a
      // snackbar that disappears before it can be read.
      expect(find.text('You took this at 7:45 AM today.'), findsOneWidget);
      expect(
        find.text('We could not save that just now. It is still shown here.'),
        findsOneWidget,
      );
    });

    testWidgets('announces the day summary as a live region', (tester) async {
      await pumpCareScreen(tester, const PatientTodayScreen());

      // Without liveRegion, TalkBack would not re-read the progress after a
      // dose is ticked, so a screen-reader user gets no confirmation.
      final liveRegions = tester
          .widgetList<Semantics>(find.byType(Semantics))
          .where((s) => s.properties.liveRegion == true);
      expect(liveRegions, isNotEmpty);
    });

    testWidgets('reports an all-clear once every dose is taken',
        (tester) async {
      final harness =
          await pumpCareScreen(tester, const PatientTodayScreen());

      final meds = harness.meds();
      for (final dose in meds.todaysDoses) {
        await meds.markTaken(dose.id);
      }
      await tester.pumpAndSettle();

      expect(
        find.text('All done. There is nothing left to take today.'),
        findsOneWidget,
      );
      expect(find.text('6 of 6 doses taken today'), findsOneWidget);

      // After a refresh the sticky cards settle and the actionable sections
      // empty out.
      meds.syncNow();
      await tester.pumpAndSettle();
      expect(find.text('Take these now'), findsNothing);
      expect(find.text('Later today'), findsNothing);
      expect(find.text('Already done'), findsOneWidget);
    });

    testWidgets('a skipped dose is never reported as taken', (tester) async {
      final harness =
          await pumpCareScreen(tester, const PatientTodayScreen());

      final meds = harness.meds();
      for (final dose in meds.todaysDoses) {
        await meds.markSkipped(dose.id);
      }
      await tester.pumpAndSettle();

      // The old wording said "All done. You have taken all 6 of today's
      // doses." over a day where nothing was swallowed.
      expect(find.textContaining('You have taken all'), findsNothing);
      expect(find.text('0 of 6 doses taken today'), findsOneWidget);
      expect(
        find.textContaining('You took 0 of 6 doses and skipped 6.'),
        findsOneWidget,
      );

      // And the skipped cards stay on the page rather than vanishing.
      meds.syncNow();
      await tester.pumpAndSettle();
      // "Skipped" also appears on each status chip, so assert the section by
      // its subtitle, which is unique to the header.
      expect(find.text('You decided not to take these today.'), findsOneWidget);
      expect(find.text('Skipped'), findsWidgets);
    });
  });
}
