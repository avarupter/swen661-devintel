import 'package:go_router/go_router.dart';
import '../screens/landing_screen.dart';
import '../screens/signup_screen.dart';
import '../screens/signin_screen.dart';
import '../screens/caregiver_activity_screen.dart';
import '../screens/caregiver_appointments_screen.dart';
import '../screens/caregiver_medication_forms_screen.dart';
import '../screens/caregiver_medications_screen.dart';

final GoRouter router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'landing',
      builder: (context, state) => const LandingScreen(),
    ),
    GoRoute(
      path: '/signup',
      name: 'signup',
      builder: (context, state) => const SignUpScreen(),
    ),
    GoRoute(
      path: '/signin',
      name: 'signin',
      builder: (context, state) => const SignInScreen(),
    ),
    GoRoute(
      path: '/caregiver_activity',
      name: 'caregiver_activity',
      builder: (context, state) => const CaregiverActivityScreen(),
    ),
    GoRoute(
      path: '/caregiver_appointments',
      name: 'caregiver_appointments',
      builder: (context, state) => const CaregiverAppointmentsScreen(),
    ),
    GoRoute(
      path: '/caregiver_medication_forms',
      name: 'caregiver_medication_forms',
      builder: (context, state) => const CaregiverMedicationFormsScreen(),
    ),
    GoRoute(
      path: '/caregiver_medications',
      name: 'caregiver_medications',
      builder: (context, state) => const CaregiverMedicationsScreen(),
    ),
  ],
);