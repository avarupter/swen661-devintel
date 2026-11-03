import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  createRef,
} from 'react';

import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import ConfirmDialog from '../ConfirmDialog.tsx';


function setup(open = true) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const triggerRef = createRef();

  render(
    <>
      <button ref={triggerRef}>
        Trigger
      </button>

      <ConfirmDialog
        open={open}
        title="Delete item?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep item"
        triggerRef={triggerRef}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </>,
  );

  return {
    onConfirm,
    onCancel,
    triggerRef,
  };
}


describe('ConfirmDialog', () => {

  it('renders nothing while closed', () => {
    setup(false);

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument();
  });


  it('renders an accessible modal dialog', () => {
    setup();

    const dialog =
      screen.getByRole('dialog', {
        name: 'Delete item?',
      });

    expect(dialog).toHaveAttribute(
      'aria-modal',
      'true',
    );

    expect(
      screen.getByText(
        'This cannot be undone.',
      ),
    ).toBeInTheDocument();
  });


  it('locks page scrolling while open', () => {
    setup();

    expect(
      document.body.style.overflow,
    ).toBe('hidden');
  });


  it('confirms the action', async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();

    await user.click(
      screen.getByRole('button', {
        name: 'Delete',
      }),
    );

    expect(
      onConfirm,
    ).toHaveBeenCalledTimes(1);
  });


  it('cancels from the cancel button', async () => {
    const user = userEvent.setup();
    const { onCancel } = setup();

    await user.click(
      screen.getByRole('button', {
        name: 'Keep item',
      }),
    );

    expect(
      onCancel,
    ).toHaveBeenCalledTimes(1);
  });


  it('cancels from the close button', async () => {
    const user = userEvent.setup();
    const { onCancel } = setup();

    await user.click(
      screen.getByRole('button', {
        name: 'Close confirmation',
      }),
    );

    expect(
      onCancel,
    ).toHaveBeenCalledTimes(1);
  });


  it('cancels when Escape is pressed', () => {
    const { onCancel } = setup();

    act(() => {
      fireEvent.keyDown(
        document,
        {
          key: 'Escape',
        },
      );
    });

    expect(
      onCancel,
    ).toHaveBeenCalledTimes(1);
  });


  it('does not cancel for unrelated key presses', () => {
    const { onCancel } = setup();

    fireEvent.keyDown(
      document,
      {
        key: 'Enter',
      },
    );

    expect(
      onCancel,
    ).not.toHaveBeenCalled();
  });

});