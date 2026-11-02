/**
 * Landing — the public home page (/): what CareConnect is and who it is for,
 * the ways into sign-up and sign-in, and the floating help assistant.
 */
import { describe, test, expect } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Landing from '../Landing';
import { renderWithProviders } from '../../test/test-utils';

function renderLanding() {
  return renderWithProviders(<Landing />, { route: '/' });
}

const accountNav = () => within(screen.getByRole('navigation', { name: 'Account navigation' }));
const main = () => within(screen.getByRole('main', { name: 'Main content' }));

/** The checklist under one of the "Made for two kinds of people" headings. */
function audienceList(heading: string): string[] {
  const block = screen.getByRole('heading', { level: 3, name: heading }).parentElement as HTMLElement;
  return within(block)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

describe('content', () => {
  test('introduces CareConnect under a single main heading', () => {
    renderLanding();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Your daily companion for calm, confident care.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('For people who need a little help remembering, and the people who care for them.'),
    ).toBeInTheDocument();
  });

  test('its sections are headed in order beneath the main heading', () => {
    renderLanding();

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'How CareConnect helps',
      'Made for two kinds of people',
      'Ready to get started?',
    ]);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Stay on top of medications',
      'Never miss an appointment',
      'Stay connected to your caregiver',
      'For care recipients',
      'For caregivers',
    ]);
  });

  test('explains each feature', () => {
    renderLanding();

    expect(
      within(screen.getByRole('region', { name: 'Never miss an appointment' })).getByText(/^Your full day is laid out simply/),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Stay connected to your caregiver' })).getByText(
        /^Caregivers can leave notes, check progress/,
      ),
    ).toBeInTheDocument();
  });

  test('lists what care recipients and caregivers each get', () => {
    renderLanding();

    expect(audienceList('For care recipients')).toEqual([
      "Today's schedule at a glance",
      'Medication reminders',
      'Memory cards for people and places',
      'One-tap contact for your carer',
    ]);
    expect(audienceList('For caregivers')).toEqual([
      'Real-time schedule view',
      'Medication tracking',
      'Shift notes and priority flags',
      'Emergency contact list',
    ]);
  });

  test('reassures about privacy and medical advice', () => {
    renderLanding();

    expect(screen.getByText('Your information is private and never shared')).toBeInTheDocument();
    expect(screen.getByText('CareConnect never gives medical advice')).toBeInTheDocument();
  });
});

describe('page structure', () => {
  test('has a banner, a labelled main region and a footer', () => {
    renderLanding();

    expect(within(screen.getByRole('banner')).getByRole('navigation', { name: 'Account navigation' })).toBeInTheDocument();
    expect(screen.getByRole('main', { name: 'Main content' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('contentinfo')).getByText(
        new RegExp(`^© ${new Date().getFullYear()} CareConnect\\. For informational use only\\.`),
      ),
    ).toBeInTheDocument();
  });

  test('the first link skips to the main content, which can take focus', () => {
    renderLanding();

    const [first] = screen.getAllByRole('link');
    expect(first).toHaveAccessibleName('Skip to main content');
    expect(first).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  test('keyboard focus starts on the chat button, not at the top of the page', () => {
    renderLanding();

    // BUG: ChatBot's open/close focus effect (ChatBot.tsx:129-135) also runs
    // on mount and focuses its launcher, the last element on the page. A
    // keyboard or screen-reader user arrives at the floating chat button and
    // skips the skip link, the header and the main heading.
    expect(screen.getByRole('button', { name: 'Need help getting started? Open assistant' })).toHaveFocus();
  });
});

describe('ways in', () => {
  test.each([
    ['the header’s "Sign in"', () => accountNav().getByRole('link', { name: 'Sign in' }), '/signin'],
    ['the header’s "Sign up"', () => accountNav().getByRole('link', { name: 'Sign up' }), '/signup'],
    ['"Get started — it’s free"', () => main().getByRole('link', { name: 'Sign up for CareConnect' }), '/signup'],
    ['"I already have an account"', () => main().getByRole('link', { name: 'Sign in to CareConnect' }), '/signin'],
    ['"Create a free account"', () => main().getByRole('link', { name: 'Create a free account' }), '/signup'],
    ['the closing "Sign in"', () => main().getByRole('link', { name: 'Sign in' }), '/signin'],
  ])('%s goes to %s', async (_link, find, path) => {
    const { user, location } = renderLanding();

    await user.click(find());

    expect(location().pathname).toBe(path);
  });

  test('the two hero links are named differently from what they show', () => {
    renderLanding();

    // BUG (WCAG 2.5.3 Label in Name): the aria-labels (Landing.tsx:127, 135)
    // replace the visible text with words that do not contain it, so the
    // speech commands "click Get started" / "click I already have an
    // account" do not match. Drop the aria-labels, or start them with the
    // visible text.
    expect(main().getByRole('link', { name: 'Sign up for CareConnect' })).toHaveTextContent("Get started — it's free");
    expect(main().getByRole('link', { name: 'Sign in to CareConnect' })).toHaveTextContent('I already have an account');
  });
});

describe('help assistant', () => {
  test('opens from the floating button and closes with Escape', async () => {
    const { user } = renderLanding();
    const launcher = screen.getByRole('button', { name: 'Need help getting started? Open assistant' });

    await user.click(launcher);

    expect(screen.getByRole('dialog', { name: 'CareConnect Assistant' })).toBeInTheDocument();
    expect(launcher).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(launcher).toHaveFocus();
  });
});
