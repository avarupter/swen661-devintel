import type { ContextMenuItem } from '../../../shared/api'
import type { CommandId } from '../../../shared/commands'
import { COMMAND_LABELS } from '../../../shared/commands'
import type { Patient } from '../../../shared/model'
import { acceleratorForCommand } from '../../../shared/shortcuts'
import { LIMITS } from '../../../shared/validate'

function item(id: CommandId, label = COMMAND_LABELS[id]): ContextMenuItem {
  const accelerator = acceleratorForCommand(id)
  return { id, label, ...(accelerator ? { accelerator } : {}) }
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

/**
 * The native context menu for a patient (right-click, Shift+F10, the Menu key,
 * or the "More" button). Item ids are command ids, so the chosen item is run
 * through the same dispatcher as everything else.
 */
export function patientContextMenuItems(patient: Patient): ContextMenuItem[] {
  return fitMenuLabels([
    item('patient.message', `Message ${patient.name}…`),
    item('patient.editSummary', 'Edit care summary…'),
    item('patient.addNote', 'Add clinical note…'),
    { id: 'separator-status', label: '', type: 'separator' },
    { id: 'patient.markNeedsReview', label: 'Needs review', type: 'radio', checked: patient.status === 'needs-review' },
    { id: 'patient.markOpen', label: 'Open', type: 'radio', checked: patient.status === 'open' },
    { id: 'patient.markCompleted', label: 'Completed', type: 'radio', checked: patient.status === 'completed' },
    { id: 'separator-file', label: '', type: 'separator' },
    item('patient.copyCareId', `Copy Care ID (${patient.careId})`),
    item('patient.export', 'Export summary…')
  ])
}
