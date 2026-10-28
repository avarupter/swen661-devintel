// PWA behaviour verification (dev-only; run against `npm run preview`).
//   node scripts/verify-pwa.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const SESSION = {
  user: { id: 'verify_user', name: 'Margaret Okafor', email: 'margaret@example.com' },
  role: 'patient',
};

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return await chromium.launch({ channel: 'msedge' });
  }
}

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
await context.addInitScript(
  (s) => localStorage.setItem('careconnect_session', JSON.stringify(s)),
  SESSION,
);
const page = await context.newPage();
let pass = 0;
let fail = 0;
const check = (ok, label, extra = '') => {
  console.log(`[${ok ? 'ok' : 'FAIL'}] ${label}${extra ? '  ' + extra : ''}`);
  ok ? pass++ : fail++;
};

// ── 1. Manifest is linked and valid ─────────────────────────────────────────────
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href');
check(manifestHref === '/manifest.webmanifest', 'manifest linked', manifestHref || '');
const manifest = await page.evaluate(async (href) => (await fetch(href)).json(), manifestHref);
check(manifest.name === 'CareConnect', 'manifest name = CareConnect');
check(manifest.display === 'standalone', 'display = standalone');
check(
  manifest.icons.some((i) => i.purpose === 'maskable') &&
    manifest.icons.some((i) => i.sizes === '512x512'),
  'has maskable + 512px icons',
);
check(manifest.theme_color === '#146488', 'theme_color set', manifest.theme_color);

// ── 2. Service worker registers and activates ───────────────────────────────────
const swReady = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  return !!reg.active;
});
check(swReady, 'service worker active');

// Give the SW a moment to precache the shell.
await page.waitForTimeout(800);

// ── 3. Offline: app shell + today's schedule still load ─────────────────────────
await context.setOffline(true);
await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.waitForTimeout(800);
const offlineHeading = await page
  .locator('text=/Here.s your day/i')
  .first()
  .isVisible()
  .catch(() => false);
const offlineSchedule = await page
  .locator('text=/Next thing to do/i')
  .first()
  .isVisible()
  .catch(() => false);
check(offlineHeading, "offline: 'Here's your day' renders");
check(offlineSchedule, "offline: today's schedule renders");
await context.setOffline(false);

// ── 4. Install prompt: appears, keyboard-operable, Escape dismisses ─────────────
// beforeinstallprompt won't fire reliably in automation, so simulate it.
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.removeItem('careconnect_install_dismissed_until');
  const e = new Event('beforeinstallprompt');
  // Stub the methods InstallPrompt awaits.
  e.prompt = async () => {};
  e.userChoice = Promise.resolve({ outcome: 'dismissed' });
  window.dispatchEvent(e);
});
const promptRegion = page.locator('[aria-labelledby="install-prompt-title"]');
await promptRegion.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
check(await promptRegion.isVisible().catch(() => false), 'install prompt visible');

// Keyboard: focus the Install button, confirm it's reachable, then Escape dismiss.
const installBtn = page.getByRole('button', { name: 'Install', exact: true });
await installBtn.focus();
const focused = await page.evaluate(
  () => document.activeElement?.textContent?.includes('Install') ?? false,
);
check(focused, 'Install button is keyboard-focusable');

await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check(!(await promptRegion.isVisible().catch(() => true)), 'Escape dismisses prompt');

await browser.close();
console.log(`\n${fail === 0 ? 'ALL PWA CHECKS PASSED' : fail + ' PWA CHECK(S) FAILED'} (${pass} ok)`);
process.exit(fail === 0 ? 0 : 1);
