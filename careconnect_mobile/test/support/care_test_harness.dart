import 'package:careconnect_mobile/core/clock.dart';
import 'package:careconnect_mobile/data/care_providers.dart';
import 'package:careconnect_mobile/models/patient.dart';
import 'package:careconnect_mobile/providers/appointment_provider.dart';
import 'package:careconnect_mobile/providers/auth_provider.dart';
import 'package:careconnect_mobile/providers/medication_provider.dart';
import 'package:careconnect_mobile/providers/patient_provider.dart';
import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

/// Test scaffolding shared by every patient-screen widget test.
///
/// The point of this file is that no widget test needs to mock a platform
/// channel or depend on the wall clock: [InMemoryJsonStore] replaces
/// path_provider and [FixedClock] replaces `DateTime.now()`.

/// 07:45 on Tuesday 8 September 2026.
///
/// Chosen deliberately against the seed data:
///  * the 08:00 doses (Memantine, Lisinopril, Vitamin D3) are inside the
///    one-hour early window, so they are "due now";
///  * the 20:00 and 21:00 doses are still "later today";
///  * the seeded Memory Clinic appointment is at 10:30 the same day, so
///    "today" is never empty.
DateTime get testInstant => DateTime(2026, 9, 8, 7, 45);

FixedClock newTestClock() => FixedClock(testInstant);

/// A [PatientProvider] that never touches the filesystem.
///
/// The real one calls `getApplicationDocumentsDirectory()` from its
/// constructor, which throws under `flutter_test`.
class FakePatientProvider extends PatientProvider {
  @override
  List<Patient> get patients => const [];
}

/// Mounts [child] with the full patient provider graph and no router.
///
/// Use for a screen that does not navigate. If the screen pushes a route, use
/// [pumpRoutedApp] instead — `context.pushNamed` needs a GoRouter above it.
Future<CareHarness> pumpCareScreen(
  WidgetTester tester,
  Widget child, {
  InMemoryJsonStore? store,
  FixedClock? clock,
  String userName = 'Mary',
  TextScaler? textScaler,
  // Tall on purpose. A ListView only builds the children that fit the
  // viewport, so on a phone-sized surface the lower sections ("Already done",
  // "Where you are going") never enter the element tree and find.text cannot
  // see them. A tall surface renders the whole page in one pass.
  Size surfaceSize = const Size(500, 3600),
}) async {
  final harness = CareHarness(
    store: store ?? InMemoryJsonStore(),
    clock: clock ?? newTestClock(),
  );

  await tester.binding.setSurfaceSize(surfaceSize);
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    harness.wrap(
      userName: userName,
      child: MaterialApp(
        // The text scaler has to be applied INSIDE MaterialApp: MaterialApp
        // builds its own MediaQuery from the view, which would discard a
        // MediaQuery wrapped around the outside.
        builder: textScaler == null
            ? null
            : (context, inner) => MediaQuery(
                  data: MediaQuery.of(context).copyWith(textScaler: textScaler),
                  child: inner!,
                ),
        home: child,
      ),
    ),
  );
  await tester.pumpAndSettle();
  return harness;
}

/// Mounts a real [GoRouter] over the app's own route table, so navigation
/// assertions exercise the routes that ship rather than a test-only copy.
Future<CareHarness> pumpRoutedApp(
  WidgetTester tester, {
  required String initialLocation,
  required List<RouteBase> routes,
  InMemoryJsonStore? store,
  FixedClock? clock,
  String userName = 'Mary',
  Size surfaceSize = const Size(500, 3600),
}) async {
  final harness = CareHarness(
    store: store ?? InMemoryJsonStore(),
    clock: clock ?? newTestClock(),
  );

  await tester.binding.setSurfaceSize(surfaceSize);
  addTearDown(() => tester.binding.setSurfaceSize(null));

  final router = GoRouter(initialLocation: initialLocation, routes: routes);
  addTearDown(router.dispose);

  await tester.pumpWidget(
    harness.wrap(
      userName: userName,
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return harness;
}

/// Holds the injected seams so a test can advance the clock, inspect what was
/// written, or reach a provider directly.
class CareHarness {
  CareHarness({required this.store, required this.clock});

  final InMemoryJsonStore store;
  final FixedClock clock;

  final GlobalKey _rootKey = GlobalKey();

  Widget wrap({
    required Widget child,
    String userName = 'Mary',
  }) {
    final auth = AuthProvider()
      ..signUp(userName, '${userName.toLowerCase()}@example.com', 'pw')
      ..setRole('patient');

    final Widget tree = KeyedSubtree(key: _rootKey, child: child);

    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: auth),
        ChangeNotifierProvider<PatientProvider>(
          create: (_) => FakePatientProvider(),
        ),
        ...buildCareProviders(store: store, clock: clock),
      ],
      child: tree,
    );
  }

  MedicationProvider meds() =>
      Provider.of<MedicationProvider>(_rootKey.currentContext!, listen: false);

  AppointmentProvider appts() =>
      Provider.of<AppointmentProvider>(_rootKey.currentContext!, listen: false);
}
