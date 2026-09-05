import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Select Your Role'),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Semantics(
              header: true,
              label: 'Welcome to CareConnect. Please select your role.',
              child: Column(
                children: [
                  Text(
                    'Welcome${user?.name != null ? ', ${user!.name}' : ''}!',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'How are you using CareConnect today?',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
            // Patient Button with Semantics
            Semantics(
              button: true,
              label: 'Select patient role. Manage your own care.',
              child: _buildRoleButton(
                context: context,
                icon: Icons.person,
                title: 'I\'m a Patient',
                subtitle: 'Manage your own care',
                color: Colors.blue,
                onTap: () {
                  authProvider.setRole('patient');
                  context.go('/home');
                },
              ),
            ),
            const SizedBox(height: 16),
            // Caregiver Button with Semantics
            Semantics(
              button: true,
              label: 'Select caregiver role. Manage patients you care for.',
              child: _buildRoleButton(
                context: context,
                icon: Icons.people,
                title: 'I\'m a Caregiver',
                subtitle: 'Manage patients you care for',
                color: Colors.teal,
                onTap: () {
                  authProvider.setRole('caregiver');
                  context.go('/home');
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _buildRoleButton({
  required BuildContext context,
  required IconData icon,
  required String title,
  required String subtitle,
  required Color color,
  required VoidCallback onTap,
}) {
  return SizedBox(
    width: double.infinity,
    child: Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 20, color: Colors.grey),
            ],
          ),
        ),
      ),
    ),
  );
}