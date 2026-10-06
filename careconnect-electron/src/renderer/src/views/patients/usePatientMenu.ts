import { useCallback } from 'react'
import { isCommandId } from '../../../../shared/commands'
import type { Patient } from '../../../../shared/model'
import { useApi } from '../../api/ApiContext'
import { useCommands } from '../../commands/CommandProvider'
import { describeFailure } from '../../commands/defaultCommands'
import { patientContextMenuItems } from '../../commands/patientContextMenu'
import { useStatus } from '../../state/AppStateProvider'
import { fitMenuLabels, type MenuPosition } from './patientMenus'

/**
 * Shows a patient's native context menu and runs the chosen command for that
 * patient. Item ids are command ids, so the choice goes through the same
 * dispatcher as the menu bar, the palette and the keyboard.
 */
export function usePatientMenu(): (patient: Patient, position: MenuPosition) => Promise<void> {
  const api = useApi()
  const { run } = useCommands()
  const setStatus = useStatus()
  return useCallback(
    async (patient: Patient, position: MenuPosition) => {
      let choice: string | null
      try {
        // A very long name or Care ID would make the main process reject the whole menu.
        choice = await api.showContextMenu({ items: fitMenuLabels(patientContextMenuItems(patient)), ...position })
      } catch (error) {
        setStatus(`Couldn't open the menu: ${describeFailure(error)}`, 'error')
        return
      }
      if (choice && isCommandId(choice)) run({ id: choice, patientId: patient.id })
    },
    [api, run, setStatus]
  )
}
