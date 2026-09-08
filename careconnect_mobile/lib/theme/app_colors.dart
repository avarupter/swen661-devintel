import 'package:flutter/material.dart';

/// CareConnect design tokens.
///
/// Source of truth: the team's Figma file
/// "DevIntel Team CareConnect Daily Compass — Design System",
/// page *Color Palette (Light Mode)*.
///
/// Every colour below is annotated with its measured WCAG 2.1 contrast ratio so
/// that the accessibility claims in the README can be checked rather than taken
/// on trust. Ratios are quoted against the two surfaces the app actually paints
/// on: [surface0] (#FFFFFF cards) and [surface50] (#F7F8FA page background).
///
/// The team's assigned accessibility constraint is **short-term memory loss**,
/// which is a cognitive rather than a visual constraint. Colour still matters
/// for it, but only as *redundant* reinforcement: every status in this app is
/// carried by an icon and a text label as well as a colour, never by colour
/// alone. See [AppColors.statusTakenFg] and friends, which are always used
/// alongside an icon and a written label.
class AppColors {
  const AppColors._();

  // ---------------------------------------------------------------------
  // Primary — the CareConnect blues, straight from Figma.
  // ---------------------------------------------------------------------

  /// Deep navy. 8.63:1 on white, 8.12:1 on the page background.
  /// Safe for body text anywhere; used for headings and emphasised numbers.
  static const Color primary900 = Color(0xFF0D47A1);

  /// Dark blue. 5.75:1 on white, 5.41:1 on the page background.
  /// This is the colour to use for *blue text and links*, because the core
  /// brand blue does not clear AA on the page background (see [primary700]).
  static const Color primary800 = Color(0xFF1565C0);

  /// Core brand blue. 4.51:1 on white — it clears AA by 0.01, and only on
  /// white. On [surface50] it measures 4.24:1 and **fails** AA for body text.
  ///
  /// So: use it as a *fill* (white-on-blue is 4.51:1, which passes) and for
  /// large display text on white. Do not use it for small blue text on the
  /// page background — use [primary800] there instead.
  static const Color primary700 = Color(0xFF1A73E8);

  /// 3.12:1 on white. Decorative only — never text.
  static const Color primary600 = Color(0xFF2196F3);

  static const Color primary500 = Color(0xFF42A5F5);
  static const Color primary400 = Color(0xFF64B5F6);
  static const Color primary300 = Color(0xFF90CAF9);
  static const Color primary200 = Color(0xFFBBDEFB);

  /// Very light blue, for tinted panels. [primary900] on it is 7.56:1.
  static const Color primary100 = Color(0xFFE3F2FD);

  // ---------------------------------------------------------------------
  // Text
  // ---------------------------------------------------------------------

  /// Primary text. 15.25:1 on white, 14.35:1 on the page background.
  static const Color text900 = Color(0xFF1E2631);

  /// Secondary dark text. 11.82:1 / 11.12:1.
  static const Color text700 = Color(0xFF303845);

  /// Muted supporting text. 5.53:1 / 5.20:1 — still clears AA, so it is safe
  /// for the secondary lines on a card.
  static const Color text500 = Color(0xFF60697A);

  /// Placeholder / disabled. 2.85:1 — deliberately below AA, so it is only
  /// ever used for genuinely disabled controls, never for information.
  static const Color text300 = Color(0xFF8F9AAA);

  // ---------------------------------------------------------------------
  // Surfaces and borders
  // ---------------------------------------------------------------------

  /// Cards and primary surfaces.
  static const Color surface0 = Color(0xFFFFFFFF);

  /// Page background.
  static const Color surface50 = Color(0xFFF7F8FA);

  /// Input and control border.
  static const Color border300 = Color(0xFFC4CAD5);

  /// Subtle divider.
  static const Color border200 = Color(0xFFDDE1E8);

  /// Required / error accent. 6.22:1 on white; white on it is also 6.22:1.
  static const Color danger600 = Color(0xFFA63D45);

  static const Color dangerTint = Color(0xFFFBEAEC);

  // ---------------------------------------------------------------------
  // Status colours.
  //
  // The Figma palette has no success or warning ramp, so these are a
  // documented extension. Both were chosen by measuring candidates rather
  // than by eye, and both clear AA on white, on the page background, and on
  // their own tint.
  // ---------------------------------------------------------------------

  /// "Taken" / done. 7.13:1 on white, 6.71:1 on the page background,
  /// 6.38:1 on [statusTakenBg]. White on it is 7.13:1.
  static const Color statusTakenFg = Color(0xFF166534);

  /// Tint behind a completed item. [text900] on it is 13.65:1.
  static const Color statusTakenBg = Color(0xFFE7F6EC);

  /// "Due now" / needs attention. 7.09:1 on white, 6.67:1 on the page
  /// background, 6.45:1 on [statusDueBg].
  static const Color statusDueFg = Color(0xFF92400E);

  /// Tint behind an item that still needs doing. [text900] on it is 13.87:1.
  static const Color statusDueBg = Color(0xFFFDF3E2);

  /// "Later today" / not yet actionable — reuses the blue ramp so that the
  /// three states read as one system.
  static const Color statusLaterFg = primary800;
  static const Color statusLaterBg = primary100;
}

/// Sizing tokens.
class AppSizes {
  const AppSizes._();

  /// The minimum interactive target the assignment requires. Every tappable
  /// control in the patient screens is constrained to at least this.
  static const double minTapTarget = 48.0;

  static const double cardRadius = 14.0;
  static const double controlRadius = 10.0;
  static const double pagePadding = 16.0;
  static const double cardGap = 16.0;
}
