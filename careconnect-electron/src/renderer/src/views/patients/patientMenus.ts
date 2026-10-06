/**
 * Pure helpers for the Patients view: option naming, result counts, the
 * filter and sort radio menus, and where a native menu should open.
 */
import type { ContextMenuItem, ContextMenuRequest } from '../../../../shared/api'
import { pluralize, STATUS_LABELS } from '../../../../shared/format'
import type { Patient } from '../../../../shared/model'
import { LIMITS } from '../../../../shared/validate'
import type { SortOrder, StatusFilter } from '../../state/appState'
import { patientSecondaryText } from '../../state/selectors'

export interface MenuOption<T extends string> {
  id: T
  label: string
}

export const FILTER_OPTIONS: readonly MenuOption<StatusFilter>[] = [
  { id: 'all', label: 'All patients' },
  { id: 'needs-review', label: 'Needs review' },
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' }
]

export const SORT_OPTIONS: readonly MenuOption<SortOrder>[] = [
  { id: 'recent', label: 'Recent activity' },
  { id: 'name', label: 'Name' },
  { id: 'nextVisit', label: 'Next visit' },
  { id: 'status', label: 'Status' }
]

/** Radio items for a native menu, with the current choice checked. */
export function radioItems<T extends string>(options: readonly MenuOption<T>[], current: T): ContextMenuItem[] {
  return options.map((option) => ({ id: option.id, label: option.label, type: 'radio', checked: option.id === current }))
}

/**
 * The main process rejects a menu whose labels are longer than LIMITS.shortText
 * characters, but a patient's name or Care ID can reach that limit on its own
 * ("Message <name>…"). Long labels are cut to the limit and end in "…", so the
 * menu still opens; ids, and so the commands, are unchanged. Items that already
 * fit are returned as they are.
 */
export function fitMenuLabels(items: readonly ContextMenuItem[], max: number = LIMITS.shortText): ContextMenuItem[] {
  return items.map((item) => {
    if (item.label.length <= max) return item
    let head = item.label.slice(0, max - 1)
    // Never end on the first half of a surrogate pair (an emoji, for example).
    if (/[\uD800-\uDBFF]$/.test(head)) head = head.slice(0, -1)
    return { ...item, label: `${head.trimEnd()}…` }
  })
}

/** The option whose id a native menu returned, or undefined when it was dismissed. */
export function chosenOption<T extends string>(options: readonly MenuOption<T>[], choice: string | null): MenuOption<T> | undefined {
  return options.find((option) => option.id === choice)
}

/** "28 results", "1 result", "No results". */
export function resultCountLabel(count: number): string {
  return count === 0 ? 'No results' : pluralize(count, 'result')
}

/** "Showing Needs review patients, 8 results" / "Showing all patients, 28 results". */
export function filterAnnouncement(filter: StatusFilter, count: number): string {
  const which = filter === 'all' ? 'all' : STATUS_LABELS[filter]
  return `Showing ${which} patients, ${pluralize(count, 'result')}`
}

/** "Sorted by name" */
export function sortAnnouncement(sortOrder: SortOrder): string {
  const option = SORT_OPTIONS.find((entry) => entry.id === sortOrder)
  return `Sorted by ${(option?.label ?? sortOrder).toLowerCase()}`
}

export function patientOptionId(patientId: string): string {
  return `patient-option-${patientId}`
}

/**
 * The listbox option's accessible name (spec card 05). The listbox adds
 * "selected" and "1 of 28", giving "Avery Park, Wellness follow-up · 10:30.
 * Needs review" plus position and state.
 */
export function patientOptionName(patient: Patient, now: Date): string {
  return `${patient.name}, ${patientSecondaryText(patient, now)}. ${STATUS_LABELS[patient.status]}`
}

export type MenuPosition = Pick<ContextMenuRequest, 'x' | 'y'>

function coordinate(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

/**
 * Where a native menu opens. A right-click carries the pointer position; a
 * keyboard request (Shift+F10, the Menu key, a button) arrives at 0,0, so the
 * menu opens below the element's left edge instead. The main process rejects
 * negative or fractional coordinates, so both are rounded and clamped.
 */
export function menuPosition(element: Element | null, pointer?: { clientX: number; clientY: number }): MenuPosition {
  if (pointer && (pointer.clientX !== 0 || pointer.clientY !== 0)) {
    return { x: coordinate(pointer.clientX), y: coordinate(pointer.clientY) }
  }
  if (!element) return {}
  const rect = element.getBoundingClientRect()
  return { x: coordinate(rect.left), y: coordinate(rect.bottom) }
}
