import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/main.dart';

void main() {
  testWidgets('CareConnect app launches landing screen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that CareConnect landing screen is displayed.
    expect(find.text('CareConnect'), findsOneWidget);
    expect(find.text('Your daily companion'), findsOneWidget);
  });
}
