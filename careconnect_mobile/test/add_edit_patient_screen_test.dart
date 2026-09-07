import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:careconnect_mobile/screens/add_edit_patient_screen.dart';
import 'package:careconnect_mobile/providers/patient_provider.dart';
import 'package:careconnect_mobile/models/patient.dart';

class FakePatientProvider extends PatientProvider {
  final List<Patient> _fakePatients = [];

  @override
  List<Patient> get patients => _fakePatients;

  @override
  void addPatient(Patient patient) {
    _fakePatients.add(patient);
    notifyListeners();
  }

  @override
  void updatePatient(Patient updated) {
    final index = _fakePatients.indexWhere((p) => p.id == updated.id);
    if (index != -1) {
      _fakePatients[index] = updated;
      notifyListeners();
    }
  }
}

void main() {
  Widget createWidgetUnderTest({Patient? patient, PatientProvider? provider}) {
    final fakeProvider = provider ?? FakePatientProvider();
    return ChangeNotifierProvider<PatientProvider>.value(
      value: fakeProvider,
      child: MaterialApp(
        home: AddEditPatientScreen(patient: patient),
      ),
    );
  }

  group('AddEditPatientScreen Widget Tests', () {
    testWidgets('renders add patient title and empty form fields in add mode', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Add Patient'), findsNWidgets(2)); // Title and button
      expect(find.byType(TextFormField), findsNWidgets(3));
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('renders edit patient title and pre-filled form fields in edit mode', (WidgetTester tester) async {
      final existingPatient = Patient(id: '1', name: 'Dorothy Smith', age: 78, condition: "Alzheimer's");
      await tester.pumpWidget(createWidgetUnderTest(patient: existingPatient));

      expect(find.text('Edit Patient'), findsOneWidget);
      expect(find.text('Update Patient'), findsOneWidget);
      expect(find.text('Dorothy Smith'), findsOneWidget);
      expect(find.text('78'), findsOneWidget);
      expect(find.text("Alzheimer's"), findsOneWidget);
    });

    testWidgets('validates required fields when submitted empty', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(find.text('Please enter a patient name'), findsOneWidget);
      expect(find.text('Please enter an age'), findsOneWidget);
    });

    testWidgets('verifies accessibility semantics for input fields and submit button', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Patient name required',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Patient age required',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Add new patient',
        ),
        findsOneWidget,
      );
    });
  });
}
