import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/responsive.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

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
                  'Create your account',
                  style: TextStyle(
                    fontSize: isTablet ? 32 : 24,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Free, private, and takes under two minutes.',
                  style: TextStyle(
                    fontSize: isTablet ? 18 : 14,
                    color: const Color(0xFF64748B),
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: isTablet ? 40 : 30),

                // ---- NAME FIELD ----
                _buildLabel('Your name *', isTablet),
                _buildTextField('e.g. Dorothy Smith', isTablet),
                const SizedBox(height: 8),
                Text(
                  'This is how CareConnect will greet you.',
                  style: TextStyle(
                    fontSize: isTablet ? 14 : 12,
                    color: const Color(0xFF64748B),
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: isTablet ? 20 : 16),

                // ---- EMAIL FIELD ----
                _buildLabel('Email address *', isTablet),
                _buildTextField('you@example.com', isTablet),
                SizedBox(height: isTablet ? 20 : 16),

                // ---- PASSWORD FIELD ----
                _buildLabel('Password *', isTablet),
                _buildTextField('••••••••', isTablet, obscureText: true),
                const SizedBox(height: 8),
                Text(
                  'At least 6 characters.',
                  style: TextStyle(
                    fontSize: isTablet ? 14 : 12,
                    color: const Color(0xFF64748B),
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: isTablet ? 20 : 16),

                // ---- CONFIRM PASSWORD FIELD ----
                _buildLabel('Confirm password *', isTablet),
                _buildTextField('••••••••', isTablet, obscureText: true),
                SizedBox(height: isTablet ? 40 : 30),

                // ---- CREATE ACCOUNT BUTTON ----
                Semantics(
                  button: true,
                  label: 'Create your new account',
                  child: SizedBox(
                    width: isTablet ? 400 : double.infinity,
                    height: isTablet ? 60 : 52,
                    child: ElevatedButton(
                      onPressed: () {
                        final authProvider = Provider.of<AuthProvider>(context, listen: false);
                        authProvider.signUp('Mary', 'mary@example.com', 'password123');
                        context.go('/role-selection');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A73E8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      child: Text(
                        'Create account',
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

                // ---- SIGN IN LINK ----
                Semantics(
                  button: true,
                  label: 'Already have an account? Sign in',
                  child: GestureDetector(
                    onTap: () {
                      context.push('/signin');
                    },
                    child: Text(
                      'Already have an account? Sign in',
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