// Responsive verification harness (dev-only; run against `npm run preview`).
//   node scripts/verify-responsive.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const SHOT_DIR = 'scripts/.shots';
mkdirSync(SHOT_DIR, { recursive: true });

const SESSION = {
  user: { id: 'verify_user', name: 'Margaret Okafor', email: 'margaret@example.com' },
  role: 'patient',
};

const breakpoints = [
  { name: '320-patient', width: 320, height: 720, role: 'patient' },
  { name: '375-patient', width: 375, height: 812, role: 'patient' },
  { name: '768-caregiver', width: 768, height: 1024, role: 'caregiver' },
  { name: '768-patient', width: 768, height: 1024, role: 'patient' },
  { name: '1024-caregiver', width: 1024, height: 768, role: 'caregiver' },
  { name: '1280-caregiver', width: 1280, height: 800, role: 'caregiver' },
  { name: '1280-patient', width: 1280, height: 800, role: 'patient' },
];

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    console.log('  (chromium download missing — falling back to installed msedge)');
    return await chromium.launch({ channel: 'msedge' });
  }
}

const browser = await launch();
let failures = 0;

for (const bp of breakpoints) {
  const context = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    deviceScaleFactor: 1,
  });
  // Seed an authenticated session before any app code runs.
  await context.addInitScript(
    (sess) => localStorage.setItem('careconnect_session', JSON.stringify(sess)),
    { ...SESSION, role: bp.role },
  );

  const page = await context.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // The app initialises the view as "patient" on first mount (role hydrates
  // async). To exercise caregiver layouts, flip via the header "Switch role"
  // control — the same path a real user takes.
  if (bp.role === 'caregiver') {
    await page.locator('button[aria-label="Switch to caregiver role"]').click();
    await page.waitForTimeout(300);
  }

  // 1. Horizontal overflow check
  const metrics = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    bodyScrollW: document.body.scrollWidth,
  }));
  const overflow = metrics.scrollW - metrics.clientW;
  const hScroll = overflow > 1;

  // 2. Layout-feature checks
  const nav = page.locator('nav[aria-label="Main navigation"]').first();
  const navBox = await nav.boundingBox();
  const vh = bp.height;
  let featureNote = '';

  if (bp.role === 'patient') {
    // Bottom nav: a nav anchored near the bottom of the viewport.
    const isBottom = navBox && navBox.y + navBox.height >= vh - 4;
    featureNote = isBottom ? 'bottom-nav ✓' : `bottom-nav ✗ (y=${navBox?.y})`;
    if (!isBottom) failures++;
  } else if (bp.width >= 1024) {
    // Caregiver desktop: a left sidebar (tall, narrow, anchored left).
    const isSidebar = navBox && navBox.x < 8 && navBox.height > vh * 0.4;
    featureNote = isSidebar
      ? `sidebar ✓ (w=${Math.round(navBox.width)})`
      : `sidebar ✗ (box=${JSON.stringify(navBox)})`;
    if (!isSidebar) failures++;
  } else {
    // Caregiver tablet: top nav strip (full-width, near top).
    const isTopStrip = navBox && navBox.y < 220 && navBox.width > bp.width * 0.8;
    featureNote = isTopStrip ? 'top-nav-strip ✓' : `top-nav-strip ? (box=${JSON.stringify(navBox)})`;
  }

  if (hScroll) failures++;
  const status = hScroll ? 'FAIL' : 'ok';
  console.log(
    `[${status}] ${bp.name.padEnd(16)} ${bp.width}px  ` +
      `overflow=${overflow}px  ${featureNote}`,
  );

  await page.screenshot({ path: `${SHOT_DIR}/${bp.name}.png`, fullPage: false });
  await context.close();
}

await browser.close();
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
