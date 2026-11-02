import { describe, test, expect } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  test('is a region named by its heading, with the content inside', () => {
    render(
      <Card heading="Next appointment">
        <p>Blood pressure check at 10:30</p>
      </Card>,
    );

    const card = screen.getByRole('region', { name: 'Next appointment' });
    expect(within(card).getByRole('heading', { level: 2, name: 'Next appointment' })).toBeVisible();
    expect(within(card).getByText('Blood pressure check at 10:30')).toBeInTheDocument();
  });

  test.each([3, 4, 5, 6] as const)('can use an h%i heading for nesting', (level) => {
    render(
      <Card heading="Morning" headingLevel={level}>
        <p>Breakfast</p>
      </Card>,
    );

    expect(screen.getByRole('heading', { level, name: 'Morning' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  test('a visually hidden heading still names the card for screen readers', () => {
    render(
      <Card heading="Today's medicines" headingHidden>
        <p>Amlodipine</p>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: "Today's medicines" })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: "Today's medicines" })).toBeInTheDocument();
  });

  test('renders the actions slot inside the card', () => {
    render(
      <Card heading="Notes" actions={<button type="button">Add note</button>}>
        <p>No notes yet</p>
      </Card>,
    );

    const card = screen.getByRole('region', { name: 'Notes' });
    expect(within(card).getByRole('button', { name: 'Add note' })).toBeInTheDocument();
  });

  test('has no actions area when none are given', () => {
    render(
      <Card heading="Notes">
        <p>No notes yet</p>
      </Card>,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
