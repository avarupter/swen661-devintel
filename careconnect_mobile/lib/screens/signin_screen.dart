import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/responsive.dart';

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isTablet = Responsive.isTablet(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () {
            context.pop();
          },
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Icon(
              Icons.arrow_back,
              size: isTablet ? 32 : 24,
              color: const Color(0xFF1E293B),
            ),
          ),
        ),
        title: Center(
          child: Text(
            'CareConnect',
            style: TextStyle(
              fontSize: isTablet ? 28 : 20,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1E293B),
            ),
          ),
        ),
        actions: const [SizedBox(width: 48)],
      ),
      body: Center(
        child: Container(
          constraints: BoxConstraints(
            maxWidth: isTablet ? 600 : double.infinity,
          ),
          padding: EdgeInsets.symmetric(
            horizontal: isTablet ? 0 : 24,
            vertical: isTablet ? 40 : 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  'Sign In',
                  style: TextStyle(
                    fontSize: isTablet ? 32 : 24,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                SizedBox(height: isTablet ? 40 : 30),

                // ---- EMAIL FIELD ----
                _buildLabel('Email address *', isTablet),
                _buildTextField('you@example.com', isTablet),
                SizedBox(height: isTablet ? 20 : 16),

                // ---- PASSWORD FIELD ----
                _buildLabel('Password *', isTablet),
                _buildTextField('••••••••', isTablet, obscureText: true),
                SizedBox(height: isTablet ? 40 : 30),

                // ---- SIGN IN BUTTON ----
                Semantics(
                  button: true,
                  label: 'Sign in to your account',
                  child: SizedBox(
                    width: isTablet ? 400 : double.infinity,
                    height: isTablet ? 60 : 52,
                    child: ElevatedButton(
                      onPressed: () {
                        final authProvider = Provider.of<AuthProvider>(context, listen: false);
                        authProvider.signIn('mary@example.com', 'password123');
                        context.go('/role-selection');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A73E8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      child: Text(
                        'Sign In',
                        style: TextStyle(
                          fontSize: isTablet ? 20 : 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // ---- FORGOT PASSWORD ----
                Semantics(
                  button: true,
                  label: 'Forgot password? Click here to reset',
                  child: Text(
                    'Forgot password? Click here to reset.',
                    style: TextStyle(
                      fontSize: isTablet ? 18 : 14,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF1A73E8),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 12),

                // ---- SIGN UP LINK ----
                Semantics(
                  button: true,
                  label: 'New user? Click here to sign up',
                  child: GestureDetector(
                    onTap: () {
                      context.push('/signup');
                    },
                    child: Text(
                      'New? Click here to sign up.',
                      style: TextStyle(
                        fontSize: isTablet ? 18 : 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF1A73E8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text, bool isTablet) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: isTablet ? 0 : 0),
      child: Text(
        text,
        style: TextStyle(
          fontSize: isTablet ? 18 : 14,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF1E293B),
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildTextField(String hint, bool isTablet, {bool obscureText = false}) {
    return SizedBox(
      width: isTablet ? 400 : double.infinity,
      child: TextField(
        obscureText: obscureText,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: isTablet ? 16 : 14,
            color: const Color(0xFF94A3B8),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF1A73E8), width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        ),
      ),
    );
  }
}