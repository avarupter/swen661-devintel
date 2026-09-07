import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect_mobile/providers/auth_provider.dart';

void main() {
  group('AuthProvider Unit Tests', () {
    late AuthProvider authProvider;

    setUp(() {
      authProvider = AuthProvider();
    });

    test('initial state has null user, null role, and isLoggedIn false', () {
      expect(authProvider.user, isNull);
      expect(authProvider.role, isNull);
      expect(authProvider.isLoggedIn, isFalse);
    });

    test('signUp creates user and notifies listeners', () {
      bool listenerNotified = false;
      authProvider.addListener(() {
        listenerNotified = true;
      });

      authProvider.signUp('Alice Smith', 'alice@example.com', 'password123');

      expect(authProvider.user, isNotNull);
      expect(authProvider.user!.name, 'Alice Smith');
      expect(authProvider.user!.email, 'alice@example.com');
      expect(authProvider.isLoggedIn, isTrue);
      expect(listenerNotified, isTrue);
    });

    test('signIn authenticates default Mary user and notifies listeners', () {
      bool listenerNotified = false;
      authProvider.addListener(() {
        listenerNotified = true;
      });

      authProvider.signIn('mary@example.com', 'password123');

      expect(authProvider.user, isNotNull);
      expect(authProvider.user!.name, 'Mary');
      expect(authProvider.user!.email, 'mary@example.com');
      expect(authProvider.isLoggedIn, isTrue);
      expect(listenerNotified, isTrue);
    });

    test('setRole sets user role and notifies listeners', () {
      bool listenerNotified = false;
      authProvider.addListener(() {
        listenerNotified = true;
      });

      authProvider.setRole('patient');

      expect(authProvider.role, 'patient');
      expect(listenerNotified, isTrue);

      listenerNotified = false;
      authProvider.setRole('caregiver');

      expect(authProvider.role, 'caregiver');
      expect(listenerNotified, isTrue);
    });

    test('signOut resets user and role to null and notifies listeners', () {
      authProvider.signIn('mary@example.com', 'password123');
      authProvider.setRole('caregiver');
      expect(authProvider.isLoggedIn, isTrue);

      bool listenerNotified = false;
      authProvider.addListener(() {
        listenerNotified = true;
      });

      authProvider.signOut();

      expect(authProvider.user, isNull);
      expect(authProvider.role, isNull);
      expect(authProvider.isLoggedIn, isFalse);
      expect(listenerNotified, isTrue);
    });
  });
}
