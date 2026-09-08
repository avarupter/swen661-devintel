import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/dose.dart';
import '../models/medication.dart';
import '../providers/medication_provider.dart';
import '../theme/app_colors.dart';
import '../theme/status_style.dart';
import '../widgets/care_page.dart';
import '../widgets/section_header.dart';
import '../widgets/status_chip.dart';

/// The patient's full medicine list.
///
/// Two short-term-memory-loss decisions shape this screen:
///
///  * Every row carries the medicine's *purpose* in plain language. "What is
///    this one for again?" is the single most repeated question in this
///    domain, and answering it on the list means never having to ring the
///    caregiver to find out.
///  * "Only if you need it" medicines are listed in their own section. A
///    painkiller sitting in the same list as a scheduled tablet reads as a
///    missed dose, which is a false alarm this user cannot easily resolve.
class PatientMedicationsScreen extends StatelessWidget {
  const PatientMedicationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final meds = context.watch<MedicationProvider>();
    final scheduled = meds.scheduledMedications;
    final asNeeded = meds.asNeededMedications;
    final isEmpty = scheduled.isEmpty && asNeeded.isEmpty;

    return CarePage(
      state: meds.state,
      errorMessage: meds.errorMessage,
      onRetry: meds.load,
      loadingLabel: 'Loading your medicines…',
      child: ListView(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        children: [
          Semantics(
            header: true,
            child: const Text(
              'My medicines',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: AppColors.text900,
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Tap a medicine to see what it is for and how to take it.',
            style: TextStyle(fontSize: 16, color: AppColors.text500),
          ),
          if (isEmpty) ...[
            const SizedBox(height: 24),
            const Text(
              'No medicines are on your list yet.',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.text700,
              ),
            ),
          ],
          if (scheduled.isNotEmpty) ...[
            SectionHeader(
              'Taken every day',
              subtitle:
                  '${scheduled.length} '
                  '${scheduled.length == 1 ? 'medicine' : 'medicines'}',
            ),
            ...scheduled.map((m) => _MedicationRow(medication: m, meds: meds)),
          ],
          if (asNeeded.isNotEmpty) ...[
            const SectionHeader('Only if you need it'),
            ...asNeeded.map((m) => _MedicationRow(medication: m, meds: meds)),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

/// One medicine in the list.
///
/// The whole row is a single tap target and a single semantics node, so a
/// screen reader hears one sentence and there is exactly one thing to press.
class _MedicationRow extends StatelessWidget {
  const _MedicationRow({required this.medication, required this.meds});

  final Medication medication;
  final MedicationProvider meds;

  @override
  Widget build(BuildContext context) {
    final m = medication;
    final doses =
        m.isAsNeeded ? const <ScheduledDose>[] : meds.dosesForMedication(m.id);
    final takenCount = doses.where((d) => d.isTaken).length;

    // Spoken and written versions of the same fact, so the list answers
    // "did I already take this one?" without opening anything.
    // Empty for an as-needed medicine: `spokenSummary` already ends with
    // "Taken only when needed", and repeating it makes the screen reader say
    // the same sentence twice in a row.
    final todayLine =
        m.isAsNeeded ? '' : 'Today: $takenCount of ${doses.length} taken.';

    // One callback for both the pointer and the accessibility tap, so the two
    // cannot drift apart.
    void open() =>
        context.pushNamed('medicationDetail', pathParameters: {'medId': m.id});

    // `onTap` here is what makes the row operable by TalkBack, VoiceOver and
    // Switch Access. Without it the node says `isButton` but carries no tap
    // action, because the wrapper hides the InkWell's action from the
    // accessibility tree — the row would announce itself as a button that
    // cannot be pressed.
    return Semantics(
      button: true,
      onTap: open,
      excludeSemantics: true,
      label:
          '${m.spokenSummary}'
          '${todayLine.isEmpty ? '' : ' $todayLine'} Opens the details.',
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSizes.cardGap),
        decoration: BoxDecoration(
          color: AppColors.surface0,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.border200),
        ),
        child: InkWell(
          onTap: open,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: AppSizes.minTapTarget),
            child: Padding(
              padding: const EdgeInsets.all(AppSizes.pagePadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    m.displayTitle,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.text900,
                    ),
                  ),
                  if (m.purpose.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      // Never truncated and never given a maxLines: this is
                      // the sentence the whole screen exists to deliver.
                      child: Text(
                        m.purpose,
                        style: const TextStyle(
                          fontSize: 16,
                          color: AppColors.text700,
                        ),
                      ),
                    ),
                  if (m.appearance.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        m.appearance,
                        style: const TextStyle(
                          fontSize: 15,
                          color: AppColors.text500,
                        ),
                      ),
                    ),
                  const SizedBox(height: 10),
                  if (m.isAsNeeded)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.info_outline,
                          size: 18,
                          color: AppColors.statusDueFg,
                        ),
                        const SizedBox(width: 6),
                        const Expanded(
                          child: Text(
                            'Take only when you need it.',
                            style: TextStyle(
                              fontSize: 15,
                              color: AppColors.statusDueFg,
                            ),
                          ),
                        ),
                      ],
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final dose in doses)
                          StatusChip(
                            visual: visualForDoseStatus(dose.status),
                            text:
                                '${dose.scheduledTime.label12h} · '
                                '${visualForDoseStatus(dose.status).word}',
                          ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
