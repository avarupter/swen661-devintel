/// Lifecycle of an asynchronously loaded provider.
///
/// Having an explicit state (rather than "empty list means loading, probably")
/// lets the three screens show a spinner, an empty state and an error state
/// that are each independently widget-testable.
enum LoadState { idle, loading, ready, error }

extension LoadStateX on LoadState {
  bool get isIdle => this == LoadState.idle;
  bool get isLoading => this == LoadState.loading;
  bool get isReady => this == LoadState.ready;
  bool get hasError => this == LoadState.error;
}
