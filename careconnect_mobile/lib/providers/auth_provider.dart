import 'package:flutter/material.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;

  User? get user => _user;

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
    notifyListeners();
  }
}