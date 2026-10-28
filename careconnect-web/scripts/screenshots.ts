/**
 * scripts/screenshots.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Automated README screenshots for CareConnect.
 *
 * What it does:
 *   1. Builds the app (`npm run build`) for stable, hashed assets, then serves it
 *      with `npm run preview`. If a server is already reachable on PORT it is
 *      reused (and no build is run) so you can iterate quickly.
 *   2. Uses the mock auth by seeding `localStorage` (careconnect_session) so the
 *      protected /app routes load reliably, selecting the right role per screen.
 *   3. For every screen, navigates, performs any needed interaction (open the
 *      chatbot, mark a dose taken, open the medication form, switch to the
 *      caregiver view), waits for a key selector so we never capture a blank or
 *      loading state, then writes a 1280x800 PNG into docs/screenshots/.
 *   4. Logs which screenshots succeeded and which failed, and exits non-zero if
 *      any of the 14 expected files is missing.
 *
 * Run with:  npm run screenshots
 *
 * Note on the caregiver view: AppShell derives its initial view from the auth
 * role at mount, but the role hydrates asynchronously, so a fresh page load
 * always lands on the patient view. Caregiver screens are therefore reached the
 * same way a real user would — by clicking the header "Switch role" control.
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'docs', 'screenshots');

const PORT = Number(process.env.PORT ?? 4173);
const VIEWPORT = { width: 1280, height: 800 };
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// A mock signed-in user. Seeding the session directly is enough for the auth
// context to rehydrate — no need to walk the sign-up form first.
const USER = { id: 'demo-user', name: 'Joyce Adeyemi', email: 'joyce@example.com' };

type Seed = 'none' | 'no-role' | 'patient';

interface Shot {
  file: string;
  /** localStorage seed to apply before the app boots */
  seed: Seed;
  /** Full URL path to open (after the origin) */
  path: string;
  /** Switch into the caregiver view after load (click the header control) */
  caregiver?: boolean;
  /** Drive the page after load: open a panel, mark a dose, open a form, etc. */
  prepare?: (page: Page) => Promise<void>;
  /** Selector / text that must be visible before we capture */
  waitFor: (page: Page) => Promise<void>;
}

// ── Small helpers ────────────────────────────────────────────────────────────

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok || res.status === 304;
  } catch {
    return false;
  }
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await probe(url)) return;
    await sleep(500);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, shell: true, stdio: 'inherit' });
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)),
    );
    child.on('error', reject);
  });
}

/** Switch the app chrome from the (default) patient view into the caregiver view. */
async function switchToCaregiver(page: Page): Promise<void> {
  const toggle = page.locator('button[aria-label="Switch to caregiver role"]');
  await toggle.click();
  // The caregiver chrome announces whose plan is being viewed.
  await page.getByText("Viewing Margaret's care plan").waitFor({ state: 'visible', timeout: 10_000 });
}

// ── The 14 screens ───────────────────────────────────────────────────────────

const shots: Shot[] = [
  {
    file: '01-landing.png',
    seed: 'none',
    path: '/',
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /daily companion/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '02-assistant.png',
    seed: 'none',
    path: '/',
    prepare: async (p) => {
      await p.locator('button[aria-controls="chatbot-panel"]').click();
    },
    waitFor: (p) => p.getByRole('heading', { name: 'CareConnect Assistant' }).waitFor({ state: 'visible' }),
  },
  {
    file: '03-signup.png',
    seed: 'none',
    path: '/signup',
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /create your account/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '04-signin.png',
    seed: 'none',
    path: '/signin',
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /welcome back/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '05-role-chooser.png',
    seed: 'no-role',
    path: '/role',
    waitFor: (p) => p.getByText(/how are you using careconnect/i).waitFor({ state: 'visible' }),
  },
  {
    file: '06-patient-today.png',
    seed: 'patient',
    path: '/app',
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /here's your day/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '07-patient-medications.png',
    seed: 'patient',
    path: '/app/medications',
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /^medicines$/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '08-medication-taken.png',
    seed: 'patient',
    path: '/app/medications',
    prepare: async (p) => {
      // Mark the first medicine as taken to surface the polite confirmation state.
      const markTaken = p.locator('button[aria-label^="Mark "][aria-label$=" as taken"]').first();
      await markTaken.click();
      // Wait until that toggle reports the pressed/taken state.
      await p.locator('button[aria-label^="Mark "][aria-label$=" as not taken"]').first()
        .waitFor({ state: 'visible', timeout: 10_000 });
    },
    waitFor: (p) => p.locator('[role="status"]').first().waitFor({ state: 'visible' }),
  },
  {
    file: '09-patient-appointments.png',
    seed: 'patient',
    path: '/app/appointments',
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /my appointments/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '10-caregiver-dashboard.png',
    seed: 'patient',
    path: '/app',
    caregiver: true,
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /^dashboard$/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '11-caregiver-medications.png',
    seed: 'patient',
    path: '/app/manage-medications',
    caregiver: true,
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /manage medications/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '12-caregiver-medication-form.png',
    seed: 'patient',
    path: '/app/manage-medications',
    caregiver: true,
    prepare: async (p) => {
      await p.locator('button[aria-label="Add new medication"]').click();
    },
    waitFor: (p) => p.getByRole('heading', { name: /add new medication/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '13-caregiver-appointments.png',
    seed: 'patient',
    path: '/app/manage-appointments',
    caregiver: true,
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /manage appointments/i }).waitFor({ state: 'visible' }),
  },
  {
    file: '14-caregiver-activity.png',
    seed: 'patient',
    path: '/app/activity',
    caregiver: true,
    waitFor: (p) => p.getByRole('heading', { level: 1, name: /activity log/i }).waitFor({ state: 'visible' }),
  },
];

// ── Capture one screen in its own isolated context ─────────────────────────────

async function capture(browser: Browser, origin: string, shot: Shot): Promise<void> {
  const context: BrowserContext = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  // Seed localStorage before any app script runs.
  if (shot.seed !== 'none') {
    const role = shot.seed === 'patient' ? 'patient' : null;
    await context.addInitScript(
      ([u, r]) => localStorage.setItem('careconnect_session', JSON.stringify({ user: u, role: r })),
      [USER, role] as const,
    );
  }

  const page = await context.newPage();
  try {
    await page.goto(`${origin}${shot.path}`, { waitUntil: 'networkidle' });

    if (shot.caregiver) await switchToCaregiver(page);
    if (shot.prepare) await shot.prepare(page);
    await shot.waitFor(page);

    // Let fonts/transitions settle for a clean frame.
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT_DIR, shot.file) });
  } finally {
    await context.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const origin = `http://localhost:${PORT}`;
  let server: ChildProcess | undefined;

  // Reuse a running server if one is already up; otherwise build + preview.
  if (await probe(origin)) {
    console.log(`▶ Reusing server already running at ${origin}`);
  } else {
    console.log('▶ Building production bundle (npm run build)…');
    await run(npmCmd, ['run', 'build']);

    console.log(`▶ Starting preview server on port ${PORT}…`);
    server = spawn(npmCmd, ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
      cwd: ROOT,
      shell: true,
      stdio: 'ignore',
      detached: !isWin, // own process group on POSIX so we can kill the tree
    });
    await waitForServer(origin);
    console.log(`▶ Preview ready at ${origin}`);
  }

  const results: { file: string; ok: boolean; error?: string }[] = [];
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch().catch(() => chromium.launch({ channel: 'msedge' }));

    for (const shot of shots) {
      try {
        await capture(browser, origin, shot);
        results.push({ file: shot.file, ok: true });
        console.log(`  ✓ ${shot.file}`);
      } catch (err) {
        const message = err instanceof Error ? err.message.split('\n')[0] : String(err);
        results.push({ file: shot.file, ok: false, error: message });
        console.log(`  ✗ ${shot.file} — ${message}`);
      }
    }
  } finally {
    if (browser) await browser.close();
    if (server?.pid) {
      if (isWin) spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true });
      else process.kill(-server.pid, 'SIGTERM');
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log('\n──────── Screenshot summary ────────');
  console.log(`Succeeded (${succeeded.length}/${shots.length}): ${succeeded.map((r) => r.file).join(', ') || '—'}`);
  if (failed.length) {
    console.log(`Failed (${failed.length}): `);
    for (const f of failed) console.log(`   - ${f.file}: ${f.error}`);
  }

  // Verify every expected file now exists on disk.
  const missing = shots.filter((s) => !existsSync(join(OUT_DIR, s.file))).map((s) => s.file);
  if (missing.length) {
    console.log(`\nMissing files: ${missing.join(', ')}`);
    console.log(`Output dir: ${OUT_DIR}`);
    process.exit(1);
  }

  console.log(`\nAll ${shots.length} screenshots present in docs/screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
