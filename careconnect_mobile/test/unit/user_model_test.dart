import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/models/user.dart';

void main() {
  group('User Model Unit Tests', () {
    test('creates User instance with name and email', () {
      final user = User(
        name: 'Mary Jane',
        email: 'mary@example.com',
      );

      expect(user.name, 'Mary Jane');
      expect(user.email, 'mary@example.com');
    });
  });
}
