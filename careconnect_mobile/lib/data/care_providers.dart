import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';

import '../core/clock.dart';
import '../providers/appointment_provider.dart';
import '../providers/medication_provider.dart';
import '../services/care_repository.dart';
import '../services/json_store.dart';
import 'seed_data.dart';

/// Composition root for Shane's three screens.
///
/// One function builds the whole object graph, so `main.dart` stays a wiring
/// file and every dependency (store, clock, seed) has a test seam.
///
/// There is deliberately no timer anywhere in this graph. Freshness comes from
/// [MedicationProvider.syncNow], which Patient Today calls on resume and from
/// its Refresh button — see that method for the reasoning.
List<SingleChildWidget> buildCareProviders({
  JsonStore? store,
  Clock clock = const SystemClock(),
  bool autoLoad = true,
}) {
  final jsonStore = store ?? FileJsonStore();
  final repository = JsonCareRepository(
    store: jsonStore,
    seed: CareSeed(clock: clock),
  );

  return [
    ChangeNotifierProvider<MedicationProvider>(
      create: (_) {
        final provider = MedicationProvider(
          repository: repository,
          clock: clock,
        );
        if (autoLoad) provider.load();
        return provider;
      },
    ),
    ChangeNotifierProvider<AppointmentProvider>(
      create: (_) {
        final provider = AppointmentProvider(
          repository: repository,
          clock: clock,
        );
        if (autoLoad) provider.load();
        return provider;
      },
    ),
  ];
}
