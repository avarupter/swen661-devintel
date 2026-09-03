import 'package:flutter/material.dart';

class Responsive {
  static const double tabletBreakpoint = 600;

  static bool isPhone(BuildContext context) {
    return MediaQuery.of(context).size.width < tabletBreakpoint;
  }

  static bool isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= tabletBreakpoint;
  }

  static double getWidth(BuildContext context) {
    return MediaQuery.of(context).size.width;
  }

  static double getHeight(BuildContext context) {
    return MediaQuery.of(context).size.height;
  }
}