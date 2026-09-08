import 'package:flutter/material.dart';

import '../theme/status_style.dart';

/// Icon + word + tint. Never a bare colour.
///
/// Wrapped in [ExcludeSemantics] because the card around it already speaks the
/// status inside one fluent sentence. A second, fragmentary "Taken" node would
/// only make TalkBack repeat itself.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.visual, this.text});

  final DoseVisual visual;

  /// Overrides [DoseVisual.word] with a richer phrase, e.g. "Taken 8:12 AM".
  final String? text;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: visual.background,
          borderRadius: BorderRadius.circular(999),
        ),
        // A Wrap rather than a Row: at 200% text scale the word has to be
        // allowed to drop onto a second line instead of overflowing the pill.
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 6,
          children: [
            Icon(visual.icon, size: 18, color: visual.foreground),
            Text(
              text ?? visual.word,
              style: TextStyle(
                color: visual.foreground,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
