import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:careconnect_mobile/screens/role_selection_screen.dart';
import 'package:careconnect_mobile/providers/auth_provider.dart';

void main() {
  Widget createWidgetUnderTest({AuthProvider? authProvider}) {
    final auth = authProvider ?? AuthProvider();
    return ChangeNotifierProvider<AuthProvider>.value(
      value: auth,
      child: const MaterialApp(
        home: RoleSelectionScreen(),
      ),
    );
  }

  group('RoleSelectionScreen Widget Tests', () {
    testWidgets('renders screen title and welcome message', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Select Your Role'), findsOneWidget);
      expect(find.text('Welcome!'), findsOneWidget);
      expect(find.text('How are you using CareConnect today?'), findsOneWidget);
    });

    testWidgets('renders patient and caregiver selection cards', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text("I'm a Patient"), findsOneWidget);
      expect(find.text('Manage your own care'), findsOneWidget);
      expect(find.text("I'm a Caregiver"), findsOneWidget);
      expect(find.text('Manage patients you care for'), findsOneWidget);
      expect(find.byType(Card), findsNWidgets(2));
    });

    testWidgets('verifies accessibility semantics for role options', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == "Select patient role. Manage your own care.",
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == "Select caregiver role. Manage patients you care for.",
        ),
        findsOneWidget,
      );
    });
  });
}
