#!/usr/bin/env node
/* global document, getComputedStyle -- page.evaluate callbacks run in the browser */
/**
 * Layout checks that axe cannot make, in Chromium against the renderer dev server:
 *
 * - WCAG 1.4.10 Reflow: every view and dialog at 320 x 256 CSS pixels (a 1280 x 1024
 *   window at 400% zoom) must fit without horizontal scrolling.
 * - WCAG 1.4.12 Text Spacing: with line height 1.5, paragraph spacing 2, letter
 *   spacing 0.12 and word spacing 0.16 applied to everything, no text may be clipped.
 *
 *   npm run dev:web        # terminal 1: serves http://localhost:5173
 *   npm run test:layout    # terminal 2: writes docs/accessibility/layout/
 *
 * Exits non-zero when anything overflows or is clipped.
 */
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright-core')

const ROOT = path.resolve(__dirname, '..')
const APP_URL = process.env.CARECONNECT_URL || 'http://localhost:5173/'
const OUT = path.resolve(ROOT, process.argv[2] || 'docs/accessibility/layout')

/** The WCAG 1.4.12 metrics, as in the W3C text spacing bookmarklet. */
const TEXT_SPACING_CSS = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p { margin-bottom: 2em !important; }
`

const VIEWS = [
  { id: 'overview', nav: 'Overview' },
  { id: 'schedule', nav: 'Schedule' },
  { id: 'patients', nav: 'Patients' },
  { id: 'inbox', nav: /^Inbox/ },
  { id: 'tasks', nav: 'Tasks' },
  { id: 'reports', nav: 'Reports' },
  { id: 'resources', nav: 'Resources' }
]

const DIALOGS = [
  { id: 'dialog-command-palette', name: 'Command palette', open: (p) => p.keyboard.press('Control+K') },
  { id: 'dialog-keyboard-shortcuts', name: 'Keyboard shortcuts', open: (p) => p.keyboard.press('Control+/') },
  { id: 'dialog-help', name: 'Help', open: (p) => p.keyboard.press('F1') },
  { id: 'dialog-settings', name: 'Settings', open: (p) => p.keyboard.press('Control+,') },
  { id: 'dialog-new-patient', name: 'New patient', open: (p) => p.keyboard.press('Control+N') },
  { id: 'dialog-compose-new', name: 'New message', open: (p) => p.keyboard.press('Control+Shift+M') },
  { id: 'dialog-add-note', name: /note/i, open: (p) => p.getByRole('button', { name: 'Add note for Avery Park' }).click() },
  { id: 'dialog-edit-summary', name: /care summary/i, open: (p) => p.getByRole('button', { name: /^Edit care summary for Avery Park/ }).click() },
  {
    id: 'dialog-compose-reply',
    name: 'Reply',
    open: async (p) => {
      await goTo(p, /^Inbox/)
      await p.getByRole('option').first().click()
      await p.keyboard.press('r')
    }
  }
]

async function closeDialogs(page) {
  for (let i = 0; i < 3 && (await page.getByRole('dialog').count()) > 0; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
  }
}

async function goTo(page, nav) {
  await closeDialogs(page)
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('button', { name: nav }).click()
  await page.waitForTimeout(250)
}

/** Content wider than the viewport: the page scroll width, and the elements past the right edge. */
function measureOverflow() {
  const width = document.documentElement.clientWidth
  const beyond = []
  for (const element of document.querySelectorAll('body *')) {
    const box = element.getBoundingClientRect()
    if (box.width === 0 || box.height === 0 || getComputedStyle(element).position === 'fixed') continue
    if (box.right > width + 1) beyond.push(`${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]} (right edge ${Math.round(box.right)}px)`)
  }
  return { viewport: width, scrollWidth: document.documentElement.scrollWidth, beyond: beyond.slice(0, 10) }
}

/** Text cut off by a box that hides its overflow. Visually hidden text (a 1 px box) is meant to be. */
function measureClipping() {
  const clipped = []
  for (const element of document.querySelectorAll('body *')) {
    if (!element.textContent || !element.textContent.trim()) continue
    const style = getComputedStyle(element)
    if (style.visibility === 'hidden' || style.display === 'none') continue
    const box = element.getBoundingClientRect()
    if (box.width <= 1 || box.height <= 1 || element.closest('.visually-hidden')) continue
    const hidesX = style.overflowX === 'hidden' || style.overflowX === 'clip'
    const hidesY = style.overflowY === 'hidden' || style.overflowY === 'clip'
    const cutX = hidesX && element.scrollWidth > element.clientWidth + 1
    const cutY = hidesY && element.scrollHeight > element.clientHeight + 1
    if (cutX || cutY) clipped.push(`${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]}: "${element.textContent.trim().slice(0, 40)}"`)
  }
  return clipped.slice(0, 10)
}

async function run() {
  fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true })
  const browser = await chromium.launch()
  const results = []

  // 1.4.10 Reflow at 320 CSS pixels.
  const narrow = await browser.newPage({ viewport: { width: 320, height: 256 } })
  await narrow.goto(APP_URL)
  await narrow.getByRole('heading', { level: 1 }).waitFor()
  for (const view of VIEWS) {
    await goTo(narrow, view.nav)
    const overflow = await narrow.evaluate(measureOverflow)
    await narrow.screenshot({ path: path.join(OUT, 'screenshots', `reflow-${view.id}.png`), fullPage: true })
    results.push({ check: 'reflow', target: view.id, pass: overflow.scrollWidth <= overflow.viewport && overflow.beyond.length === 0, ...overflow })
  }
  await goTo(narrow, 'Patients')
  for (const dialog of DIALOGS) {
    await closeDialogs(narrow)
    await dialog.open(narrow)
    await narrow.getByRole('dialog', { name: dialog.name }).waitFor()
    await narrow.waitForTimeout(200)
    const overflow = await narrow.evaluate(measureOverflow)
    await narrow.screenshot({ path: path.join(OUT, 'screenshots', `reflow-${dialog.id}.png`) })
    results.push({ check: 'reflow', target: dialog.id, pass: overflow.scrollWidth <= overflow.viewport && overflow.beyond.length === 0, ...overflow })
  }
  await narrow.close()

  // 1.4.12 Text Spacing at the default window size. Text that is already shortened at the normal
  // spacing (a one-line message preview) is a design choice, reported but not failed; text the
  // extra spacing cuts off is a failure.
  const spaced = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await spaced.goto(APP_URL)
  await spaced.getByRole('heading', { level: 1 }).waitFor()
  const checkSpacing = async (target) => {
    await spaced.evaluate(() => document.getElementById('wcag-text-spacing')?.remove())
    await spaced.waitForTimeout(100)
    const before = new Set(await spaced.evaluate(measureClipping))
    await spaced.addStyleTag({ content: TEXT_SPACING_CSS }).then((handle) => handle.evaluate((style) => (style.id = 'wcag-text-spacing')))
    await spaced.waitForTimeout(100)
    const after = await spaced.evaluate(measureClipping)
    await spaced.screenshot({ path: path.join(OUT, 'screenshots', `text-spacing-${target}.png`) })
    const clipped = after.filter((entry) => !before.has(entry))
    results.push({ check: 'text-spacing', target, pass: clipped.length === 0, clipped, byDesign: after.filter((entry) => before.has(entry)) })
  }
  for (const view of VIEWS) {
    await goTo(spaced, view.nav)
    await checkSpacing(view.id)
  }
  await goTo(spaced, 'Patients')
  for (const dialog of DIALOGS) {
    await closeDialogs(spaced)
    await dialog.open(spaced)
    await spaced.getByRole('dialog', { name: dialog.name }).waitFor()
    await spaced.waitForTimeout(200)
    await checkSpacing(dialog.id)
  }
  // The skip links appear only while one has focus.
  await closeDialogs(spaced)
  await spaced.evaluate(() => document.activeElement?.blur())
  await spaced.locator('.skip-link').first().focus()
  await checkSpacing('skip-links-focused')
  const chromiumVersion = browser.version()
  await browser.close()

  fs.writeFileSync(path.join(OUT, 'results.json'), `${JSON.stringify({ url: APP_URL, chromium: chromiumVersion, date: new Date().toISOString(), results }, null, 2)}\n`)
  const row = (r) =>
    r.check === 'reflow'
      ? `| ${r.target} | ${r.pass ? 'Pass' : 'Fail'} | ${r.scrollWidth}px wide in a ${r.viewport}px viewport${r.beyond.length ? `; past the edge: ${r.beyond.join(', ')}` : ''} | [screenshot](screenshots/reflow-${r.target}.png) |`
      : `| ${r.target} | ${r.pass ? 'Pass' : 'Fail'} | ${r.clipped.length ? `clipped: ${r.clipped.join('; ')}` : 'no text cut off'}${r.byDesign.length ? `; shortened at normal spacing too (by design): ${r.byDesign.join('; ')}` : ''} | [screenshot](screenshots/text-spacing-${r.target}.png) |`
  const table = (check) => ['| Screen | Result | Measured | Evidence |', '|---|---|---|---|', ...results.filter((r) => r.check === check).map(row)].join('\n')
  const failures = results.filter((r) => !r.pass)
  fs.writeFileSync(
    path.join(OUT, 'README.md'),
    `# Reflow and text spacing checks

Generated by \`npm run test:layout\` (scripts/layout-check.cjs) on ${new Date().toISOString().slice(0, 10)},
Chromium ${chromiumVersion}, against ${APP_URL} (the renderer served by \`npm run dev:web\`).

**${results.length - failures.length} of ${results.length} checks pass.**

## WCAG 1.4.10 Reflow: 320 x 256 CSS pixels

A 1280 x 1024 window at 400% zoom. Pass means the page is no wider than the
viewport and no element extends past its right edge, so nothing needs
horizontal scrolling.

${table('reflow')}

## WCAG 1.4.12 Text Spacing

Line height 1.5, paragraph spacing 2 em, letter spacing 0.12 em and word spacing
0.16 em forced on every element (the W3C text spacing bookmarklet values), at
1280 x 800. Pass means the extra spacing makes no element that hides its overflow
cut off its text. Text already shortened at normal spacing, such as the one-line
message preview in the Inbox list (the full message is in the reading pane), is
listed as by design.

${table('text-spacing')}
`
  )
  console.log(`${results.length - failures.length}/${results.length} layout checks pass`)
  for (const failure of failures) console.log(`FAIL ${failure.check} ${failure.target}: ${JSON.stringify(failure.beyond ?? failure.clipped)}`)
  process.exitCode = failures.length > 0 ? 1 : 0
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
