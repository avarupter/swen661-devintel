import { Dialog } from '../../components/Dialog'

/** Shown if a patient dialog is opened for a record that no longer exists. Close or Esc dismisses it. */
export function MissingPatientDialog({ title, onClose }: { title: string; onClose(): void }): React.JSX.Element {
  return (
    <Dialog title={title} size="small" onClose={onClose}>
      <p>That patient is no longer in the list.</p>
    </Dialog>
  )
}
