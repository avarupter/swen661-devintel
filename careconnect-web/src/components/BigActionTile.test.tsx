import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BigActionTile from './BigActionTile';

const icon = <svg data-testid="tile-icon" />;

describe('BigActionTile', () => {
  test('is a button named by its label and description', () => {
    render(
      <BigActionTile
        icon={icon}
        label="Check in"
        description="Let your caregiver know you're well"
        onClick={() => {}}
      />,
    );

    const tile = screen.getByRole('button', {
      name: "Check in — Let your caregiver know you're well",
    });
    expect(tile).toHaveAttribute('type', 'button');
    expect(within(tile).getByText('Check in')).toBeVisible();
  });

  test('is named by its label alone when there is no description', () => {
    render(<BigActionTile icon={icon} label="My Day" onClick={() => {}} />);

    expect(screen.getByRole('button', { name: 'My Day' })).toBeInTheDocument();
  });

  test('renders the icon inside the tile, hidden from assistive technology', () => {
    render(<BigActionTile icon={icon} label="My Day" onClick={() => {}} />);

    const tile = screen.getByRole('button', { name: 'My Day' });
    const renderedIcon = within(tile).getByTestId('tile-icon');
    expect(renderedIcon.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  test('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<BigActionTile icon={icon} label="My Day" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'My Day' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('is activated from the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<BigActionTile icon={icon} label="My Day" onClick={onClick} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'My Day' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  test('a disabled tile cannot be pressed', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<BigActionTile icon={icon} label="Checked in" onClick={onClick} disabled />);

    const tile = screen.getByRole('button', { name: 'Checked in' });
    await user.click(tile);

    expect(tile).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  test.each(['calm', 'warm', 'success', 'neutral'] as const)(
    'renders in the %s colour scheme',
    (colour) => {
      render(<BigActionTile icon={icon} label="Medicines" colour={colour} onClick={() => {}} />);

      expect(screen.getByRole('button', { name: 'Medicines' })).toBeEnabled();
    },
  );
});
