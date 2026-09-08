import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:careconnect_mobile/router/app_router.dart';

void main() {
  group('AppRouter Configuration Unit Tests', () {
    test('router instance is defined with GoRouter configuration', () {
      expect(router.configuration.routes.isNotEmpty, isTrue);
    });

    test('defines required public and authenticated application routes', () {
      final routePaths = router.configuration.routes
          .whereType<GoRoute>()
          .map((r) => r.path)
          .toList();

      expect(routePaths, contains('/'));
      expect(routePaths, contains('/signup'));
      expect(routePaths, contains('/signin'));
      expect(routePaths, contains('/role-selection'));
      expect(routePaths, contains('/home'));
      expect(routePaths, contains('/patient/add'));
      expect(routePaths, contains('/patient/:id'));
    });

    test('defines the patient detail routes that carry an id', () {
      final routes = router.configuration.routes.whereType<GoRoute>();

      expect(routes.map((r) => r.path), contains('/medications/:medId'));
      expect(routes.map((r) => r.path), contains('/appointments/:apptId'));

      // pushNamed throws at runtime on a misspelled name and nothing else
      // catches that, so assert the names as well as the paths.
      expect(routes.map((r) => r.name), contains('medicationDetail'));
      expect(routes.map((r) => r.name), contains('appointmentDetail'));
    });
  });
}
