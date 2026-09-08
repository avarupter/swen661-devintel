import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/load_state.dart';
import '../models/medication.dart';
import '../providers/medication_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/dose_tile.dart';
import '../widgets/section_header.dart';

/// Go back, or go home when there is nowhere to go back to.
///
/// The AppBar's `leading` is set unconditionally, which is the right call for
/// this audience — an always-present, always-labelled back affordance beats one
/// that sometimes isn't there. But setting `leading` also defeats AppBar's own
/// "hide the chevron when the stack is empty" behaviour, and go_router's
/// `context.pop()` throws `GoError: There is nothing to pop` rather than
/// no-opping. That happens whenever this screen is the first route: a deep
/// link, or a cold start straight into a detail URL.
///
/// `canPop()` is checked inside the callback rather than in `build`, because it
/// is a go_router extension and the widget tests mount these screens under a
/// plain MaterialApp with no GoRouter above them.
void _goBack(BuildContext context) {
  if (context.canPop()) {
    context.pop();
  } else {
    context.goNamed('home');
  }
}

/// Everything about one medicine.
///
/// [medicationId] arrives in the route path (`/medications/:medId`) and is
/// resolved against the provider here. The id travels, not the object: that
/// way the route survives a restart or a deep link, and the screen rebuilds
/// when the shared state changes rather than rendering a stale snapshot.
class MedicationDetailScreen extends StatelessWidget {
  const MedicationDetailScreen({super.key, required this.medicationId});

  /// The information passed from the previous screen.
  final String medicationId;

  @override
  Widget build(BuildContext context) {
    final meds = context.watch<MedicationProvider>();
    final medication = meds.medicationById(medicationId);

    // The ordering of this switch matters. Rendering "we could not find that
    // medicine" while the provider is merely still reading the file would tell
    // a patient with memory loss that their medicine had been taken off their
    // list — the worst false message this app could produce. Loading is
    // checked before not-found, always.
    final Widget body = switch (meds.state) {
      LoadState.idle || LoadState.loading => _loading(),
      LoadState.error => _error(meds),
      LoadState.ready when medication == null => _notFound(context),
      LoadState.ready => _content(context, meds, medication!),
    };

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        backgroundColor: AppColors.surface0,
        foregroundColor: AppColors.text900,
        elevation: 0,
        title: Text(
          medication?.name ?? 'Medicine',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        // A labelled back affordance, not a bare chevron: "back" is only
        // meaningful if you remember where you came from.
        leading: Semantics(
          button: true,
          label: 'Back to my medicines',
          child: BackButton(
            onPressed: () => _goBack(context),
          ),
        ),
      ),
      body: SafeArea(child: body),
    );
  }

  Widget _loading() => Semantics(
        liveRegion: true,
        container: true,
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: AppSizes.cardGap),
            Text(
              'Loading this medicine…',
              style: TextStyle(fontSize: 18, color: AppColors.text700),
            ),
          ],
        ),
      );

  Widget _error(MedicationProvider meds) => Padding(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppColors.danger600),
            const SizedBox(height: AppSizes.cardGap),
            Text(
              meds.errorMessage ?? 'Something went wrong.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, color: AppColors.text900),
            ),
            const SizedBox(height: AppSizes.cardGap),
            Semantics(
              button: true,
              label: 'Try again',
              child: ElevatedButton(
                onPressed: meds.load,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(160, AppSizes.minTapTarget),
                  backgroundColor: AppColors.primary700,
                  foregroundColor: AppColors.surface0,
                ),
                child: const ExcludeSemantics(child: Text('Try again')),
              ),
            ),
          ],
        ),
      );

  Widget _notFound(BuildContext context) => Padding(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.help_outline,
              size: 48,
              color: AppColors.text500,
            ),
            const SizedBox(height: AppSizes.cardGap),
            const Text(
              'We could not find that medicine.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppColors.text900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'It may have been removed from your list.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: AppColors.text700),
            ),
            const SizedBox(height: AppSizes.cardGap),
            Semantics(
              button: true,
              label: 'Back to my medicines',
              child: ElevatedButton(
                onPressed: () => _goBack(context),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(200, AppSizes.minTapTarget),
                  backgroundColor: AppColors.primary700,
                  foregroundColor: AppColors.surface0,
                ),
                child: const ExcludeSemantics(
                  child: Text('Back to my medicines'),
                ),
              ),
            ),
          ],
        ),
      );

  Widget _content(
    BuildContext context,
    MedicationProvider meds,
    Medication m,
  ) {
    final doses = meds.dosesForMedication(m.id);

    return ListView(
      padding: const EdgeInsets.all(AppSizes.pagePadding),
      children: [
        Semantics(
          header: true,
          child: Text(
            m.displayTitle,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: AppColors.text900,
            ),
          ),
        ),
        if (m.purpose.isNotEmpty) ...[
          const SectionHeader('What it is for'),
          _card(Text(
            m.purpose,
            style: const TextStyle(fontSize: 18, color: AppColors.text900),
          )),
        ],
        if (m.appearance.isNotEmpty) ...[
          const SectionHeader('What it looks like'),
          _card(Text(
            m.appearance,
            style: const TextStyle(fontSize: 18, color: AppColors.text900),
          )),
        ],
        const SectionHeader('How to take it'),
        _card(Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (m.instructions.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  m.instructions,
                  style: const TextStyle(
                    fontSize: 18,
                    color: AppColors.text900,
                  ),
                ),
              ),
            Text(
              'Dose: ${m.dosage}',
              style: const TextStyle(fontSize: 16, color: AppColors.text700),
            ),
            Text(
              'Form: ${m.form.label}',
              style: const TextStyle(fontSize: 16, color: AppColors.text700),
            ),
          ],
        )),
        const SectionHeader('When to take it'),
        _card(
          m.isAsNeeded
              ? const Text(
                  'Take only when you need it.',
                  style: TextStyle(fontSize: 18, color: AppColors.text900),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final t in m.schedule)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          '${t.dayPart.label} — ${t.label12h}',
                          style: const TextStyle(
                            fontSize: 18,
                            color: AppColors.text900,
                          ),
                        ),
                      ),
                  ],
                ),
        ),
        if (doses.isNotEmpty) ...[
          const SectionHeader("Today's doses"),
          // onOpenMedication is null: you are already on the medicine.
          ...doses.map(
            (d) => DoseTile(
              dose: d,
              onToggleTaken: () => meds.toggleTaken(d.id),
            ),
          ),
        ],
        if (m.prescriber != null && m.prescriber!.isNotEmpty) ...[
          const SectionHeader('Prescribed by'),
          _card(Text(
            m.prescriber!,
            style: const TextStyle(fontSize: 18, color: AppColors.text900),
          )),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _card(Widget child) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        decoration: BoxDecoration(
          color: AppColors.surface0,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.border200),
        ),
        child: child,
      );
}
