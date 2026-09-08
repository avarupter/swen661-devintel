import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'data/care_providers.dart';
import 'router/app_router.dart';
import 'providers/auth_provider.dart';
import 'providers/patient_provider.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PatientProvider()),
        // MedicationProvider + AppointmentProvider, wired to the JSON store
        // and the system clock. Built by one composition-root function so this
        // file stays wiring and every dependency keeps a test seam.
        ...buildCareProviders(),
      ],
      child: MaterialApp.router(
        title: 'CareConnect',
        theme: ThemeData(
          primaryColor: const Color(0xFF1A73E8),
          useMaterial3: true,
        ),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}