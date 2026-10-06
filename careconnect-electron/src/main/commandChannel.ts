/**
 * Delivers AppCommands from the menu, tray, Jump List, second instance and
 * notification clicks to the renderer (IPC `app:command`).
 *
 * A command can arrive before the renderer can act on it: a Jump List launch
 * carries one from the first instant, and React subscribes to commands only
 * after its first render, then loads the workspace. Commands are therefore
 * held until the renderer reports its UI state, which it first does once the
 * workspace has loaded, and held again whenever the page reloads.
 */
import type { WebContents } from 'electron'
import type { AppCommand } from '../shared/commands'
import { IPC } from '../shared/ipc'

export type CommandTarget = Pick<WebContents, 'send' | 'isDestroyed' | 'on'>

export interface CommandChannel {
  /** Targets a window's contents. Commands wait until that page reports it is ready. */
  attach(contents: CommandTarget): void
  /** Delivers now if the renderer is ready, otherwise holds the command until it is. */
  send(command: AppCommand): void
  /** The renderer has reported its UI state: deliver everything held. */
  markReady(): void
}

/** Commands are user actions; a long queue only means the renderer never loaded. */
export const MAX_PENDING_COMMANDS = 20

export function createCommandChannel(): CommandChannel {
  let target: CommandTarget | null = null
  let ready = false
  const pending: AppCommand[] = []

  function canDeliver(): boolean {
    return ready && target !== null && !target.isDestroyed()
  }

  function flush(): void {
    while (pending.length > 0 && canDeliver()) {
      target?.send(IPC.command, pending.shift())
    }
  }

  return {
    attach(contents) {
      target = contents
      ready = false
      contents.on('did-start-loading', () => {
        if (target === contents) ready = false
      })
    },
    send(command) {
      if (canDeliver()) {
        target?.send(IPC.command, command)
        return
      }
      pending.push(command)
      if (pending.length > MAX_PENDING_COMMANDS) pending.shift()
    },
    markReady() {
      ready = true
      flush()
    }
  }
}
