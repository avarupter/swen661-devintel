import 'package:flutter/material.dart';

class CaregiverMedicationsScreen extends StatelessWidget {
  const CaregiverMedicationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(),
            _buildGreeting(),
            _buildMedicationList(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Row(
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
              color: const Color(0xFFCDE9DE),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.person, size: 14, color: Color(0xFF146C94)),
                SizedBox(width: 4),
                Text('Caregiver', style: TextStyle(color: Color(0xFF146C94), fontSize: 14)),
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
    );
  }

  Widget _buildGreeting() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            label: 'Thursday 4 June, 5:38 AM',
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
                      style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                      children: [
                        TextSpan(text: 'Thursday 4 June '),
                        TextSpan(text: '5:38 AM', style: TextStyle(color: Color(0xFF1A73E8))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  RichText(
                    text: const TextSpan(
                      style: TextStyle(fontSize: 16, color: Color(0xFF667085)),
                      children: [
                        TextSpan(text: 'Good morning, Joyce · '),
                        TextSpan(text: 'Manage Medications', style: TextStyle(color: Color(0xFF1F2937))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "Viewing Margaret's care plan",
                    style: TextStyle(color: Color(0xFF146C94), fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMedicationList() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: const Color(0xFFF4F6F8),
      child: Column(
        children: [
          _buildMedicationCard(
            title: '8:30 am',
            note: 'Take with or without food.',
            time: '8:30 am',
          ),
          const SizedBox(height: 16),
          _buildMedicationCard(
            title: 'Vitamin D3',
            dosage: '1000 IU — 1 capsule',
            note: 'Take with breakfast.',
            time: '8:30 am',
          ),
        ],
      ),
    );
  }

  Widget _buildMedicationCard({
    required String title,
    String? dosage,
    required String note,
    required String time,
  }) {
    return Semantics(
      button: true,
      label: '$title medication${dosage != null ? ' - $dosage' : ''}',
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFBFC7D1)),
          boxShadow: const [
            BoxShadow(color: Color(0x14101828), offset: Offset(0, 1), blurRadius: 2),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (dosage != null) ...[
              Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(dosage, style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
            ],
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFD5EDF6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.access_time, size: 14, color: Color(0xFF146C94)),
                  const SizedBox(width: 4),
                  Text(time, style: const TextStyle(color: Color(0xFF146C94), fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(note, style: const TextStyle(color: Color(0xFF667085), fontStyle: FontStyle.italic)),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            Row(
              children: [
                Semantics(
                  button: true,
                  label: 'Edit this medication',
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF146C94), width: 2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.edit, size: 16, color: Color(0xFF146C94)),
                        SizedBox(width: 6),
                        Text('Edit', style: TextStyle(color: Color(0xFF146C94), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Semantics(
                  button: true,
                  label: 'Delete this medication',
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