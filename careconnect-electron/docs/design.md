# CareConnect Desktop — Design

Week 8 implementation of the Assignment 7 desktop designs: the clinical
workspace, the command palette, the keyboard shortcuts reference and the
desktop accessibility specification. Target platform: **Windows** (NSIS
installer). Linux and macOS are not packaged, but nothing in the code is
Windows-only; platform-specific calls are guarded.

All patient data is **synthetic demo data**.

## 1. Requirements traceability

| Assignment 8 requirement | Where it lives |
|---|---|
| Main and renderer processes separated | `src/main` (Node, Electron APIs), `src/preload` (bridge), `src/renderer` (React, sandboxed), `src/shared` (pure TS used by both). ESLint `no-restricted-imports` enforces the boundaries. |
| Native menu bar: File, Edit, View, Help | `src/main/menu.ts`: File, Edit, View, Navigate, Patient, Communicate, Help, with `&` access keys. Item state follows the renderer (`ui:state`). |
| All keyboard shortcuts from the design | `src/shared/shortcuts.ts` is the single table. The menu, the renderer key handler and the Shortcuts dialog all read it. |
| Desktop navigation patterns | Sidebar navigation, G-key sequences, F6 region cycling, skip links, command palette (Ctrl+K), native context menus (Shift+F10), roving-tabindex toolbars, a listbox for patients. |
| Window state management | `src/main/windowState.ts` remembers size, position, maximized and full-screen state, and re-centres a window whose display has gone. |
| File system operations | JSON workspace store in `userData`, written atomically. Export a patient summary (`.txt` / `.json`) and import patients (`.json`) through native dialogs. Attach-document picker. |
| System tray | `src/main/tray.ts`: tooltip with unread count, plus a menu for Open, New patient, Inbox and Quit. |
| React app in renderer | `src/renderer/src`, React 19. |
| Platform features (Windows) | Native menus, toast notifications (AppUserModelID), taskbar overlay badge for unread messages, Jump List tasks, High Contrast support, NSIS installer. |
| Code quality | Organised structure, Electron security checklist (section 4), ESLint clean, `tsc` clean. |
| Unit tests | Jest: shared logic, reducer and selectors, main-process modules. React Testing Library for every component and dialog. |
| Integration tests | `tests/integration/ipc.test.ts` drives the real preload API into the real IPC handlers. `tests/integration/windowManagement.test.ts` drives window creation and window-state persistence. Optional `tests/e2e/` launches the built app with Playwright. |
| Coverage ≥ 60 % | Jest `coverageThreshold` of 60 % (statements, branches, functions, lines) fails the run below that. The HTML report is at `coverage/lcov-report/index.html`. |
| Accessibility | Section 9. jest-axe runs on every view and dialog. |
| Installer | `npm run dist:win` (Windows host) or `npm run dist:win:docker` (Linux/WSL), producing `dist/CareConnect-Setup-<version>.exe`. |

## 2. Architecture

```
┌──────────────────────────── main process (Node) ────────────────────────────┐
│ index.ts      bootstrap: single-instance lock, app:// protocol, sandbox,     │
│               window, menu, tray, IPC, notifications, Windows integration    │
│ window.ts     secure BrowserWindow + navigation/permission guards            │
│ windowState.ts  bounds persistence and validation against displays           │
│ menu.ts       application menu template (pure) + state updates               │
│ tray.ts       tray icon and menu                                             │
│ ipcHandlers.ts  every ipcMain.handle, sender check + payload validation      │
│ store.ts      workspace JSON (atomic write, corrupt-file recovery, seeding)  │
│ fileOps.ts    export / import / attachment through native dialogs           │
│ notifications.ts, platform.ts (Windows: AUMID, Jump List, overlay badge)     │
│ commandChannel.ts  queues menu/tray/Jump List commands until the renderer is │
│               ready; closeGuard.ts holds a close until the last autosave     │
└───────────────▲─────────────────────────────────────────┬────────────────────┘
                │ ipcRenderer.invoke / send               │ webContents.send
                │ (channels in shared/ipc.ts)             │ ('app:command', 'theme:changed')
┌───────────────┴──────── preload (sandboxed, CJS) ───────▼────────────────────┐
│ contextBridge.exposeInMainWorld('careconnect', CareConnectApi)               │
│ One method per channel. No generic send/invoke, no Electron objects leak.   │
└───────────────▲──────────────────────────────────────────────────────────────┘
                │ window.careconnect
┌───────────────┴──────── renderer (React, sandboxed, no Node) ────────────────┐
│ api/       ApiProvider (window.careconnect, or in-memory API in tests)       │
│ state/     WorkspaceProvider: reducer + autosave + UI state                  │
│ commands/  command registry and dispatcher (menu, palette, keys share it)    │
│ keyboard/  key matching, G-sequences, F6 regions                             │
│ a11y/      live-region announcer, focus return, visually-hidden              │
│ components/ Sidebar, Header/Toolbar, StatusBar, SkipLinks, Dialog, chips…    │
│ views/     Overview, Schedule, Patients, Inbox, Tasks, Reports, Resources    │
│ dialogs/   CommandPalette, Shortcuts, Help, NewPatient, AddNote,             │
│            EditSummary, Compose, Settings                                    │
└──────────────────────────────────────────────────────────────────────────────┘
          shared/: model, api types, ipc channels, commands, shortcuts,
          seed data, formatting, validation, export format, CSP
```

Directory names avoid `linux/`, `windows/`, `macos/`, `web/`, `ios/` and `android/`.
The repository's root `.gitignore` drops any directory with those names.

## 3. Process model and IPC contract

The contract is code, in `src/shared/api.ts` (types) and `src/shared/ipc.ts`
(channel names).

| Channel | Direction | Payload → result |
|---|---|---|
| `workspace:load` | invoke | → `LoadResult` (`workspace`, `source: 'file' \| 'seed' \| 'recovered'`, `backupPath?`) |
| `workspace:save` | invoke | `Workspace` → `{ savedAt }` |
| `patient:export` | invoke | `{ patient, format: 'txt' \| 'json' }` → `{ filePath } \| null` (null = cancelled) |
| `patients:import` | invoke | → `{ patients, skipped, filePath } \| null` |
| `attachment:pick` | invoke | → `{ name, size } \| null` |
| `notification:show` | invoke | `{ title, body, patientId? }` → `boolean` |
| `context-menu:show` | invoke | `{ items, x?, y? }` → chosen item id `\| null` |
| `app:info` | invoke | → `{ platform, version, isPackaged, highContrast }` |
| `external:open` | invoke | `url` → `boolean` (https and allow-listed hosts only) |
| `clipboard:write` | invoke | `text` → `void` |
| `window:print` | invoke | → `void` (prints the current page, used by the shortcuts reference) |
| `ui:state` | send | `UiState`: view, selection, open modal, unread count, unsaved changes, preferences. Drives menu enablement, tray tooltip and the overlay badge. |
| `app:command` | main → renderer | `AppCommand` from menu, tray, Jump List, second instance or notification click |
| `theme:changed` | main → renderer | `{ highContrast, dark }` when Windows High Contrast toggles |

Every `ipcMain.handle` goes through one wrapper that:
1. rejects senders whose frame URL is not `app://careconnect` (or the dev-server origin in development),
2. validates the payload with `src/shared/validate.ts` and rejects anything malformed,
3. returns only structured-cloneable data.

## 4. Security (Electron security checklist)

| Checklist item | Implementation |
|---|---|
| 1. Only load secure content | Only `app://careconnect` (packaged) or the local Vite server (dev) is loaded. |
| 2–4. No Node in renderer; context isolation; sandbox | `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and `app.enableSandbox()` for every renderer. |
| 5. Session permission requests | `setPermissionRequestHandler` and `setPermissionCheckHandler` deny everything. Notifications come from the main process, not the web API. |
| 6. Do not disable webSecurity | Left at its default. |
| 7. Content-Security-Policy | Strict policy (`default-src 'none'; script-src 'self'; …`), sent as `<meta>` and as a header by the protocol handler. No `unsafe-eval` in any mode. |
| 8–9. No insecure content, no experimental features | Defaults are kept. |
| 10. No `<webview>` | `webviewTag: false`. `will-attach-webview` is prevented. |
| 11–12. Limit navigation and new windows | `will-navigate` and `will-redirect` block anything off-origin. `setWindowOpenHandler` denies everything and hands allow-listed https URLs to `shell.openExternal`. |
| 13. Safe `shell.openExternal` | Only `https:` URLs on an allow-list. |
| 15. Validate IPC senders | Sender-frame origin check on every handler. |
| 17. Validate IPC payloads | Hand-written validators in `src/shared/validate.ts`. |
| 18. Custom protocol instead of `file://` | `app://careconnect`, with a path-traversal guard. |
| 19. Fuses | `runAsNode`, `enableNodeOptionsEnvironmentVariable`, `enableNodeCliInspectArguments` and `grantFileProtocolExtraPrivileges` are off. `onlyLoadAppFromAsar` and `enableCookieEncryption` are on (`electron-builder.yml`). |
| 20. Don't expose Electron APIs | The preload exposes one function per channel. It never exposes `ipcRenderer` or event objects. |

## 5. Data model and persistence

Types are in `src/shared/model.ts`. A `Workspace` holds the clinic and user,
`patients[]` (28 synthetic records, the first five exactly as in the design),
`conversations[]` (4 unread), `drafts[]`, `tasks[]`, `preferences` and
`recentPatientIds`.

- **Load:** `store.load()` reads `userData/careconnect-workspace.json`.
  - If the file is missing, the workspace is seeded from `createSeedWorkspace(now)`, relative to today so "Today, 10:30" stays true.
  - If the file is unreadable or invalid, it is renamed to `careconnect-workspace.corrupt-<timestamp>.json` and the workspace is re-seeded. The result says `recovered`, and the renderer announces it.
- **Save:**
  - Every state change increments "unsaved changes".
  - A 600 ms debounce sends the whole workspace to `workspace:save`.
  - Main validates it, writes a temp file and renames it into place, then returns `savedAt`.
  - The status bar shows "0 unsaved changes · Synced 09:42".
  - A failed save is announced assertively, stays visible and is retried on the next change.
- **Time:** nothing below the UI calls `new Date()` directly. The renderer's `ClockProvider` supplies "now", and the main store takes `now()` as a dependency, so date logic is testable.

## 6. Desktop integration

### Menus (native)

`&File &Edit &View &Navigate &Patient &Communicate &Help`. Access keys are
unique within each menu (a test enforces it). Edit, View zoom, Full screen,
Close and Exit use Electron roles, so the OS behaves natively. As built:

- **File:** New Patient…, Import Patients…, Export Patient Summary…, Print…, Settings…, Close Window, Exit.
- **Edit:** Undo, Redo, Cut, Copy, Paste, Select All, Find in List, Co&mmand Palette….
- **View:**
  - Show Shortcut Hints, High Contrast Theme and Reduce Motion, as checkboxes
  - Actual Size, Zoom In and Zoom Out (a hidden twin also binds Ctrl+=)
  - Toggle Full Screen
  - in development only: Reload and Developer Tools
- **Navigate:** the seven views, then Next Region and Pre&vious Region.
- **Patient:**
  - New Patient…, Edit Care Summary…, Add Clinical Note…, Message Patient…
  - Mark as Com&pleted, Needs Review, Open
  - Copy Care ID, Export Summary…, Open Context Menu
  - Filter List…, Sort List…
- **Communicate:** New Message…, Reply, Send Message, Save Draft, Attach Document….
- **Help:** Keyboard Shortcuts, CareConnect Help, Command Palette, Accessibility &Resources, About CareConnect.

**Who handles app shortcuts:**
- **Windows and Linux:** the menu item carries the accelerator for display with `registerAccelerator: false`. The renderer handles the keystroke itself, so it can apply context synchronously (ignored while typing or while a dialog is open). There is no double firing.
- **macOS:** menu key equivalents are always registered, so the renderer defers to the menu for those keys.

Item state follows `ui:state`. For example, Patient items are disabled with no selected patient, and Send, Save draft and Attach are enabled only while the compose dialog is open.

### Tray

Tooltip: "CareConnect — N unread messages". Menu: Open CareConnect, New patient…,
Open inbox (N unread), Quit. A click shows and focuses the window.

### Notifications

- On launch, one toast summarises follow-ups due today, unless turned off in Settings.
- Clicking the toast focuses the window and opens the first such patient.
- On Windows, `app.setAppUserModelId('edu.umgc.swen661.careconnect')`, which matches the installer's appId.

### Windows-specific

- Jump List tasks via `app.setUserTasks`: "New patient" and "Open inbox". They relaunch with `--command=<id>`, which the single-instance handler routes to the running window.
- Taskbar overlay badge with an accessible description ("4 unread messages").
- `nativeTheme.shouldUseHighContrastColors` is forwarded as `theme:changed`. CSS also responds to `forced-colors: active`.

### Window state

- Defaults: 1440×900, centred, minimum 960×640.
- The normal bounds are saved on move or resize (debounced 400 ms), and the maximized and full-screen flags are saved too. Everything is saved synchronously on close.
- On restore, the saved rectangle must overlap a current display's work area. If it doesn't, the window is centred on the primary display and clamped to fit.
- Closing or quitting waits, for at most 3 s, until the renderer reports 0 unsaved changes. Ending the session can't drop the last autosave.

## 7. Renderer

### Layout (Patients view, as in the design)

```
SkipLinks (visible on focus)
┌ nav "Workspace" ┐┌ header (banner): title · count chip · toolbar ───────────┐
│ clinic switcher ││┌ list pane ─────────────┐┌ detail pane ────────────────┐ │
│ Overview   G O  │││ Recent patients  28    ││ avatar · name · meta · tools │ │
│ Schedule   G S  │││ [search]           /   ││ stat cards (3)               │ │
│ Patients   G P  │││ listbox of patients    ││ Care summary │ Recent activity│ │
│ Inbox (4)  G I  │││                        ││ (alert, plan)│ (aside)        │ │
│ Tasks      G T  ││└────────────────────────┘└──────────────────────────────┘ │
│ Reports         │└───────────────────────────────────────────────────────────┘
│ Resources       │
│ Keyboard mode   │
│ Jordan Lee, RN  │
└─────────────────┘
footer "Status": ● All systems operational · N unsaved changes | Secure session | Synced hh:mm | Keyboard help F1
```

The other views reuse the shell: Overview (counts and today's agenda),
Schedule (visits for the next 7 days), Inbox (conversation list and reading
pane, Reply, New message), Tasks (checklist), Reports (status and reason
breakdown tables) and Resources (external links, allow-listed).

### Commands

Every user action is an `AppCommand` (`src/shared/commands.ts`). The menu, the
tray, the Jump List, the command palette, key presses and buttons all dispatch
through one renderer dispatcher. That's why the palette, the menu and the
shortcuts reference can never disagree.

### Dialogs

All dialogs use one `Dialog` component:
- `role="dialog"`, `aria-modal`, and a labelled title
- focus moves in on open, and Tab is trapped inside
- Esc closes the dialog
- on close, focus returns to the control that opened it
- the rest of the app is `inert` while the dialog is open

## 8. Keyboard model

| Action | Windows / Linux | macOS | Handled by |
|---|---|---|---|
| Open Overview / Schedule / Patients / Inbox / Tasks | G O / G S / G P / G I / G T (sequence) | same | renderer sequence (1.5 s window) |
| Next / previous workspace region | F6 / Shift+F6 | Fn F6 / ⇧ Fn F6 | renderer |
| Create patient record | Ctrl+N | ⌘N | renderer (menu on macOS) |
| Search current list | Ctrl+F, `/` | ⌘F, `/` | renderer |
| Filter list | **Ctrl+Shift+L** (design: Alt+F, see section 11) | ⌘⇧L | renderer |
| Edit care summary | E | E | renderer |
| Add clinical note | N | N | renderer |
| Message patient | M | M | renderer |
| Open context menu | Shift+F10 / Menu key | ⇧F10 | DOM `contextmenu` event → native menu |
| New message | Ctrl+Shift+M | ⌘⇧M | renderer |
| Reply | R (Inbox) | R | renderer |
| Send message | Ctrl+Enter (compose) | ⌘Return | compose dialog |
| Save draft | Ctrl+S (compose) | ⌘S | compose dialog |
| Attach document | Ctrl+Shift+A (compose) | ⌘⇧A | compose dialog |
| Open command palette | Ctrl+K | ⌘K | renderer |
| Keyboard shortcuts | Ctrl+/ | ⌘/ | renderer |
| Show access keys | Alt | ⌥ | Windows natively underlines menu access keys. In-app shortcut hints show while Alt is held, or always when "Show shortcut hints" is on. |
| Close dialog or menu | Esc | Esc | dialog / palette |
| Open help | F1 | Fn F1 | renderer |
| Export patient summary | Ctrl+Shift+E | ⌘⇧E | renderer |
| Settings | Ctrl+, | ⌘, | renderer |

**Rules:**
- Single-key shortcuts and sequences are ignored when focus is in an editable field, while a modal is open, or with Ctrl, Alt or Meta held.
- Modifier shortcuts work from text fields, except while a modal is open (the modal owns the keyboard).
- Reserved combinations (Ctrl+C/V/X/Z/A, Alt+letter access keys, F10, screen-reader keys) are never overridden.

**Regions (F6):**
- Patients view order: Navigation → Toolbar → Patient list → Detail pane → Status.
- Other views: Navigation → Toolbar → Main → Status.
- F6 moves to the next region's last-focused element, or failing that its first focusable element. Shift+F6 moves backwards.
- From outside every region (the view title after navigating, or `#main` after "Skip to main workspace"), F6 goes to the next region in document order and Shift+F6 to the previous one.

## 9. Accessibility (Assignment 7 spec → implementation)

| Spec card | Implementation | Verified by |
|---|---|---|
| 01 Logical focus order | DOM order = visual order, with no positive `tabindex`. F6 and Shift+F6 move between regions. Closing a layer restores focus to its opener. | Region tests; Dialog focus-return tests; axe `tabindex` rule |
| 02 Visible focus | A 3 px `#008F89` ring with a white halo on both sides (`:focus-visible`), so wherever the ring is drawn outside an element it sits on white: **3.97:1**. Rows in scroll containers (`.focus-inset`) and a focused dialog draw it just inside their own edge, on their own background: 3.46:1 on the selected row, 3.53:1 on hover, 3.67:1 on the page colour. Selection and validation use borders and backgrounds, never `outline`, so they can't hide focus. | The contrast test recomputes every ratio from `tokens.css` and the component CSS |
| 03 Skip links and landmarks | "Skip to main workspace / patient list / status" come first in the DOM. Named landmarks: banner, navigation "Workspace", main, search "Patient list", complementary "Recent activity", and contentinfo "Status". The Patients view adds two regions: "Recent patients" (the list pane) and "Care summary". Status messages are announced by the announcer's polite (`role="status"`) and assertive (`role="alert"`) live regions. Those sit outside the app shell, which is `inert` under a dialog, so the footer itself is not live. A live footer would go silent while a dialog is open, and would otherwise read each message twice. | Landmark tests; axe `region` and `landmark-*` rules |
| 04 Menus and toolbars | Native menus. Toolbars use roving tabindex: one Tab stop, arrows, Home/End. Esc closes menus. Disabled actions use `aria-disabled` plus a described reason and stay focusable. | Toolbar tests |
| 05 Screen-reader naming | Patient options read "Avery Park, Wellness follow-up · 10:30. Needs review", plus "selected" and "1 of 28" from the listbox. Repeated controls name their context ("Message Avery Park", "Add note for Avery Park"). Every accessible name starts with the visible label (WCAG 2.5.3). Icons are `aria-hidden`. Counts appear once ("Inbox, 4 unread"). | RTL `getByRole(name)` assertions |
| 06 Motion, contrast, targets | `prefers-reduced-motion` and an in-app Reduce motion toggle. 4.5:1 text and 3:1 UI, recomputed in tests. Targets ≥ 32×32 px, essential clinical actions ≥ 44×44 px. Layout reflows at 200 % zoom (CSS width 640 px) without clipping. | Contrast test; CSS review; manual check at 200 % |
| 07 Errors and recovery | On submit, focus moves to an error summary (`role="alert"` heading plus links to each field). Fields get `aria-invalid` and `aria-describedby` with specific guidance ("Visit date is required. Enter a date, or choose 'Schedule later.'"). Entered values are kept. | NewPatient and Compose tests |
| 08 Non-colour status | Every status chip has an icon and a word (✓ Completed, ! Needs review, i Open). Polite announcements for success and assertive for failures. Status messages stay until dismissed or replaced. | Chip tests; announcer tests |

Windows High Contrast and other forced-colours modes:
- CSS uses system colours under `@media (forced-colors: active)`.
- Chips and cards keep visible borders.
- Focus stays on `outline`, which forced colours keep; `box-shadow` is dropped.
- macOS Increase Contrast maps to `prefers-contrast: more`.
- An in-app High contrast theme exists for demos.

**Screen-reader test matrix (manual, recorded for Part 3):**
- NVDA + CareConnect on Windows 11 (primary)
- Narrator (secondary)

## 10. Visual tokens (measured)

| Token | Hex | Contrast |
|---|---|---|
| Text | `#0F172A` | 17.85:1 on white, 16.49:1 on page `#F4F6F9` |
| Secondary text | `#475569` | 7.58:1 on white, 6.61:1 on selected `#E8F0FE` |
| Muted labels | `#5A6B7F` | 5.46:1 on white, 4.86:1 on `#EEF2F6` |
| Link / blue text | `#1559B8` | 6.66:1 on white, 5.81:1 on selected |
| Brand fill (white text) | `#1A73E8` | 4.51:1 |
| Needs review | `#8A4B00` on `#FFF4E5` | 6.26:1 |
| Completed | `#1E6B34` on `#E6F4EA` | 5.76:1 |
| Error | `#B3261E` on `#FDECEA` | 5.72:1 |
| Focus ring | `#008F89` | 3.97:1 on its white halo. Drawn inside a row: 3.46:1 on selected, 3.67:1 on the page colour. |
| UI borders (inputs) | `#7A8899` | 3.61:1 on white |

## 11. Deviations from the Assignment 7 design

1. **Filter: Ctrl+Shift+L instead of Alt+F.**
   - On Windows, Alt+F opens the File menu.
   - The shortcut sheet's own rule is "CareConnect does not override reserved key combinations".
   - Ctrl+Shift+L is the filter toggle in Excel.
2. **Focus ring `#008F89` instead of `#00A9A2`.**
   - `#00A9A2` measures 2.92:1 on white and 2.55:1 on the selected row (`#E8F0FE`), which fails the spec's own "at least 3:1" criterion.
3. **Native OS menu bar instead of the drawn dark title-bar menu.**
   - The assignment requires native menus.
   - Native menus are what NVDA and Narrator handle best.
   - Alt and F10 reach them, so the design's "App menu" focus stop is the native menu bar.

## 12. Testing strategy

| Layer | Tooling | Location |
|---|---|---|
| Shared logic (seed, format, validate, shortcuts, export format, contrast) | Jest (node) | `src/shared/__tests__` |
| Main-process modules (window state, menu, tray, store, file ops, IPC handlers, notifications, platform, protocol, window) | Jest (node) + `tests/mocks/electron.ts` | `src/main/__tests__` |
| Preload bridge | Jest (node) | `src/preload/__tests__` |
| IPC integration (real preload ↔ real handlers ↔ real store on a temp dir) | Jest (node) | `tests/integration/ipc.test.ts` |
| Window management integration | Jest (node) | `tests/integration/windowManagement.test.ts` |
| Components, views and dialogs | Jest (jsdom) + React Testing Library + user-event + jest-axe | `src/renderer/src/**/__tests__` |
| End-to-end (optional, needs a display) | Jest + Playwright `_electron` against the built app | `tests/e2e` (`npm run test:e2e`) |

Coverage gate: 60 % global. Target: 80 % or more.

## 13. Packaging

- `electron-builder.yml` targets NSIS x64 (assisted installer). The user chooses the install folder, and it creates Start-menu and desktop shortcuts.
- The appId `edu.umgc.swen661.careconnect` matches the AppUserModelID.
- The runtime icons in `resources/` are unpacked from `app.asar`, because Windows reads them directly for toast notifications and the taskbar overlay.
- `npm run dist:win:docker` builds it from WSL, and `npm run dist:win` builds it on Windows.
- The installer is a submission artefact. It isn't committed: `dist/` is git-ignored.

## 14. Out of scope

- No real authentication or backend. The signed-in user is fixed ("Jordan Lee, RN").
- Attachments record name and size only. File contents are not copied.
- Clinic switching is shown disabled with a reason, because the demo has one clinic.
