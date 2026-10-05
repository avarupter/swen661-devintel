/**
 * Every user action is a command. The native menu, the tray, Windows Jump
 * List tasks, notification clicks, the command palette, keyboard shortcuts
 * and on-screen buttons all dispatch these ids, so they can never disagree
 * about what an action does.
 */

export type ViewId = 'overview' | 'schedule' | 'patients' | 'inbox' | 'tasks' | 'reports' | 'resources'

export const VIEW_IDS: readonly ViewId[] = ['overview', 'schedule', 'patients', 'inbox', 'tasks', 'reports', 'resources']

export const VIEW_LABELS: Record<ViewId, string> = {
  overview: 'Overview',
  schedule: 'Schedule',
  patients: 'Patients',
  inbox: 'Inbox',
  tasks: 'Tasks',
  reports: 'Reports',
  resources: 'Resources'
}

export const COMMAND_IDS = [
  'navigate.overview',
  'navigate.schedule',
  'navigate.patients',
  'navigate.inbox',
  'navigate.tasks',
  'navigate.reports',
  'navigate.resources',
  'region.next',
  'region.previous',
  'patient.new',
  'patient.search',
  'patient.filter',
  'patient.sort',
  'patient.open',
  'patient.editSummary',
  'patient.addNote',
  'patient.message',
  'patient.contextMenu',
  'patient.export',
  'patient.import',
  'patient.copyCareId',
  'patient.markCompleted',
  'patient.markNeedsReview',
  'patient.markOpen',
  'message.new',
  'message.reply',
  'message.send',
  'message.saveDraft',
  'message.attach',
  'app.commandPalette',
  'app.shortcuts',
  'app.help',
  'app.settings',
  'view.toggleShortcutHints',
  'view.toggleHighContrast',
  'view.toggleReduceMotion'
] as const

export type CommandId = (typeof COMMAND_IDS)[number]

/** A command plus its optional subject. `patientId` is used by `patient.open`. */
export interface AppCommand {
  id: CommandId
  patientId?: string
}

const COMMAND_ID_SET: ReadonlySet<string> = new Set(COMMAND_IDS)

export function isCommandId(value: unknown): value is CommandId {
  return typeof value === 'string' && COMMAND_ID_SET.has(value)
}

export function navigateCommand(view: ViewId): CommandId {
  return `navigate.${view}` as CommandId
}

/** The view a `navigate.*` command opens, or null for any other command. */
export function viewForCommand(id: CommandId): ViewId | null {
  if (!id.startsWith('navigate.')) return null
  return id.slice('navigate.'.length) as ViewId
}

/** Human-readable names, used by the command palette and native menus. */
export const COMMAND_LABELS: Record<CommandId, string> = {
  'navigate.overview': 'Open Overview',
  'navigate.schedule': 'Open Schedule',
  'navigate.patients': 'Open Patients',
  'navigate.inbox': 'Open Inbox',
  'navigate.tasks': 'Open Tasks',
  'navigate.reports': 'Open Reports',
  'navigate.resources': 'Open Resources',
  'region.next': 'Next workspace region',
  'region.previous': 'Previous workspace region',
  'patient.new': 'Create new patient record',
  'patient.search': 'Search current list',
  'patient.filter': 'Filter patient list',
  'patient.sort': 'Sort patient list',
  'patient.open': 'Open patient',
  'patient.editSummary': 'Edit care summary',
  'patient.addNote': 'Add clinical note',
  'patient.message': 'Message patient',
  'patient.contextMenu': 'Open context menu',
  'patient.export': 'Export patient summary',
  'patient.import': 'Import patients',
  'patient.copyCareId': 'Copy Care ID',
  'patient.markCompleted': 'Mark as completed',
  'patient.markNeedsReview': 'Mark as needs review',
  'patient.markOpen': 'Mark as open',
  'message.new': 'New message',
  'message.reply': 'Reply',
  'message.send': 'Send message',
  'message.saveDraft': 'Save draft',
  'message.attach': 'Attach document',
  'app.commandPalette': 'Open command palette',
  'app.shortcuts': 'Open keyboard shortcuts',
  'app.help': 'CareConnect help center',
  'app.settings': 'Open settings',
  'view.toggleShortcutHints': 'Show or hide shortcut hints',
  'view.toggleHighContrast': 'Turn high contrast theme on or off',
  'view.toggleReduceMotion': 'Turn reduce motion on or off'
}
