import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/load_state.dart';
import '../models/appointment.dart';
import '../providers/appointment_provider.dart';
import '../theme/app_colors.dart';
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

/// Everything about one appointment.
///
/// Like [MedicationDetailScreen], the id travels in the route path
/// (`/appointments/:apptId`) and is resolved against the provider here.
class AppointmentDetailScreen extends StatelessWidget {
  const AppointmentDetailScreen({super.key, required this.appointmentId});

  /// The information passed from the previous screen.
  final String appointmentId;

  @override
  Widget build(BuildContext context) {
    final appts = context.watch<AppointmentProvider>();
    final appointment = appts.appointmentById(appointmentId);

    // Loading is checked before not-found — see MedicationDetailScreen for why.
    final Widget body = switch (appts.state) {
      LoadState.idle || LoadState.loading => _loading(),
      LoadState.error => _error(appts),
      LoadState.ready when appointment == null => _notFound(context),
      LoadState.ready => _content(context, appts, appointment!),
    };

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        backgroundColor: AppColors.surface0,
        foregroundColor: AppColors.text900,
        elevation: 0,
        title: const Text(
          'Appointment',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        leading: Semantics(
          button: true,
          label: 'Back to my appointments',
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
              'Loading this appointment…',
              style: TextStyle(fontSize: 18, color: AppColors.text700),
            ),
          ],
        ),
      );

  Widget _error(AppointmentProvider appts) => Padding(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppColors.danger600),
            const SizedBox(height: AppSizes.cardGap),
            Text(
              appts.errorMessage ?? 'Something went wrong.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, color: AppColors.text900),
            ),
            const SizedBox(height: AppSizes.cardGap),
            Semantics(
              button: true,
              label: 'Try again',
              child: ElevatedButton(
                onPressed: appts.load,
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
            const Icon(Icons.help_outline, size: 48, color: AppColors.text500),
            const SizedBox(height: AppSizes.cardGap),
            const Text(
              'We could not find that appointment.',
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
              label: 'Back to my appointments',
              child: ElevatedButton(
                onPressed: () => _goBack(context),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(220, AppSizes.minTapTarget),
                  backgroundColor: AppColors.primary700,
                  foregroundColor: AppColors.surface0,
                ),
                child: const ExcludeSemantics(
                  child: Text('Back to my appointments'),
                ),
              ),
            ),
          ],
        ),
      );

  Widget _content(
    BuildContext context,
    AppointmentProvider appts,
    Appointment a,
  ) {
    final now = appts.now;
    final transportArranged = a.transport.isArranged;

    return ListView(
      padding: const EdgeInsets.all(AppSizes.pagePadding),
      children: [
        if (a.isCancelled)
          Semantics(
            liveRegion: true,
            container: true,
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: AppSizes.cardGap),
              padding: const EdgeInsets.all(AppSizes.pagePadding),
              decoration: BoxDecoration(
                color: AppColors.dangerTint,
                borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                border: Border.all(color: AppColors.danger600),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.event_busy, color: AppColors.danger600),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'This appointment was cancelled. '
                      'You do not need to go.',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: AppColors.danger600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        Semantics(
          header: true,
          child: Text(
            a.title,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: AppColors.text900,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${a.relativeDayLabel(now)} at ${a.timeLabel}',
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppColors.primary900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          a.clinicianRole.isEmpty
              ? a.clinician
              : '${a.clinician}, ${a.clinicianRole}',
          style: const TextStyle(fontSize: 18, color: AppColors.text700),
        ),
        const SectionHeader('Where to go'),
        _card(
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.place_outlined, color: AppColors.text500),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  a.location.isEmpty ? 'Not recorded' : a.location,
                  style: const TextStyle(
                    fontSize: 18,
                    color: AppColors.text900,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SectionHeader('Who is taking you'),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSizes.pagePadding),
          decoration: BoxDecoration(
            color: transportArranged
                ? AppColors.primary100
                : AppColors.statusDueBg,
            borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                transportArranged ? Icons.directions_car : Icons.help_outline,
                color: transportArranged
                    ? AppColors.primary800
                    : AppColors.statusDueFg,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  transportArranged
                      ? a.transport.summary
                      : 'Transport is not arranged yet. Ask Joyce.',
                  style: TextStyle(
                    fontSize: 18,
                    color: transportArranged
                        ? AppColors.primary800
                        : AppColors.statusDueFg,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (a.hasPreparation) ...[
          const SectionHeader('What to bring'),
          // One semantics node reading the whole list, so a screen-reader user
          // hears "What to bring: X, Y, Z" instead of three orphaned items.
          Semantics(
            container: true,
            label: 'What to bring: ${a.preparation.join(', ')}',
            child: ExcludeSemantics(
              child: _card(
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final item in a.preparation)
                      ConstrainedBox(
                        constraints: const BoxConstraints(
                          minHeight: AppSizes.minTapTarget,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.check_box_outline_blank,
                              size: 24,
                              color: AppColors.text500,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                item,
                                style: const TextStyle(
                                  fontSize: 17,
                                  color: AppColors.text900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
        if (a.notes.isNotEmpty) ...[
          const SectionHeader('Notes'),
          _card(Text(
            a.notes,
            style: const TextStyle(fontSize: 17, color: AppColors.text900),
          )),
        ],
        const SectionHeader('How long it takes'),
        _card(Text(
          'About ${a.duration.inMinutes} minutes',
          style: const TextStyle(fontSize: 18, color: AppColors.text900),
        )),
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
