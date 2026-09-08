import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'patient_appointments_screen.dart';
import 'patient_list_screen.dart';
import 'patient_medications_screen.dart';
import 'patient_today_screen.dart';
import 'profile_screen.dart';  // NEW: Patient profile screen
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
    final List<Widget> screens = isPatient
        ? [
            // The patient tabs used to render the CAREGIVER screens, which
            // showed one hard-coded medicine and no state of the patient's own.
            const PatientTodayScreen(),        // Tab 0: Today (landing tab)
            const PatientMedicationsScreen(),  // Tab 1: My Medications
            const PatientAppointmentsScreen(), // Tab 2: My Appointments
            ProfileScreen(),                   // Tab 3: My Profile
            HelpScreen(),                      // Tab 4: Help
          ]
        : [
            PatientListScreen(),          // Tab 0: Patients (caregiver)
            CaregiverMedicationsScreen(), // Tab 1: Medications
            CaregiverAppointmentsScreen(),// Tab 2: Appointments
            CaregiverActivityScreen(),    // Tab 3: Activity
            HelpScreen(),                 // Tab 4: Help
          ];

    // Different bottom nav items based on role
    final List<BottomNavigationBarItem> items = isPatient
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
            BottomNavigationBarItem(
              icon: Icon(Icons.help),
              label: 'Help',
            ),
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
            BottomNavigationBarItem(
              icon: Icon(Icons.help),
              label: 'Help',
            ),
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
        // Optional: Add a welcome message for patients
        bottom: isPatient
            ? PreferredSize(
                preferredSize: const Size.fromHeight(32),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      const Icon(Icons.waving_hand, size: 20, color: Color(0xFF1A73E8)),
                      const SizedBox(width: 8),
                      // Expanded so the strip wraps instead of overflowing on
                      // a narrow phone or at a large system text size.
                      Expanded(
                        child: Text(
                          'Welcome back! Here\'s your care summary.',
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