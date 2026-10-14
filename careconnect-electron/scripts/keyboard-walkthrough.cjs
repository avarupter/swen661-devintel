#!/usr/bin/env node
/* global document, getComputedStyle -- page.evaluate callbacks run in the browser */
/**
 * Keyboard-only walkthrough of the major CareConnect tasks in the real built
 * desktop app (Playwright's Electron driver, a fresh --user-data-dir). After
 * launch nothing is clicked: every step is a key press, and every outcome is
 * checked in the app. Writes a report with the Tab order, F6 region order,
 * task results and focus screenshots.
 *
 *   npm run build && npm run test:keyboard     # writes docs/accessibility/keyboard/
 *
 * Needs a display (WSLg on Windows, or Xvfb). Exits non-zero if a task fails.
 */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { _electron: electron } = require('playwright-core')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.resolve(ROOT, process.argv[2] || 'docs/accessibility/keyboard')

async function main() {
  fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true })
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-keyboard-'))
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({
    args: [ROOT, `--user-data-dir=${userDataDir}`],
    cwd: ROOT,
    env,
    executablePath: path.join(ROOT, 'node_modules/electron/dist/electron')
  })
  const page = await app.firstWindow()
  await page.getByRole('heading', { level: 1, name: 'Patients' }).waitFor()
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setBounds({ x: 40, y: 40, width: 1440, height: 900 }))
  await page.waitForTimeout(500)

  const press = async (keys) => {
    for (const key of keys) {
      await page.keyboard.press(key)
      await page.waitForTimeout(120)
    }
  }
  /** Role and accessible name of the focused element, from Chromium's accessibility tree. */
  const focused = async () => {
    const snapshot = await page
      .locator(':focus')
      .ariaSnapshot()
      .catch(() => '')
    const region = await page.evaluate(() => document.activeElement?.closest('[data-region]')?.getAttribute('data-region') ?? '')
    const outline = await page.evaluate(() => {
      const element = document.activeElement
      if (!element || element === document.body) return 'none'
      const style = getComputedStyle(element)
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 ? `${style.outlineWidth} ${style.outlineColor}` : 'none'
    })
    return { node: (snapshot.split('\n')[0] || '(body)').replace(/^- /, '').replace(/:$/, ''), region, outline }
  }
  const politeText = () => page.getByTestId('live-polite').textContent()
  const statusText = () => page.locator('.status-message__text').textContent().catch(() => '')
  const shot = async (name) => {
    await page.waitForTimeout(250)
    const b64 = await app.evaluate(async ({ BrowserWindow }) => (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString('base64'))
    fs.writeFileSync(path.join(OUT, 'screenshots', `${name}.png`), Buffer.from(b64, 'base64'))
    return `screenshots/${name}.png`
  }
  const dialogOpen = (name) =>
    page
      .getByRole('dialog', { name })
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false)
  const dialogClosed = () =>
    page
      .getByRole('dialog')
      .waitFor({ state: 'detached', timeout: 3000 })
      .then(() => true)
      .catch(() => false)

  // 1. Tab order from launch.
  await page.evaluate(() => document.body.focus())
  const tabOrder = []
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    tabOrder.push(await focused())
  }

  const tasks = []
  const task = async (name, keys, expected, run) => {
    let result = false
    let observed = ''
    let screenshot = ''
    try {
      ;({ result, observed, screenshot = '' } = await run())
    } catch (error) {
      observed = `Error: ${error.message.split('\n')[0]}`
    }
    tasks.push({ name, keys, expected, result, observed, screenshot })
    console.log(`${result ? 'PASS' : 'FAIL'}  ${name}: ${observed}`)
  }

  // Fresh start for the tasks: reload puts focus back on the page.
  await page.reload()
  await page.getByRole('heading', { level: 1, name: 'Patients' }).waitFor()
  await page.evaluate(() => document.body.focus())

  await task('Skip links appear first and move focus', 'Tab, Tab, Enter', 'First Tab shows "Skip to main workspace"; "Skip to patient list" moves focus to the patient list', async () => {
    await press(['Tab'])
    const first = await focused()
    const screenshot = await shot('01-skip-links')
    await press(['Tab', 'Enter'])
    const after = await focused()
    return { result: /Skip to main workspace/.test(first.node) && after.region === 'list', observed: `first stop: ${first.node}; after Enter: focus in region "${after.region}"`, screenshot }
  })

  const regions = []
  await task('F6 cycles the regions; Shift+F6 goes back', 'F6 ×5, Shift+F6', 'Detail → Status → Navigation → Toolbar → List, then back to Toolbar', async () => {
    for (let i = 0; i < 5; i++) {
      await press(['F6'])
      regions.push((await focused()).region)
    }
    await press(['Shift+F6'])
    const back = (await focused()).region
    return { result: regions.join(',') === 'detail,status,navigation,toolbar,list' && back === 'toolbar', observed: `${regions.join(' → ')}; Shift+F6 → ${back}` }
  })

  await task('Toolbar is one Tab stop with arrow keys', 'F6 to toolbar, →, →, Home', 'Arrow keys move between Search, Filter, Sort and New patient; Home returns to the first', async () => {
    await press(['ArrowRight'])
    const second = await focused()
    await press(['ArrowRight'])
    const third = await focused()
    const screenshot = await shot('02-toolbar-focus')
    await press(['Home'])
    const home = await focused()
    return { result: /Filter/.test(second.node) && /Sort/.test(third.node) && /Search/.test(home.node), observed: `${second.node} → ${third.node} → Home: ${home.node}`, screenshot }
  })

  await task('Patient list: arrows move selection, detail follows', 'F6 to list, ↓, ↓, Home', 'Selection moves Avery Park → Morgan Chen → Riley Singh and the detail heading follows', async () => {
    await press(['F6'])
    // F6 lands on the list pane's first control, the search field; Tab moves on to the list.
    if (/searchbox/.test((await focused()).node)) await press(['Tab'])
    await press(['ArrowDown', 'ArrowDown'])
    const option = await focused()
    const heading = await page.locator('#patient-name-heading').textContent()
    const screenshot = await shot('03-patient-list-focus')
    await press(['Home'])
    const home = await focused()
    return { result: /Riley Singh/.test(option.node) && heading === 'Riley Singh' && /Avery Park/.test(home.node), observed: `${option.node} (detail: ${heading}); Home → ${home.node}`, screenshot }
  })

  await task('Search the list with "/" and announce the count', '/, type "taylor", Esc, Esc', '"1 result" is announced without moving focus; Esc clears; Esc returns to the list', async () => {
    await press(['/'])
    const field = await focused()
    await page.keyboard.type('taylor')
    await page.waitForTimeout(700)
    const announced = await politeText()
    const options = await page.getByRole('option').count()
    await press(['Escape'])
    const cleared = await page.getByRole('searchbox', { name: 'Search list' }).inputValue()
    await press(['Escape'])
    const back = await focused()
    return { result: /searchbox/.test(field.node) && /1 result/.test(announced ?? '') && options === 1 && cleared === '' && back.region === 'list', observed: `focus: ${field.node}; announced "${announced}"; ${options} option; cleared; back in "${back.region}"` }
  })

  await task('Add a clinical note', 'N, type, Ctrl+Enter', 'Dialog opens with focus in it; the note saves; "Note added for Avery Park." is announced', async () => {
    await press(['n'])
    const opened = await dialogOpen(/note/i)
    // Focus starts on the first field, Note type; Tab moves to the note itself.
    for (let i = 0; i < 4 && !/textbox "Note/.test((await focused()).node); i++) await press(['Tab'])
    await page.keyboard.type('Keyboard-only walkthrough note.')
    const screenshot = await shot('04-add-note-dialog')
    await press(['Control+Enter'])
    const closed = await dialogClosed()
    await page.waitForTimeout(300)
    const announced = await politeText()
    return { result: opened && closed && /Note added for Avery Park/.test(announced ?? ''), observed: `opened: ${opened}; closed: ${closed}; announced "${announced}"`, screenshot }
  })

  await task('Escape closes a dialog and restores focus to its opener', 'E, Esc', 'Edit care summary opens; Esc closes it; focus returns to where it was', async () => {
    const before = await focused()
    await press(['e'])
    const opened = await dialogOpen(/care summary/i)
    await press(['Escape'])
    const closed = await dialogClosed()
    await page.waitForTimeout(200)
    const after = await focused()
    return { result: opened && closed && after.node === before.node, observed: `before: ${before.node}; after: ${after.node}` }
  })

  await task('Command palette navigates', 'Ctrl+K, type "inb", Enter', 'Palette opens with focus in "Search commands"; Enter opens the Inbox', async () => {
    await press(['Control+k'])
    const opened = await dialogOpen('Command palette')
    const field = await focused()
    await page.keyboard.type('inb')
    await page.waitForTimeout(400)
    const screenshot = await shot('05-command-palette')
    await press(['Enter'])
    await page.getByRole('heading', { level: 1, name: 'Inbox' }).waitFor({ timeout: 3000 })
    return { result: opened && /combobox "Search commands"/.test(field.node), observed: `focus: ${field.node}; Inbox opened`, screenshot }
  })

  await task('Reply to a conversation', 'F6 to list, R, type, Ctrl+Enter', 'Reply opens for the focused conversation and sends; status confirms', async () => {
    let region = ''
    for (let i = 0; i < 6 && region !== 'list'; i++) {
      await press(['F6'])
      region = (await focused()).region
    }
    // Focusing a conversation does not open it (so tabbing past never marks it read); Space opens it.
    await press(['Space', 'r'])
    const opened = await dialogOpen('Reply')
    await page.keyboard.type('Thanks, see you at the next visit.')
    const screenshot = await shot('06-reply-dialog')
    await press(['Control+Enter'])
    const closed = await dialogClosed()
    await page.waitForTimeout(300)
    const status = await statusText()
    return { result: opened && closed && /Message sent/.test(status ?? ''), observed: `opened: ${opened}; status "${status}"`, screenshot }
  })

  await task('Complete a task', 'G T, Tab to a task, Space', 'Tasks opens; Space toggles the focused checkbox; status confirms', async () => {
    await page.evaluate(() => document.getElementById('view-title')?.focus())
    await press(['g', 't'])
    await page.getByRole('heading', { level: 1, name: 'Tasks' }).waitFor({ timeout: 3000 })
    let node = ''
    for (let i = 0; i < 12 && !/checkbox/.test(node); i++) {
      await press(['Tab'])
      node = (await focused()).node
    }
    const screenshot = await shot('07-task-checkbox-focus')
    await press(['Space'])
    await page.waitForTimeout(300)
    const status = await statusText()
    return { result: /checkbox/.test(node) && /Task marked done/.test(status ?? ''), observed: `focused ${node}; status "${status}"`, screenshot }
  })

  await task('Create a patient record', 'Ctrl+N, type, Tab…, Space, Enter', 'Form opens on Full name; "Schedule later" is a checkbox; Enter submits; status confirms', async () => {
    await press(['Control+n'])
    const opened = await dialogOpen('New patient')
    const first = await focused()
    await page.keyboard.type('Sam Okoro')
    await press(['Tab', 'Tab', 'Tab'])
    await page.keyboard.type('Annual wellness visit')
    // The date field has month, day and year stops, then comes "Schedule later".
    for (let i = 0; i < 6 && !/Schedule later/.test((await focused()).node); i++) await press(['Tab'])
    const checkbox = await focused()
    await press(['Space'])
    const screenshot = await shot('08-new-patient-form')
    // With the date disabled, Shift+Tab returns to Reason for visit; Enter submits the form.
    for (let i = 0; i < 6 && !/Reason for visit/.test((await focused()).node); i++) await press(['Shift+Tab'])
    await press(['Enter'])
    const closed = await dialogClosed()
    await page.waitForTimeout(300)
    const status = await statusText()
    return { result: opened && /Full name/.test(first.node) && /Schedule later/.test(checkbox.node) && closed && /Sam Okoro added/.test(status ?? ''), observed: `first field ${first.node}; ${checkbox.node}; status "${status}"`, screenshot }
  })

  await task('Shortcuts reference and help open and close from the keyboard', 'Ctrl+/, Esc, F1, Esc', 'Both dialogs open with focus inside and close with Esc', async () => {
    await press(['Control+/'])
    const shortcuts = await dialogOpen('Keyboard shortcuts')
    const screenshot = await shot('09-shortcuts-dialog')
    await press(['Escape'])
    const closedShortcuts = await dialogClosed()
    await press(['F1'])
    const help = await dialogOpen('CareConnect help')
    await press(['Escape'])
    const closedHelp = await dialogClosed()
    return { result: shortcuts && closedShortcuts && help && closedHelp, observed: `shortcuts ${shortcuts}/${closedShortcuts}, help ${help}/${closedHelp}`, screenshot }
  })

  const menu = await app.evaluate(({ Menu }) =>
    (Menu.getApplicationMenu()?.items ?? []).map((item) => ({
      label: item.label,
      items: (item.submenu?.items ?? []).filter((sub) => sub.type !== 'separator').length
    }))
  )
  await app.close()
  fs.rmSync(userDataDir, { recursive: true, force: true })

  const lines = [
    '# Keyboard-only walkthrough',
    '',
    'Generated by `npm run test:keyboard` (scripts/keyboard-walkthrough.cjs). The built desktop app runs in a fresh profile. After launch nothing is clicked: every step is a key press, and every result is checked in the app.',
    '',
    `Run: ${new Date().toISOString()} · Electron ${require('electron/package.json').version} · window 1440×900`,
    '',
    '## Tasks',
    '',
    '| # | Task | Keys | Expected | Result | Observed |',
    '|---|---|---|---|---|---|'
  ]
  tasks.forEach((t, i) => lines.push(`| ${i + 1} | ${t.name}${t.screenshot ? ` ([screenshot](${t.screenshot}))` : ''} | ${t.keys} | ${t.expected} | ${t.result ? '✅ Pass' : '❌ Fail'} | ${t.observed.replace(/\|/g, '/')} |`))
  lines.push(
    '',
    '## Tab order from launch (first 40 stops)',
    '',
    'Each stop shows the focused element as Chromium exposes it to screen readers (role and name), its F6 region, and its computed focus outline. Toolbars and list boxes are a single Tab stop. Arrow keys move inside them.',
    '',
    '| Stop | Element (role "name") | Region | Focus outline |',
    '|---|---|---|---|'
  )
  tabOrder.forEach((stop, i) => lines.push(`| ${i + 1} | ${stop.node.replace(/\|/g, '/')} | ${stop.region || '—'} | ${stop.outline} |`))
  lines.push('', '## Native menu bar', '', 'Reached with Alt (or F10) and the access keys. The OS draws it, so it is checked by hand in the NVDA run. Structure, read from the app:', '')
  menu.forEach((m) => lines.push(`- ${m.label.replace(/&/g, '')}: ${m.items} items`))
  const failed = tasks.filter((t) => !t.result).length
  lines.push('', failed === 0 ? `**All ${tasks.length} keyboard tasks passed.**` : `**${failed} of ${tasks.length} tasks failed.**`, '')
  fs.writeFileSync(path.join(OUT, 'README.md'), `${lines.join('\n')}\n`)
  console.log(`\n${failed === 0 ? 'All' : `${tasks.length - failed} of`} ${tasks.length} tasks passed. Report: ${path.relative(ROOT, path.join(OUT, 'README.md'))}`)
  process.exitCode = failed === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
