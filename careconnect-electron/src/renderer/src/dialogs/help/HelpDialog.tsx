import { Dialog } from '../../components/Dialog'

/** Placeholder until the CareConnect help dialog is implemented. */
export function HelpDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  return (
    <Dialog title="CareConnect help" onClose={onClose}>
      <p>CareConnect help is not built yet.</p>
    </Dialog>
  )
}
