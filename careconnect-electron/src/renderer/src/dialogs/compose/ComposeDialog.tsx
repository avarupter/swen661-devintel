import { Dialog } from '../../components/Dialog'

/** Placeholder until the New message dialog is implemented. */
export function ComposeDialog({ onClose }: { onClose(): void; patientId: string | null; conversationId: string | null; draftId: string | null }): React.JSX.Element {
  return (
    <Dialog title="New message" onClose={onClose}>
      <p>New message is not built yet.</p>
    </Dialog>
  )
}
