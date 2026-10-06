/**
 * Keeps the last edit. The renderer autosaves 600 ms after the last change
 * (design section 5), so closing the window within that time (Ctrl+W, Alt+F4,
 * Quit in the tray) would drop it. While the renderer reports unsaved changes,
 * a close waits for the autosave to finish, then goes ahead; if the save never
 * completes, the window closes anyway after a short wait.
 */
import type { BrowserWindow } from 'electron'

/** Long enough for the 600 ms autosave debounce plus the write; short enough not to feel stuck. */
export const CLOSE_WAIT_MS = 3000

export type GuardedWindow = Pick<BrowserWindow, 'on' | 'close' | 'isDestroyed'>

export interface UnsavedChangesGuard {
  /** Call with `unsavedChanges` from every renderer UI-state report. */
  update(unsavedChanges: number): void
}

export function guardUnsavedChanges(win: GuardedWindow, { timeoutMs = CLOSE_WAIT_MS }: { timeoutMs?: number } = {}): UnsavedChangesGuard {
  let unsaved = 0
  let waiting = false
  let allowClose = false
  let timer: ReturnType<typeof setTimeout> | null = null

  function closeNow(): void {
    if (timer !== null) clearTimeout(timer)
    timer = null
    waiting = false
    allowClose = true
    if (!win.isDestroyed()) win.close()
  }

  win.on('close', (event) => {
    if (allowClose || unsaved === 0) return
    event.preventDefault()
    if (waiting) return
    waiting = true
    timer = setTimeout(closeNow, timeoutMs)
  })

  return {
    update(unsavedChanges) {
      unsaved = unsavedChanges
      if (waiting && unsaved === 0) closeNow()
    }
  }
}
