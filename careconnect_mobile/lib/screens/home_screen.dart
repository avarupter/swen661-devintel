import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'patient_appointments_screen.dart';
import 'patient_list_screen.dart';
import 'patient_medications_screen.dart';
import 'patient_today_screen.dart';
import 'profile_screen.dart'; // NEW: Patient profile screen
import 'caregiver_medications_screen.dart';
import 'caregiver_appointments_screen.dart';
import 'caregiver_activity_screen.dart';
import 'help_screen.dart';
import '../providers/auth_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final role = Provider.of<AuthProvider>(context).role;
    final isPatient = role == 'patient';

    // Different screens based on role
    final List<Widget> screens =
        isPatient
            ? [
              // The patient tabs used to render the CAREGIVER screens, which
              // showed one hard-coded medicine and no state of the patient's own.
              const PatientTodayScreen(), // Tab 0: Today (landing tab)
              const PatientMedicationsScreen(), // Tab 1: My Medications
              const PatientAppointmentsScreen(), // Tab 2: My Appointments
              ProfileScreen(), // Tab 3: My Profile
              HelpScreen(), // Tab 4: Help
            ]
            : [
              PatientListScreen(), // Tab 0: Patients (caregiver)
              CaregiverMedicationsScreen(), // Tab 1: Medications
              CaregiverAppointmentsScreen(), // Tab 2: Appointments
              CaregiverActivityScreen(), // Tab 3: Activity
              HelpScreen(), // Tab 4: Help
            ];

    // Different bottom nav items based on role
    final List<BottomNavigationBarItem> items =
        isPatient
            ? const [
              // Today is first: a dashboard you have to navigate to is not a
              // dashboard, and it is the screen that orients the patient.
              BottomNavigationBarItem(
                icon: Icon(Icons.wb_sunny),
                label: 'Today',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.medication),
                label: 'Medications',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.calendar_month),
                label: 'Appointments',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: 'Profile',
              ),
              BottomNavigationBarItem(icon: Icon(Icons.help), label: 'Help'),
            ]
            : const [
              BottomNavigationBarItem(
                icon: Icon(Icons.people),
                label: 'Patients',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.medication),
                label: 'Medications',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.calendar_month),
                label: 'Appointments',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.fitness_center),
                label: 'Activity',
              ),
              BottomNavigationBarItem(icon: Icon(Icons.help), label: 'Help'),
            ];

    // Ensure selected index is valid for the current role
    if (_selectedIndex >= screens.length) {
      _selectedIndex = 0;
    }

    return Scaffold(
      appBar: AppBar(
        title: Semantics(
          header: true,
          label: isPatient ? 'My Care dashboard' : 'Care Dashboard',
          child: Text(
            isPatient ? 'My Care' : 'Care Dashboard',
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        // The toolbar has to grow with the text too. kToolbarHeight is a fixed
        // 56 dp, so at 2.0x system text the title alone overflowed the AppBar's
        // own vertical flex by 40 px — striped overflow bars across the top of
        // every patient screen, on the setting a low-vision or older user is
        // most likely to have turned on.
        toolbarHeight: math.max(
          kToolbarHeight,
          MediaQuery.textScalerOf(context).scale(22) * 2.0 + 16,
        ),
        // Optional: Add a welcome message for patients
        bottom:
            isPatient
                ? PreferredSize(
                  // Measured rather than guessed.
                  //
                  // PreferredSize needs its height up front, so it cannot
                  // discover how tall the wrapped text turned out. The original
                  // fixed 32 dp overflowed by 2 px at 1.5x system text and by
                  // 47 px at 2.0x, painting the striped overflow banner across
                  // the top of every patient screen at exactly the font sizes
                  // this app exists to support. Laying the string out with a
                  // TextPainter gives the real height at any scale.
                  preferredSize: Size.fromHeight(_welcomeStripHeight(context)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.waving_hand,
                          size: 20,
                          color: Color(0xFF1A73E8),
                        ),
                        const SizedBox(width: 8),
                        // Expanded so the strip wraps instead of overflowing on
                        // a narrow phone or at a large system text size.
                        Expanded(
                          child: Text(
                            _welcomeMessage,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                : null,
      ),
      body: screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        items: items,
      ),
    );
  }
}

/// Height of the patient welcome strip at the current text scale.
///
/// Lays the sentence out at the width it will actually get — the screen minus
/// the strip's horizontal padding, the icon and the gap — and returns the
/// resulting height plus a little breathing room.
double _welcomeStripHeight(BuildContext context) {
  const horizontalPadding = 16.0 * 2;
  const iconAndGap = 20.0 + 8.0;
  const verticalPadding = 8.0;

  final available =
      MediaQuery.sizeOf(context).width - horizontalPadding - iconAndGap;
  final painter = TextPainter(
    text: TextSpan(text: _welcomeMessage, style: const TextStyle(fontSize: 14)),
    textDirection: Directionality.of(context),
    textScaler: MediaQuery.textScalerOf(context),
  )..layout(maxWidth: available > 0 ? available : 0);

  // Never shorter than the icon, so the row stays balanced at normal sizes.
  return math.max(painter.height, 20.0) + verticalPadding;
}

const String _welcomeMessage = "Welcome back! Here's your care summary.";
