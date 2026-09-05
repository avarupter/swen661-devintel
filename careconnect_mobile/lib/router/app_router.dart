import 'package:go_router/go_router.dart';
import '../screens/landing_screen.dart';
import '../screens/signup_screen.dart';
import '../screens/signin_screen.dart';
import '../screens/role_selection_screen.dart';  // NEW
import '../screens/home_screen.dart';            // NEW

final GoRouter router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'landing',
      builder: (context, state) => const LandingScreen(),
    ),
    GoRoute(
      path: '/signup',
      name: 'signup',
      builder: (context, state) => const SignUpScreen(),
    ),
    GoRoute(
      path: '/signin',
      name: 'signin',
      builder: (context, state) => const SignInScreen(),
    ),
    // NEW: Role Selection Screen (after login)
    GoRoute(
      path: '/role-selection',
      name: 'roleSelection',
      builder: (context, state) => const RoleSelectionScreen(),
    ),
    // NEW: Home Screen (main app with bottom navigation)
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
  ],
);