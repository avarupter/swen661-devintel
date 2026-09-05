import 'package:flutter/material.dart';

class CaregiverActivityScreen extends StatelessWidget {
  const CaregiverActivityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F9),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(),
            _buildNavigation(),
            _buildActivityLog(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Semantics(
                button: true,
                label: 'Go back',
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A73E8),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.arrow_back, color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFD7EAF4),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Color(0x33177245)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.person, size: 14, color: Color(0xFF1A73E8)),
                    SizedBox(width: 4),
                    Text('Caregiver', style: TextStyle(color: Color(0xFF1A73E8), fontSize: 14)),
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
          ),
          const SizedBox(height: 12),
          Semantics(
            header: true,
            label: 'Thursday 4 June, 5:39 AM',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: const TextSpan(
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                    children: [
                      TextSpan(text: 'Thursday 4 June '),
                      TextSpan(text: '5:39 AM', style: TextStyle(color: Color(0xFF1A73E8))),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                RichText(
                  text: const TextSpan(
                    style: TextStyle(fontSize: 18, color: Color(0xFF667085)),
                    children: [
                      TextSpan(text: 'Good morning, Joyce · '),
                      TextSpan(text: 'Activity Log', style: TextStyle(color: Color(0xFF1F2937))),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  "Viewing Margaret's care plan",
                  style: TextStyle(color: Color(0xFF1A73E8), fontSize: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigation() {
    return Container(
      padding: const EdgeInsets.all(12),
      color: Colors.white,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          Semantics(
            button: true,
            label: 'Navigate to Dashboard',
            child: _buildNavItem('Dashboard', Icons.dashboard, false),
          ),
          Semantics(
            button: true,
            label: 'Navigate to Medications',
            child: _buildNavItem('Medications', Icons.medication, false),
          ),
          Semantics(
            button: true,
            label: 'Navigate to Appointments',
            child: _buildNavItem('Appointments', Icons.calendar_month, false),
          ),
          Semantics(
            button: true,
            label: 'Navigate to Activity',
            child: _buildNavItem('Activity', Icons.fitness_center, true),
          ),
          Semantics(
            button: true,
            label: 'Navigate to Notes',
            child: _buildNavItem('Notes', Icons.note, false),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(String label, IconData icon, bool isActive) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFD7EAF4) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: isActive ? const Color(0xFF1A73E8) : const Color(0xFF1F2937)),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: isActive ? const Color(0xFF1A73E8) : const Color(0xFF1F2937),
              fontWeight: isActive ? FontWeight.w500 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityLog() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: const Color(0xFFF4F7F9),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            label: 'Activity log',
            child: Row(
              children: [
                const Icon(Icons.history, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Activity log',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Margaret's recent actions — medications taken, check-ins, and tasks",
            style: TextStyle(color: Color(0xFF667085), fontSize: 16),
          ),
          const SizedBox(height: 16),
          // Filters
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Semantics(
                button: true,
                label: 'Refresh activity log',
                child: _buildFilterChip('Refresh', true, Icons.refresh),
              ),
              Semantics(
                button: true,
                label: 'Filter by Medication taken',
                child: _buildFilterChip('Medication taken', false, null),
              ),
              Semantics(
                button: true,
                label: 'Filter by Medication unmarked',
                child: _buildFilterChip('Medication unmarked', false, null),
              ),
              Semantics(
                button: true,
                label: 'Filter by Task completed',
                child: _buildFilterChip('Task completed', false, null),
              ),
              Semantics(
                button: true,
                label: 'Filter by Checked in',
                child: _buildFilterChip('Checked in', false, null),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Empty state
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFC9D1DC), width: 2),
            ),
            child: Column(
              children: [
                const Icon(Icons.inbox, size: 48, color: Color(0xFFC9D1DC)),
                const SizedBox(height: 16),
                const Text(
                  'No activity yet',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Events will appear here when Margaret takes medications, completes tasks, or checks in.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF667085), fontSize: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isActive, IconData? icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD5DBE3), width: 2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isActive) ...[
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: Color(0xFF1A73E8),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Text(label, style: const TextStyle(color: Color(0xFF1F2937))),
        ],
      ),
    );
  }
}