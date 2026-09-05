import 'package:flutter/material.dart';

class CaregiverAppointmentsScreen extends StatelessWidget {
  const CaregiverAppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 16),
            _buildGreeting(),
            const SizedBox(height: 24),
            _buildAppointmentCard(
              title: 'Vision Plus Opticians',
              subtitle: '22 High Street, Westfield',
              note: 'Routine yearly eye test. Your glasses prescription may be updated. No special preparation needed.',
            ),
            const SizedBox(height: 16),
            _buildAppointmentCard(
              title: 'Annual health review — Dr. Sharma',
              subtitle: 'Monday 22 June — 2:00 pm',
              location: 'Greenfield Surgery — 12 Greenfield Road, Westfield',
              note: 'Your yearly health check. Dr. Sharma will review all your medicines. Maria will drive you.',
              isLarge: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
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
            color: const Color(0xFFCDEADF),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.person, size: 14, color: Color(0xFF1F6F56)),
              SizedBox(width: 4),
              Text('Caregiver', style: TextStyle(color: Color(0xFF1F6F56), fontSize: 14)),
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
    return Semantics(
      header: true,
      label: 'Thursday 4 June, 5:39 AM',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            RichText(
              text: const TextSpan(
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF27303F)),
                children: [
                  TextSpan(text: 'Thursday 4 June '),
                  TextSpan(text: '5:39 AM', style: TextStyle(color: Color(0xFF1A73E8))),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Good morning, Joyce · Manage Appointments',
              style: TextStyle(color: Color(0xFF6D7788), fontSize: 16),
            ),
            const SizedBox(height: 4),
            const Text(
              "Viewing Margaret's care plan",
              style: TextStyle(color: Color(0xFF1F6F56), fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard({
    required String title,
    required String subtitle,
    String? location,
    required String note,
    bool isLarge = false,
  }) {
    return Semantics(
      button: true,
      label: title,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(color: Color(0x1427303F), offset: Offset(0, 1), blurRadius: 2),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on, size: 14, color: Color(0xFF6D7788)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: isLarge ? 20 : 16,
                      color: const Color(0xFF27303F),
                      fontWeight: isLarge ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
              ],
            ),
            if (location != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: Color(0xFF6D7788)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(location, style: const TextStyle(color: Color(0xFF6D7788))),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.access_time, size: 14, color: Color(0xFF6D7788)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(subtitle, style: const TextStyle(color: Color(0xFF27303F))),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F5F7),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFD6DCE3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline, size: 14, color: Color(0xFF6D7788)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(note, style: const TextStyle(color: Color(0xFF27303F), fontSize: 14)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Semantics(
                  button: true,
                  label: 'Edit this appointment',
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF1E7099), width: 2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.edit, size: 16, color: Color(0xFF1E7099)),
                        SizedBox(width: 6),
                        Text('Edit', style: TextStyle(color: Color(0xFF1E7099), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Semantics(
                  button: true,
                  label: 'Delete this appointment',
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    child: const Text(
                      'Delete',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}