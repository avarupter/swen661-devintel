/// <reference lib="dom" />
/**
 * End-to-end tests: launch the built app (out/) with Playwright's Electron
 * driver, so the real main process, preload bridge and renderer run together
 * over real IPC. Each launch gets its own --user-data-dir, so nothing touches
 * the developer's real CareConnect data.
 *
 *   npm run test:e2e        (builds first; needs a display, e.g. WSLg or Xvfb)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { _electron as electron, type ElectronApplication, type Page } from 'playwright-core'

const ROOT = path.resolve(__dirname, '../..')

interface Launched {
  app: ElectronApplication
  page: Page
  consoleLines: string[]
}

function cleanEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    // VS Code's extension host leaks this; it would make Electron behave as plain Node.
    if (value !== undefined && key !== 'ELECTRON_RUN_AS_NODE') env[key] = value
  }
  return env
}

async function launch(userDataDir: string): Promise<Launched> {
  const app = await electron.launch({
    args: [ROOT, `--user-data-dir=${userDataDir}`],
    cwd: ROOT,
    env: cleanEnv(),
    executablePath: path.join(ROOT, 'node_modules/electron/dist/electron')
  })
  const page = await app.firstWindow()
  const consoleLines: string[] = []
  page.on('console', (message) => consoleLines.push(`${message.type()}: ${message.text()}`))
  await page.getByRole('heading', { level: 1 }).waitFor()
  return { app, page, consoleLines }
}

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-e2e-'))
}

async function activeRegion(page: Page): Promise<string | null> {
  return page.evaluate(() => (document.activeElement?.closest('[data-region]') as HTMLElement | null)?.dataset.region ?? null)
}

describe('CareConnect desktop app (end to end)', () => {
  const dirs: string[] = []
  const freshDir = (): string => {
    const dir = tempDir()
    dirs.push(dir)
    return dir
  }

  afterAll(() => {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true })
  })

  it('opens a sandboxed window on app:// and loads the workspace over real IPC', async () => {
    const userDataDir = freshDir()
    const { app, page } = await launch(userDataDir)
    try {
      const info = await app.evaluate(({ app: electronApp, BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0]
        // Present at runtime but missing from Electron's typings.
        const contents = win.webContents as unknown as { getLastWebPreferences(): Record<string, unknown> | null }
        const prefs = contents.getLastWebPreferences()
        return {
          userData: electronApp.getPath('userData'),
          url: win.webContents.getURL(),
          sandbox: prefs?.sandbox,
          contextIsolation: prefs?.contextIsolation,
          nodeIntegration: prefs?.nodeIntegration
        }
      })
      expect(info).toEqual({
        userData: userDataDir,
        url: 'app://careconnect/index.html',
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      })
      expect(await page.title()).toBe('Patients · CareConnect — Clinical workspace')
      await page.getByRole('option', { name: /^Avery Park/ }).waitFor()
      expect(await page.getByRole('option').count()).toBe(28)

      // The renderer has no Node.js, only the bridge.
      expect(await page.evaluate(() => typeof (window as unknown as { require?: unknown }).require)).toBe('undefined')
      expect(await page.evaluate(() => typeof (window as unknown as { process?: unknown }).process)).toBe('undefined')
      expect(fs.existsSync(path.join(userDataDir, 'careconnect-workspace.json'))).toBe(true)
    } finally {
      await app.close()
    }
  })

  it('has native File, Edit, View, Navigate, Patient, Communicate and Help menus', async () => {
    const { app } = await launch(freshDir())
    try {
      const labels = await app.evaluate(({ Menu }) => Menu.getApplicationMenu()?.items.map((item) => item.label.replace(/&/g, '')) ?? [])
      expect(labels).toEqual(expect.arrayContaining(['File', 'Edit', 'View', 'Navigate', 'Patient', 'Communicate', 'Help']))
    } finally {
      await app.close()
    }
  })

  it('logs no Electron security warnings and no errors while loading', async () => {
    const { app, page, consoleLines } = await launch(freshDir())
    try {
      // Reload so every load-time message is captured by the listener.
      await page.reload()
      await page.getByRole('heading', { level: 1 }).waitFor()
      await page.waitForTimeout(1500)
      expect(consoleLines.filter((line) => line.includes('Electron Security Warning'))).toEqual([])
      expect(consoleLines.filter((line) => line.startsWith('error:'))).toEqual([])
    } finally {
      await app.close()
    }
  })

  it('opens the command palette with Ctrl+K and returns focus when it closes', async () => {
    const { app, page } = await launch(freshDir())
    try {
      await page.getByRole('option', { name: /^Avery Park/ }).focus()
      await page.keyboard.press('Control+K')
      const palette = page.getByRole('dialog', { name: 'Command palette' })
      await palette.waitFor()
      expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).toBe('combobox')
      await page.keyboard.press('Escape')
      await palette.waitFor({ state: 'detached' })
      expect(await page.evaluate(() => document.activeElement?.id)).toMatch(/^patient-option-/)
    } finally {
      await app.close()
    }
  })

  it('cycles workspace regions with F6 and Shift+F6', async () => {
    const { app, page } = await launch(freshDir())
    try {
      await page.locator('#view-title').focus()
      // The view title is outside every region; F6 goes to the next region in document order.
      const forward: (string | null)[] = []
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('F6')
        forward.push(await activeRegion(page))
      }
      expect(forward).toEqual(['toolbar', 'list', 'detail', 'status', 'navigation', 'toolbar'])
      await page.keyboard.press('Shift+F6')
      expect(await activeRegion(page)).toBe('navigation')
    } finally {
      await app.close()
    }
  })

  it('navigates with G-key sequences', async () => {
    const { app, page } = await launch(freshDir())
    try {
      await page.locator('#view-title').focus()
      await page.keyboard.press('g')
      await page.keyboard.press('i')
      await page.getByRole('heading', { level: 1, name: 'Inbox' }).waitFor()
      await page.keyboard.press('g')
      await page.keyboard.press('p')
      await page.getByRole('heading', { level: 1, name: 'Patients' }).waitFor()
    } finally {
      await app.close()
    }
  })

  it('remembers the window size across launches', async () => {
    const userDataDir = freshDir()
    let launched = await launch(userDataDir)
    await launched.app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0].setBounds({ x: 140, y: 90, width: 1300, height: 820 })
    })
    await launched.page.waitForTimeout(1000)
    await launched.app.close()

    expect(JSON.parse(fs.readFileSync(path.join(userDataDir, 'window-state.json'), 'utf8'))).toMatchObject({ width: 1300, height: 820 })

    launched = await launch(userDataDir)
    try {
      const bounds = await launched.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds())
      expect(bounds.width).toBe(1300)
      expect(bounds.height).toBe(820)
    } finally {
      await launched.app.close()
    }
  })

  it('saves edits to disk and restores them on the next launch', async () => {
    const userDataDir = freshDir()
    let launched = await launch(userDataDir)
    const note = `E2E note ${path.basename(userDataDir)}`
    await launched.page.getByRole('option', { name: /^Avery Park/ }).click()
    await launched.page.keyboard.press('n')
    const dialog = launched.page.getByRole('dialog', { name: /note/i })
    await dialog.waitFor()
    await dialog.getByRole('textbox', { name: /note/i }).fill(note)
    await dialog.getByRole('button', { name: /^(save|add) note/i }).click()
    await dialog.waitFor({ state: 'detached' })
    await launched.page.getByText('0 unsaved changes').waitFor({ timeout: 10_000 })
    await launched.app.close()

    launched = await launch(userDataDir)
    try {
      await launched.page.getByRole('option', { name: /^Avery Park/ }).click()
      await launched.page.getByRole('complementary', { name: 'Recent activity' }).getByText(/note added/i).first().waitFor()
      const saved = fs.readFileSync(path.join(userDataDir, 'careconnect-workspace.json'), 'utf8')
      expect(saved).toContain(note)
    } finally {
      await launched.app.close()
    }
  })
})
