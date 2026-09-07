import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/models/patient.dart';

void main() {
  group('Patient Model Unit Tests', () {
    test('creates Patient instance with correct properties', () {
      final patient = Patient(
        id: '101',
        name: 'Margaret Walker',
        age: 82,
        condition: 'Dementia',
      );

      expect(patient.id, '101');
      expect(patient.name, 'Margaret Walker');
      expect(patient.age, 82);
      expect(patient.condition, 'Dementia');
    });

    test('toJson serializes Patient into valid Map', () {
      final patient = Patient(
        id: '102',
        name: 'Arthur Pendelton',
        age: 75,
        condition: 'Hypertension',
      );

      final jsonMap = patient.toJson();

      expect(jsonMap, {
        'id': '102',
        'name': 'Arthur Pendelton',
        'age': 75,
        'condition': 'Hypertension',
      });
    });

    test('fromJson deserializes Map into valid Patient object', () {
      final jsonMap = {
        'id': '103',
        'name': 'Eleanor Vance',
        'age': 68,
        'condition': 'Arthritis',
      };

      final patient = Patient.fromJson(jsonMap);

      expect(patient.id, '103');
      expect(patient.name, 'Eleanor Vance');
      expect(patient.age, 68);
      expect(patient.condition, 'Arthritis');
    });

    test('supports JSON round-trip serialization and deserialization', () {
      final originalPatient = Patient(
        id: '104',
        name: 'Samuel Clemens',
        age: 71,
        condition: 'Diabetes',
      );

      final jsonMap = originalPatient.toJson();
      final restoredPatient = Patient.fromJson(jsonMap);

      expect(restoredPatient.id, originalPatient.id);
      expect(restoredPatient.name, originalPatient.name);
      expect(restoredPatient.age, originalPatient.age);
      expect(restoredPatient.condition, originalPatient.condition);
    });
  });
}
