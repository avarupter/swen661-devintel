import 'package:flutter/material.dart';

import '../models/dose.dart';
import 'app_colors.dart';

/// A dose status rendered three ways at once: colour, icon and word.
///
/// WCAG 1.4.1 (Use of Color) says colour must never be the only thing carrying
/// a piece of information. Bundling the three together into one value makes it
/// structurally impossible for a screen to use the colour and quietly forget
/// the icon or the word — you cannot get one without the others.
@immutable
class DoseVisual {
  const DoseVisual({
    required this.foreground,
    required this.background,
    required this.icon,
    required this.word,
  });

  final Color foreground;
  final Color background;
  final IconData icon;

  /// The written status, shown next to the icon. Never omitted.
  final String word;
}

/// Measured contrast ratios (sRGB / WCAG 2.1):
///
///   taken     #166534 on #E7F6EC = 6.38:1   on #FFFFFF = 7.13:1
///   dueNow    #92400E on #FDF3E2 = 6.45:1   on #FFFFFF = 7.09:1
///   overdue   #A63D45 on #FBEAEC = 5.36:1   on #FFFFFF = 6.22:1
///   missed    #A63D45 on #FBEAEC = 5.36:1
///   skipped   #303845 on #DDE1E8 = 9.01:1
///   upcoming  #1565C0 on #E3F2FD = 5.03:1
///
/// Every one clears WCAG AA (4.5:1) for normal text, and
/// `test/unit/status_style_test.dart` re-derives them so the claim cannot rot.
///
/// Note the skipped chip uses [AppColors.text700], not `text500`: `text500`
/// (#60697A) on `border200` (#DDE1E8) is only 4.21:1 and would fail.
DoseVisual visualForDoseStatus(DoseStatus status) {
  switch (status) {
    case DoseStatus.taken:
      return const DoseVisual(
        foreground: AppColors.statusTakenFg,
        background: AppColors.statusTakenBg,
        icon: Icons.check_circle,
        word: 'Taken',
      );
    case DoseStatus.dueNow:
      return const DoseVisual(
        foreground: AppColors.statusDueFg,
        background: AppColors.statusDueBg,
        icon: Icons.notifications_active,
        word: 'Due now',
      );
    case DoseStatus.overdue:
      return const DoseVisual(
        foreground: AppColors.danger600,
        background: AppColors.dangerTint,
        icon: Icons.error_outline,
        word: 'Overdue',
      );
    case DoseStatus.missed:
      return const DoseVisual(
        foreground: AppColors.danger600,
        background: AppColors.dangerTint,
        icon: Icons.cancel_outlined,
        word: 'Not taken',
      );
    case DoseStatus.skipped:
      return const DoseVisual(
        foreground: AppColors.text700,
        background: AppColors.border200,
        icon: Icons.remove_circle_outline,
        word: 'Skipped',
      );
    case DoseStatus.upcoming:
      return const DoseVisual(
        foreground: AppColors.statusLaterFg,
        background: AppColors.statusLaterBg,
        icon: Icons.schedule,
        word: 'Later',
      );
  }
}
