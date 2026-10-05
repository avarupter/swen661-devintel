import { Dialog } from '../../components/Dialog'

/** Placeholder until the Keyboard shortcuts dialog is implemented. */
export function ShortcutsDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose}>
      <p>Keyboard shortcuts is not built yet.</p>
    </Dialog>
  )
}
