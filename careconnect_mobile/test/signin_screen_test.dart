import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:careconnect_mobile/screens/signin_screen.dart';
import 'package:careconnect_mobile/providers/auth_provider.dart';

void main() {
  Widget createWidgetUnderTest() {
    return ChangeNotifierProvider<AuthProvider>(
      create: (_) => AuthProvider(),
      child: const MaterialApp(
        home: SignInScreen(),
      ),
    );
  }

  group('SignInScreen Widget Tests', () {
    testWidgets('renders screen header and input fields', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('CareConnect'), findsOneWidget);
      expect(find.text('Sign In'), findsNWidgets(2)); // Header title and button
      expect(find.text('Email address *'), findsOneWidget);
      expect(find.text('Password *'), findsOneWidget);
      expect(find.byType(TextField), findsNWidgets(2));
    });

    testWidgets('renders sign in button and navigation action links', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.text('Forgot password? Click here to reset.'), findsOneWidget);
      expect(find.text('New? Click here to sign up.'), findsOneWidget);
    });

    testWidgets('verifies semantics on interactive elements', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Sign in to your account',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'Forgot password? Click here to reset',
        ),
        findsOneWidget,
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.label == 'New user? Click here to sign up',
        ),
        findsOneWidget,
      );
    });
  });
}
