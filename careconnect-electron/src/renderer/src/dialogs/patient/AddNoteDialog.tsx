import { Dialog } from '../../components/Dialog'

/** Placeholder until the Add clinical note dialog is implemented. */
export function AddNoteDialog({ onClose }: { onClose(): void; patientId: string }): React.JSX.Element {
  return (
    <Dialog title="Add clinical note" onClose={onClose}>
      <p>Add clinical note is not built yet.</p>
    </Dialog>
  )
}
