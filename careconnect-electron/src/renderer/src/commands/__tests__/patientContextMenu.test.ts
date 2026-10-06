import { FIXED_NOW } from '../../../../../tests/renderer/memoryApi'
import { isCommandId } from '../../../../shared/commands'
import type { Patient } from '../../../../shared/model'
import { createSeedWorkspace } from '../../../../shared/seed'
import { validateContextMenuRequest } from '../../../../shared/validate'
import { patientContextMenuItems } from '../patientContextMenu'

const avery: Patient = createSeedWorkspace(FIXED_NOW).patients[0]

describe('patientContextMenuItems', () => {
  it('lists the patient actions, a status radio group and the file actions, named for the patient', () => {
    expect(patientContextMenuItems(avery)).toEqual([
      { id: 'patient.message', label: 'Message Avery Park…', accelerator: 'M' },
      { id: 'patient.editSummary', label: 'Edit care summary…', accelerator: 'E' },
      { id: 'patient.addNote', label: 'Add clinical note…', accelerator: 'N' },
      { id: 'separator-status', label: '', type: 'separator' },
      { id: 'patient.markNeedsReview', label: 'Needs review', type: 'radio', checked: true },
      { id: 'patient.markOpen', label: 'Open', type: 'radio', checked: false },
      { id: 'patient.markCompleted', label: 'Completed', type: 'radio', checked: false },
      { id: 'separator-file', label: '', type: 'separator' },
      { id: 'patient.copyCareId', label: 'Copy Care ID (CC-1048)' },
      { id: 'patient.export', label: 'Export summary…', accelerator: 'CmdOrCtrl+Shift+E' }
    ])
  })

  it.each<Patient['status']>(['needs-review', 'open', 'completed'])('checks only the current status (%s)', (status) => {
    const checked = patientContextMenuItems({ ...avery, status }).filter((item) => item.checked)
    expect(checked).toHaveLength(1)
    expect(checked[0].id).toBe({ 'needs-review': 'patient.markNeedsReview', open: 'patient.markOpen', completed: 'patient.markCompleted' }[status])
  })

  it('uses command ids for every actionable item, so a choice runs through the dispatcher', () => {
    for (const item of patientContextMenuItems(avery)) {
      expect(item.type === 'separator' || isCommandId(item.id)).toBe(true)
    }
  })

  it('passes the main process’s IPC validation', () => {
    const items = patientContextMenuItems(avery)
    expect(validateContextMenuRequest({ items, x: 24, y: 300 }).items.map((item) => item.id)).toEqual(items.map((item) => item.id))
  })
})
