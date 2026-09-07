import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/screens/appointment_list_screen.dart';
import 'package:careconnect_mobile/screens/help_screen.dart';
import 'package:careconnect_mobile/screens/medication_list_screen.dart';
import 'package:careconnect_mobile/screens/messages_screen.dart';

void main() {
  group('Placeholder Screens Widget Tests', () {
    testWidgets('renders AppointmentListScreen placeholder content', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: AppointmentListScreen()),
      );

      expect(find.text('Appointments - coming soon'), findsOneWidget);
    });

    testWidgets('renders HelpScreen placeholder content', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: HelpScreen()),
      );

      expect(find.text('Help - coming soon'), findsOneWidget);
    });

    testWidgets('renders MedicationListScreen placeholder content', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: MedicationListScreen()),
      );

      expect(find.text('Medications - coming soon'), findsOneWidget);
    });

    testWidgets('renders MessagesScreen placeholder content', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: MessagesScreen()),
      );

      expect(find.text('Messages - coming soon'), findsOneWidget);
    });
  });
}
