/**
 * The command palette's catalog and matching rules, kept free of React so
 * they can be tested directly.
 *
 * `buildPaletteItems` returns every item that makes sense in the current
 * context: the browse groups shown for an empty query (Suggested commands,
 * Recent destinations, Global commands) and the searchable groups (Commands,
 * Patients, Destinations). `filterPaletteItems` picks what to show for a
 * query. Every item runs an ordinary AppCommand, so the palette can never
 * disagree with the menu, the keyboard or the buttons.
 */
import { COMMAND_LABELS, navigateCommand, VIEW_IDS, type AppCommand, type CommandId, type ViewId } from '../../../../shared/commands'
import { formatTimeAgo, pluralize, STATUS_LABELS } from '../../../../shared/format'
import type { Patient, PatientStatus, Workspace } from '../../../../shared/model'
import { shortcutForCommand, shortcutKeys, type KeyPlatform, type ShortcutScope } from '../../../../shared/shortcuts'
import type { IconName } from '../../components/Icon'
import type { AppState, SortOrder, StatusFilter } from '../../state/appState'
import { conversationById, patientById, tasksDueToday, unreadCount } from '../../state/selectors'

export type PaletteGroup = 'suggested' | 'recent' | 'global' | 'commands' | 'patients' | 'destinations'

export interface PaletteItem {
  /** Unique within one catalog; also the basis of the option's DOM id. */
  id: string
  group: PaletteGroup
  title: string
  subtitle?: string
  icon: IconName
  command: AppCommand
  /** Keycaps for the item's shortcut, when that shortcut works in the current view. */
  keys?: string[]
  /** Extra search terms that are never shown ("hotkeys", "json"). */
  keywords?: string[]
}

/** Display order for an empty query, and the default order of the search groups. */
export const PALETTE_GROUPS: readonly { id: PaletteGroup; title: string }[] = [
  { id: 'suggested', title: 'Suggested commands' },
  { id: 'recent', title: 'Recent destinations' },
  { id: 'global', title: 'Global commands' },
  { id: 'commands', title: 'Commands' },
  { id: 'patients', title: 'Patients' },
  { id: 'destinations', title: 'Destinations' }
]

/** No group ever shows more results than this. */
export const PALETTE_GROUP_LIMIT = 8

const BROWSE_GROUPS: readonly PaletteGroup[] = ['suggested', 'recent', 'global']
const SEARCH_GROUPS: readonly PaletteGroup[] = ['commands', 'patients', 'destinations']

const SORT_LABELS: Record<SortOrder, string> = {
  recent: 'recent activity',
  name: 'name',
  nextVisit: 'next visit',
  status: 'status'
}

function filterLabel(filter: StatusFilter): string {
  return filter === 'all' ? 'Showing all patients' : `Showing ${STATUS_LABELS[filter]}`
}

interface CatalogContext {
  state: AppState
  workspace: Workspace
  now: Date
  /** The selected patient, for patient-scoped commands. */
  patient: Patient | null
}

interface CommandEntry {
  id: CommandId
  icon: IconName
  subtitle?: string | ((ctx: CatalogContext) => string)
  keywords: string[]
  /** Acts on the selected patient, so it is offered only while one is selected. */
  patientScoped?: boolean
  /** Extra condition for the command to be offered. */
  available?: (ctx: CatalogContext) => boolean
}

function patientLine(ctx: CatalogContext): string {
  return ctx.patient ? `${ctx.patient.name} · ${ctx.patient.careId}` : ''
}

function notAlready(status: PatientStatus): (ctx: CatalogContext) => boolean {
  return (ctx) => ctx.patient?.status !== status
}

/**
 * The searchable commands, in their default order. Deliberately absent:
 * navigation (listed once, under Destinations), Open patient (the Patients
 * group), the command palette itself, F6 region moves and the context menu
 * (they act on where focus was, which a dialog has taken), and Send, Save
 * draft and Attach (they belong to the open compose dialog).
 */
const COMMAND_CATALOG: readonly CommandEntry[] = [
  { id: 'patient.new', icon: 'userPlus', subtitle: 'Opens a blank synthetic record form', keywords: ['add', 'create', 'register', 'record'] },
  { id: 'patient.search', icon: 'search', subtitle: 'Find a patient by name, Care ID or reason', keywords: ['find', 'directory', 'lookup'] },
  {
    id: 'patient.filter',
    icon: 'sliders',
    subtitle: (ctx) => filterLabel(ctx.state.ui.statusFilter),
    keywords: ['status', 'needs review', 'completed', 'show only'],
    available: (ctx) => ctx.state.ui.view === 'patients'
  },
  {
    id: 'patient.sort',
    icon: 'sort',
    subtitle: (ctx) => `Sorted by ${SORT_LABELS[ctx.state.ui.sortOrder]}`,
    keywords: ['order', 'arrange', 'next visit'],
    available: (ctx) => ctx.state.ui.view === 'patients'
  },
  { id: 'patient.editSummary', icon: 'edit', subtitle: patientLine, keywords: ['care plan', 'plan', 'alert', 'update'], patientScoped: true },
  { id: 'patient.addNote', icon: 'file', subtitle: patientLine, keywords: ['note', 'visit note', 'document', 'chart'], patientScoped: true },
  { id: 'patient.message', icon: 'message', subtitle: patientLine, keywords: ['contact', 'portal', 'email', 'write'], patientScoped: true },
  {
    id: 'patient.markNeedsReview',
    icon: 'alert',
    subtitle: patientLine,
    keywords: ['status', 'flag'],
    patientScoped: true,
    available: notAlready('needs-review')
  },
  { id: 'patient.markOpen', icon: 'info', subtitle: patientLine, keywords: ['status', 'reopen'], patientScoped: true, available: notAlready('open') },
  {
    id: 'patient.markCompleted',
    icon: 'checkCircle',
    subtitle: patientLine,
    keywords: ['status', 'complete', 'done', 'close'],
    patientScoped: true,
    available: notAlready('completed')
  },
  { id: 'patient.copyCareId', icon: 'clipboard', subtitle: patientLine, keywords: ['clipboard', 'identifier'], patientScoped: true },
  { id: 'patient.export', icon: 'file', subtitle: patientLine, keywords: ['download', 'save', 'txt', 'json', 'file'], patientScoped: true },
  { id: 'patient.import', icon: 'file', subtitle: 'Add synthetic patients from a JSON file', keywords: ['upload', 'load', 'file'] },
  { id: 'message.new', icon: 'message', subtitle: 'Compose a secure message', keywords: ['compose', 'write', 'email', 'send'] },
  {
    id: 'message.reply',
    icon: 'reply',
    subtitle: (ctx) => {
      const conversation = conversationById(ctx.workspace, ctx.state.ui.selectedConversationId)
      return conversation ? `${conversation.subject} · ${conversation.with}` : ''
    },
    keywords: ['respond', 'answer'],
    available: (ctx) => ctx.state.ui.view === 'inbox' && conversationById(ctx.workspace, ctx.state.ui.selectedConversationId) !== null
  },
  { id: 'app.shortcuts', icon: 'keyboard', subtitle: 'Every shortcut for Windows, Linux and macOS', keywords: ['keys', 'hotkeys', 'reference'] },
  {
    id: 'app.help',
    icon: 'help',
    subtitle: 'Getting around, screen readers and status messages',
    keywords: ['support', 'guide', 'screen reader', 'nvda', 'narrator', 'accessibility']
  },
  { id: 'app.settings', icon: 'settings', subtitle: 'Display and notification preferences', keywords: ['preferences', 'options', 'notifications'] },
  {
    id: 'view.toggleShortcutHints',
    icon: 'keyboard',
    subtitle: (ctx) => (ctx.workspace.preferences.showShortcutHints ? 'Shortcut hints are shown' : 'Shortcut hints are hidden'),
    keywords: ['access keys', 'labels']
  },
  {
    id: 'view.toggleHighContrast',
    icon: 'settings',
    subtitle: (ctx) => (ctx.workspace.preferences.highContrast ? 'High contrast theme is on' : 'High contrast theme is off'),
    keywords: ['theme', 'colour', 'color', 'accessibility']
  },
  {
    id: 'view.toggleReduceMotion',
    icon: 'activity',
    subtitle: (ctx) => (ctx.workspace.preferences.reduceMotion ? 'Reduce motion is on' : 'Reduce motion is off'),
    keywords: ['animation', 'transitions', 'accessibility']
  }
]

interface DestinationEntry {
  icon: IconName
  subtitle: (ctx: CatalogContext) => string
  keywords: string[]
}

const DESTINATIONS: Record<ViewId, DestinationEntry> = {
  overview: { icon: 'grid', subtitle: () => 'Today’s counts and visits', keywords: ['home', 'dashboard', 'today'] },
  schedule: { icon: 'calendar', subtitle: () => 'Visits for the next 7 days', keywords: ['calendar', 'appointments', 'agenda'] },
  patients: { icon: 'users', subtitle: () => 'Navigate to patient workspace', keywords: ['patient list', 'records', 'directory'] },
  inbox: {
    icon: 'inbox',
    subtitle: (ctx) => pluralize(unreadCount(ctx.workspace.conversations), 'unread conversation'),
    keywords: ['messages', 'conversations', 'triage']
  },
  tasks: {
    icon: 'clipboard',
    subtitle: (ctx) => `${pluralize(tasksDueToday(ctx.workspace.tasks, ctx.now).length, 'task')} due today`,
    keywords: ['to do', 'checklist', 'due']
  },
  reports: { icon: 'chart', subtitle: () => 'Status, visit and reason breakdowns', keywords: ['statistics', 'tables', 'counts'] },
  resources: { icon: 'book', subtitle: () => 'Accessibility and clinical reference links', keywords: ['links', 'reference', 'guides', 'wcag'] }
}

/** Whether a shortcut with this scope works in `view` (so its keycaps are worth showing). */
function shortcutWorksIn(scope: ShortcutScope, view: ViewId): boolean {
  return scope === 'global' || (scope === 'patients' && view === 'patients') || (scope === 'inbox' && view === 'inbox')
}

export function buildPaletteItems(state: AppState, now: Date, platform: KeyPlatform): PaletteItem[] {
  const { workspace, ui } = state
  if (!workspace) return []
  const ctx: CatalogContext = { state, workspace, now, patient: patientById(workspace, ui.selectedPatientId) }

  const keysFor = (id: CommandId): string[] | undefined => {
    const shortcut = shortcutForCommand(id)
    if (!shortcut || !shortcutWorksIn(shortcut.scope, ui.view)) return undefined
    const keys = shortcutKeys(shortcut, platform)
    return keys.length > 0 ? keys : undefined
  }

  const item = (
    group: PaletteGroup,
    key: string,
    fields: Omit<PaletteItem, 'id' | 'group' | 'keys'>,
    keys?: string[]
  ): PaletteItem => ({ id: `${group}:${key}`, group, ...fields, ...(keys ? { keys } : {}) })

  const suggested: PaletteItem[] = [
    item('suggested', 'navigate.patients', { title: 'Open Patients', subtitle: 'Navigate to patient workspace', icon: 'users', command: { id: 'navigate.patients' } }, keysFor('navigate.patients')),
    item('suggested', 'patient.new', { title: 'Create new patient record', subtitle: 'Opens a blank synthetic record form', icon: 'userPlus', command: { id: 'patient.new' } }, keysFor('patient.new')),
    item('suggested', 'patient.search', { title: 'Search patient directory', subtitle: 'Search across assigned care teams', icon: 'search', command: { id: 'patient.search' } }, keysFor('patient.search'))
  ]

  const recent: PaletteItem[] = []
  for (const entry of ui.recentPatients) {
    const patient = patientById(workspace, entry.patientId)
    if (!patient) continue
    recent.push(
      item('recent', patient.id, {
        title: `${patient.name} — Care summary`,
        subtitle: `Recent · ${formatTimeAgo(entry.at, now)}`,
        icon: 'file',
        command: { id: 'patient.open', patientId: patient.id }
      })
    )
  }
  recent.push(
    item(
      'recent',
      'inbox',
      { title: 'Team Inbox — Triage', subtitle: pluralize(unreadCount(workspace.conversations), 'unread conversation'), icon: 'inbox', command: { id: 'navigate.inbox' } },
      keysFor('navigate.inbox')
    )
  )

  const global: PaletteItem[] = [
    item('global', 'app.shortcuts', { title: 'Open keyboard shortcuts', icon: 'keyboard', command: { id: 'app.shortcuts' } }, keysFor('app.shortcuts')),
    item('global', 'app.help', { title: 'CareConnect help center', icon: 'help', command: { id: 'app.help' } }, keysFor('app.help'))
  ]

  const commands: PaletteItem[] = COMMAND_CATALOG.filter(
    (entry) => (!entry.patientScoped || ctx.patient !== null) && (entry.available?.(ctx) ?? true)
  ).map((entry) => {
    const subtitle = typeof entry.subtitle === 'function' ? entry.subtitle(ctx) : entry.subtitle
    return item(
      'commands',
      entry.id,
      {
        title: COMMAND_LABELS[entry.id],
        ...(subtitle ? { subtitle } : {}),
        icon: entry.icon,
        command: { id: entry.id },
        keywords: entry.keywords
      },
      keysFor(entry.id)
    )
  })

  const patients: PaletteItem[] = [...workspace.patients]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((patient) =>
      item('patients', patient.id, {
        title: patient.name,
        subtitle: `${patient.careId} · ${patient.reason} · ${STATUS_LABELS[patient.status]}`,
        icon: 'users',
        command: { id: 'patient.open', patientId: patient.id },
        keywords: [patient.careId]
      })
    )

  const destinations: PaletteItem[] = VIEW_IDS.map((view) => {
    const id = navigateCommand(view)
    const entry = DESTINATIONS[view]
    return item(
      'destinations',
      id,
      { title: COMMAND_LABELS[id], subtitle: entry.subtitle(ctx), icon: entry.icon, command: { id }, keywords: entry.keywords },
      keysFor(id)
    )
  })

  return [...suggested, ...recent, ...global, ...commands, ...patients, ...destinations]
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * How well an item matches: 4 title starts with the query, 3 a title word
 * does, 2 the title contains it, 1 every word of the query appears somewhere
 * in the title, subtitle or keywords, 0 no match. Patients match on name and
 * Care ID only, so "review" does not list every patient who needs review.
 */
function matchScore(item: PaletteItem, needle: string): number {
  const title = normalize(item.title)
  if (title.startsWith(needle)) return 4
  if (` ${title}`.includes(` ${needle}`)) return 3
  if (title.includes(needle)) return 2
  const fields = item.group === 'patients' ? [item.title] : [item.title, item.subtitle ?? '']
  const haystack = normalize([...fields, ...(item.keywords ?? [])].join(' '))
  return needle.split(' ').every((word) => haystack.includes(word)) ? 1 : 0
}

/**
 * The items to show for `query`. An empty query shows the browse groups. A
 * query shows matching commands, patients and destinations, best match
 * first within each group, with the group holding the best match first.
 * No group shows more than PALETTE_GROUP_LIMIT results.
 */
export function filterPaletteItems(items: readonly PaletteItem[], query: string): PaletteItem[] {
  const needle = normalize(query)
  if (!needle) {
    return BROWSE_GROUPS.flatMap((group) => items.filter((item) => item.group === group).slice(0, PALETTE_GROUP_LIMIT))
  }
  const ranked = SEARCH_GROUPS.map((group, order) => {
    const matches = items
      .filter((item) => item.group === group)
      .map((item) => ({ item, score: matchScore(item, needle) }))
      .filter((entry) => entry.score > 0)
      // Array.prototype.sort is stable, so equal scores keep catalog order.
      .sort((a, b) => b.score - a.score)
      .slice(0, PALETTE_GROUP_LIMIT)
    return { order, best: matches[0]?.score ?? 0, items: matches.map((entry) => entry.item) }
  })
  return ranked
    .filter((group) => group.items.length > 0)
    .sort((a, b) => b.best - a.best || a.order - b.order)
    .flatMap((group) => group.items)
}

export interface PaletteSection {
  id: PaletteGroup
  title: string
  /** Each item with its position in the whole result list (for aria-posinset and the active option). */
  items: { item: PaletteItem; index: number }[]
}

/** Splits a result list into its consecutive groups, for rendering under visible headings. */
export function groupPaletteItems(results: readonly PaletteItem[]): PaletteSection[] {
  const sections: PaletteSection[] = []
  results.forEach((item, index) => {
    const last = sections[sections.length - 1]
    if (last && last.id === item.group) {
      last.items.push({ item, index })
      return
    }
    const title = PALETTE_GROUPS.find((group) => group.id === item.group)?.title ?? item.group
    sections.push({ id: item.group, title, items: [{ item, index }] })
  })
  return sections
}
