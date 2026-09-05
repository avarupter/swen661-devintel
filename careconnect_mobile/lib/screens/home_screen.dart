import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'patient_list_screen.dart';
import 'medication_list_screen.dart';
import 'appointment_list_screen.dart';
import 'messages_screen.dart';
import 'help_screen.dart';
import '../providers/auth_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _screens = [
    PatientListScreen(),      // Tab 0: Patients
    MedicationListScreen(),   // Tab 1: Medications
    AppointmentListScreen(),  // Tab 2: Appointments
    MessagesScreen(),         // Tab 3: Messages
    HelpScreen(),             // Tab 4: Help
  ];

  @override
  Widget build(BuildContext context) {
    // Get the user's role to customize the UI
    final role = Provider.of<AuthProvider>(context).role;
    
    return Scaffold(
      appBar: AppBar(
        // Show different titles based on role
        title: Text(
          role == 'patient' ? 'My Care' : 'Care Dashboard',
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            color: Color(0xFF1E293B),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed, // For 5+ items
        items: const [
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
            icon: Icon(Icons.message),
            label: 'Messages',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.help),
            label: 'Help',
          ),
        ],
      ),
    );
  }
}