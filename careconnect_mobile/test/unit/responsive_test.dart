import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/utils/responsive.dart';

void main() {
  group('Responsive Utility Unit Tests', () {
    test('tabletBreakpoint is defined as 600', () {
      expect(Responsive.tabletBreakpoint, 600);
    });

    testWidgets('identifies phone screen dimensions (< 600px width)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(393, 852);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      late bool isPhone;
      late bool isTablet;
      late double width;
      late double height;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              isPhone = Responsive.isPhone(context);
              isTablet = Responsive.isTablet(context);
              width = Responsive.getWidth(context);
              height = Responsive.getHeight(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(isPhone, isTrue);
      expect(isTablet, isFalse);
      expect(width, 393);
      expect(height, 852);
    });

    testWidgets('identifies tablet screen dimensions (>= 600px width)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(768, 1024);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      late bool isPhone;
      late bool isTablet;
      late double width;
      late double height;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              isPhone = Responsive.isPhone(context);
              isTablet = Responsive.isTablet(context);
              width = Responsive.getWidth(context);
              height = Responsive.getHeight(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(isPhone, isFalse);
      expect(isTablet, isTrue);
      expect(width, 768);
      expect(height, 1024);
    });
  });
}
