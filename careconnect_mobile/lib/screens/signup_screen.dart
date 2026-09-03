import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: 393,
        height: 852,
        color: Colors.white,
        child: Stack(
          children: [
            // ---- BACK ARROW (goes back) ----
            Positioned(
              top: 36,
              left: 16,
              child: GestureDetector(
                onTap: () {
                  context.pop();
                },
                child: const Text(
                  '←',
                  style: TextStyle(
                    fontSize: 24,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ),
            ),

            // ---- HEADER ----
            const Positioned(
              top: 40,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'CareConnect',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ),
            ),

            // ---- TITLE ----
            const Positioned(
              top: 96,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'Create your account',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ),
            ),

            // ---- SUBTITLE ----
            const Positioned(
              top: 136,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'Free, private, and takes under two minutes.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ),

            // ---- NAME FIELD ----
            const Positioned(
              top: 196,
              left: 24,
              child: Text(
                'Your name *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),
            Positioned(
              top: 220,
              left: 24,
              child: Container(
                width: 345,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                ),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'e.g. Dorothy Smith',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // ---- HINT TEXT ----
            const Positioned(
              top: 278,
              left: 24,
              child: Text(
                'This is how CareConnect will greet you.',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF64748B),
                ),
              ),
            ),

            // ---- EMAIL FIELD ----
            const Positioned(
              top: 316,
              left: 24,
              child: Text(
                'Email address *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),
            Positioned(
              top: 340,
              left: 24,
              child: Container(
                width: 345,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                ),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'you@example.com',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // ---- PASSWORD FIELD ----
            const Positioned(
              top: 404,
              left: 24,
              child: Text(
                'Password *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),
            Positioned(
              top: 428,
              left: 24,
              child: Container(
                width: 345,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                ),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '••••••••',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // ---- PASSWORD HINT ----
            const Positioned(
              top: 486,
              left: 24,
              child: Text(
                'At least 6 characters.',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF64748B),
                ),
              ),
            ),

            // ---- CONFIRM PASSWORD FIELD ----
            const Positioned(
              top: 520,
              left: 24,
              child: Text(
                'Confirm password *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),
            Positioned(
              top: 544,
              left: 24,
              child: Container(
                width: 345,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                ),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '••••••••',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // ---- CREATE ACCOUNT BUTTON ----
            Positioned(
              top: 620,
              left: 24,
              child: SizedBox(
                width: 345,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Account creation coming soon!')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A73E8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: const Text(
                    'Create account',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),

            // ---- SIGN IN LINK (navigates to Sign In) ----
            Positioned(
              top: 690,
              left: 0,
              right: 0,
              child: Center(
                child: GestureDetector(
                  onTap: () {
                    context.push('/signin');
                  },
                  child: const Text(
                    'Already have an account? Sign in',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1A73E8),
                    ),
                  ),
                ),
              ),
            ),

            // ---- BOTTOM NAVIGATION BAR ----
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                height: 60,
                color: const Color(0xFF1A73E8),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Text('Home', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 11)),
                    Text('Medications', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 11)),
                    Text('Appointments', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 11)),
                    Text('Messages', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 11)),
                    Text('Help', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 11)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}