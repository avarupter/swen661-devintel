import 'dart:math' as math;

import 'package:careconnect_mobile/models/dose.dart';
import 'package:careconnect_mobile/theme/app_colors.dart';
import 'package:careconnect_mobile/theme/status_style.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// WCAG 2.1 relative luminance.
double _luminance(Color c) {
  double channel(double v) =>
      v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  return 0.2126 * channel(c.r) +
      0.7152 * channel(c.g) +
      0.0722 * channel(c.b);
}

double _contrast(Color a, Color b) {
  final la = _luminance(a);
  final lb = _luminance(b);
  final hi = math.max(la, lb);
  final lo = math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

void main() {
  group('Dose status visuals', () {
    test('no two statuses can be told apart by colour alone', () {
      final pairs = <String>{};
      for (final status in DoseStatus.values) {
        final visual = visualForDoseStatus(status);
        expect(visual.word, isNotEmpty,
            reason: '$status has no written label');
        pairs.add('${visual.icon.codePoint}|${visual.word}');
      }
      // WCAG 1.4.1: colour is never the sole carrier of meaning. If two
      // statuses shared an icon AND a word, colour would be all that was left.
      expect(pairs.length, DoseStatus.values.length);
    });

    test('every status foreground clears AA on its own background', () {
      for (final status in DoseStatus.values) {
        final v = visualForDoseStatus(status);
        expect(
          _contrast(v.foreground, v.background),
          greaterThanOrEqualTo(4.5),
          reason: '$status fails AA on its own tint',
        );
      }
    });

    test('every status foreground also clears AA on both app surfaces', () {
      for (final status in DoseStatus.values) {
        final v = visualForDoseStatus(status);
        expect(_contrast(v.foreground, AppColors.surface0),
            greaterThanOrEqualTo(4.5),
            reason: '$status fails AA on a card');
        expect(_contrast(v.foreground, AppColors.surface50),
            greaterThanOrEqualTo(4.5),
            reason: '$status fails AA on the page background');
      }
    });
  });

  group('Palette contrast claims in app_colors.dart', () {
    test('body-text colours clear AA on both surfaces', () {
      for (final c in [
        AppColors.text900,
        AppColors.text700,
        AppColors.text500,
        AppColors.primary900,
        AppColors.primary800,
        AppColors.danger600,
      ]) {
        expect(_contrast(c, AppColors.surface0), greaterThanOrEqualTo(4.5));
        expect(_contrast(c, AppColors.surface50), greaterThanOrEqualTo(4.5));
      }
    });

    test('primary700 is a fill colour, not a body-text colour', () {
      // White on the brand blue passes, which is why it is used for button
      // fills...
      expect(
        _contrast(AppColors.surface0, AppColors.primary700),
        greaterThanOrEqualTo(4.5),
      );
      // ...but the brand blue as small text on the page background does NOT,
      // which is why every blue text in the app uses primary800 instead.
      expect(
        _contrast(AppColors.primary700, AppColors.surface50),
        lessThan(4.5),
      );
    });

    test('text300 is reserved for disabled controls, never information', () {
      expect(_contrast(AppColors.text300, AppColors.surface0), lessThan(4.5));
    });
  });
}
