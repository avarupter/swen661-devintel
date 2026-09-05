import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/patient_provider.dart';

class PatientListScreen extends StatelessWidget {
  const PatientListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final patients = Provider.of<PatientProvider>(context).patients;

    return Scaffold(
      appBar: AppBar(title: const Text('Patients')),
      body: patients.isEmpty
          ? const Center(child: Text('No patients yet. Add one!'))
          : ListView.builder(
              itemCount: patients.length,
              itemBuilder: (context, index) {
                final patient = patients[index];
                return Semantics(
                  button: true,
                  label: 'View details for ${patient.name}',
                  child: ListTile(
                    title: Text(patient.name),
                    subtitle: Text('${patient.age} yrs • ${patient.condition}'),
                    onTap: () {
                      context.pushNamed(
                        'patientDetail',
                        pathParameters: {'id': patient.id},
                      );
                    },
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/patient/add'),
        tooltip: 'Add new patient',
        child: const Icon(Icons.add),
      ),
    );
  }
}