import 'package:flutter/material.dart';

class CaregiverMedicationFormsScreen extends StatelessWidget {
  const CaregiverMedicationFormsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Medication'),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 16),
            _buildGreeting(),
            const SizedBox(height: 24),
            _buildNavButtons(),
            const SizedBox(height: 24),
            _buildForm(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFF1A73E8),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.arrow_back, color: Colors.white),
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFDEF2EA),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.person, size: 14, color: Color(0xFF16694C)),
              SizedBox(width: 4),
              Text('Caregiver', style: TextStyle(color: Color(0xFF16694C), fontSize: 13)),
            ],
          ),
        ),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Text('Joyce', style: TextStyle(fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _buildGreeting() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: const TextSpan(
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
            children: [
              TextSpan(text: 'Thursday 4 June '),
              TextSpan(text: '5:38 AM', style: TextStyle(color: Color(0xFF1A73E8))),
            ],
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Good morning, Joyce · Manage Medications',
          style: TextStyle(color: Color(0xFF667085), fontSize: 16),
        ),
        const SizedBox(height: 4),
        const Text(
          "Viewing Margaret's care plan",
          style: TextStyle(color: Color(0xFF16694C), fontSize: 13),
        ),
      ],
    );
  }

  Widget _buildNavButtons() {
    return Column(
      children: [
        _buildNavButton('Dashboard', Icons.dashboard, false),
        _buildNavButton('Medications', Icons.medication, true),
        _buildNavButton('Appointments', Icons.calendar_month, false),
        _buildNavButton('Activity', Icons.fitness_center, false),
        _buildNavButton('Notes', Icons.note, false),
      ],
    );
  }

  Widget _buildNavButton(String label, IconData icon, bool isActive) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFD9EEF7) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: isActive ? const Color(0xFF0A7199) : const Color(0xFF1F2937)),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: isActive ? const Color(0xFF0A7199) : const Color(0xFF1F2937))),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFC7D0DA), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Add new medication',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          const Text('Medication name (required) *', style: TextStyle(color: Color(0xFFDC2626))),
          const SizedBox(height: 8),
          TextField(
            decoration: InputDecoration(
              hintText: 'e.g. Amlodipine',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFBCC5D1), width: 2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Dose (required) *', style: TextStyle(color: Color(0xFFDC2626))),
          const SizedBox(height: 8),
          TextField(
            decoration: InputDecoration(
              hintText: 'e.g. 5 mg — 1 tablet',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFBCC5D1), width: 2),
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Include strength, form, and quantity.',
            style: TextStyle(color: Color(0xFF667085), fontSize: 13),
          ),
          const SizedBox(height: 16),
          const Text('Schedule times (required) *', style: TextStyle(color: Color(0xFFDC2626))),
          const SizedBox(height: 8),
          TextField(
            decoration: InputDecoration(
              hintText: 'e.g. 8:30 AM, 2:00 PM',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFBCC5D1), width: 2),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A73E8),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Save Medication', style: TextStyle(fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}