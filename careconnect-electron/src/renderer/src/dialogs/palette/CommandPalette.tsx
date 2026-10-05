import { Dialog } from '../../components/Dialog'

/** Placeholder until the Command palette dialog is implemented. */
export function CommandPalette({ onClose }: { onClose(): void }): React.JSX.Element {
  return (
    <Dialog title="Command palette" onClose={onClose}>
      <p>Command palette is not built yet.</p>
    </Dialog>
  )
}
