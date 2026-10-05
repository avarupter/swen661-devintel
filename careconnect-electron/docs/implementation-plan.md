# CareConnect Desktop Implementation Plan

> **For agentic workers:** this plan is executed by parallel subagents (one per task in Tasks 3–7) in the same working tree, then integrated and audited by the orchestrator (Tasks 8–9). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the CareConnect clinical workspace as a secure, keyboard-first, screen-reader-friendly Electron + React desktop app for Windows, with ≥ 60 % (target 80 %+) Jest coverage and an NSIS installer.

**Architecture:** electron-vite builds four separate code areas:
- `src/main`: Node, Electron APIs.
- `src/preload`: a sandboxed bridge exposing `window.careconnect`.
- `src/renderer`: React 19, sandboxed, with no Node access.
- `src/shared`: pure TypeScript used by both sides.

Every user action is an `AppCommand` dispatched through one renderer dispatcher. The native menu, tray, Jump List, palette, keys and buttons all feed it.

**Tech stack:** Electron 44, React 19, TypeScript 6.0, electron-vite 5 (Vite 7), Jest 30 with ts-jest, React Testing Library 16, user-event 14, jest-axe 11, ESLint 9 (typescript-eslint, react-hooks 7, jsx-a11y), electron-builder 26.

**Spec:** [`docs/design.md`](design.md). Read sections 1–11 before starting any task.

## Global constraints

- **Working directory:** `/home/shane/swen661-devintel/careconnect-electron`. Run every command from there.
- **Launching Electron from this shell:** prefix it with `env -u ELECTRON_RUN_AS_NODE`. The VS Code host leaks `ELECTRON_RUN_AS_NODE=1`.
- **Off-limits to subagents** (Tasks 3–7):
  - `package.json` and the lockfile
  - every config file (`*.config.*`, `tsconfig*.json`, `electron-builder.yml`)
  - `src/shared/**`
  - `docs/**`
  - another task's files

  If a task needs a change there, describe it in your final report. The orchestrator integrates it. No new npm dependencies.
- **Directory names:** never create directories named `linux`, `windows`, `macos`, `web`, `ios` or `android`. The root `.gitignore` drops them.
- **Time:** never call `new Date()` or `Date.now()` in renderer components.
  - Use `useNow()` while rendering and `useClock()()` in event handlers (`src/renderer/src/state/clock.tsx`).
  - Main-process modules take `now: () => Date` as a dependency.
- **New record ids:** `createId(prefix)` from `src/renderer/src/state/ids.ts`, called in event handlers, never during render.
- **Synthetic data only.** Never add real names, addresses or identifiers.
- **Colours:** use `var(--…)` tokens from `src/renderer/src/styles/tokens.css`. Never put a raw hex in component CSS.
- **Focus:** never set `outline` for selection or validation. Use `border` and `background`. Focus is `:focus-visible` from `base.css`. Rows inside scroll containers add the class `focus-inset`.
- **Targets:** interactive elements are at least 32×32 px. Essential clinical actions (Add note, Send, Save, New patient) are at least 44×44 px (`.button` defaults to 44, `.button--small` is 32).
- **Status:** status is never conveyed by colour alone. Use `StatusChip` or icon + text.
- **Strings:** user-facing copy uses sentence case and the design's wording ("Needs review", "Add note", "Recent activity").
- **Gates for a task**, run on its own files only. A whole-project `tsc` shows other agents' half-written files, so filter its output and never "fix" another task's files:
  ```bash
  npx jest <your test paths>
  npx eslint <your source and test paths>
  npx tsc -p tsconfig.web.json --noEmit 2>&1 | grep -E '<your dirs>'    # renderer tasks
  npx tsc -p tsconfig.node.json --noEmit 2>&1 | grep -E 'src/main|src/preload|tests/integration'   # Task 3
  ```
  Your files must have zero ESLint errors and zero TypeScript errors.
- **Commits:** subagents do not commit. The orchestrator commits after integration.

## Contract quick reference (already implemented)

| Need | Use |
|---|---|
| Domain types | `src/shared/model.ts` (`Workspace`, `Patient`, `Activity`, `Conversation`, `Message`, `Draft`, `CareTask`, `Preferences`) |
| Bridge API | `src/shared/api.ts` (`CareConnectApi`, `UiState`, `ContextMenuItem`, …). Channel names are in `src/shared/ipc.ts` (`IPC`). |
| Commands | `src/shared/commands.ts`: `CommandId`, `COMMAND_LABELS`, `VIEW_LABELS`, `isCommandId`, `navigateCommand`, `viewForCommand` |
| Shortcuts | `src/shared/shortcuts.ts`: `SHORTCUTS`, `SHORTCUT_GROUPS`, `shortcutKeys`, `describeShortcut`, `toAccelerator`, `acceleratorForCommand`, `menuOwnsChord`, `ariaKeyShortcuts`, `matchesChord`, `keyPlatform` |
| Formatting | `src/shared/format.ts`: `formatTime`, `formatRelativeDay`, `formatDayTime` ("Today, 10:30"), `formatActivityTime` ("Today · 09:14"), `formatShortDate`, `formatWeekdayDate`, `formatTimeAgo`, `formatLongDateTime`, `initials`, `STATUS_LABELS`, `pluralize`, `formatBytes` |
| Validation | `src/shared/validate.ts`: `validateWorkspace`, `validatePatient`, `validateUiState`, `validateExportRequest`, `validateNotificationRequest`, `validateContextMenuRequest`, `validateExternalUrl`, `validateClipboardText`, `parsePatientImport`, `ValidationError` |
| Seed / export / links | `src/shared/seed.ts` (`createSeedWorkspace(now)`, `patientIdFor`), `src/shared/exportFormat.ts` (`formatPatientExport`, `exportFileName`), `src/shared/links.ts` (`isAllowedExternalUrl`, `RESOURCE_LINKS`) |
| State | `useAppState()`, `useAppDispatch()`, `useWorkspace()`, `useStatus()` (`src/renderer/src/state/AppStateProvider.tsx`). Actions and the `Modal` union are in `state/appState.ts`. Derived data is in `state/selectors.ts`. |
| Commands (renderer) | `useCommands()` → `{ run, openModal }`; `useCommandHandler(id, handler, enabled)`; `useSearchTarget()` (`src/renderer/src/commands/CommandProvider.tsx`). `patientContextMenuItems(patient)` |
| Announcements | `useAnnounce()(text, 'polite' \| 'assertive')`. `useStatus()(text, tone)` also shows the message in the status bar. |
| Keyboard | `findScopedCommand(event, 'compose', platform)` (`keyboard/useKeyboardShortcuts.ts`); `focusableWithin` (`keyboard/regions.ts`); `isEditableTarget` |
| Components | `Dialog`, `Toolbar`/`ToolbarButton`, `StatusChip`, `KeyHint`, `Avatar`, `Icon` (names in `Icon.tsx`), `VisuallyHidden` |
| Test harness | `tests/renderer/renderApp.tsx`: `renderApp()`, `renderWithProviders(ui, { keyboard })`, `liveRegionText()`. `tests/renderer/memoryApi.ts`: `createMemoryApi()`, `FIXED_NOW` (Mon 5 Oct 2026 09:42 local). Main-process tests use `tests/mocks/electron.ts` (`mockElectron`). |

**Element ids and regions other code relies on:**
- `view-title`: the h1 in `AppHeader`.
- `main`: the main landmark.
- `status-bar`: the footer.
- `patient-list`: the Patients list pane. It's the skip-link target.
- `patient-search`: the Patients search input.
- `patient-option-<patientId>`: each patient listbox option.
- `patient-name-heading`: the detail-pane h2.
- `toolbar-<commandId>`: toolbar buttons, for example `toolbar-patient.filter`.
- `data-region` values:
  - `navigation`: the sidebar.
  - `toolbar`: the header toolbar.
  - `list` and `detail`: the two panes of Patients and Inbox.
  - `main`: the root element of every other view.
  - `status`: the status bar.

**Opening and switching modals:**
- `run({ id })` opens a modal through the default handlers. It refuses to stack a modal on top of a non-palette dialog.
- A dialog that wants to switch to another modal (Help → Keyboard shortcuts) calls `openModal(modal)` directly.
- The command palette runs a chosen command with `dispatch({ type: 'ui/closeModal' })` followed by `run(command)`.
- `ModalHost` returns focus to the original opener when the last modal closes.

---

## Task 1: Scaffold and toolchain ✅ (commit `7367c23`)

electron-vite project, `app://` protocol, sandboxed window, ESLint boundaries, Jest projects, Windows NSIS packaging via Docker.

## Task 2: Shared contract and renderer foundation ✅

Everything in the quick reference above, plus:
- `App.tsx` and `main.tsx`
- `Sidebar`, `AppHeader` and `StatusBar`
- `SkipLinks`
- `ModalHost`
- placeholder views and dialogs
- `styles/tokens.css`, `base.css` and `layout.css`

---

## Task 3: Main process, preload tests, IPC and window integration tests

**Files:**

Create:
- `src/main/windowState.ts`
- `src/main/window.ts`
- `src/main/security.ts`
- `src/main/store.ts`
- `src/main/fileOps.ts`
- `src/main/menu.ts`
- `src/main/tray.ts`
- `src/main/notifications.ts`
- `src/main/platform.ts`
- `src/main/ipcHandlers.ts`
- `src/main/contextMenu.ts`

Modify:
- `src/main/index.ts`: rewrite as thin wiring.
- `tests/mocks/electron.ts`: you may extend it, but don't break the existing behaviour.

Keep:
- `src/main/protocol.ts`

Tests:
- `src/main/__tests__/<module>.test.ts`, one per module
- `src/preload/__tests__/preload.test.ts`
- `tests/integration/ipc.test.ts`
- `tests/integration/windowManagement.test.ts`

Delete:
- `tests/integration/.gitkeep`

**Interfaces**

Consumes:
- `src/shared/*` (types, `IPC`, validators, `createSeedWorkspace`, `formatPatientExport`, `exportFileName`, `acceleratorForCommand`, `menuOwnsChord`, `shortcutForCommand`, `COMMAND_LABELS`, `isAllowedExternalUrl`, `RESOURCE_LINKS`)
- `src/main/protocol.ts` (`APP_ORIGIN`, `APP_ENTRY_URL`, `registerAppScheme`, `handleAppProtocol`)
- `src/preload/index.ts` (`createCareConnectApi`)

Produces (exact names; keep them testable by injecting Electron objects and `fs`):
- `windowState.ts`:
  - `interface WindowState { x?: number; y?: number; width: number; height: number; isMaximized: boolean; isFullScreen: boolean }`
  - `DEFAULT_WINDOW_STATE` (1440×900, not maximized)
  - `MIN_WINDOW_SIZE = { width: 960, height: 640 }`
  - `loadWindowState(filePath, readFile = fs.readFileSync): WindowState`. Returns the default on a missing, corrupt or invalid file.
  - `ensureVisible(state, displays: { workArea: Rectangle }[]): WindowState`. Keeps x/y only if the window overlaps a display work area by at least 25 % of the window's area. Otherwise it drops x/y (Electron centres) and clamps width/height to the primary work area. NaN or non-positive sizes fall back to the defaults.
  - `createWindowStateKeeper({ filePath, screen, debounceMs = 400, writeFile = fs.writeFileSync, readFile })`, returning:
    - `state: WindowState`: loaded, then made visible.
    - `track(win)`: saves normal bounds on `resize`/`move` (debounced; ignored while maximized, minimized or full screen), the flags on `maximize`/`unmaximize`/`enter-full-screen`/`leave-full-screen`, and synchronously on `close`.
    - `saveNow()`
- `security.ts`:
  - `allowedOrigins(devServerUrl?: string): string[]`, giving `[APP_ORIGIN, devOrigin?]`
  - `isTrustedUrl(url, origins): boolean`
  - `isTrustedSender(event: { senderFrame: { url: string } | null }, origins): boolean`
  - `configureSessionSecurity(session)`: deny every permission request and check; `will-download` → prevent.
- `window.ts`:
  - `createMainWindow({ preloadPath, entryUrl, iconPath, state: WindowState, isDev, origins, openExternal })`. Creates a `BrowserWindow` with:
    - title `CareConnect — Clinical workspace`
    - `backgroundColor: '#f4f6f9'`, `show: false`
    - `minWidth`/`minHeight` from `MIN_WINDOW_SIZE`
    - `webPreferences: { preload, contextIsolation: true, sandbox: true, nodeIntegration: false, webviewTag: false, spellcheck: true, devTools: isDev }`

    It then shows the window on `ready-to-show` (maximizing and/or going full screen per state), applies `hardenWebContents`, and loads `entryUrl`.
  - `hardenWebContents(contents, origins, openExternal)`:
    - `will-navigate`/`will-redirect` to any untrusted URL → `preventDefault`
    - `setWindowOpenHandler` always returns `{ action: 'deny' }`, and calls `openExternal(url)` when `isAllowedExternalUrl(url)`
    - `will-attach-webview` → `preventDefault`
- `store.ts`: `createWorkspaceStore({ dir, now, fs = node:fs/promises })` → `{ filePath, load(): Promise<LoadResult>, save(ws: unknown): Promise<SaveResult> }`.
  - The file is `careconnect-workspace.json`.
  - **Load:**
    - A missing file is seeded and written; `source` is `'seed'`.
    - An invalid file (JSON or `validateWorkspace` fails) is renamed to `careconnect-workspace.corrupt-<yyyyMMddTHHmmss>.json`, then reseeded and written; `source` is `'recovered'` with `backupPath`.
    - Otherwise `source` is `'file'`.
  - **Save:** validates (rejecting with a clear message), writes `<file>.tmp`, then renames. Creates `dir` if missing. Returns `savedAt` (ISO).
- `fileOps.ts`: `createFileOps({ dialog, fs, now })`, returning:
  - `exportPatient(win, request: ExportRequest)`:
    - `dialog.showSaveDialog(win, { title: 'Export patient summary', defaultPath: exportFileName(patient, format), filters: [{ name: 'Text', extensions: ['txt'] }, { name: 'JSON', extensions: ['json'] }] })`
    - Writes `formatPatientExport`. The format follows the chosen extension when it is `.json`.
    - Returns `{ filePath }`, or `null` if cancelled.
  - `importPatients(win)`:
    - Shows the open dialog (JSON filter, `openFile`).
    - Rejects files larger than 2 MB.
    - Runs `parsePatientImport`.
    - Returns `{ patients, skipped, filePath }`, or `null`.
  - `pickAttachment(win)`:
    - Shows the open dialog (all files).
    - Calls `stat`.
    - Returns `{ name: basename, size }`, or `null`.
- `contextMenu.ts`: `showNativeContextMenu(win, request: ContextMenuRequest, Menu): Promise<string | null>`.
  - Builds from the items:
    - separators → `{ type: 'separator' }`
    - radio/checkbox items keep `type` and `checked`
    - accelerator items get `registerAccelerator: false`
  - Calls `menu.popup({ window, x, y, callback })`.
  - Resolves with the clicked id after the popup closes, or `null`.
- `menu.ts`:
  - `buildMenuTemplate({ platform, isDev, appName, state: UiState | null, send(command: AppCommand), showAbout(), openExternal(url), print() }): MenuItemConstructorOptions[]`
  - `applyMenuState(menu, state: UiState)`
  - `MENU_ITEM_IDS`

  Menus in order (each with an `&` access key; letters unique within each menu):
  - `&File`:
    - `&New Patient…` (patient.new)
    - `&Import Patients…` (patient.import)
    - `&Export Patient Summary…` (patient.export)
    - separator
    - `Se&ttings…` (app.settings)
    - separator
    - role `close`
    - role `quit` labelled `E&xit` on Windows/Linux
  - `&Edit`:
    - roles undo, redo, separator, cut, copy, paste, selectAll
    - separator
    - `&Find in List` (patient.search)
    - `Command &Palette…` (app.commandPalette)
  - `&View`:
    - checkboxes `Show &Shortcut Hints`, `&High Contrast Theme`, `&Reduce Motion` (view.toggle*), with `checked` from state
    - separator
    - roles resetZoom, zoomIn, zoomOut
    - separator
    - role togglefullscreen
    - only when `isDev`: separator, roles reload, toggleDevTools
  - `&Navigate`:
    - `&Overview`, `&Schedule`, `&Patients`, `&Inbox`, `&Tasks`, `&Reports`, `Reso&urces`
    - separator
    - `&Next Region` (region.next)
    - `P&revious Region` (region.previous)
  - `&Patient`:
    - `&New Patient…`
    - `&Edit Care Summary…`
    - `&Add Clinical Note…`
    - `&Message Patient…`
    - separator
    - `Mark as &Completed`, `Mark as Needs &Review`, `Mark as &Open`
    - separator
    - `&Copy Care ID`
    - `E&xport Summary…`
    - `Open Context Men&u`
  - `&Communicate`:
    - `&New Message…`
    - `&Reply`
    - separator
    - `&Send Message`
    - `Save &Draft`
    - `&Attach Document…`
  - `&Help`:
    - `&Keyboard Shortcuts` (app.shortcuts)
    - `CareConnect &Help` (app.help)
    - `Command &Palette` (app.commandPalette)
    - separator
    - `&Accessibility Resources`: opens the WCAG quick reference via `openExternal`
    - separator
    - `&About CareConnect`: `showAbout`

  Rules for these items:
  - Every command item has `id` equal to the command id. Clicking it calls `send({ id })`.
  - Accelerators come from `acceleratorForCommand(id)`. Set `registerAccelerator: false` except when `menuOwnsChord(chord, 'mac')` on darwin. Never give printable single keys (E, N, M, R) an accelerator on darwin.
  - On darwin, prepend the standard app menu (about, separator, services, hide, hideOthers, unhide, separator, quit).

  `applyMenuState` sets `enabled`:
  - Patient items need `hasSelection && modal === null`.
  - Send, Save Draft and Attach need `modal === 'compose'`.
  - Reply needs `view === 'inbox' && modal === null`.
  - Every other command item needs `modal === null`, except the View checkboxes and Help items.

  The checkboxes mirror `showShortcutHints`, `highContrast` and `reduceMotion`.
- `tray.ts`:
  - `buildTrayMenuTemplate({ unreadCount, show(), send(command), quit() })`:
    - `Open CareConnect`
    - `New Patient…`
    - `Open Inbox (N unread)`
    - separator
    - `Quit CareConnect`
  - `createTray({ Tray, Menu, nativeImage, iconPath, show, send, quit })`, returning `{ tray, update(unreadCount) }`.
    - Tooltip: `CareConnect — N unread messages` ("1 unread message" when N is 1).
    - A `click` on the tray calls `show`.
- `notifications.ts`: `showNotification({ Notification, iconPath, request, onClick(patientId?) }): boolean`. Returns false when `Notification.isSupported()` is false. Clicking calls `onClick(request.patientId)`.
- `platform.ts`:
  - `APP_USER_MODEL_ID = 'edu.umgc.swen661.careconnect'`
  - `parseCommandArgument(argv: string[]): AppCommand | null` reads `--command=<id>` and validates it with `isCommandId`.
  - `jumpListTasks({ execPath, appPath, isPackaged })`:
    - New patient: `--command=patient.new`
    - Open inbox: `--command=navigate.inbox`
    - When not packaged, `arguments` starts with the quoted `appPath`.
  - `applyWindowsIntegration(app, opts)`: calls `setAppUserModelId` and `setUserTasks` on win32 only.
  - `updateUnreadBadge({ platform, app, win, badgeImage, count })`:
    - win32: `win.setOverlayIcon(count ? badgeImage : null, count ? '<N> unread messages' : '')`
    - other platforms: `app.setBadgeCount(count)`
- `ipcHandlers.ts`: `registerIpcHandlers(deps): () => void` (the returned function removes every handler and listener).
  - `deps`: `{ ipcMain, origins, getWindow, store, fileOps, showContextMenu, showNotification, shell, clipboard, appInfo: () => AppInfo, onUiState(state: UiState) }`
  - Every invoke handler, via one `handle(channel, parse, fn)` wrapper:
    - rejects an untrusted sender with `Error('Blocked IPC from an untrusted sender')`
    - parses its arguments with the matching validator, rejecting `ValidationError` messages
    - never returns Electron objects

  | Channel | Behaviour |
  |---|---|
  | `workspace:load` | `store.load()` |
  | `workspace:save` | `store.save(arg)` |
  | `patient:export` | Validate the request, then call `fileOps.exportPatient` |
  | `patients:import` | Import patients |
  | `attachment:pick` | Pick an attachment |
  | `notification:show` | Show a notification |
  | `context-menu:show` | Show a context menu |
  | `app:info` | Return app info |
  | `external:open` | `validateExternalUrl`, then `shell.openExternal`, returning true |
  | `clipboard:write` | Write to the clipboard |
  | `window:print` | `webContents.print({ printBackground: true })`, resolving when its callback fires |
  | `ui:state` (`ipcMain.on`) | Validate the payload and ignore it if invalid or untrusted; otherwise call `onUiState` |
- `index.ts` wiring:
  - `registerAppScheme()`, `app.enableSandbox()` and the single-instance lock. When the lock fails, quit.
  - `whenReady`:
    - `handleAppProtocol`, `configureSessionSecurity`
    - window-state keeper and `createMainWindow` (dev: `ELECTRON_RENDERER_URL`; packaged: `APP_ENTRY_URL`)
    - the menu (`Menu.setApplicationMenu`) and tray
    - `registerIpcHandlers` with `onUiState`, which updates the menu state, tray and badge
    - `nativeTheme` `updated` → send `theme:changed`
    - Windows integration
    - handle any `--command=` in `process.argv` after `did-finish-load`
  - `second-instance` → restore and focus, then route `--command=`.
  - `window-all-closed` → quit, except on darwin.
  - Notification clicks → show and focus the window, then send `{ id: 'patient.open', patientId }`.
  - About → `dialog.showMessageBox` (type info, title "About CareConnect", version, "All patient data is synthetic.").
  - Icons:
    - `import iconPath from '../../resources/icon.png?asset'`
    - `import badgePath from '../../resources/badge.png?asset'`

**Tests (minimum; each is a real assertion, not a smoke check):**
- **windowState**
  - default when the file is missing or corrupt
  - restores a valid saved state
  - drops x/y for a rectangle on a removed display
  - clamps a size larger than the work area
  - debounced save on move/resize (`jest.useFakeTimers`)
  - no bounds save while maximized
  - maximize flag persisted
  - synchronous save on close
- **security**
  - trusted and untrusted URLs and senders, including a lookalike origin `app://careconnect.evil` and an `http://localhost` origin that isn't the dev server
  - the permission handlers deny
- **window**
  - every `webPreferences` value asserted
  - `minWidth`/`minHeight`
  - `ready-to-show` shows the window and maximizes it when the state says so
  - `will-navigate` to `https://example.com` is prevented
  - same-origin navigation is not prevented
  - `setWindowOpenHandler` denies all and opens only allow-listed URLs externally
  - `will-attach-webview` is prevented
- **store**: use a real temp dir (`fs.mkdtempSync(os.tmpdir())`)
  - seed on first run (file written)
  - round-trip save then load (`source: 'file'`)
  - a corrupt file is backed up and reseeded (`recovered`, `backupPath` exists)
  - an invalid save rejects and leaves the file untouched
  - the write is atomic (no `.tmp` left)
- **fileOps**
  - cancelled dialogs → null
  - export writes text that contains the patient name and Care ID
  - a `.json` export parses back with `parsePatientImport`
  - import of an array, of `{ patients }` and of a single export
  - an oversize file rejects
  - attachment returns `{ name, size }`
- **contextMenu**
  - resolves the clicked id
  - resolves null when dismissed
  - separators and radios are mapped
  - `registerAccelerator` is false
- **menu**
  - the top-level labels are exactly File, Edit, View, Navigate, Patient, Communicate, Help (labels without `&`, on win32)
  - access keys are unique per menu
  - every command item's id is a valid `CommandId`
  - accelerators equal `acceleratorForCommand`, with `registerAccelerator: false` on win32
  - a darwin template has the app menu and no single-key accelerators
  - clicking New Patient sends `{ id: 'patient.new' }`
  - `applyMenuState` enables and disables per the rules
  - checkboxes reflect the state
  - dev-only items exist only when `isDev`
- **tray**: menu labels with the unread count, tooltip pluralisation, click shows the window, menu items send commands and quit
- **notifications**: supported and unsupported cases; a click routes the `patientId`
- **platform**: `parseCommandArgument` (valid, invalid and missing), jump-list arguments packaged and unpackaged, win32-only integration, badge on win32 vs linux
- **ipcHandlers**
  - every channel is registered once
  - an untrusted sender is rejected for each invoke channel
  - invalid payloads are rejected (bad workspace, bad URL, oversized clipboard)
  - `ui:state` invalid payload ignored and valid payload forwarded
  - dispose removes the handlers
- **preload**
  - `contextBridge.exposeInMainWorld('careconnect', …)` is called once with exactly the `CareConnectApi` keys
  - every method invokes or sends the right channel with the right arguments
  - `onCommand` delivers the payload without the event object, and its unsubscribe removes the listener
- **tests/integration/ipc.test.ts**:
  - require the real `src/preload/index.ts` (which registers on the mocked `contextBridge`) and the real `registerIpcHandlers` with a real store in a temp dir and fake dialogs, connected through `mockElectron.connectRenderer(win.webContents)`
  - `api.loadWorkspace()` seeds 28 patients
  - `saveWorkspace(modified)`, then a fresh store's `load()` sees the change
  - `exportPatient` writes a file
  - `importPatients` returns validated patients
  - `openExternal` with a disallowed URL rejects
  - an untrusted `senderUrl` rejects
  - a menu click (template item `click`) reaches `api.onCommand` listeners
  - `updateUiState` reaches `onUiState`
- **tests/integration/windowManagement.test.ts**:
  - `createWindowStateKeeper` + `createMainWindow` with `FakeBrowserWindow` and fake displays
  - first launch uses the defaults
  - move and resize, advance the timers, close
  - a second launch restores the bounds
  - maximize persists and the next launch maximizes on `ready-to-show`
  - unplugging the display (`mockElectron.displays = [primary only]`) re-centres the window
  - the window is created with secure `webPreferences`

**Steps**
- [ ] Write a failing test per module, then implement (red/green), one module at a time.
- [ ] Rewrite `index.ts` as wiring only. Keep logic in the modules above.
- [ ] Build with `npx electron-vite build`, then launch:
  ```bash
  node /tmp/claude-1000/-home-shane-swen661-devintel/c639e663-1ba9-4060-84f1-86076df724ac/scratchpad/smoke-launch.cjs "$PWD" /tmp/claude-1000/-home-shane-swen661-devintel/c639e663-1ba9-4060-84f1-86076df724ac/scratchpad/task3.png
  ```
  It prints the URL, the title, `webPreferences` and any console or main errors. Confirm the renderer loads the workspace (no "No handler registered" errors) and that there are no "Electron Security Warning" lines.
- [ ] Run the gates. Main-process line coverage should be ≥ 85 % (`npx jest --selectProjects main --coverage --collectCoverageFrom='src/main/**/*.ts' --collectCoverageFrom='src/preload/**/*.ts'`), excluding `index.ts` if it is pure wiring.

---

## Task 4: Patients view and patient dialogs

**Files:**
- Create:
  - `src/renderer/src/views/patients/PatientsView.tsx` (replaces the stub)
  - `PatientList.tsx`
  - `PatientDetail.tsx`
  - `patients.css`
  - `__tests__/*.test.tsx`
- Create:
  - `src/renderer/src/dialogs/patient/NewPatientDialog.tsx`
  - `AddNoteDialog.tsx`
  - `EditSummaryDialog.tsx` (replace the stubs, keeping the same exported names and props)
  - `patientDialogs.css`
  - `__tests__/*.test.tsx`

**Interfaces**
- Consumes: the foundation (quick reference). Use:
  - `visiblePatients`, `patientSecondaryText`, `patientById`, `statusCounts`
  - `patientContextMenuItems`
  - `useCommandHandler`, `useSearchTarget`
  - `formatDayTime`, `formatShortDate`, `formatActivityTime`
  - `StatusChip`, `Avatar`, `Toolbar`, `ToolbarButton`, `Dialog`
- Produces:
  - `PatientsView` (no props)
  - `NewPatientDialog({ onClose })`
  - `AddNoteDialog({ patientId, onClose })`
  - `EditSummaryDialog({ patientId, onClose })`

**Requirements (design image 1 and spec cards 01–08)**

1. **Layout.**
   - A list pane: `<section id="patient-list" data-region="list" aria-labelledby=…>`, about 380 px wide.
   - A detail pane: `<section data-region="detail" aria-labelledby="patient-name-heading">`.
   - Below 1100 px the panes stack, the list first, with no horizontal scrolling at 640 px.
2. **List header.**
   - `h2` "Recent patients" and a result count ("28 results" / "1 result").
   - A search landmark (`role="search"`, `aria-label="Patient list"`) containing:
     - an input with `id="patient-search"`, `type="search"`, label "Search list" (visually hidden `<label>`) and placeholder "Search list"
     - a `/` key hint
   - The input is registered with `useSearchTarget()` and bound to `ui.patientQuery`.
   - Typing announces the new count politely after 400 ms of quiet ("5 results").
   - Escape with text clears the query. Escape when empty moves focus to the selected option.
   - When `ui.statusFilter !== 'all'`, show "Showing: Needs review" with a "Clear filter" button.
3. **Listbox.**
   - A `<ul role="listbox" aria-label="Recent patients">` of `<li role="option" id="patient-option-<id>" aria-selected tabIndex={active ? 0 : -1} className="… focus-inset">`.
   - Each row: an `Avatar` (brand tone when selected), the name, `patientSecondaryText(patient, now)` and a `StatusChip`.
   - The accessible name is set with `aria-label` to `"<name>, <secondary>. <status label>"`. The design's announcement is "Avery Park, selected, list item, 1 of 28. Needs review."
   - Selection follows focus. ArrowUp and ArrowDown move focus and selection: dispatch `ui/selectPatient` with `at: clock().toISOString()`.
   - Home, End, PageUp and PageDown (±10) also move. There is no type-ahead, because single letters are workspace shortcuts.
   - Enter moves focus to `#patient-name-heading`.
   - A click selects.
   - Use a `contextmenu` listener (fired by right-click, Shift+F10 and the Menu key):
     - prevent the default
     - select the patient
     - call `api.showContextMenu({ items: patientContextMenuItems(patient), x, y })` at the pointer, or at the row's bottom-left when the coordinates are 0
     - run the chosen command with `{ id, patientId }`
   - Empty results: "No patients match “query”." with a "Clear search" button.
4. **Command handlers** (registered while mounted):
   - `patient.contextMenu`: the selected patient's menu at its row.
   - `patient.filter`: a native menu at `#toolbar-patient.filter` with radio items All patients / Needs review / Open / Completed, then dispatch `ui/setStatusFilter` and announce, for example "Showing Needs review patients, 6 results".
   - `patient.sort`: radio items Recent activity / Name / Next visit / Status, then dispatch `ui/setSortOrder` and announce.
5. **Detail pane.**
   - With no patient selected: "Select a patient to see their care summary."
   - **Header:**
     - a large brand `Avatar`
     - `h2#patient-name-heading` (tabIndex −1) with the name
     - a "Synthetic demo record" neutral chip
     - meta "Adult · they/them · Care ID CC-1048"
     - a `Toolbar` labelled "Actions for <name>":
       - Message: command `patient.message`, accessible name "Message <name>"
       - More: `aria-haspopup="menu"`, accessible name "More actions for <name>", hint Shift+F10; opens the context menu at the button
   - **Stat cards:**
     - LAST CONTACT: `formatShortDate`, or "Today"/"Yesterday" via `formatRelativeDay`
     - NEXT VISIT: `formatDayTime`, or "Not scheduled"
     - CARE TEAM: "4 members", as a disclosure button (`aria-expanded`) revealing the names
   - **Care summary card** (`<section aria-labelledby>`):
     - `h3` "Care summary"
     - an Edit button: `patient.editSummary`, name "Edit care summary for <name>", hint E
     - the alert callout (warning icon, title, detail) when `patient.alert` is set
     - the "Current plan" section label and a `ul` of plan items, or "No plan items yet."
   - **Recent activity:**
     - `<aside aria-labelledby>`, which is the complementary landmark
     - `h3` "Recent activity"
     - an `ol` of activities, each with an icon by kind, the title and `formatActivityTime`
     - a full-width "Add note" button: `patient.addNote`, name "Add clinical note for <name>", hint N, at least 44 px
6. **NewPatientDialog** (Ctrl+N).
   - **Fields:**
     - Full name (required)
     - Pronouns (select: they/them, she/her, he/him, "Not recorded")
     - Age group (select: Adult, Older adult, Young adult)
     - Reason for visit (required)
     - Visit date (`type="date"`, required unless "Schedule later" is checked)
     - Schedule later (checkbox)
     - Visit time (`type="time"`, default 09:00)
     - Status (radio group in a `fieldset`/`legend`: Open (default), Needs review)
   - **Submit with errors:**
     - render an error summary at the top: a `div.error-summary` with `tabIndex=-1` and `role="alert"`, a heading "There is a problem" or "There are N problems", and a list of `<a href="#field-id">` links whose `onClick` focuses the field
     - move focus to the summary
     - each invalid field gets `aria-invalid="true"` and `aria-describedby` → its `.field__error`
     - entered values are kept
   - **Messages:**
     - "Enter the patient’s full name."
     - "Enter a reason for the visit."
     - "Visit date is required. Enter a date, or choose “Schedule later.”"
     - "Enter a visit date that is today or later."
   - **Success:**
     - create a `Patient`:
       - `createId('p')`
       - `careId` = the next number after the highest existing `CC-` id
       - `lastContact` = now
       - `careTeam = [user.name]`
       - `plan: []`, `alert: null`
       - activity: `record` "Patient record created"
     - dispatch `patient/added`, then `onClose()`
     - `run({ id: 'patient.open', patientId })`, which focuses the new option
     - status "<name> added. Care ID CC-…"
7. **AddNoteDialog** (N).
   - The description names the patient.
   - **Fields:**
     - Note type (select: Visit note, Phone call, Care coordination)
     - Note (required textarea, error "Enter the note text.")
     - "Clear the follow-up alert" checkbox, shown only when `patient.alert` is set
   - **Success:**
     - dispatch `patient/noteAdded` with a `note` activity titled "<type> added", plus `patient/updated { alert: null }` if the box is checked
     - close
     - status "Note added for <name>."
8. **EditSummaryDialog** (E).
   - Plan items as a list of inputs, each with a "Remove plan item N" icon button.
   - An "Add plan item" button, which focuses the new input.
   - A "Show follow-up alert" checkbox with Title (required when checked) and Details.
   - Empty plan rows are dropped on save.
   - Dispatch `patient/updated { plan, alert }` with a `record` activity "Care summary updated".
   - Status "Care summary updated for <name>."
9. **Styling** follows design image 1: list rows about 88 px tall, the selected row `--color-selected` with a 2 px `--color-brand` border, and white cards on the page background.

**Tests (minimum)**
- **PatientsView:**
  - renders 28 options; the first is Avery Park and selected
  - the accessible name of the Avery option equals `Avery Park, Wellness follow-up · 10:30. Needs review`
  - ArrowDown selects Morgan Chen and the detail heading updates
  - Home and End
  - typing "riley" leaves 1 option and announces "1 result"
  - Escape clears
  - filter via `api.nextContextMenuChoice = 'needs-review'` (or whatever ids you use) then `run('patient.filter')` filters and announces
  - sort by name puts Alex Rivera first
  - a `contextmenu` event on an option calls `showContextMenu` with the patient items, and a chosen `patient.addNote` opens the Add note dialog
  - the empty state
  - axe passes
- **PatientDetail:**
  - Avery shows "Today, 10:30", "4 members", "Follow-up due today" and the three plan items
  - the activity list renders "Visit note updated" with "Today · 09:14"
  - the buttons have the context names above
  - the care-team disclosure toggles `aria-expanded`
- **Dialogs** (open via `renderApp()` and the key or button):
  - submitting empty focuses the error summary; each summary link moves focus to its field; `aria-invalid` and `aria-describedby` are set
  - "Schedule later" removes the date error
  - a valid submit adds the patient, focuses its option and sets the status text
  - an Add note submit adds activity at the top, and the live region contains "Note added for Avery Park."
  - Edit summary add/remove/save, and clearing the alert hides the callout
  - Escape closes, and focus returns to the opener
  - axe passes on each dialog

---

## Task 5: Command palette, keyboard shortcuts, help and settings dialogs

**Files:**
- Replace:
  - `src/renderer/src/dialogs/palette/CommandPalette.tsx`
  - `dialogs/shortcuts/ShortcutsDialog.tsx`
  - `dialogs/help/HelpDialog.tsx`
  - `dialogs/settings/SettingsDialog.tsx`
- Create:
  - `dialogs/palette/paletteCommands.ts`: pure command catalog and matching
  - `*.css` per dialog
  - `__tests__/` in each folder

**Interfaces**
- Consumes: `Dialog`, `useCommands`, `useAppState`, `useAppDispatch`, `useWorkspace`, `useApi`, `useAnnounce`, `useStatus`, `SHORTCUTS`, `SHORTCUT_GROUPS`, `shortcutKeys`, `COMMAND_LABELS`, `formatTimeAgo`, `RESOURCE_LINKS`, `findScopedCommand`, `isEditableTarget`.
- Produces:
  - `CommandPalette({ onClose })`, `ShortcutsDialog({ onClose })`, `HelpDialog({ onClose })`, `SettingsDialog({ onClose })`
  - `paletteCommands.ts`:
    - `interface PaletteItem { id: string; group: 'suggested' | 'recent' | 'global' | 'commands' | 'patients' | 'destinations'; title: string; subtitle?: string; icon: IconName; command: AppCommand; keys?: string[] }`
    - `buildPaletteItems(state: AppState, now: Date, platform): PaletteItem[]`
    - `filterPaletteItems(items, query): PaletteItem[]`

**Requirements**

1. **CommandPalette** (design image 3).
   - Uses `Dialog`, titled "Command palette", with the ⌘ icon, `closeOnBackdrop` and size medium.
   - **Input:**
     - `role="combobox"`, `aria-label="Search commands"`, `aria-expanded="true"`, `aria-controls=<listbox id>`, `aria-autocomplete="list"`
     - `aria-activedescendant` → the active option id
     - `aria-describedby` → the helper text "Type a command, patient label, or destination"
     - Focus stays in the input the whole time: "Results update without moving focus."
   - An "All commands" scope chip (decorative) and the `↑ ↓ move · Enter open` legend.
   - **Listbox:**
     - one `role="listbox"` labelled "Commands"
     - groups are `role="group"` with `aria-labelledby` pointing at visible group headings
     - options are `role="option"` with `aria-selected` on the active one, plus `aria-setsize` = total results and `aria-posinset` = 1-based index across all groups
     - the active option shows "1 of 8"
     - the option's name is the title plus the subtitle
   - **Empty query groups:**
     - **Suggested commands:**
       - Open Patients ("Navigate to patient workspace", G P)
       - Create new patient record ("Opens a blank synthetic record form", Ctrl N)
       - Search patient directory ("Search across assigned care teams", Ctrl F)
     - **Recent destinations:**
       - each `ui.recentPatients` entry as "<name> — Care summary" with "Recent · 4 minutes ago" (`formatTimeAgo`), opening the patient
       - "Team Inbox — Triage" with "<N> unread conversations" (G I)
     - **Global commands:**
       - Open keyboard shortcuts (Ctrl /)
       - CareConnect help center (F1)
   - **With a query:**
     - commands matched case-insensitively on title, subtitle or keywords
     - patients matched on name or Care ID (open patient)
     - destinations matched
     - no group exceeds 8
   - **Context filtering:**
     - patient-scoped commands appear only when a patient is selected
     - filter and sort appear only in the Patients view
     - send, save draft and attach never appear
     - reply appears only in the Inbox with a conversation selected
   - **Keys:**
     - ArrowDown and ArrowUp move the active option (wrapping)
     - Enter runs it: `dispatch({ type: 'ui/closeModal' })` then `run(item.command)`
     - Escape closes (the Dialog handles it, and `ModalHost` restores focus)
     - Tab stays within the dialog (handled by Dialog)
   - Clicking an option runs it.
   - The result count is announced politely, debounced to 300 ms ("3 results", "No results").
   - Footer: "Searching CareConnect · synthetic demo data only" and "Open anytime Ctrl K".
2. **ShortcutsDialog** (Ctrl+/, design image 4).
   - Size large, titled "Keyboard shortcuts".
   - A legend: Ctrl K "Press together" and G P "Press in sequence".
   - A "Find a command" search input, labelled. Ctrl+F (⌘F on mac) inside the dialog focuses it.
   - One `<table>` per `SHORTCUT_GROUPS` entry:
     - the caption is the group title, plus its description
     - columns: `th scope="col"` Action / Windows / Linux / macOS
     - the row header cell is the action label, plus a "Sequence" badge for sequences
     - key cells are `kbd` keycaps from `shortcutKeys`
     - the current platform's column header reads "… (this computer)"
   - Filtering hides non-matching rows and empty tables, and announces "N shortcuts".
   - Footer note: "Browser or assistive technology shortcuts take priority. CareConnect does not override reserved key combinations." plus a "Print reference" button that calls `api.printPage()`.
3. **HelpDialog** (F1).
   - Titled "CareConnect help".
   - **Sections** (h3):
     - **Getting around:** F6 regions in order, skip links, G sequences, the command palette
     - **Using a screen reader:** the landmark list, using NVDA browse mode on the patient list, the Insert+Space focus mode tip, Narrator
     - **Status and errors:** where status messages appear and how errors are summarised
     - **Keyboard shortcuts:** a button that calls `openModal({ kind: 'shortcuts' })`
     - **Accessibility resources:** the `RESOURCE_LINKS` with category "Accessibility", as buttons named "<title> (opens in your browser)" that call `api.openExternal(url)`, with a status if it resolves false
4. **SettingsDialog** (Ctrl+, or the gear).
   - Size small, titled "Settings".
   - A `fieldset` "Display" with `<input type="checkbox" role="switch">` controls:
     - Show shortcut hints
     - High contrast theme
     - Reduce motion
   - A `fieldset` "Notifications": Desktop notifications for follow-ups due today.
   - Each change immediately dispatches `preferences/changed` and announces politely, for example "High contrast theme on".
   - A read-only line: "Windows High Contrast: On/Off" (`ui.systemHighContrast`).
   - A "Done" button closes.

**Tests (minimum)**
- **paletteCommands** (unit):
  - empty-query groups exactly match the design text above
  - patient matching by name and Care ID
  - context filtering (no selection → no patient commands; not Patients → no filter/sort)
  - send, save draft and attach never present
  - group caps
- **CommandPalette** (via `renderApp()`):
  - Ctrl+K opens the dialog and focus is in the combobox named "Search commands"
  - typing "inbox" filters the list
  - ArrowDown changes `aria-activedescendant` and `aria-selected`
  - Enter on "Open Inbox" navigates (the h1 becomes "Inbox")
  - Escape restores focus to the element focused before opening
  - selecting a patient result opens that patient
  - `aria-setsize`/`aria-posinset` are correct
  - the live region shows the count
  - axe passes
- **ShortcutsDialog:**
  - one row per `SHORTCUTS` entry, in four tables with captions
  - mac platform marks the macOS column
  - the filter "draft" leaves Save draft only and announces "1 shortcut"
  - Ctrl+F focuses the filter
  - Print calls `api.printPage`
  - axe passes
- **HelpDialog:**
  - F1 opens it
  - resource buttons call `openExternal` with the allow-listed URL
  - the Keyboard shortcuts button switches to the shortcuts dialog, and closing it returns focus to the original opener
  - axe passes
- **SettingsDialog:**
  - each switch toggles the preference
  - `document.documentElement.dataset.theme` becomes `high-contrast`
  - announcements happen
  - Done closes
  - axe passes

---

## Task 6: Overview, Schedule, Inbox, Tasks, Reports and Resources views, and the compose dialog

**Files:**
- Replace the stubs in `src/renderer/src/views/{overview,schedule,inbox,tasks,reports,resources}/` (same export names).
- Add CSS beside each view, and tests in `__tests__/` under each folder.
- Replace `src/renderer/src/dialogs/compose/ComposeDialog.tsx` (same props), with a CSS file and tests.

**Interfaces**
- Consumes: the foundation. Use:
  - `statusCounts`, `upcomingVisits`, `tasksDueToday`, `isOverdue`, `unreadCount`, `sortedConversations`, `conversationById`, `patientById`
  - `useCommandHandler`, `useCommands`, `useStatus`
  - `findScopedCommand`
  - `Dialog`, `StatusChip`, `Avatar`, `Icon`
  - `RESOURCE_LINKS`
- Produces: `OverviewView`, `ScheduleView`, `InboxView`, `TasksView`, `ReportsView`, `ResourcesView` and `ComposeDialog({ patientId, conversationId, draftId, onClose })`.

**Requirements**

Every view root is `<div className="view …" data-region="main">`, except Inbox, which has `list` and `detail` regions. Section headings are h2, because the h1 is in the header.

1. **Overview.**
   - Stat cards, each a button that navigates and is named with its count, for example "Needs review: 7 patients":
     - Needs review / Open / Completed counts → Patients with that filter (`ui/setStatusFilter` + navigate)
     - Unread messages → Inbox
     - Tasks due today → Tasks
   - "Today’s visits": time, patient-name buttons that run `patient.open`, reason, `StatusChip`.
   - "Needs attention": patients with an `alert`.
2. **Schedule.**
   - The next 7 days via `upcomingVisits(patients, now, 7)`, grouped by day.
   - Each day is an h2 using `formatRelativeDay` plus `formatWeekdayDate`, for example "Today · Mon, Oct 5".
   - Rows: time, a patient button (`patient.open`), reason and status.
   - Days with no visits say "No visits scheduled."
3. **Inbox.**
   - **Conversation list:** a `role="listbox"` (selection follows focus) with `data-region="list"`. Each option shows:
     - an avatar and the `with` name
     - the subject
     - a one-line preview of the last message
     - its time
     - an unread marker that is a "New" chip, never colour alone
   - The option's accessible name is "<with>, <subject>, <time>[, unread]".
   - Selecting a conversation dispatches `ui/selectConversation` and `conversation/setUnread false`. The sidebar count updates, giving the accessible name "Inbox, 3 unread".
   - Drafts are listed above, "Drafts (N)", as buttons that open compose with `draftId`.
   - **Reading pane** (`data-region="detail"`):
     - an `h2` subject
     - messages as an `ol` of `article`s with the author, `formatActivityTime` and the body
     - attachments listed with `formatBytes`
     - Reply (R, `message.reply`) and "Mark as unread" buttons
   - Register a `message.reply` handler while a conversation is selected. It opens compose with that `conversationId`/`patientId`.
   - Empty state: "Select a conversation to read it."
4. **Tasks.**
   - Groups: Overdue, Due today, Upcoming, and Completed (only when `ui.showCompletedTasks`).
   - Each task is a native checkbox labelled by its title, with the due text in `aria-describedby`.
   - Urgent tasks carry a "! Urgent" chip (icon + word).
   - A patient-name button opens the patient.
   - Toggling dispatches `task/toggled`, and the status reads "Task marked done." or "Task reopened."
5. **Reports.**
   - Accessible `table`s with captions:
     - patients by status (count and %)
     - visits in the next 7 days by day
     - the top 5 reasons for care
   - Optional decorative CSS bars are `aria-hidden`, with the table as the source of truth.
   - A note that all data is synthetic.
6. **Resources.**
   - Cards grouped by `category` (an h2 per group).
   - Each card has a title, a description and a button "Open <title> (opens in your browser)" that calls `api.openExternal(url)`.
   - When it resolves false: status "That link can’t be opened." (warning).
7. **ComposeDialog.**
   - The title is "Reply" with a conversation, otherwise "New message".
   - **Fields:**
     - To: when replying, a read-only line "To: <with>"; when new, a select of patients with "Choose a recipient" and a required error
     - Subject: "Re: <subject>" when replying; required
     - Message: required textarea
     - Attachments: a list with "Remove <name>" buttons
   - **Footer:**
     - Attach document… (Ctrl+Shift+A): `api.pickAttachment()`, then append and announce "<name> attached."
     - Save draft (Ctrl+S): dispatch `draft/saved` (reusing `draftId`, else `createId('d')`) and set the status "Draft saved."; the dialog stays open
     - Send (Ctrl+Enter, primary, ≥ 44 px):
       - validate, using the error-summary pattern from Task 4 (focus the summary, field errors, keep the values)
       - dispatch `message/sent` with `{ conversationId: existing or createId('c'), patientId, with, subject, message: { id: createId('m'), author: user.name, body, at: now, outgoing: true, attachments } }` and `draftId`
       - close and set the status "Message sent to <with>."
   - **Keyboard:**
     - pass `onKeyDown` to `Dialog`, which calls `findScopedCommand(event, 'compose', ui.platform)` and handles the three commands, with `preventDefault`
     - also register `useCommandHandler` for `message.send`, `message.saveDraft` and `message.attach` (native menu clicks)
   - **Closing:** with a non-empty body and no send, save a draft automatically and set the status "Draft saved." It must never lose text.
   - Loading a `draftId` restores its fields.

**Tests (minimum)**
- **Overview:**
  - counts match `statusCounts(seed)`
  - clicking "Needs review" opens Patients filtered to needs-review
  - a today's-visit patient button opens Avery Park
- **Schedule:** the today group lists Avery Park at 10:30, and days are ordered.
- **Inbox:**
  - 6 options with 4 unread
  - selecting the first marks it read, and the sidebar link's accessible name becomes "Inbox, 3 unread"
  - R opens compose titled "Reply" with "Re: …"
  - the Reply toolbar button is `aria-disabled` with its reason when nothing is selected
  - Mark as unread
- **Compose:**
  - Send with an empty body focuses the summary
  - Ctrl+Enter sends; the conversation gains a message and the patient activity gains "Message sent"
  - Ctrl+S saves a draft
  - Ctrl+Shift+A with `api.nextAttachment` lists the attachment and announces it
  - Escape with text saves a draft
- **Tasks:**
  - the groups render
  - toggling updates the status and moves the task to Completed when shown
  - the urgent chip has text
- **Reports:** the table caption and status counts.
- **Resources:** a button calls `openExternal` with the right URL, and a false result shows the warning.
- axe passes on every view and on the compose dialog.

---

## Task 7: Tests for the shared modules and the renderer foundation

**Files:**
- Tests only, under:
  - `src/shared/__tests__/`
  - `src/renderer/src/{state,commands,keyboard,components,a11y,styles}/__tests__/`
- You may fix a genuine bug in a foundation file you are testing when:
  - no exported name or type changes
  - you list every such fix in your final report, with the reason and the test that caught it

**Interfaces**
- Consumes: everything in the quick reference.
- Produces: tests.

**Requirements and minimum tests**

1. **`shared/shortcuts`** (table-driven over `SHORTCUTS`):
   - every chord matches a synthetic event built from itself on both platforms, and fails with an extra modifier
   - punctuation ignores Shift
   - `chordKeys` labels: Ctrl/⌘, Shift/⇧, Fn for mac function keys, Enter/Return
   - `toAccelerator` values: `CmdOrCtrl+K`, `Shift+F6`, `E`, `CmdOrCtrl+/`
   - `menuOwnsChord` only on mac, and only for modifier chords and function keys
   - `ariaKeyShortcuts`
   - every non-null command is a valid `CommandId`
   - ids are unique
   - the reference sheet's required actions exist: Open Overview, Patients, Inbox, Next/Previous region, Create patient record, Search current list, Edit care summary, Add clinical note, Open context menu, New message, Reply, Send message, Save draft, Attach document, Open command palette, Keyboard shortcuts, Show access keys, Close dialog or menu, Open help
2. **`shared/format`**: every function, including the year boundary, "Yesterday" across midnight, `formatTimeAgo` minutes/hours/yesterday, `initials` for one, two and three words, `formatBytes` thresholds.
3. **`shared/seed`**:
   - 28 patients with unique ids and Care IDs
   - the first five match the design (names, statuses, reasons; Avery's next visit is 10:30 today relative to `now`; Avery's alert)
   - 4 unread conversations
   - the output passes `validateWorkspace`
   - deterministic for the same `now`
4. **`shared/validate`**:
   - the valid seed passes
   - unknown fields are stripped
   - each error path names the field
   - limits are enforced
   - every IPC validator accepts and rejects
   - `parsePatientImport` accepts all three shapes, counts skipped records, and rejects non-JSON and empty files
5. **`shared/exportFormat`, `links`, `commands`, `csp`:**
   - the text export lists the alert, the plan and activity
   - the JSON round-trips
   - file name slugging
   - the allow-list rejects http, a userinfo trick, a port, an unknown host and a `javascript:` URL
   - `viewForCommand` and `isCommandId`
   - the CSP has no `unsafe-eval` and production has no `unsafe-inline`
6. **`state/appState`**: every action, plus revision counting (UI actions don't bump the revision), `workspaceForSave`, `modalCategory`, and the initial selection on load.
7. **`state/selectors`**: every selector, including the sort orders, `patientSecondaryText` for a visit today vs the latest activity, `mergeImportedPatients` duplicates and id collisions, `followUpsDueToday`.
8. **`state/AppStateProvider`**, with fake timers where needed:
   - load success
   - the `recovered` source announces assertively
   - the debounced save fires once after rapid changes
   - a save failure sets `saveError`, shows the status and announces assertively; `save/retry` saves again
   - `updateUiState` is called with the correct `UiState`
   - `getAppInfo` sets the platform
   - `emitTheme` updates `systemHighContrast`
   - the follow-up notification is sent once, with a title naming the count
9. **`commands/defaultCommands`**: unit-test `runDefaultCommand` with a fake context for every command id. Assert the dispatched actions, the opened modals, and the status messages, including:
   - "Select a patient first."
   - modal refusal ("Close the open dialog first.")
   - export success, cancel and error
   - import merge messages
   - copy
   - marking with the same status
   - toggles
10. **`commands/CommandProvider`:**
    - the most recently registered handler wins, and unregistering restores the default
    - `api.emitCommand` runs a command
    - `openModal` remembers the opener, and `restoreFocusAfterModal` focuses it, falling back to `#view-title`
    - a thrown handler error becomes an error status
11. **`keyboard/useKeyboardShortcuts`** (table-driven):
    - every global and patients/inbox-scope shortcut fires its command in the right view, as observed through `api`/state, for example `app.commandPalette` opening the palette dialog
    - single keys are ignored in an `<input>`
    - nothing fires while a modal is open
    - each G-sequence navigates, and a sequence expires after 1.5 s
    - Alt reveals hints (`data-hints="on"`) and releasing Alt hides them
    - on mac, `menuOwnsChord` chords are skipped
    - `findScopedCommand` for compose
12. **`keyboard/regions`:**
    - F6 cycles Navigation → Toolbar → List → Detail → Status → Navigation
    - Shift+F6 goes backwards
    - the remembered element is restored
    - an empty region gets `tabindex=-1` and focus
13. **Components:**
    - **Dialog:** initial focus, the Tab trap in both directions, Escape → `onClose`, `closeOnBackdrop`
    - **Toolbar:** a single tab stop, Arrow/Home/End, `aria-disabled` with a described reason that does not run the command
    - **Sidebar:** `aria-current`, "Inbox, 4 unread", the hints toggle `aria-pressed`, the clinic switch disabled with a reason, settings
    - **AppHeader:** each view's toolbar buttons and subtitle chip
    - **StatusBar:** "0 unsaved changes", the status message and dismiss, Retry save, the Keyboard help button opens help, the sequence hint
    - **SkipLinks:** each focuses its target, and "Skip to patient list" appears only in Patients
    - **StatusChip:** icon + text for each status
    - **KeyHint:** text and keys variants, mac labels
    - **Avatar**
    - **Announcer:** polite vs assertive regions, a repeated message announced again
14. **`styles/__tests__/contrast.test.ts`:**
    - parse `tokens.css` (`fs.readFileSync`)
    - implement the WCAG relative-luminance formula
    - assert every pair in the `tokens.css` comments and the design table at the minimum ratio (4.5 for text, 3 for UI and focus)
    - also assert that the design's original `#00A9A2` is below 3:1 on white (documenting deviation 2)
    - and that the `[data-theme='high-contrast']` text tokens are ≥ 7:1 on white

---

## Task 8 (orchestrator): Integration, end-to-end tests, packaging, documentation

- [ ] Merge the reports from Tasks 3–7. Apply any requested foundation changes. Run all gates:
  ```bash
  npm run typecheck
  npm run lint
  npm test -- --coverage
  npm run build
  ```
- [ ] `tests/e2e/app.e2e.test.ts` (Playwright `_electron`, a separate Jest project run by `npm run test:e2e`) against the built app:
  - the window title
  - the native menu has File/Edit/View/Help
  - the workspace loads through real IPC
  - Ctrl+K opens the palette
  - F6 moves focus between regions
  - window bounds persist across a relaunch with a temporary `--user-data-dir`
  - no "Electron Security Warning" in the console
- [ ] Run the app (WSLg) and screenshot the main views and dialogs. Compare them with the design images and fix the visual gaps.
- [ ] Windows installer: `npm run dist:win:docker`. Optionally smoke-run `win-unpacked/CareConnect.exe` via WSL interop.
- [ ] `README.md` for the Electron app: run, test, coverage, lint, package, architecture, shortcuts, accessibility testing guide (NVDA, Narrator, High Contrast), known issues, AI usage.
- [ ] `docs/test-plan.md`: test cases mapped to the rubric.
- [ ] `docs/accessibility-demo-script.md`: a 10–15 minute video script.
- [ ] Commit the coverage report (un-ignore `coverage/` in `careconnect-electron/.gitignore`).

## Task 9 (orchestrator): Adversarial audits

Run parallel audits, then verify each finding and fix the confirmed ones:
- accessibility against spec cards 01–08
- the Electron security checklist
- keyboard shortcuts against the reference sheet
- the assignment rubric
- test quality

Re-run every gate afterwards.
