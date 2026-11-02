// ──────────────────────────────────────────────────────────────────────────────
// Service-worker registration.
//
// Registers /sw.js after the page loads (so it never competes with first paint).
// In dev, Vite serves modules unbundled and the SW offers no benefit, so we only
// register for production-style builds (preview / deployed). This avoids the
// classic "stale dev module" caching headaches.
// ──────────────────────────────────────────────────────────────────────────────

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  // import.meta.env.PROD is true for `vite build` output (preview & deploy).
  if (!import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Non-fatal: the app works without the SW, just without offline support.
      console.error('Service worker registration failed:', err);
    });
  });
}
