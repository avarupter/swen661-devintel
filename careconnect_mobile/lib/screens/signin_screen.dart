import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: 393,
        height: 852,
        color: Colors.white,
        child: Stack(
          children: [
            // ---- BACK ARROW ----
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
              top: 146,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'Sign In',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ),
            ),

            // ---- EMAIL FIELD ----
            const Positioned(
              top: 304,
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
              top: 328,
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
              top: 392,
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
              top: 416,
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

            // ---- SIGN IN BUTTON ----
            Positioned(
              top: 487,
              left: 24,
              child: SizedBox(
                width: 345,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Sign In coming soon!')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A73E8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: const Text(
                    'Sign In',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),

            // ---- FORGOT PASSWORD ----
            const Positioned(
              top: 565,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'Forgot password? Click here to reset.',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF1A73E8),
                  ),
                ),
              ),
            ),

            // ---- SIGN UP LINK ----
            Positioned(
              top: 595,
              left: 0,
              right: 0,
              child: Center(
                child: GestureDetector(
                  onTap: () {
                    context.push('/signup');
                  },
                  child: const Text(
                    'New? Click here to sign up.',
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