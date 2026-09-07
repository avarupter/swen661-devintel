import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:careconnect_mobile/screens/signup_screen.dart';
import 'package:careconnect_mobile/providers/auth_provider.dart';

void main() {
  Widget createWidgetUnderTest() {
    return ChangeNotifierProvider<AuthProvider>(
      create: (_) => AuthProvider(),
      child: const MaterialApp(
        home: SignUpScreen(),
      ),
    );
  }

  group('SignUpScreen Widget Tests', () {
    testWidgets('renders screen header and subtitle', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('CareConnect'), findsOneWidget);
      expect(find.text('Create your account'), findsOneWidget);
      expect(find.text('Free, private, and takes under two minutes.'), findsOneWidget);
    });

    testWidgets('renders all required registration input fields', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Your name *'), findsOneWidget);
      expect(find.text('Email address *'), findsOneWidget);
      expect(find.text('Password *'), findsOneWidget);
      expect(find.text('Confirm password *'), findsOneWidget);
      expect(find.byType(TextField), findsNWidgets(4));
    });

    testWidgets('renders create account button and sign in navigation link', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Create account'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.text('Already have an account? Sign in'), findsOneWidget);
    });

    testWidgets('verifies accessibility semantics on create account button and sign in link', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Create your new account',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Already have an account? Sign in',
        ),
        findsOneWidget,
      );
    });
  });
}
