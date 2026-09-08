import 'package:flutter/material.dart';

import '../core/load_state.dart';
import '../theme/app_colors.dart';
import '../utils/responsive.dart';

/// The shell every patient screen sits in.
///
/// It does three jobs: paints the page background, caps the width on a tablet,
/// and owns the loading / error / content branch — so that branch is written
/// once and widget-tested once instead of being retyped on three screens.
///
/// It deliberately has **no `AppBar`**. These screens are bodies inside
/// `HomeScreen`'s `Scaffold`, and a second AppBar is exactly the bug the team
/// already had to fix once on the caregiver Activity screen.
class CarePage extends StatelessWidget {
  const CarePage({
    super.key,
    required this.state,
    required this.child,
    this.errorMessage,
    this.onRetry,
    this.loadingLabel = 'Loading…',
  });

  final LoadState state;
  final Widget child;
  final String? errorMessage;
  final VoidCallback? onRetry;
  final String loadingLabel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface50,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: Responsive.isTablet(context) ? 640 : double.infinity,
            ),
            child: _body(),
          ),
        ),
      ),
    );
  }

  Widget _body() {
    if (state.isLoading || state.isIdle) {
      return Semantics(
        liveRegion: true,
        container: true,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: AppSizes.cardGap),
            Text(
              loadingLabel,
              style: const TextStyle(fontSize: 18, color: AppColors.text700),
            ),
          ],
        ),
      );
    }

    if (state.hasError) {
      return Padding(
        padding: const EdgeInsets.all(AppSizes.pagePadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppColors.danger600),
            const SizedBox(height: AppSizes.cardGap),
            Text(
              errorMessage ?? 'Something went wrong.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, color: AppColors.text900),
            ),
            const SizedBox(height: AppSizes.cardGap),
            if (onRetry != null)
              Semantics(
                button: true,
                label: 'Try again',
                child: ElevatedButton(
                  onPressed: onRetry,
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
    }

    return child;
  }
}
