import { Dialog } from '../../components/Dialog'

/** Placeholder until the Settings dialog is implemented. */
export function SettingsDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  return (
    <Dialog title="Settings" onClose={onClose}>
      <p>Settings is not built yet.</p>
    </Dialog>
  )
}
