import { describe, test, expect, jest } from '@jest/globals';
import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';
import type { ConfirmDialogProps } from './ConfirmDialog';

type HarnessProps = Partial<Omit<ConfirmDialogProps, 'open' | 'triggerRef'>> & {
  startOpen?: boolean;
};

// A trigger button that owns the dialog's open state, like Button does.
function Harness({ startOpen = false, onConfirm, onCancel, ...props }: HarnessProps) {
  const [open, setOpen] = useState(startOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Delete medication
      </button>
      <ConfirmDialog
        title="Delete medication?"
        {...props}
        open={open}
        triggerRef={triggerRef}
        onConfirm={() => {
          onConfirm?.();
          setOpen(false);
        }}
        onCancel={() => {
          onCancel?.();
          setOpen(false);
        }}
      />
    </>
  );
}

async function openDialog(props: HarnessProps = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  await user.click(screen.getByRole('button', { name: 'Delete medication' }));
  return { user, dialog: screen.getByRole('dialog') };
}

describe('ConfirmDialog', () => {
  test('renders nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('is a modal dialog named by its title and described by its description', async () => {
    const { dialog } = await openDialog({
      title: 'Delete Amlodipine?',
      description: 'It will be removed from the medicines list.',
    });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Delete Amlodipine?');
    expect(dialog).toHaveAccessibleDescription('It will be removed from the medicines list.');
  });

  test('has no description when none is given', async () => {
    const { dialog } = await openDialog();

    expect(dialog).not.toHaveAttribute('aria-describedby');
  });

  test('uses Confirm / Cancel unless other labels are given', async () => {
    await openDialog();

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('uses the given button labels', async () => {
    await openDialog({ confirmLabel: 'Yes, delete', cancelLabel: 'Keep it' });

    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeInTheDocument();
  });

  test('moves focus into the dialog when it opens', async () => {
    await openDialog();

    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  test('keeps Tab and Shift+Tab inside the dialog', async () => {
    const { user } = await openDialog();
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });

    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab(); // past the last button → wraps to the first
    expect(close).toHaveFocus();
    await user.tab({ shift: true }); // before the first button → wraps to the last
    expect(confirm).toHaveFocus();
    await user.tab({ shift: true });
    expect(cancel).toHaveFocus();
  });

  test('ignores keys other than Tab and Escape', async () => {
    const onCancel = jest.fn();
    const { user } = await openDialog({ onCancel });

    await user.keyboard('a');

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('confirming calls onConfirm', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { user } = await openDialog({ onConfirm, onCancel });

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test.each([
    ['the Cancel button', async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['the Close button', async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole('button', { name: 'Close dialog' }))],
    ['the Escape key', async (user: ReturnType<typeof userEvent.setup>) =>
      user.keyboard('{Escape}')],
  ])('%s cancels', async (_how, act) => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { user } = await openDialog({ onConfirm, onCancel });

    await act(user);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('a click on the backdrop cancels, a click inside the dialog does not', async () => {
    const onCancel = jest.fn();
    const { user, dialog } = await openDialog({ onCancel, description: 'Are you sure?' });

    await user.click(screen.getByText('Are you sure?'));
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(dialog.parentElement as HTMLElement); // the backdrop
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('returns focus to the button that opened it', async () => {
    const { user } = await openDialog();

    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Delete medication' })).toHaveFocus();
  });

  test('locks page scrolling while open and releases it afterwards', async () => {
    const { user } = await openDialog();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');

    expect(document.body.style.overflow).toBe('');
  });

  test('releases the scroll lock if it unmounts while open', () => {
    const { unmount } = render(<Harness startOpen />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  test('a closed dialog pulls focus to its trigger as soon as it mounts', () => {
    render(
      <>
        <input aria-label="Search medicines" autoFocus />
        <Harness />
      </>,
    );

    // BUG: the "return focus to trigger on close" effect (ConfirmDialog.tsx:95-99)
    // also runs on the first render, while the dialog is closed, so mounting a
    // dialog steals focus — here from an autofocused field. Every danger
    // <Button> mounts one, so ManageMedications and ManageAppointments load
    // with focus (and scroll) on the last "Delete" button in the list.
    expect(screen.getByRole('button', { name: 'Delete medication' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Search medicines' })).not.toHaveFocus();
  });
});
