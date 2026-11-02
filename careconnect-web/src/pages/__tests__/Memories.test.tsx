/**
 * Memories — /app/memories: photo cards of the people, places and moments
 * that matter to the care recipient. Pinned cards come first; category
 * filters narrow the list; long stories expand with "Read more".
 */
import { describe, test, expect, jest } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Memories from '../Memories';
import * as mockData from '../../data/mockData';
import { renderWithProviders } from '../../test/test-utils';

function renderMemories() {
  return renderWithProviders(<Memories />, { route: '/app/memories', role: 'patient' });
}

const filters = () => screen.getByRole('group', { name: 'Filter memories by category' });
const filter = (name: string) => within(filters()).getByRole('button', { name });

function titlesIn(section: string) {
  return within(screen.getByRole('region', { name: section }))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

/** The <article> card whose heading is `title`. */
function memory(title: string): HTMLElement {
  // (Not named `card`: Tailwind scans src/ for class names, tests included, and
  // would read the negated name as the important (!) variant of .card.)
  const article = screen.getByRole('heading', { level: 3, name: title }).closest('article');
  if (!article) throw new Error(`no memory card titled "${title}"`);
  return article;
}

const PINNED = ['Maria — Your Daughter', 'Your Home', 'Buddy — Your Cat'];
const MORE = ['Your Garden', '50th Wedding Anniversary', 'Favourite Walk — River Path'];

describe('the memory cards', () => {
  test('are headed Memories', () => {
    renderMemories();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Memories');
    expect(screen.getByText('People, places, and moments that matter to you')).toBeInTheDocument();
  });

  test('pinned memories come first, then the rest', () => {
    renderMemories();

    const pinned = screen.getByRole('region', { name: 'Pinned memories' });
    expect(within(pinned).getByRole('heading', { level: 2 })).toHaveTextContent('Pinned');
    expect(titlesIn('Pinned memories')).toEqual(PINNED);

    const more = screen.getByRole('region', { name: 'More memories' });
    expect(within(more).getByRole('heading', { level: 2 })).toHaveTextContent('More memories');
    expect(titlesIn('More memories')).toEqual(MORE);
  });

  test('each card has a photo described by its title, its category and its story', () => {
    renderMemories();

    const maria = memory('Maria — Your Daughter');
    expect(within(maria).getByRole('img', { name: 'Maria — Your Daughter' })).toHaveAttribute(
      'src',
      mockData.memoryCards[0].imageUrl,
    );
    expect(within(maria).getByText('Family')).toBeInTheDocument();
    expect(within(maria).getByText('Pinned')).toBeInTheDocument();
    expect(within(maria).getByText(/^Maria lives in Bristol with her husband Tom/)).toBeInTheDocument();

    const garden = memory('Your Garden');
    expect(within(garden).getByText('Hobby')).toBeInTheDocument();
    expect(within(garden).queryByText('Pinned')).toBeNull();
  });

  test('a short memory has no "Read more", and one without a photo shows no image', () => {
    jest.replaceProperty(mockData, 'memoryCards', [
      {
        id: 'x1',
        title: 'Sunday roast',
        body: 'Robert carved the beef every Sunday.',
        category: 'event',
        pinned: false,
      },
    ]);
    renderMemories();

    const card = memory('Sunday roast');
    expect(within(card).getByText('Memory')).toBeInTheDocument();
    expect(within(card).getByText('Robert carved the beef every Sunday.')).toBeInTheDocument();
    expect(within(card).queryByRole('button')).toBeNull();
    expect(within(card).queryByRole('img')).toBeNull();
    // With nothing pinned, the list has no "More memories" heading of its own.
    expect(screen.queryByRole('region', { name: 'Pinned memories' })).toBeNull();
    expect(within(screen.getByRole('region', { name: 'More memories' })).queryByRole('heading', { level: 2 })).toBeNull();
  });
});

describe('category filters', () => {
  test('show every memory to begin with', () => {
    renderMemories();

    const buttons = within(filters()).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'All',
      'Family',
      'Places',
      'Memories',
      'Hobbies',
      'Pets',
    ]);
    expect(filter('All')).toHaveAttribute('aria-pressed', 'true');
    for (const button of buttons.slice(1)) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test.each([
    ['Family', ['Maria — Your Daughter'], null],
    ['Places', ['Your Home'], ['Favourite Walk — River Path']],
    ['Memories', null, ['50th Wedding Anniversary']],
    ['Hobbies', null, ['Your Garden']],
    ['Pets', ['Buddy — Your Cat'], null],
  ])('"%s" shows only that kind of memory', async (name, pinned, more) => {
    const { user } = renderMemories();

    await user.click(filter(name));

    expect(filter(name)).toHaveAttribute('aria-pressed', 'true');
    expect(filter('All')).toHaveAttribute('aria-pressed', 'false');

    if (pinned) expect(titlesIn('Pinned memories')).toEqual(pinned);
    else expect(screen.queryByRole('region', { name: 'Pinned memories' })).toBeNull();

    if (more) {
      expect(titlesIn('More memories')).toEqual(more);
      // The "More memories" heading only separates the list from pinned cards.
      const moreHeading = within(screen.getByRole('region', { name: 'More memories' })).queryByRole('heading', {
        level: 2,
      });
      if (pinned) expect(moreHeading).toHaveTextContent('More memories');
      else expect(moreHeading).toBeNull();
    } else {
      expect(screen.queryByRole('region', { name: 'More memories' })).toBeNull();
    }
  });

  test('"All" brings every memory back', async () => {
    const { user } = renderMemories();

    await user.click(filter('Pets'));
    await user.click(filter('All'));

    expect(filter('All')).toHaveAttribute('aria-pressed', 'true');
    expect(filter('Pets')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByRole('article')).toHaveLength(6);
  });

  test('a category with no memories says so', async () => {
    jest.replaceProperty(
      mockData,
      'memoryCards',
      mockData.memoryCards.filter((card) => card.category !== 'pet'),
    );
    const { user } = renderMemories();

    await user.click(filter('Pets'));

    expect(screen.getByText('No memories in this category yet.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Pinned memories' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'More memories' })).toBeNull();

    await user.click(filter('All'));

    expect(screen.queryByText('No memories in this category yet.')).toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });
});

describe('Read more', () => {
  test('opens the whole story, and "Show less" closes it again', async () => {
    const { user } = renderMemories();
    const card = memory('Maria — Your Daughter');
    const toggle = within(card).getByRole('button', { name: 'Read more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // The button names the paragraph it opens.
    const story = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(story).toHaveTextContent(/^Maria lives in Bristol/);
    expect(card).toContainElement(story);

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName('Show less');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName('Read more');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('only one story is open at a time', async () => {
    const { user } = renderMemories();
    const maria = within(memory('Maria — Your Daughter')).getByRole('button', { name: 'Read more' });
    const garden = within(memory('Your Garden')).getByRole('button', { name: 'Read more' });

    await user.click(maria);
    await user.click(garden);

    expect(maria).toHaveAttribute('aria-expanded', 'false');
    expect(garden).toHaveAttribute('aria-expanded', 'true');

    await user.click(garden);

    expect(garden).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Show less' })).toBeNull();
  });

  test('every toggle has the same name', () => {
    renderMemories();

    // BUG: Memories.tsx:174-181 (accessibility) — all six toggles are called
    // "Read more", so in a screen reader's list of buttons nothing says which
    // memory each one opens (aria-controls is rarely announced). Include the
    // title, e.g. aria-label "Read more about Maria — Your Daughter".
    expect(screen.getAllByRole('button', { name: 'Read more' })).toHaveLength(6);
  });
});
