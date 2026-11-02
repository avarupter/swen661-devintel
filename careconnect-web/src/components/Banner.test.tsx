import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Banner from './Banner';

describe('Banner', () => {
  test.each(['info', 'success', 'warning'] as const)(
    'a %s banner is a polite status message',
    (variant) => {
      render(<Banner variant={variant}>Your changes were saved.</Banner>);

      const banner = screen.getByRole('status');
      expect(banner).toHaveTextContent('Your changes were saved.');
      expect(banner).toHaveAttribute('aria-live', 'polite');
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );

  test('an error banner is an assertive alert', () => {
    render(<Banner variant="error">We could not save your changes.</Banner>);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('We could not save your changes.');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  test('includes the title with the message when one is given', () => {
    render(
      <Banner variant="warning" title="Missed medicine">
        Atorvastatin was due at 8:00 PM.
      </Banner>,
    );

    const banner = screen.getByRole('status');
    expect(within(banner).getByText('Missed medicine')).toBeInTheDocument();
    expect(within(banner).getByText('Atorvastatin was due at 8:00 PM.')).toBeInTheDocument();
  });

  test('without a title, nothing names the banner type', () => {
    render(<Banner variant="warning">Atorvastatin was due at 8:00 PM.</Banner>);

    // BUG: Banner.tsx:60-93 gives every variant a defaultTitle ("Information",
    // "Success", "Warning", "Error") that is never rendered — only an explicit
    // `title` is (Banner.tsx:131). A title-less banner announces its type
    // through colour and an aria-hidden icon alone, so screen-reader users
    // cannot tell a warning from a success message.
    expect(screen.getByRole('status')).toHaveTextContent(/^Atorvastatin was due at 8:00 PM\.$/);
    expect(screen.queryByText('Warning')).toBeNull();
  });

  test('has no dismiss button unless onDismiss is given', () => {
    render(<Banner variant="info">Saved.</Banner>);

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('the dismiss button is labelled and calls onDismiss', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(
      <Banner variant="success" onDismiss={onDismiss}>
        Saved.
      </Banner>,
    );

    await user.click(screen.getByRole('button', { name: 'Dismiss this message' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
