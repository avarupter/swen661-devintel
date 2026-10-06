import './patients.css'
import { useAnnounce } from '../../a11y/Announcer'
import { useApi } from '../../api/ApiContext'
import { useCommandHandler } from '../../commands/CommandProvider'
import { useAppDispatch, useAppState, useStatus, useWorkspace } from '../../state/AppStateProvider'
import { useNow } from '../../state/clock'
import { patientById, visiblePatients } from '../../state/selectors'
import { MORE_BUTTON_ID, PatientDetail } from './PatientDetail'
import { PatientList } from './PatientList'
import {
  chosenOption,
  FILTER_OPTIONS,
  filterAnnouncement,
  menuPosition,
  patientOptionId,
  radioItems,
  SORT_OPTIONS,
  sortAnnouncement
} from './patientMenus'
import { usePatientMenu } from './usePatientMenu'

/** The header toolbar's Filter and Sort buttons (ToolbarButton ids are `toolbar-<command>`). */
const FILTER_BUTTON_ID = 'toolbar-patient.filter'
const SORT_BUTTON_ID = 'toolbar-patient.sort'

/**
 * The Patients workspace (design image 1): the list pane and the detail pane.
 * While mounted it handles the context-specific patient commands: filter and
 * sort open native radio menus, and "Open context menu" opens the selected
 * patient's menu at its row.
 */
export function PatientsView(): React.JSX.Element {
  const { ui } = useAppState()
  const workspace = useWorkspace()
  const dispatch = useAppDispatch()
  const api = useApi()
  const announce = useAnnounce()
  const setStatus = useStatus()
  const now = useNow()
  const showPatientMenu = usePatientMenu()
  const { patientQuery: query, statusFilter: filter, sortOrder } = ui

  useCommandHandler('patient.filter', async () => {
    const choice = await api.showContextMenu({ items: radioItems(FILTER_OPTIONS, filter), ...menuPosition(document.getElementById(FILTER_BUTTON_ID)) })
    const option = chosenOption(FILTER_OPTIONS, choice)
    if (!option) return
    dispatch({ type: 'ui/setStatusFilter', filter: option.id })
    announce(filterAnnouncement(option.id, visiblePatients(workspace.patients, { query, filter: option.id, sortOrder }).length))
  })

  useCommandHandler('patient.sort', async () => {
    const choice = await api.showContextMenu({ items: radioItems(SORT_OPTIONS, sortOrder), ...menuPosition(document.getElementById(SORT_BUTTON_ID)) })
    const option = chosenOption(SORT_OPTIONS, choice)
    if (!option) return
    dispatch({ type: 'ui/setSortOrder', sortOrder: option.id })
    announce(sortAnnouncement(option.id))
  })

  useCommandHandler('patient.contextMenu', async (command) => {
    const patient = patientById(workspace, command.patientId ?? ui.selectedPatientId)
    if (!patient) {
      setStatus('Select a patient first.', 'warning')
      return
    }
    const anchor = document.getElementById(patientOptionId(patient.id)) ?? document.getElementById(MORE_BUTTON_ID)
    await showPatientMenu(patient, menuPosition(anchor))
  })

  return (
    <div className="patients">
      <PatientList now={now} onShowMenu={showPatientMenu} />
      <PatientDetail patient={patientById(workspace, ui.selectedPatientId)} now={now} onShowMenu={showPatientMenu} />
    </div>
  )
}
