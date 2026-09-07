import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:careconnect_mobile/screens/home_screen.dart';
import 'package:careconnect_mobile/providers/auth_provider.dart';
import 'package:careconnect_mobile/providers/patient_provider.dart';
import 'package:careconnect_mobile/models/patient.dart';

class FakePatientProvider extends PatientProvider {
  @override
  List<Patient> get patients => [];
}

void main() {
  Widget createWidgetUnderTest(AuthProvider authProvider) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        ChangeNotifierProvider<PatientProvider>(create: (_) => FakePatientProvider()),
      ],
      child: const MaterialApp(
        home: HomeScreen(),
      ),
    );
  }

  group('HomeScreen Widget Tests', () {
    testWidgets('renders patient care dashboard and bottom navigation for patient role', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final auth = AuthProvider();
      auth.signUp('Dorothy', 'dorothy@example.com', 'pass');
      auth.setRole('patient');

      await tester.pumpWidget(createWidgetUnderTest(auth));

      // Header title & welcome message
      expect(find.text('My Care'), findsOneWidget);
      expect(find.text("Welcome back! Here's your care summary."), findsOneWidget);

      // Bottom nav bar items for patient
      final bottomNav = find.byType(BottomNavigationBar);
      expect(bottomNav, findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Profile')), findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Medications')), findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Appointments')), findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Help')), findsOneWidget);
    });

    testWidgets('renders caregiver care dashboard and bottom navigation for caregiver role', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final auth = AuthProvider();
      auth.signUp('Joyce', 'joyce@example.com', 'pass');
      auth.setRole('caregiver');

      await tester.pumpWidget(createWidgetUnderTest(auth));

      // Header title
      expect(find.text('Care Dashboard'), findsOneWidget);

      // Bottom nav items for caregiver
      final bottomNav = find.byType(BottomNavigationBar);
      expect(bottomNav, findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Patients')), findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Medications')), findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Appointments')), findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Activity')), findsOneWidget);
      expect(find.descendant(of: bottomNav, matching: find.text('Help')), findsOneWidget);
    });

    testWidgets('allows switching bottom navigation tabs', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final auth = AuthProvider();
      auth.signUp('Joyce', 'joyce@example.com', 'pass');
      auth.setRole('caregiver');

      await tester.pumpWidget(createWidgetUnderTest(auth));

      // Tap on Help tab in bottom nav
      final bottomNav = find.byType(BottomNavigationBar);
      await tester.tap(find.descendant(of: bottomNav, matching: find.text('Help')));
      await tester.pumpAndSettle();

      expect(find.text('Help - coming soon'), findsOneWidget);
    });
  });
}
