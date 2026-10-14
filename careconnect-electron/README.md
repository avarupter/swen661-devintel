# CareConnect Desktop (Electron + React)

CareConnect's clinical workspace for care coordinators. It's a keyboard-first, screen-reader-friendly Windows desktop app built with Electron and React, implementing the Assignment 7 desktop designs: the patient workspace, the command palette, the keyboard shortcuts reference and the desktop accessibility specification.

**All patient data is synthetic demo data.**

- Design spec and requirements traceability: [`docs/design.md`](docs/design.md)
- Implementation plan: [`docs/implementation-plan.md`](docs/implementation-plan.md)
- Week 9 accessibility testing report: [`docs/accessibility/README.md`](docs/accessibility/README.md), with the [WCAG 2.1 AA conformance table](docs/accessibility/wcag-2.1-aa-conformance.md), [screen reader notes](docs/accessibility/screen-reader-notes.md) and [coverage report](docs/coverage/html/index.html)
- Accessibility demo script (Part 3 video): [`docs/accessibility-demo-script.md`](docs/accessibility-demo-script.md)

## Requirements

- Node.js 22.12 or newer (developed on Node 26) and npm.
- To build the Windows installer, either:
  - a Windows machine with Node (`npm run dist:win`), or
  - Linux/WSL with Docker (`npm run dist:win:docker`).

## Quick start

```bash
cd careconnect-electron
npm install
npm run dev        # Vite dev server + Electron, with hot reload for the renderer
```

| Script | What it does |
|---|---|
| `npm run dev` | Development mode (renderer served by Vite, DevTools available) |
| `npm start` | Builds, then runs the production bundle (`electron-vite preview`) |
| `npm run build` | Bundles main, preload and renderer into `out/` |
| `npm test` | Unit, component and integration tests (Jest) |
| `npm test -- --coverage` | Same, plus a coverage report in `coverage/lcov-report/index.html`. The run fails below 60 %. |
| `npm run test:e2e` | Builds, then drives the real app with Playwright (needs a display) |
| `npm run dev:web` | Serves the renderer alone at http://localhost:5173 for Chrome and the axe DevTools extension; data stays in the browser. Chrome keeps Ctrl+N for itself, so open New patient from the toolbar or Ctrl+K there. |
| `npm run test:axe` | With `dev:web` running: axe-core WCAG 2.1 A/AA scan of every screen and dialog, written to `docs/accessibility/axe/` |
| `npm run test:layout` | With `dev:web` running: reflow at 320 CSS px and WCAG text spacing, written to `docs/accessibility/layout/` |
| `npm run test:keyboard` | After `npm run build`: keyboard-only walkthrough of the desktop app, written to `docs/accessibility/keyboard/` |
| `npm run lint` | ESLint (typescript-eslint, react-hooks, jsx-a11y and process-boundary rules) |
| `npm run typecheck` | TypeScript, separately for the Node side and the web side |
| `npm run dist:win` | Windows NSIS installer, built on Windows |
| `npm run dist:win:docker` | The same installer, built from Linux/WSL in `electronuserland/builder:wine` |

> **Running from a VS Code extension terminal?** Some VS Code hosts export `ELECTRON_RUN_AS_NODE=1`, which makes Electron behave like plain Node. Unset it (`env -u ELECTRON_RUN_AS_NODE npm run dev`) if the window never appears. The packaged app ignores the variable entirely, because the `runAsNode` fuse is off.

## Project structure

```
careconnect-electron/
├── src/
│   ├── main/            Main process: window, window state, menus, tray, IPC handlers,
│   │                    workspace store, file import/export, notifications, Windows integration
│   ├── preload/         Sandboxed bridge: exposes window.careconnect (one method per IPC channel)
│   ├── renderer/        React app (sandboxed, no Node)
│   │   └── src/
│   │       ├── api/         ApiProvider (the bridge, or a test double)
│   │       ├── state/       Reducer, autosave provider, selectors, clock
│   │       ├── commands/    The single command dispatcher and its default handlers
│   │       ├── keyboard/    Shortcut matching, G-sequences, F6 regions
│   │       ├── a11y/        Live-region announcer
│   │       ├── components/  Shell (sidebar, header, status bar, skip links), Dialog, Toolbar, chips
│   │       ├── views/       Overview, Schedule, Patients, Inbox, Tasks, Reports, Resources
│   │       ├── dialogs/     Command palette, shortcuts, help, settings, patient forms, compose
│   │       └── styles/      Design tokens (with measured contrast ratios), base, layout
│   └── shared/          Pure TypeScript used by both processes: domain model, IPC contract,
│                        commands, the keyboard shortcut table, seed data, validation, formatting
├── tests/
│   ├── mocks/           In-memory Electron (routes ipcRenderer.invoke into ipcMain handlers)
│   ├── renderer/        Renderer test harness (in-memory API, fixed clock)
│   ├── integration/     IPC and window-management integration tests
│   └── e2e/             Playwright end-to-end tests against the built app
├── resources/           Runtime icons (window, tray, taskbar badge)
├── build/               Installer icon
├── scripts/             Icon generator, Docker Windows build
└── screens/             Earlier static HTML prototypes of the mobile screens (not packaged)
```

## Architecture

Electron's [process model](https://www.electronjs.org/docs/latest/tutorial/process-model) is followed strictly:

- The **main process** owns every operating-system capability: files, dialogs, menus, tray, notifications and window state.
- The **renderer** is a sandboxed React app with no Node.js. It reaches the main process only through `window.careconnect`, the typed API that the preload exposes with `contextBridge`.
- **Shared code** (the contract) holds no Electron or DOM code.
- ESLint `no-restricted-imports` rules enforce these boundaries, so an accidental `import fs` in the renderer fails the lint.

Every user action is a **command**: native menu items, tray items, Jump List tasks, notification clicks, the command palette, keyboard shortcuts and buttons all go through one dispatcher. The keyboard shortcut table in `src/shared/shortcuts.ts` drives the native menu accelerators, the renderer key handling and the in-app shortcuts reference, so they can't disagree.

Details, including the IPC contract table, are in [`docs/design.md`](docs/design.md).

## Security

The Electron [security checklist](https://www.electronjs.org/docs/latest/tutorial/security) is applied throughout.

| Checklist item | Implementation |
|---|---|
| Isolation | `contextIsolation`, `sandbox` and `app.enableSandbox()`; no `nodeIntegration`; no `<webview>` |
| Content Security Policy | Strict policy (`default-src 'none'; script-src 'self'; …`), delivered as `<meta>` and as a response header. No `unsafe-eval` in any mode. |
| Custom protocol | The renderer is served from `app://careconnect` instead of `file://`, with a path-traversal guard |
| Navigation | Navigation outside the app is blocked. `window.open` is denied. Only allow-listed `https` links open in the browser. |
| Permissions | Every web permission request is denied |
| IPC | Every handler checks that the sender's frame is the app's own origin, and validates its payload |
| Fuses | `runAsNode`, `NODE_OPTIONS`, `--inspect` and the extra `file://` privileges are off. The app loads only from `app.asar`. Cookie encryption is on. |

## Desktop features

- **Native menus:** File, Edit, View, Navigate, Patient, Communicate and Help.
  - Every menu has an `Alt` access key.
  - Items enable and disable with context; for example, Send is enabled only while a message is open.
- **Keyboard shortcuts:** every shortcut from the design is implemented. Press `Ctrl+/` in the app for the full reference.

  | Action | Keys |
  |---|---|
  | Command palette | `Ctrl+K` |
  | New patient | `Ctrl+N` |
  | Search current list | `Ctrl+F` or `/` |
  | Filter list | `Ctrl+Shift+L` |
  | Edit care summary | `E` |
  | Add clinical note | `N` |
  | Message patient | `M` |
  | Context menu | `Shift+F10` |
  | New message | `Ctrl+Shift+M` |
  | Reply | `R` |
  | Send | `Ctrl+Enter` |
  | Save draft | `Ctrl+S` |
  | Attach | `Ctrl+Shift+A` |
  | Go to Overview / Schedule / Patients / Inbox / Tasks | `G O` / `G S` / `G P` / `G I` / `G T` |
  | Next / previous region | `F6` / `Shift+F6` |
  | Help | `F1` |
  | Settings | `Ctrl+,` |

- **Window state:** size, position, maximized and full-screen state are remembered. A window saved on a monitor that is no longer connected is re-centred.
- **Files:**
  - The workspace autosaves to `%APPDATA%\CareConnect\careconnect-workspace.json`. Writes are atomic, and a damaged file is backed up before demo data is restored.
  - File → Export Patient Summary writes `.txt` or `.json`.
  - File → Import Patients reads JSON exports.
  - Attach Document uses the native file picker.
- **Windows integration:**
  - toast notifications for follow-ups due today
  - a taskbar badge with the unread count
  - Jump List tasks (New patient, Open inbox)
  - a system tray icon and menu
  - High Contrast support
  - a single running instance

## Accessibility

The app implements every card of the Assignment 7 desktop accessibility specification (WCAG 2.2 AA). The mapping is in [`docs/design.md` §9](docs/design.md).

- Skip links come first in the page.
- Named landmarks, and F6/Shift+F6 region cycling.
- Toolbars use a roving tabindex.
- Native menus and context menus.
- The focus ring is a 3 px teal ring between white halos, measured at 3.97:1.
- Status is always icon + word.
- Polite and assertive live regions; status messages persist until dismissed.
- Error summaries move focus and link to each field.
- The layout reflows down to 320 CSS px (400 % zoom) and survives WCAG text spacing.
- Single-key shortcuts (E, N, M, R, /, G-sequences) can be turned off in Settings → Keyboard, for speech-input users (WCAG 2.1.4).
- Windows High Contrast is followed through `forced-colors`, and there is also an in-app High contrast theme and a Reduce motion setting.
- jest-axe checks every view and dialog. axe-core also scans every screen in Chromium (`npm run test:axe`), so colour contrast is checked against real rendering.

The Week 9 testing is in [`docs/accessibility/`](docs/accessibility/README.md). It covers the axe results, the keyboard walkthrough, the reflow and text-spacing checks, NVDA notes and WCAG 2.1 AA conformance.

### Testing with assistive technology

| Tool | How to test |
|---|---|
| **NVDA** (Windows) | Start NVDA, then CareConnect. Use `F6` between regions, `NVDA+F7` for the landmarks and headings lists, and arrow keys in the patient list. Turn on the speech viewer to check exact announcements. |
| **Narrator** | `Win+Ctrl+Enter`. Scan mode (`Caps Lock+Space`) reads landmarks and headings. |
| **High Contrast** | Settings → Accessibility → Contrast themes, or `Left Alt+Left Shift+Print Screen`. |
| **Zoom** | View → Zoom In (`Ctrl+=`). Eight presses give 207 %, just over the 200 % that WCAG requires. Nothing should clip or need horizontal scrolling. |

A segment-by-segment recording script is in [`docs/accessibility-demo-script.md`](docs/accessibility-demo-script.md).

## Testing

| Layer | Where |
|---|---|
| Unit: shared logic, reducer, selectors, main-process modules | `src/**/__tests__` |
| Component: every view, dialog and shell component, with React Testing Library, user-event and jest-axe | `src/renderer/src/**/__tests__` |
| Integration: the real preload bridge → real IPC handlers → real store on disk; window creation and window-state persistence | `tests/integration` |
| End to end: the built app driven through Playwright | `tests/e2e` |

```bash
npm test -- --coverage
# open coverage/lcov-report/index.html
```

## Packaging (Windows)

```bash
npm run dist:win:docker     # from Linux/WSL (Docker)
npm run dist:win            # on Windows
```

Both produce `dist/CareConnect-Setup-1.0.0.exe`. The installer:
- is per-user
- lets you choose the install folder
- creates Start-menu and desktop shortcuts

The installer isn't code-signed, so Windows SmartScreen may warn on first run. Choose *More info → Run anyway*.

## Known issues and limitations

- No real authentication or backend. The signed-in user is the fixed demo coordinator "Jordan Lee, RN".
- Attachments record a file's name and size only; the file isn't copied.
- Clinic switching is shown disabled (with a reason), because the demo has one clinic.
- The installer is unsigned.
- `package-lock.json` isn't committed (the repository's root `.gitignore` excludes it), so installs resolve the newest versions within each semver range.

## AI usage

Claude Code was used to:
- design the architecture
- write the implementation plan
- implement the app in parallel slices, each followed by an adversarial review
- write the tests

Every slice was reviewed against the spec and verified by the same gates a human contributor would run: TypeScript, ESLint, Jest with coverage, the end-to-end suite, and the Windows installer build. Contrast ratios were computed rather than estimated. That is how the design's original focus-ring colour was found to fail its own 3:1 rule.
