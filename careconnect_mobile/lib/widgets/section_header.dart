import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// A screen-reader-addressable section heading.
///
/// `header: true` is what puts the heading into TalkBack's and VoiceOver's
/// headings rotor. That is how a screen-reader user jumps straight to
/// "Already done" instead of swiping through every dose card to reach it.
class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(0, 24, 0, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.text900,
              ),
            ),
            if (subtitle != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  subtitle!,
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.text500,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
