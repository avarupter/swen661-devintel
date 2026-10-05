import { useCallback, useEffect, useRef } from 'react'
import { useCommands } from '../commands/CommandProvider'
import { useAppDispatch, useAppState } from '../state/AppStateProvider'
import { ComposeDialog } from './compose/ComposeDialog'
import { HelpDialog } from './help/HelpDialog'
import { CommandPalette } from './palette/CommandPalette'
import { AddNoteDialog } from './patient/AddNoteDialog'
import { EditSummaryDialog } from './patient/EditSummaryDialog'
import { NewPatientDialog } from './patient/NewPatientDialog'
import { SettingsDialog } from './settings/SettingsDialog'
import { ShortcutsDialog } from './shortcuts/ShortcutsDialog'

/**
 * Renders the open modal (at most one) outside the inert app shell. When the
 * last modal closes, focus returns to the control that opened it (spec card 01).
 */
export function ModalHost(): React.JSX.Element | null {
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const { restoreFocusAfterModal } = useCommands()
  const modal = ui.modal
  const wasOpen = useRef(false)

  const close = useCallback(() => dispatch({ type: 'ui/closeModal' }), [dispatch])

  useEffect(() => {
    if (modal) {
      wasOpen.current = true
    } else if (wasOpen.current) {
      wasOpen.current = false
      restoreFocusAfterModal()
    }
  }, [modal, restoreFocusAfterModal])

  if (!modal) return null
  switch (modal.kind) {
    case 'palette':
      return <CommandPalette onClose={close} />
    case 'shortcuts':
      return <ShortcutsDialog onClose={close} />
    case 'help':
      return <HelpDialog onClose={close} />
    case 'settings':
      return <SettingsDialog onClose={close} />
    case 'newPatient':
      return <NewPatientDialog onClose={close} />
    case 'addNote':
      return <AddNoteDialog patientId={modal.patientId} onClose={close} />
    case 'editSummary':
      return <EditSummaryDialog patientId={modal.patientId} onClose={close} />
    case 'compose':
      return <ComposeDialog patientId={modal.patientId} conversationId={modal.conversationId} draftId={modal.draftId} onClose={close} />
  }
}
