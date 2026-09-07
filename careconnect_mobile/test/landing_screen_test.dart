import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/screens/landing_screen.dart';

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: LandingScreen(),
    );
  }

  group('LandingScreen Widget Tests', () {
    testWidgets('renders main title and taglines', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('CareConnect'), findsOneWidget);
      expect(find.text('Your daily companion'), findsOneWidget);
      expect(find.text('for calm, confident care.'), findsOneWidget);
      expect(find.text('For people who need a little help remembering,'), findsOneWidget);
      expect(find.text('and the people who care for them.'), findsOneWidget);
    });

    testWidgets('renders sign in and sign up links', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Sign in'), findsOneWidget);
      expect(find.text('Sign up'), findsOneWidget);
      expect(find.text('I already have an account'), findsOneWidget);
    });

    testWidgets('renders get started call-to-action button', (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text("Get started — it's free →"), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });
  });
}
