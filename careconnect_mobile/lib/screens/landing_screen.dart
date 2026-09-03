import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: 393,
        height: 852,
        color: Colors.white,
        child: Stack(
          children: [
            // ---- HEADER ----
            const Positioned(
              top: 60,
              left: 24,
              child: Text(
                'CareConnect',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),

            // ---- SIGN IN (clickable) ----
            Positioned(
              top: 66,
              left: 260,
              child: GestureDetector(
                onTap: () {
                  context.push('/signin');
                },
                child: const Text(
                  'Sign in',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF1A73E8),
                  ),
                ),
              ),
            ),

            // ---- SIGN UP (clickable) ----
            Positioned(
              top: 66,
              left: 330,
              child: GestureDetector(
                onTap: () {
                  context.push('/signup');
                },
                child: const Text(
                  'Sign up',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A73E8),
                  ),
                ),
              ),
            ),

            // ---- CIRCLE + HEART ----
            Positioned(
              top: 160,
              left: 116,
              child: Container(
                width: 160,
                height: 160,
                decoration: const BoxDecoration(
                  color: Color(0xFFE8F0FE),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text(
                    '💙',
                    style: TextStyle(fontSize: 64),
                  ),
                ),
              ),
            ),

            // ---- TAGLINE 1 ----
            const Positioned(
              top: 360,
              left: 40,
              right: 40,
              child: Text(
                'Your daily companion',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),

            // ---- TAGLINE 2 ----
            const Positioned(
              top: 392,
              left: 40,
              right: 40,
              child: Text(
                'for calm, confident care.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),

            // ---- DESCRIPTION 1 ----
            const Positioned(
              top: 448,
              left: 40,
              right: 40,
              child: Text(
                'For people who need a little help remembering,',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                ),
              ),
            ),

            // ---- DESCRIPTION 2 ----
            const Positioned(
              top: 470,
              left: 40,
              right: 40,
              child: Text(
                'and the people who care for them.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                ),
              ),
            ),

            // ---- GET STARTED BUTTON (navigates to Sign Up) ----
            Positioned(
              top: 540,
              left: 24,
              child: SizedBox(
                width: 345,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    context.push('/signup');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A73E8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  child: const Text(
                    'Get started — it\'s free →',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),

            // ---- I ALREADY HAVE AN ACCOUNT (navigates to Sign In) ----
            Positioned(
              top: 616,
              left: 0,
              right: 0,
              child: Center(
                child: GestureDetector(
                  onTap: () {
                    context.push('/signin');
                  },
                  child: const Text(
                    'I already have an account',
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
                    Text('Home', style: TextStyle(color: Colors.white, fontSize: 12)),
                    Text('Medications', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 12)),
                    Text('Appointments', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 12)),
                    Text('Messages', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 12)),
                    Text('Help', style: TextStyle(color: Color(0xFFD4E4FF), fontSize: 12)),
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