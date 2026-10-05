import { Dialog } from '../../components/Dialog'

/** Placeholder until the New patient dialog is implemented. */
export function NewPatientDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  return (
    <Dialog title="New patient" onClose={onClose}>
      <p>New patient is not built yet.</p>
    </Dialog>
  )
}
