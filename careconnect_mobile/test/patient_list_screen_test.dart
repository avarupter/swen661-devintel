import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:careconnect_mobile/screens/patient_list_screen.dart';
import 'package:careconnect_mobile/providers/patient_provider.dart';
import 'package:careconnect_mobile/models/patient.dart';

class FakePatientProvider extends PatientProvider {
  final List<Patient> _fakePatients;

  FakePatientProvider([List<Patient>? initialPatients])
      : _fakePatients = initialPatients ??
            [
              Patient(id: '1', name: 'Dorothy Smith', age: 78, condition: "Alzheimer's"),
              Patient(id: '2', name: 'Robert Johnson', age: 65, condition: "Parkinson's"),
            ];

  @override
  List<Patient> get patients => _fakePatients;
}

void main() {
  Widget createWidgetUnderTest(PatientProvider patientProvider) {
    return ChangeNotifierProvider<PatientProvider>.value(
      value: patientProvider,
      child: const MaterialApp(
        home: PatientListScreen(),
      ),
    );
  }

  group('PatientListScreen Widget Tests', () {
    testWidgets('renders empty state message when no patients exist', (WidgetTester tester) async {
      final fakeProvider = FakePatientProvider([]);
      await tester.pumpWidget(createWidgetUnderTest(fakeProvider));

      expect(find.text('Patients'), findsOneWidget);
      expect(find.text('No patients yet. Add one!'), findsOneWidget);
      expect(find.byType(FloatingActionButton), findsOneWidget);
    });

    testWidgets('renders list of patients when patients exist', (WidgetTester tester) async {
      final fakeProvider = FakePatientProvider();
      await tester.pumpWidget(createWidgetUnderTest(fakeProvider));

      expect(find.text('Patients'), findsOneWidget);
      expect(find.text('Dorothy Smith'), findsOneWidget);
      expect(find.text("78 yrs • Alzheimer's"), findsOneWidget);
      expect(find.text('Robert Johnson'), findsOneWidget);
      expect(find.text("65 yrs • Parkinson's"), findsOneWidget);
      expect(find.byType(ListTile), findsNWidgets(2));
    });

    testWidgets('verifies accessibility semantics for floating action button and list items', (WidgetTester tester) async {
      final fakeProvider = FakePatientProvider();
      await tester.pumpWidget(createWidgetUnderTest(fakeProvider));

      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Add new patient',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'View details for Dorothy Smith',
        ),
        findsOneWidget,
      );
    });
  });
}
