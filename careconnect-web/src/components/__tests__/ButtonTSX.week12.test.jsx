import {
  render,
  screen,
  within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import Button from '../Button.tsx';


jest.mock('../ConfirmDialog', () => ({
  __esModule: true,

  default: ({
    open,
    title,
    confirmLabel,
    onConfirm,
    onCancel,
  }) =>
    open ? (
      <div
        role="dialog"
        aria-label={title}
      >
        <button onClick={onConfirm}>
          {confirmLabel}
        </button>

        <button onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}));


describe('Button.tsx', () => {

  it('fires a normal action immediately', async () => {
    const user = userEvent.setup();
    const action = jest.fn();

    render(
      <Button onClick={action}>
        Save
      </Button>,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Save',
      }),
    );

    expect(action).toHaveBeenCalledTimes(1);
  });


  it('does not activate while disabled', async () => {
    const user = userEvent.setup();
    const action = jest.fn();

    render(
      <Button
        disabled
        onClick={action}
      >
        Save
      </Button>,
    );

    const button =
      screen.getByRole('button', {
        name: 'Save',
      });

    expect(button).toBeDisabled();

    await user.click(button);

    expect(action).not.toHaveBeenCalled();
  });


  it('requires confirmation for danger action', async () => {
    const user = userEvent.setup();
    const action = jest.fn();

    render(
      <Button
        variant="danger"
        onClick={action}
        confirmTitle="Delete item?"
        confirmLabel="Delete"
      >
        Delete
      </Button>,
    );

    const originalButton =
      screen.getByRole('button', {
        name: 'Delete',
      });

    await user.click(originalButton);

    expect(action).not.toHaveBeenCalled();

    const dialog =
      screen.getByRole('dialog', {
        name: 'Delete item?',
      });

    const confirmButton =
      within(dialog).getByRole(
        'button',
        {
          name: 'Delete',
        },
      );

    await user.click(confirmButton);

    expect(action).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument();
  });


  it('can cancel a danger action', async () => {
    const user = userEvent.setup();
    const action = jest.fn();

    render(
      <Button
        variant="danger"
        onClick={action}
      >
        Remove
      </Button>,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Remove',
      }),
    );

    const dialog =
      screen.getByRole('dialog');

    await user.click(
      within(dialog).getByRole(
        'button',
        {
          name: 'Cancel',
        },
      ),
    );

    expect(action).not.toHaveBeenCalled();

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument();
  });

});