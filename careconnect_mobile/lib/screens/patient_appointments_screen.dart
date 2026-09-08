import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/appointment.dart';
import '../providers/appointment_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/appointment_tile.dart';
import '../widgets/care_page.dart';
import '../widgets/section_header.dart';

/// The patient's appointments, grouped so that "when" is never ambiguous.
///
/// Note the `Cancelled` section. A cancelled appointment stays on the screen
/// rather than disappearing, because to someone with short-term memory loss a
/// row that has silently vanished is indistinguishable from a row they have
/// forgotten — which is the exact anxiety this app exists to remove. It is
/// shown, labelled, and explicitly says there is nowhere to go.
class PatientAppointmentsScreen extends StatelessWidget {
  const PatientAppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appts = context.watch<AppointmentProvider>();

    final today = appts.todaysAppointments;
    final later =
        appts.upcoming.where((a) => !a.isToday(appts.now)).toList();
    final cancelled = appts.cancelled;
    final past = appts.past;
    final isEmpty =
        today.isEmpty && later.isEmpty && cancelled.isEmpty && past.isEmpty;

    return CarePage(
      state: appts.state,
      errorMessage: appts.errorMessage,
      onRetry: appts.load,
      loadingLabel: 'Loading your appointments…',
      child: ListView(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        children: [
          Semantics(
            header: true,
            child: const Text(
              'My appointments',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: AppColors.text900,
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Tap an appointment to see where to go and who is taking you.',
            style: TextStyle(fontSize: 16, color: AppColors.text500),
          ),
          if (isEmpty) ...[
            const SizedBox(height: 24),
            const Text(
              'You have no appointments coming up.',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.text700,
              ),
            ),
          ],
          if (today.isNotEmpty) ...[
            const SectionHeader('Today'),
            ..._tiles(context, today, appts),
          ],
          if (later.isNotEmpty) ...[
            const SectionHeader('Coming up'),
            ..._tiles(context, later, appts),
          ],
          if (cancelled.isNotEmpty) ...[
            const SectionHeader(
              'Cancelled',
              subtitle: 'You do not need to go to these.',
            ),
            ..._tiles(context, cancelled, appts),
          ],
          if (past.isNotEmpty) ...[
            const SectionHeader('Already happened'),
            ..._tiles(context, past, appts),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  List<Widget> _tiles(
    BuildContext context,
    List<Appointment> appointments,
    AppointmentProvider appts,
  ) {
    return [
      for (final a in appointments)
        AppointmentTile(
          appointment: a,
          now: appts.now,
          onTap: () => context.pushNamed(
            'appointmentDetail',
            pathParameters: {'apptId': a.id},
          ),
        ),
    ];
  }
}
