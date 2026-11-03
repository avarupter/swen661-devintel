# Final week: team docs and evidence

These docs were written against commit e79a08c, before the final-week fixes. Line numbers, and some button names, will change as the fixes land; each doc says which commit it describes.

| Doc | For |
|---|---|
| [wave-checklist.md](wave-checklist.md) | Running WAVE on every page and state of the web app, and where to save the results |
| [screen-reader-procedure.md](screen-reader-procedure.md) | NVDA (Windows) and VoiceOver (macOS) test scripts for the web app, with a results template |
| [presentation-a11y-demo.md](presentation-a11y-demo.md) | The accessibility demo in the final presentation: running order, pre-flight, backup plan |

## Evidence

| App | Before the fixes | After the fixes |
|---|---|---|
| Web (`careconnect-web`) | [careconnect-web/docs/final-a11y/before/](../../careconnect-web/docs/final-a11y/before/) (axe, Lighthouse, 42 issue screenshots) | `careconnect-web/docs/final-a11y/after/`, coming |
| Mobile, Flutter (`careconnect_mobile`) | [careconnect_mobile/docs/final-a11y/before/](../../careconnect_mobile/docs/final-a11y/before/) (10 screenshots) | `careconnect_mobile/docs/final-a11y/after/`, coming |
| Mobile, React Native (`careconnect-rn`) | n/a (no headless renderer for screenshots) | coming |
| Desktop (`careconnect-electron`) | [careconnect-electron/docs/accessibility/](../../careconnect-electron/docs/accessibility/) (Week 9 audit) | final retest, coming |

The mobile demo is Android only; the team didn't build for iOS.
