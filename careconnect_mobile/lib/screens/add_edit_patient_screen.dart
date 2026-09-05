import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/patient_provider.dart';
import '../models/patient.dart';

class AddEditPatientScreen extends StatefulWidget {
  final Patient? patient;
  const AddEditPatientScreen({super.key, this.patient});

  @override
  State<AddEditPatientScreen> createState() => _AddEditPatientScreenState();
}

class _AddEditPatientScreenState extends State<AddEditPatientScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _conditionController;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _isEditing = widget.patient != null;
    _nameController = TextEditingController(text: widget.patient?.name ?? '');
    _ageController = TextEditingController(
      text: widget.patient?.age.toString() ?? '',
    );
    _conditionController = TextEditingController(
      text: widget.patient?.condition ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _conditionController.dispose();
    super.dispose();
  }

  void _savePatient() {
    if (_formKey.currentState!.validate()) {
      final patientProvider = Provider.of<PatientProvider>(context, listen: false);
      
      if (_isEditing) {
        // Update existing patient
        final updatedPatient = Patient(
          id: widget.patient!.id,
          name: _nameController.text.trim(),
          age: int.parse(_ageController.text.trim()),
          condition: _conditionController.text.trim(),
        );
        patientProvider.updatePatient(updatedPatient);
      } else {
        // Add new patient
        final newPatient = Patient(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          name: _nameController.text.trim(),
          age: int.parse(_ageController.text.trim()),
          condition: _conditionController.text.trim(),
        );
        patientProvider.addPatient(newPatient);
      }
      
      // Go back to patient list
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Patient' : 'Add Patient'),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Name Field
              Semantics(
                label: 'Patient name required',
                child: TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Patient Name *',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter a patient name';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(height: 16),
              
              // Age Field
              Semantics(
                label: 'Patient age required',
                child: TextFormField(
                  controller: _ageController,
                  decoration: const InputDecoration(
                    labelText: 'Age *',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter an age';
                    }
                    if (int.tryParse(value) == null) {
                      return 'Please enter a valid number';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(height: 16),
              
              // Condition Field
              Semantics(
                label: 'Medical condition',
                child: TextFormField(
                  controller: _conditionController,
                  decoration: const InputDecoration(
                    labelText: 'Condition',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Save Button
              Semantics(
                button: true,
                label: _isEditing ? 'Save patient changes' : 'Add new patient',
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _savePatient,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A73E8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      _isEditing ? 'Update Patient' : 'Add Patient',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}