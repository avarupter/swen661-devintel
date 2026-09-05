import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../models/patient.dart';

class PatientProvider extends ChangeNotifier {
  List<Patient> _patients = [];
  static const String _fileName = 'patients.json';

  List<Patient> get patients => _patients;

  PatientProvider() {
    _loadPatients();
  }

  // Get the file path where we'll store data
  Future<File> _getFile() async {
    final directory = await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  // Load patients from the JSON file
  Future<void> _loadPatients() async {
    try {
      final file = await _getFile();
      if (await file.exists()) {
        final contents = await file.readAsString();
        final List<dynamic> jsonList = jsonDecode(contents);
        _patients = jsonList.map((item) => Patient.fromJson(item)).toList();
      } else {
        // First time running – seed with default data
        _patients = [
          Patient(id: '1', name: 'Dorothy Smith', age: 78, condition: "Alzheimer's"),
          Patient(id: '2', name: 'Robert Johnson', age: 65, condition: "Parkinson's"),
        ];
        await _savePatients(); // Save defaults to file
      }
    } catch (e) {
      // If anything fails, use defaults
      _patients = [
        Patient(id: '1', name: 'Dorothy Smith', age: 78, condition: "Alzheimer's"),
        Patient(id: '2', name: 'Robert Johnson', age: 65, condition: "Parkinson's"),
      ];
      await _savePatients();
    }
    notifyListeners(); // Tell the UI to rebuild
  }

  // Save patients to the JSON file
  Future<void> _savePatients() async {
    final file = await _getFile();
    final jsonList = _patients.map((p) => p.toJson()).toList();
    final jsonString = jsonEncode(jsonList);
    await file.writeAsString(jsonString);
  }

  // --- CRUD Operations (Create, Read, Update, Delete) ---

  void addPatient(Patient patient) {
    _patients.add(patient);
    _savePatients();
    notifyListeners();
  }

  void updatePatient(Patient updated) {
    final index = _patients.indexWhere((p) => p.id == updated.id);
    if (index != -1) {
      _patients[index] = updated;
      _savePatients();
      notifyListeners();
    }
  }

  void deletePatient(String id) {
    _patients.removeWhere((p) => p.id == id);
    _savePatients();
    notifyListeners();
  }

  Patient? getPatientById(String id) {
    try {
      return _patients.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }
}