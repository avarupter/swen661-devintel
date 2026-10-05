import { Dialog } from '../../components/Dialog'

/** Placeholder until the Edit care summary dialog is implemented. */
export function EditSummaryDialog({ onClose }: { onClose(): void; patientId: string }): React.JSX.Element {
  return (
    <Dialog title="Edit care summary" onClose={onClose}>
      <p>Edit care summary is not built yet.</p>
    </Dialog>
  )
}
