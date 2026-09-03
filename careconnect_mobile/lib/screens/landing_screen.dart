import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/responsive.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isTablet = Responsive.isTablet(context);
    final screenWidth = Responsive.getWidth(context);

    return Scaffold(
      body: Container(
        width: screenWidth,
        height: Responsive.getHeight(context),
        color: Colors.white,
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Stack(
              children: [
                // ---- HEADER ----
                Positioned(
                  top: isTablet ? 80 : 60,
                  left: isTablet ? 60 : 24,
                  child: Text(
                    'CareConnect',
                    style: TextStyle(
                      fontSize: isTablet ? 42 : 28,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ),

                // ---- SIGN IN ----
                Positioned(
                  top: isTablet ? 86 : 66,
                  left: isTablet ? screenWidth - 200 : 260,
                  child: GestureDetector(
                    onTap: () {
                      context.push('/signin');
                    },
                    child: Text(
                      'Sign in',
                      style: TextStyle(
                        fontSize: isTablet ? 18 : 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF1A73E8),
                      ),
                    ),
                  ),
                ),

                // ---- SIGN UP ----
                Positioned(
                  top: isTablet ? 86 : 66,
                  left: isTablet ? screenWidth - 120 : 330,
                  child: GestureDetector(
                    onTap: () {
                      context.push('/signup');
                    },
                    child: Text(
                      'Sign up',
                      style: TextStyle(
                        fontSize: isTablet ? 18 : 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A73E8),
                      ),
                    ),
                  ),
                ),

                // ---- CIRCLE + HEART ----
                Positioned(
                  top: isTablet ? 220 : 160,
                  left: isTablet ? (screenWidth - 220) / 2 : 116,
                  child: Container(
                    width: isTablet ? 220 : 160,
                    height: isTablet ? 220 : 160,
                    decoration: const BoxDecoration(
                      color: Color(0xFFE8F0FE),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '💙',
                        style: TextStyle(fontSize: isTablet ? 80 : 64),
                      ),
                    ),
                  ),
                ),

                // ---- TAGLINE 1 ----
                Positioned(
                  top: isTablet ? 500 : 360,
                  left: isTablet ? 60 : 40,
                  right: isTablet ? 60 : 40,
                  child: Text(
                    'Your daily companion',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: isTablet ? 32 : 22,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ),

                // ---- TAGLINE 2 ----
                Positioned(
                  top: isTablet ? 545 : 392,
                  left: isTablet ? 60 : 40,
                  right: isTablet ? 60 : 40,
                  child: Text(
                    'for calm, confident care.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: isTablet ? 32 : 22,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ),

                // ---- DESCRIPTION 1 ----
                Positioned(
                  top: isTablet ? 610 : 448,
                  left: isTablet ? 60 : 40,
                  right: isTablet ? 60 : 40,
                  child: Text(
                    'For people who need a little help remembering,',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: isTablet ? 18 : 14,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ),

                // ---- DESCRIPTION 2 ----
                Positioned(
                  top: isTablet ? 640 : 470,
                  left: isTablet ? 60 : 40,
                  right: isTablet ? 60 : 40,
                  child: Text(
                    'and the people who care for them.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: isTablet ? 18 : 14,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ),

                // ---- GET STARTED BUTTON ----
                Positioned(
                  top: isTablet ? 720 : 540,
                  left: isTablet ? (screenWidth - 400) / 2 : 24,
                  child: SizedBox(
                    width: isTablet ? 400 : 345,
                    height: isTablet ? 64 : 56,
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
                      child: Text(
                        'Get started — it\'s free →',
                        style: TextStyle(
                          fontSize: isTablet ? 20 : 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),

                // ---- I ALREADY HAVE AN ACCOUNT ----
                Positioned(
                  top: isTablet ? 810 : 616,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: GestureDetector(
                      onTap: () {
                        context.push('/signin');
                      },
                      child: Text(
                        'I already have an account',
                        style: TextStyle(
                          fontSize: isTablet ? 18 : 14,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF1A73E8),
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
                    height: isTablet ? 80 : 60,
                    color: const Color(0xFF1A73E8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _navItem('Home', true, isTablet),
                        _navItem('Medications', false, isTablet),
                        _navItem('Appointments', false, isTablet),
                        _navItem('Messages', false, isTablet),
                        _navItem('Help', false, isTablet),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _navItem(String label, bool isActive, bool isTablet) {
    return Text(
      label,
      style: TextStyle(
        color: isActive ? Colors.white : const Color(0xFFD4E4FF),
        fontSize: isTablet ? 14 : 12,
      ),
    );
  }
}