import { describe, test, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  test.each(['primary', 'secondary'] as const)('a %s button calls onClick straight away', async (variant) => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button variant={variant} onClick={onClick}>
        Save
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('is primary by default and works without an onClick', async () => {
    const user = userEvent.setup();
    render(<Button>Continue</Button>);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  test('does not submit a form unless it is a submit button', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Preview</Button>
        <Button type="submit">Send</Button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('a disabled button is announced as disabled and ignores clicks', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(onClick).not.toHaveBeenCalled();
  });

  test('aria-label replaces the visible text as the accessible name', () => {
    render(<Button aria-label="Edit Amlodipine">Edit</Button>);

    expect(screen.getByRole('button', { name: 'Edit Amlodipine' })).toHaveTextContent('Edit');
  });

  test('the icon is decorative and stays out of the accessible name', () => {
    render(<Button icon={<span>✎</span>}>Edit</Button>);

    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button).toHaveTextContent('✎Edit');
  });

  describe('danger variant', () => {
    test('asks for confirmation before calling onClick', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(
        <Button
          variant="danger"
          onClick={onClick}
          confirmTitle="Delete medication"
          confirmDescription="Amlodipine will be removed from Margaret's list."
          confirmLabel="Yes, delete"
        >
          Delete
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      const dialog = screen.getByRole('dialog', { name: 'Delete medication' });
      expect(dialog).toHaveAccessibleDescription("Amlodipine will be removed from Margaret's list.");
      expect(onClick).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    test('uses generic confirmation copy by default', async () => {
      const user = userEvent.setup();
      render(<Button variant="danger">Delete</Button>);

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      const dialog = screen.getByRole('dialog', { name: 'Are you sure?' });
      expect(dialog).toHaveAccessibleDescription('This action cannot be undone.');
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    test('cancelling does not call onClick and returns focus to the button', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(
        <Button variant="danger" onClick={onClick}>
          Delete
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClick).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
    });

    test('confirming works without an onClick', async () => {
      const user = userEvent.setup();
      render(<Button variant="danger">Delete</Button>);

      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    test('a list of danger buttons puts focus on the last one when it renders', () => {
      render(
        <ul>
          <li>
            <Button variant="danger" aria-label="Delete Amlodipine">Delete</Button>
          </li>
          <li>
            <Button variant="danger" aria-label="Delete Sertraline">Delete</Button>
          </li>
        </ul>,
      );

      // BUG: each danger Button mounts a closed ConfirmDialog, whose
      // "return focus to the trigger" effect (ConfirmDialog.tsx:95-99) runs on
      // mount. The last button rendered keeps focus — on ManageMedications and
      // ManageAppointments the page opens focused on the last "Delete" button.
      expect(screen.getByRole('button', { name: 'Delete Sertraline' })).toHaveFocus();
    });

    test('re-rendering while the dialog is open pulls focus back to its first button', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Button variant="danger">Delete</Button>);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.tab();
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

      rerender(<Button variant="danger">Delete</Button>);

      // BUG: Button passes a new inline onCancel on every render
      // (Button.tsx:124) and ConfirmDialog's focus effect depends on it
      // (ConfirmDialog.tsx:92), so any re-render of the page while the dialog
      // is open re-runs the effect and moves focus back to "Close dialog".
      expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    });
  });
});
