import 'package:flutter/material.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _role;  // 'patient' or 'caregiver'

  User? get user => _user;
  String? get role => _role;
  bool get isLoggedIn => _user != null;

  void signUp(String name, String email, String password) {
    _user = User(name: name, email: email);
    notifyListeners();
  }

  void signIn(String email, String password) {
    _user = User(name: 'Mary', email: email);
    notifyListeners();
  }

  void signOut() {
    _user = null;
    _role = null;
    notifyListeners();
  }

  // Add this method
  void setRole(String role) {
    _role = role;
    notifyListeners();
  }
}