#!/usr/bin/env node
/* global window, document -- page.evaluate callbacks run in the browser */
/**
 * Automated WCAG 2.1 Level A/AA scan of every CareConnect screen and dialog
 * with axe-core (the engine inside axe DevTools), in Chromium, against the
 * renderer dev server. Real rendering means colour contrast is checked too,
 * which jsdom-based jest-axe cannot do.
 *
 *   npm run dev:web     # terminal 1: serves http://localhost:5173
 *   npm run test:axe    # terminal 2: writes docs/accessibility/axe/
 *
 * Exits non-zero when any WCAG 2.1 A/AA violation is found.
 */
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright-core')

const ROOT = path.resolve(__dirname, '..')
const APP_URL = process.env.CARECONNECT_URL || 'http://localhost:5173/'
const OUT = path.resolve(ROOT, process.argv[2] || 'docs/accessibility/axe')
const AXE_PATH = require.resolve('axe-core/axe.min.js')
const AXE_VERSION = require('axe-core/package.json').version
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function title(page, text) {
  await page.getByRole('heading', { level: 1, name: text }).waitFor()
}

async function goTo(page, navName, heading) {
  await closeDialogs(page)
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('button', { name: navName }).click()
  await title(page, heading)
}

async function closeDialogs(page) {
  for (let i = 0; i < 3 && (await page.getByRole('dialog').count()) > 0; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
  }
}

async function openDialog(page, open, name) {
  await closeDialogs(page)
  await open()
  await page.getByRole('dialog', { name }).waitFor()
}

/** Each scan target: how to reach it from wherever the previous one left off. */
const TARGETS = [
  { id: 'overview', label: 'Overview view', reach: (p) => goTo(p, 'Overview', 'Overview') },
  { id: 'schedule', label: 'Schedule view', reach: (p) => goTo(p, 'Schedule', 'Schedule') },
  { id: 'patients', label: 'Patients view (Avery Park selected)', reach: (p) => goTo(p, 'Patients', 'Patients') },
  {
    id: 'patients-filtered',
    label: 'Patients view, list searched for "riley"',
    reach: async (p) => {
      await goTo(p, 'Patients', 'Patients')
      await p.getByRole('searchbox', { name: 'Search list' }).fill('riley')
      await p.waitForTimeout(500)
    },
    after: (p) => p.getByRole('searchbox', { name: 'Search list' }).fill('')
  },
  {
    id: 'inbox',
    label: 'Inbox view, first conversation open',
    reach: async (p) => {
      await goTo(p, /^Inbox/, 'Inbox')
      await p.getByRole('option').first().click()
    }
  },
  { id: 'tasks', label: 'Tasks view', reach: (p) => goTo(p, 'Tasks', 'Tasks') },
  { id: 'reports', label: 'Reports view', reach: (p) => goTo(p, 'Reports', 'Reports') },
  { id: 'resources', label: 'Resources view', reach: (p) => goTo(p, 'Resources', 'Resources') },
  {
    id: 'dialog-command-palette',
    label: 'Command palette (Ctrl+K), searching "pat"',
    reach: async (p) => {
      await goTo(p, 'Patients', 'Patients')
      await openDialog(p, () => p.keyboard.press('Control+k'), 'Command palette')
      await p.keyboard.type('pat')
      await p.waitForTimeout(400)
    }
  },
  {
    id: 'dialog-keyboard-shortcuts',
    label: 'Keyboard shortcuts (Ctrl+/)',
    reach: (p) => openDialog(p, () => p.keyboard.press('Control+/'), 'Keyboard shortcuts')
  },
  { id: 'dialog-help', label: 'Help (F1)', reach: (p) => openDialog(p, () => p.keyboard.press('F1'), 'CareConnect help') },
  { id: 'dialog-settings', label: 'Settings (Ctrl+,)', reach: (p) => openDialog(p, () => p.keyboard.press('Control+,'), 'Settings') },
  {
    id: 'dialog-new-patient-errors',
    label: 'New patient (Ctrl+N) after submitting it empty',
    reach: async (p) => {
      await openDialog(p, () => p.keyboard.press('Control+n'), 'New patient')
      await p.getByRole('button', { name: 'Add patient' }).click()
      await p.waitForTimeout(200)
    }
  },
  {
    id: 'dialog-add-note',
    label: 'Add clinical note (N)',
    reach: (p) => openDialog(p, () => p.getByRole('button', { name: 'Add note for Avery Park' }).click(), /note/i)
  },
  {
    id: 'dialog-edit-summary',
    label: 'Edit care summary (E)',
    reach: (p) => openDialog(p, () => p.getByRole('button', { name: /^Edit care summary for Avery Park/ }).click(), /care summary/i)
  },
  {
    id: 'dialog-compose-new',
    label: 'New message (Ctrl+Shift+M)',
    reach: (p) => openDialog(p, () => p.keyboard.press('Control+Shift+M'), 'New message')
  },
  {
    id: 'dialog-compose-reply',
    label: 'Reply in the Inbox (R)',
    reach: async (p) => {
      await goTo(p, /^Inbox/, 'Inbox')
      await p.getByRole('option').first().click()
      await openDialog(p, () => p.keyboard.press('r'), 'Reply')
    }
  }
]

function countByImpact(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  for (const violation of violations) counts[violation.impact] = (counts[violation.impact] || 0) + violation.nodes.length
  return counts
}

function markdownReport(meta, rows) {
  const lines = [
    '# axe-core scan: WCAG 2.1 Level A and AA',
    '',
    `- Engine: axe-core ${meta.axeVersion} (the engine inside axe DevTools)`,
    `- Browser: ${meta.browser}`,
    `- Page: ${meta.url} (\`npm run dev:web\`, browser preview with synthetic data)`,
    `- Rules: tags ${WCAG_TAGS.join(', ')}`,
    `- Viewport: 1440×900`,
    `- Run: ${meta.when}`,
    '',
    '| Screen or dialog | Violations | Passed rules | Needs review |',
    '|---|---|---|---|'
  ]
  for (const row of rows) {
    const v = row.violations.length === 0 ? '0' : row.violations.map((x) => `${x.id} (${x.nodes.length})`).join(', ')
    lines.push(`| ${row.label} | ${v} | ${row.passes} | ${row.incomplete.length ? row.incomplete.map((x) => `${x.id} (${x.nodes.length})`).join(', ') : '0'} |`)
  }
  const failing = rows.filter((row) => row.violations.length > 0)
  lines.push('', failing.length === 0 ? '**No WCAG 2.1 A/AA violations.**' : `**${failing.length} screen(s) with violations.**`, '')
  for (const row of failing) {
    lines.push(`## ${row.label}`, '')
    for (const violation of row.violations) {
      lines.push(`- **${violation.id}** (${violation.impact}): ${violation.help}. ${violation.tags.filter((t) => t.startsWith('wcag')).join(', ')}. ${violation.helpUrl}`)
      for (const node of violation.nodes.slice(0, 10)) lines.push(`  - \`${node.target.join(' ')}\`: ${node.failureSummary.replace(/\n+/g, ' ')}`)
    }
    lines.push('')
  }
  const reviews = rows.filter((row) => row.incomplete.length > 0)
  if (reviews.length > 0) {
    lines.push('## Needs review (axe could not decide automatically)', '')
    for (const row of reviews) {
      for (const item of row.incomplete) {
        lines.push(`- ${row.label}: **${item.id}**: ${item.help} (${item.nodes.length} node(s)), e.g. \`${item.nodes[0].target.join(' ')}\`: ${(item.nodes[0].any[0] && item.nodes[0].any[0].message) || ''}`)
      }
    }
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

async function main() {
  fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(APP_URL)
  await title(page, 'Patients')

  const rows = []
  for (const target of TARGETS) {
    await target.reach(page)
    await page.waitForTimeout(300)
    if ((await page.evaluate(() => typeof window.axe)) === 'undefined') await page.addScriptTag({ path: AXE_PATH })
    const result = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] }), WCAG_TAGS)
    await page.screenshot({ path: path.join(OUT, 'screenshots', `${target.id}.png`) })
    const row = {
      id: target.id,
      label: target.label,
      violations: result.violations,
      incomplete: result.incomplete,
      passes: result.passes.length,
      impacts: countByImpact(result.violations)
    }
    rows.push(row)
    fs.writeFileSync(path.join(OUT, `${target.id}.json`), `${JSON.stringify({ target: target.label, url: APP_URL, axeVersion: AXE_VERSION, ...result }, null, 2)}\n`)
    console.log(`${row.violations.length === 0 ? 'PASS' : 'FAIL'}  ${target.label}: ${row.violations.length} violation rule(s), ${row.incomplete.length} to review, ${row.passes} passed`)
    if (target.after) await target.after(page)
  }

  const meta = { axeVersion: AXE_VERSION, browser: `Chromium ${browser.version()}`, url: APP_URL, when: new Date().toISOString() }
  fs.writeFileSync(path.join(OUT, 'summary.json'), `${JSON.stringify({ ...meta, tags: WCAG_TAGS, pageErrors: errors, screens: rows.map(({ violations, incomplete, ...rest }) => ({ ...rest, violations: violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), incomplete: incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })) })) }, null, 2)}\n`)
  fs.writeFileSync(path.join(OUT, 'README.md'), markdownReport(meta, rows))
  await browser.close()
  if (errors.length) console.log(`Page errors: ${errors.join(' | ')}`)
  const failing = rows.filter((row) => row.violations.length > 0).length
  console.log(failing === 0 ? '\nNo WCAG 2.1 A/AA violations.' : `\n${failing} screen(s) with violations. See ${path.relative(ROOT, path.join(OUT, 'README.md'))}`)
  process.exitCode = failing === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
