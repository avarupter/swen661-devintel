/* ──────────────────────────────────────────────────────────────────────────────
 * CareConnect service worker
 *
 * Goal: offline access to the app shell so the care recipient can still see
 * today's schedule (which the SPA renders from localStorage + bundled data)
 * even with no connection.
 *
 * Strategy:
 *   - Precache the minimal shell (index.html, manifest, icons) on install.
 *   - Navigations: network-first, falling back to the cached shell when offline.
 *   - Hashed build assets (/assets/*), icons, manifest: stale-while-revalidate.
 *   - Google Fonts: cache-first (immutable, cross-origin).
 *
 * Build assets are content-hashed by Vite, so stale-while-revalidate is safe:
 * a new deploy ships new filenames and the cache self-heals on next load.
 * ────────────────────────────────────────────────────────────────────────────── */

const VERSION = 'v1';
const SHELL_CACHE = `careconnect-shell-${VERSION}`;
const RUNTIME_CACHE = `careconnect-runtime-${VERSION}`;
const FONT_CACHE = `careconnect-fonts-${VERSION}`;

// The app shell — everything needed to boot the SPA offline.
// '/' resolves to index.html; the SPA then renders "Today" from localStorage.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
];

// Discover the content-hashed build assets (JS/CSS) referenced by index.html and
// precache them. Doing this at install time means the very first offline visit
// works — we don't rely on the SW having intercepted those requests at runtime
// (it isn't controlling the page on the initial load).
async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  // Static, known-named assets first (icons, manifest).
  await Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)));

  try {
    const res = await fetch('/index.html', { cache: 'no-cache' });
    if (!res.ok) return;
    // Store the shell document under both '/' and '/index.html'.
    await cache.put('/index.html', res.clone());
    await cache.put('/', res.clone());

    const html = await res.text();
    const urls = new Set();
    // Grab src="/assets/..." and href="/assets/..." (scripts, styles, preloads).
    const re = /(?:src|href)="(\/assets\/[^"]+)"/g;
    let m;
    while ((m = re.exec(html))) urls.add(m[1]);
    await Promise.allSettled([...urls].map((url) => cache.add(url)));
  } catch {
    /* offline at install — runtime caching will fill the gaps later */
  }
}

// ── Install: precache the shell + hashed assets ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell());
  // Activate this worker as soon as it finishes installing.
  self.skipWaiting();
});

// ── Activate: drop stale caches, take control ───────────────────────────────────
self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Allow the page to tell a waiting worker to activate immediately.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Fetch routing ───────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; let the browser do POST/PUT/etc. normally.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Google Fonts — cache-first (stylesheet + font files are effectively immutable).
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // Everything else: only same-origin.
  if (url.origin !== self.location.origin) return;

  // Navigation requests (HTML documents) — network-first with shell fallback.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithShell(request));
    return;
  }

  // Same-origin assets (JS/CSS/icons/manifest) — stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ── Strategies ──────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirstWithShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    // Keep the freshest shell document cached for offline navigations.
    if (response && response.ok) cache.put('/', response.clone());
    return response;
  } catch {
    // Offline: serve the cached document for this URL, else the app shell.
    const cached = (await cache.match(request)) || (await cache.match('/')) || (await cache.match('/index.html'));
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  // Global match so assets precached into the shell cache are also served.
  const cached = (await cache.match(request)) || (await caches.match(request));
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  // Serve cache immediately if present; otherwise wait for the network.
  return cached || (await network) || new Response('Offline', { status: 503 });
}
