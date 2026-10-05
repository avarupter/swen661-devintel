import type { ContextMenuItem } from '../../../shared/api'
import type { CommandId } from '../../../shared/commands'
import { COMMAND_LABELS } from '../../../shared/commands'
import type { Patient } from '../../../shared/model'
import { acceleratorForCommand } from '../../../shared/shortcuts'

function item(id: CommandId, label = COMMAND_LABELS[id]): ContextMenuItem {
  const accelerator = acceleratorForCommand(id)
  return { id, label, ...(accelerator ? { accelerator } : {}) }
}

/**
 * The native context menu for a patient (right-click, Shift+F10, the Menu key,
 * or the "More" button). Item ids are command ids, so the chosen item is run
 * through the same dispatcher as everything else.
 */
export function patientContextMenuItems(patient: Patient): ContextMenuItem[] {
  return [
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
  ]
}
