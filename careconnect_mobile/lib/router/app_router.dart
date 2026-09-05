import 'package:flutter/material.dart';  // 👈 THIS WAS MISSING!
import 'package:go_router/go_router.dart';
import '../screens/landing_screen.dart';
import '../screens/signup_screen.dart';
import '../screens/signin_screen.dart';
import '../screens/role_selection_screen.dart';
import '../screens/home_screen.dart';
import '../screens/add_edit_patient_screen.dart';

final GoRouter router = GoRouter(
  initialLocation: '/',
  routes: [
    // ---- PUBLIC ROUTES (No auth required) ----
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

    // ---- AUTH ROUTES (After login) ----
    GoRoute(
      path: '/role-selection',
      name: 'roleSelection',
      builder: (context, state) => const RoleSelectionScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),

    // ---- PATIENT ROUTES ----
    GoRoute(
      path: '/patient/add',
      name: 'addPatient',
      builder: (context, state) => const AddEditPatientScreen(),
    ),
    GoRoute(
      path: '/patient/:id',
      name: 'patientDetail',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        // TODO: Replace with actual PatientDetailScreen when ready
        return Scaffold(
          appBar: AppBar(
            title: Text('Patient $id'),
            backgroundColor: Colors.white,
            elevation: 0,
            foregroundColor: Colors.black,
          ),
          body: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.person, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text(
                  'Patient Detail Screen',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text(
                  'Coming Soon!',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        );
      },
    ),
  ],
);