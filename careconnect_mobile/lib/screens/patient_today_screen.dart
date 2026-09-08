import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/day_labels.dart';
import '../models/dose.dart';
import '../providers/appointment_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/medication_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/appointment_tile.dart';
import '../widgets/care_page.dart';
import '../widgets/dose_tile.dart';
import '../widgets/section_header.dart';

/// The patient's daily dashboard, and their landing tab.
///
/// This screen is the team's short-term-memory-loss constraint made concrete.
/// It is built so that the four questions a patient with STML asks over and
/// over are all answered without recalling anything and without tapping
/// anything:
///
///   * *What day is it?*            — the date and greeting header.
///   * *Did I already take my pills?* — every dose is split into
///     "Take these now" / "Later today" / "Already done", and each card states
///     who logged it and when.
///   * *How much is left?*          — one summary sentence and a progress bar.
///   * *Am I going anywhere?*       — "Where you are going", including who is
///     driving.
///
/// There is no timer here. Freshness comes from the lifecycle observer below
/// and from the visible Refresh button; a `Timer.periodic` would make every
/// widget test that mounts this screen fail with "A Timer is still pending".
class PatientTodayScreen extends StatefulWidget {
  const PatientTodayScreen({super.key});

  @override
  State<PatientTodayScreen> createState() => _PatientTodayScreenState();
}

class _PatientTodayScreenState extends State<PatientTodayScreen>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Coming back to a phone left on the side all morning must not show a
    // stale "Due now". This is the pull that replaces a polling timer.
    if (state == AppLifecycleState.resumed) _refresh();
  }

  void _refresh() {
    context.read<MedicationProvider>().syncNow();
    context.read<AppointmentProvider>().syncNow();
  }

  @override
  Widget build(BuildContext context) {
    final meds = context.watch<MedicationProvider>();
    final appts = context.watch<AppointmentProvider>();
    final auth = context.watch<AuthProvider>();

    return CarePage(
      state: meds.state,
      errorMessage: meds.errorMessage,
      onRetry: meds.load,
      loadingLabel: 'Loading your day…',
      child: ListView(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        children: [
          _header(meds, auth),
          const SizedBox(height: AppSizes.cardGap),
          _progressCard(meds),
          ..._doseSections(meds),
          ..._appointmentSection(appts),
          if (meds.saveErrorMessage != null) _saveBanner(meds.saveErrorMessage!),
          const SizedBox(height: 24),
          _refreshButton(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ------------------------------------------------------------------ header

  Widget _header(MedicationProvider meds, AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: const Text(
            'Today',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: AppColors.text900,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          fullDateLabel(meds.today),
          style: const TextStyle(fontSize: 18, color: AppColors.text700),
        ),
        Text(
          greetingLine(meds.now, auth.user?.name),
          style: const TextStyle(fontSize: 18, color: AppColors.text500),
        ),
      ],
    );
  }

  /// The "how much is left" card.
  ///
  /// `liveRegion: true` is what makes TalkBack re-announce the summary after a
  /// dose is ticked off, so a screen-reader user gets the same confirmation a
  /// sighted user gets from the bar moving.
  Widget _progressCard(MedicationProvider meds) {
    return Semantics(
      liveRegion: true,
      container: true,
      child: Container(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        decoration: BoxDecoration(
          color: AppColors.surface0,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.border200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              meds.todaySummarySentence,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.text900,
              ),
            ),
            const SizedBox(height: 12),
            ExcludeSemantics(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: meds.todayProgress,
                  minHeight: 12,
                  backgroundColor: AppColors.border200,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    AppColors.statusTakenFg,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${meds.takenCountToday} of ${meds.totalDosesToday} doses taken today',
              style: const TextStyle(fontSize: 15, color: AppColors.text500),
            ),
          ],
        ),
      ),
    );
  }

  // ------------------------------------------------------------- dose lists

  List<Widget> _doseSections(MedicationProvider meds) {
    if (meds.totalDosesToday == 0) {
      return [
        const SizedBox(height: 24),
        _quietCard(
          icon: Icons.info_outline,
          colour: AppColors.primary800,
          text: 'You have no medicines scheduled today.',
        ),
      ];
    }

    return [
      if (meds.needsAction.isNotEmpty) ...[
        const SectionHeader('Take these now'),
        ...meds.needsAction.map((d) => _tile(meds, d)),
      ],
      if (meds.upcomingToday.isNotEmpty) ...[
        const SectionHeader('Later today'),
        ...meds.upcomingToday.map((d) => _tile(meds, d)),
      ],
      if (meds.takenToday.isNotEmpty) ...[
        const SectionHeader('Already done'),
        ...meds.takenToday.map((d) => _tile(meds, d)),
      ],
      // Skipped doses stay on the page. Removing them would leave a patient
      // who cannot recall the decision with no way to see that one was made,
      // and no way to change their mind.
      if (meds.skippedToday.isNotEmpty) ...[
        const SectionHeader(
          'Skipped',
          subtitle: 'You decided not to take these today.',
        ),
        ...meds.skippedToday.map((d) => _tile(meds, d)),
      ],
      if (meds.isDayComplete) ...[
        const SizedBox(height: 8),
        // Worded from what actually happened. "All done" over a day where
        // doses were skipped would tell the patient they had taken medicine
        // they had not — and they cannot check that against their own memory.
        if (meds.allSkippedToday.isEmpty)
          _quietCard(
            icon: Icons.check_circle,
            colour: AppColors.statusTakenFg,
            text: 'All done. There is nothing left to take today.',
          )
        else
          _quietCard(
            icon: Icons.task_alt,
            colour: AppColors.primary800,
            text: 'Nothing is left to decide today. You took '
                '${meds.takenCountToday} of ${meds.totalDosesToday} doses and '
                'skipped ${meds.allSkippedToday.length}.',
          ),
      ],
    ];
  }

  DoseTile _tile(MedicationProvider meds, ScheduledDose dose) => DoseTile(
        dose: dose,
        onToggleTaken: () => meds.toggleTaken(dose.id),
        onOpenMedication: () => context.pushNamed(
          'medicationDetail',
          pathParameters: {'medId': dose.medication.id},
        ),
      );

  // ------------------------------------------------------------ appointments

  List<Widget> _appointmentSection(AppointmentProvider appts) {
    final today = appts.todaysAppointments;
    return [
      const SectionHeader('Where you are going'),
      if (today.isNotEmpty)
        ...today.map(
          (a) => AppointmentTile(
            appointment: a,
            now: appts.now,
            onTap: () => context.pushNamed(
              'appointmentDetail',
              pathParameters: {'apptId': a.id},
            ),
          ),
        )
      else
        Container(
          padding: const EdgeInsets.all(AppSizes.pagePadding),
          decoration: BoxDecoration(
            color: AppColors.surface0,
            borderRadius: BorderRadius.circular(AppSizes.cardRadius),
            border: Border.all(color: AppColors.border200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'You have nothing to go to today.',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text900,
                ),
              ),
              if (appts.nextAppointment != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    appts.nextAppointmentSentence,
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppColors.text700,
                    ),
                  ),
                ),
            ],
          ),
        ),
    ];
  }

  // ----------------------------------------------------------------- chrome

  /// A failed write is reported inline and permanently, not as a snackbar that
  /// vanishes before it can be read. The tick itself still stands.
  Widget _saveBanner(String message) {
    return Semantics(
      liveRegion: true,
      container: true,
      child: Container(
        margin: const EdgeInsets.only(top: 24),
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        decoration: BoxDecoration(
          color: AppColors.dangerTint,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.danger600),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.warning_amber, color: AppColors.danger600),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.danger600,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _refreshButton() {
    return Semantics(
      button: true,
      label: 'Refresh what is due now',
      child: OutlinedButton.icon(
        onPressed: _refresh,
        icon: const Icon(Icons.refresh),
        label: const ExcludeSemantics(child: Text('Refresh')),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, AppSizes.minTapTarget),
          foregroundColor: AppColors.primary800,
          side: const BorderSide(color: AppColors.border300),
        ),
      ),
    );
  }

  Widget _quietCard({
    required IconData icon,
    required Color colour,
    required String text,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSizes.pagePadding),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(color: AppColors.border200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: colour),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: colour,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
