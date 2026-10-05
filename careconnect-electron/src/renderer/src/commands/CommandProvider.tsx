import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { AppCommand, CommandId } from '../../../shared/commands'
import { useApi } from '../api/ApiContext'
import { moveToRegion, rememberFocus, type RegionMemory } from '../keyboard/regions'
import type { Modal } from '../state/appState'
import { useAppDispatch, useAppState, useStatus } from '../state/AppStateProvider'
import { useClock } from '../state/clock'
import { describeFailure, runDefaultCommand, type CommandContext } from './defaultCommands'

export type CommandHandler = (command: AppCommand) => void | Promise<void>

interface CommandsValue {
  /** Runs a command through the most recently registered handler, or the default. */
  run(command: AppCommand | CommandId): void
  /** Opens a modal and remembers which control to return focus to when it closes. */
  openModal(modal: Modal): void
  register(id: CommandId, handler: CommandHandler): () => void
  setSearchTarget(element: HTMLElement | null): void
  /** Called by the modal host when the last modal closes. */
  restoreFocusAfterModal(): void
}

const CommandsContext = createContext<CommandsValue | null>(null)

/**
 * The single dispatcher for commands from every source: buttons, keyboard
 * shortcuts, the command palette, and (via the preload) the native menu, tray,
 * Jump List and notification clicks.
 */
export function CommandProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const api = useApi()
  const clock = useClock()
  const setStatus = useStatus()

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const handlers = useRef(new Map<CommandId, CommandHandler[]>())
  const searchTarget = useRef<HTMLElement | null>(null)
  const modalOpener = useRef<HTMLElement | null>(null)
  const regionMemory = useRef<RegionMemory>(new Map())

  useEffect(() => {
    const onFocusIn = (event: FocusEvent): void => rememberFocus(regionMemory.current, event.target as Element | null)
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [])

  const value = useMemo<CommandsValue>(() => {
    const openModal = (modal: Modal): void => {
      if (!stateRef.current.ui.modal) {
        const active = document.activeElement
        modalOpener.current = active instanceof HTMLElement && active !== document.body ? active : null
      }
      dispatch({ type: 'ui/openModal', modal })
    }

    const run = (input: AppCommand | CommandId): void => {
      const command: AppCommand = typeof input === 'string' ? { id: input } : input
      const stack = handlers.current.get(command.id)
      const handler = stack?.[stack.length - 1]
      try {
        const result = handler ? handler(command) : runDefaultCommand(command, context)
        void Promise.resolve(result).catch((error: unknown) => setStatus(`Something went wrong: ${describeFailure(error)}`, 'error'))
      } catch (error) {
        setStatus(`Something went wrong: ${describeFailure(error)}`, 'error')
      }
    }

    const context: CommandContext = {
      getState: () => stateRef.current,
      dispatch,
      api,
      now: clock,
      setStatus,
      openModal,
      focusAfterRender: (id) => {
        setTimeout(() => document.getElementById(id)?.focus(), 0)
      },
      focusSearch: () => {
        const element = searchTarget.current
        if (!element || !element.isConnected) return false
        element.focus()
        if (element instanceof HTMLInputElement) element.select()
        return true
      },
      moveRegion: (direction) => {
        moveToRegion(direction, regionMemory.current)
      },
      run
    }

    return {
      run,
      openModal,
      register: (id, handler) => {
        const stack = handlers.current.get(id) ?? []
        stack.push(handler)
        handlers.current.set(id, stack)
        return () => {
          const current = handlers.current.get(id)
          const index = current ? current.lastIndexOf(handler) : -1
          if (current && index >= 0) current.splice(index, 1)
        }
      },
      setSearchTarget: (element) => {
        searchTarget.current = element
      },
      restoreFocusAfterModal: () => {
        const opener = modalOpener.current
        modalOpener.current = null
        if (opener && opener.isConnected && !opener.closest('[inert]')) opener.focus()
        else document.getElementById('view-title')?.focus()
      }
    }
  }, [api, clock, dispatch, setStatus])

  // Commands from the main process: menu clicks, tray, Jump List, notifications.
  useEffect(() => api.onCommand((command) => value.run(command)), [api, value])

  return <CommandsContext.Provider value={value}>{children}</CommandsContext.Provider>
}

export function useCommands(): CommandsValue {
  const value = useContext(CommandsContext)
  if (!value) throw new Error('useCommands() must be called inside <CommandProvider>')
  return value
}

/**
 * Handles `id` while the calling component is mounted (and `enabled`), taking
 * precedence over the default. Views use this for context-specific behaviour:
 * the Inbox handles Reply, the compose dialog handles Send.
 */
export function useCommandHandler(id: CommandId, handler: CommandHandler, enabled = true): void {
  const { register } = useCommands()
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })
  useEffect(() => {
    if (!enabled) return
    return register(id, (command) => handlerRef.current(command))
  }, [id, enabled, register])
}

/** Ref callback that makes an input the target of "Search current list" (Ctrl+F, /). */
export function useSearchTarget(): (element: HTMLElement | null) => void {
  const { setSearchTarget } = useCommands()
  return useCallback(
    (element: HTMLElement | null) => {
      if (element) setSearchTarget(element)
    },
    [setSearchTarget]
  )
}
