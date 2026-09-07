import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:careconnect_mobile/screens/profile_screen.dart';
import 'package:careconnect_mobile/providers/auth_provider.dart';

void main() {
  Widget createWidgetUnderTest({AuthProvider? authProvider}) {
    final auth = authProvider ?? AuthProvider();
    return ChangeNotifierProvider<AuthProvider>.value(
      value: auth,
      child: const MaterialApp(
        home: ProfileScreen(),
      ),
    );
  }

  group('ProfileScreen Widget Tests', () {
    testWidgets('renders fallback default patient profile when no user logged in', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Patient'), findsNWidgets(2)); // Name and role badge
      expect(find.text('patient@example.com'), findsOneWidget);
      expect(find.text('?'), findsOneWidget); // Default initial avatar
    });

    testWidgets('renders logged-in user profile name, email, and avatar initial', (WidgetTester tester) async {
      final auth = AuthProvider();
      auth.signUp('Dorothy', 'dorothy@example.com', 'password123');

      await tester.pumpWidget(createWidgetUnderTest(authProvider: auth));

      expect(find.text('Dorothy'), findsOneWidget);
      expect(find.text('dorothy@example.com'), findsOneWidget);
      expect(find.text('D'), findsOneWidget); // Initial avatar
      expect(find.text('Patient'), findsOneWidget); // Role badge
    });

    testWidgets('renders health summary cards and sign out button', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Medications'), findsOneWidget);
      expect(find.text('Appointments'), findsOneWidget);
      expect(find.text('Tasks'), findsOneWidget);
      expect(find.text('Sign Out'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('verifies accessibility semantics for profile elements', (WidgetTester tester) async {
      final auth = AuthProvider();
      auth.signUp('Dorothy', 'dorothy@example.com', 'password123');

      await tester.pumpWidget(createWidgetUnderTest(authProvider: auth));

      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Profile picture for Dorothy',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Sign out of your account',
        ),
        findsOneWidget,
      );
    });
  });
}
