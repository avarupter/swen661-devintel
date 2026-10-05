import { useEffect, useRef } from 'react'
import type { CommandId, ViewId } from '../../../shared/commands'
import {
  isPlainKey,
  matchesChord,
  menuOwnsChord,
  SHORTCUTS,
  type KeyEventLike,
  type KeyPlatform,
  type ShortcutDefinition,
  type ShortcutScope
} from '../../../shared/shortcuts'
import { useCommands } from '../commands/CommandProvider'
import { useAppDispatch, useAppState } from '../state/AppStateProvider'
import { isEditableTarget } from './editable'

/** How long the app waits for the second key of a G-sequence. */
export const SEQUENCE_TIMEOUT_MS = 1500

const SEQUENCE_STARTERS = new Set(SHORTCUTS.flatMap((shortcut) => (shortcut.sequence ? [shortcut.sequence[0]] : [])))

function chordsOf(shortcut: ShortcutDefinition) {
  return shortcut.chord ? [shortcut.chord, ...(shortcut.alternates ?? [])] : []
}

/**
 * The shortcut a key press triggers outside any modal, or undefined.
 * Printable single keys (E, N, M, R, /) are ignored while typing in a field.
 */
export function findGlobalShortcut(
  event: KeyEventLike,
  view: ViewId,
  platform: KeyPlatform,
  editable: boolean
): ShortcutDefinition | undefined {
  return SHORTCUTS.find((shortcut) => {
    if (!shortcut.command || shortcut.scope === 'system' || shortcut.scope === 'compose') return false
    if (shortcut.scope === 'patients' && view !== 'patients') return false
    if (shortcut.scope === 'inbox' && view !== 'inbox') return false
    return chordsOf(shortcut).some((chord) => {
      if (menuOwnsChord(chord, platform)) return false
      if (!matchesChord(event, chord, platform)) return false
      return !(editable && !chord.mod && !chord.alt && chord.key.length === 1)
    })
  })
}

/** The command a key press triggers inside a scoped layer such as the compose dialog. */
export function findScopedCommand(event: KeyEventLike, scope: ShortcutScope, platform: KeyPlatform): CommandId | undefined {
  const shortcut = SHORTCUTS.find(
    (entry) =>
      entry.scope === scope &&
      entry.command !== null &&
      chordsOf(entry).some((chord) => !menuOwnsChord(chord, platform) && matchesChord(event, chord, platform))
  )
  return shortcut?.command ?? undefined
}

/** The command for a completed G-sequence ("g" then "p"), or undefined. */
export function findSequenceCommand(first: string, second: string): CommandId | undefined {
  const shortcut = SHORTCUTS.find((entry) => entry.sequence?.[0] === first && entry.sequence?.[1] === second.toLowerCase())
  return shortcut?.command ?? undefined
}

/**
 * Window-level keyboard handling for the whole app: global chords, single-key
 * actions, G-sequences, and Alt to reveal shortcut hints. While a modal is open
 * the modal owns the keyboard, so nothing here fires.
 */
export function useKeyboardShortcuts(): void {
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const { run } = useCommands()
  const latest = useRef({ ui, run })
  useEffect(() => {
    latest.current = { ui, run }
  })

  useEffect(() => {
    let sequenceTimer: ReturnType<typeof setTimeout> | undefined

    const clearSequence = (): void => {
      clearTimeout(sequenceTimer)
      dispatch({ type: 'ui/setPendingSequence', key: null })
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const { ui: current, run: runCommand } = latest.current
      if (event.key === 'Alt') {
        if (!event.repeat && !current.modal) dispatch({ type: 'ui/setRevealHints', reveal: true })
        return
      }
      if (event.defaultPrevented || event.isComposing) return
      const modalOpen = current.modal !== null
      const editable = isEditableTarget(event.target)

      if (current.pendingSequence) {
        const first = current.pendingSequence
        clearSequence()
        if (!modalOpen && !editable && isPlainKey(event) && !event.shiftKey) {
          const command = findSequenceCommand(first, event.key)
          if (command) {
            event.preventDefault()
            runCommand({ id: command })
            return
          }
        }
      }

      if (modalOpen) return

      const shortcut = findGlobalShortcut(event, current.view, current.platform, editable)
      if (shortcut?.command) {
        event.preventDefault()
        runCommand({ id: shortcut.command })
        return
      }

      const key = event.key.toLowerCase()
      if (!editable && isPlainKey(event) && !event.shiftKey && SEQUENCE_STARTERS.has(key)) {
        event.preventDefault()
        dispatch({ type: 'ui/setPendingSequence', key })
        sequenceTimer = setTimeout(clearSequence, SEQUENCE_TIMEOUT_MS)
      }
    }

    const hideHints = (): void => dispatch({ type: 'ui/setRevealHints', reveal: false })
    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.key === 'Alt') hideHints()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', hideHints)
    return () => {
      clearTimeout(sequenceTimer)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', hideHints)
    }
  }, [dispatch])
}
