import 'package:flutter/material.dart';

import '../models/dose.dart';
import '../theme/app_colors.dart';
import '../theme/status_style.dart';
import 'status_chip.dart';

/// One dose, on Patient Today and on Medication Detail.
///
/// **Semantics structure — this is the deliberate part.**
///
///  * The information block is ONE merged node carrying [ScheduledDose
///    .semanticLabel], a whole sentence: *"Memantine, 10 mg, Morning, 8:00 AM.
///    You took this at 8:12 AM today. Take with breakfast and with dinner."*
///    Its children sit under [ExcludeSemantics], so TalkBack reads that one
///    sentence rather than six disconnected fragments.
///  * The action button is a **sibling** of that node, never a child of it, so
///    it stays independently focusable and announces its own
///    [ScheduledDose.actionSemanticLabel].
///  * The "What is this medicine for?" link is a third sibling.
///
/// Three focus stops per card — predictable, and short.
///
/// Both label strings are built in the model, not here. A widget that composes
/// its own screen-reader sentence is a widget doing logic.
class DoseTile extends StatelessWidget {
  const DoseTile({
    super.key,
    required this.dose,
    required this.onToggleTaken,
    this.onOpenMedication,
  });

  final ScheduledDose dose;

  /// Marks the dose taken, or undoes it. The provider decides which — the
  /// widget does not know and does not need to.
  final VoidCallback onToggleTaken;

  /// Null on Medication Detail: you are already looking at the medicine.
  final VoidCallback? onOpenMedication;

  @override
  Widget build(BuildContext context) {
    final visual = visualForDoseStatus(dose.status);
    final needsAction = dose.isOverdue || dose.isDueNow;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSizes.cardGap),
      padding: const EdgeInsets.all(AppSizes.pagePadding),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(
          color: needsAction ? visual.foreground : AppColors.border200,
          // A thicker border, not merely a different hue, so the "needs doing"
          // signal survives greyscale printing and every form of colour
          // blindness.
          width: needsAction ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ---------- node 1: the whole story, in one sentence ----------
          Semantics(
            container: true,
            excludeSemantics: true,
            label: dose.semanticLabel,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Wrap so the time and the chip reflow rather than overflow
                // once the system text size is turned up.
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      dose.scheduledTime.label12h,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary900,
                      ),
                    ),
                    StatusChip(visual: visual, text: dose.statusLabel),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  dose.medication.displayTitle,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text900,
                  ),
                ),
                if (dose.medication.appearance.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      dose.medication.appearance,
                      style: const TextStyle(
                        fontSize: 15,
                        color: AppColors.text500,
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                // The reassurance line: "You took this at 8:12 AM today."
                // A checkmark states a fact; this states the story the
                // patient has forgotten, including who logged it.
                Text(
                  dose.reassuranceLine,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color:
                        dose.isTaken
                            ? AppColors.statusTakenFg
                            : AppColors.text700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ---------- node 2: the one primary action ----------
          //
          // `onTap` and `excludeSemantics` are both required. A plain
          // `Semantics(label:)` wrapped around a button produces TWO nodes:
          // this one carrying the label but no action, and the button's own
          // node carrying the action but — because its child text is hidden —
          // no name at all. Screen-reader users would hear an unnamed button.
          // Collapsing them here gives one node with both.
          Semantics(
            button: true,
            onTap: onToggleTaken,
            excludeSemantics: true,
            label: dose.actionSemanticLabel,
            child: SizedBox(
              width: double.infinity,
              child:
                  dose.isTaken
                      ? OutlinedButton.icon(
                        onPressed: onToggleTaken,
                        icon: const Icon(Icons.undo),
                        label: const Text('Undo — I have not taken this'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(
                            AppSizes.minTapTarget + 8,
                          ),
                          foregroundColor: AppColors.primary800,
                          side: const BorderSide(color: AppColors.border300),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      )
                      : ElevatedButton.icon(
                        onPressed: onToggleTaken,
                        icon: const Icon(Icons.check),
                        label: const Text('Mark as taken'),
                        style: ElevatedButton.styleFrom(
                          // 56 dp — comfortably over the 48 dp floor.
                          minimumSize: const Size.fromHeight(
                            AppSizes.minTapTarget + 8,
                          ),
                          // White on primary700 measures 4.51:1, which clears AA.
                          backgroundColor: AppColors.primary700,
                          foregroundColor: AppColors.surface0,
                          textStyle: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
            ),
          ),

          // ---------- node 3: the clearly subordinate secondary action ------
          if (onOpenMedication != null)
            Semantics(
              button: true,
              onTap: onOpenMedication,
              excludeSemantics: true,
              label: 'What is ${dose.medication.name} for? Opens the details.',
              child: TextButton(
                onPressed: onOpenMedication,
                style: TextButton.styleFrom(
                  minimumSize: const Size(0, AppSizes.minTapTarget),
                  // primary800 is 5.75:1 on white; primary700 would be 4.51:1
                  // on white and only 4.24:1 on the page background.
                  foregroundColor: AppColors.primary800,
                  alignment: Alignment.centerLeft,
                ),
                child: const Text('What is this medicine for?'),
              ),
            ),
        ],
      ),
    );
  }
}
