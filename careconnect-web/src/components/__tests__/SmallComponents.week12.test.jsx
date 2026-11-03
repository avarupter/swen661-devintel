import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, jest } from '@jest/globals';

import Banner from '../Banner.tsx';
import BigActionTile from '../BigActionTile.tsx';
import Card from '../Card.tsx';
import Field from '../Field.tsx';


describe('Week 12 small TSX components', () => {

  it('renders info banner as polite status', () => {
    render(
      <Banner variant="info" title="Information">
        Helpful message
      </Banner>,
    );

    const banner = screen.getByRole('status');

    expect(banner).toHaveAttribute(
      'aria-live',
      'polite',
    );

    expect(
      screen.getByText('Information'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Helpful message'),
    ).toBeInTheDocument();
  });


  it('renders error banner as assertive alert', () => {
    render(
      <Banner variant="error">
        Something went wrong
      </Banner>,
    );

    expect(
      screen.getByRole('alert'),
    ).toHaveAttribute(
      'aria-live',
      'assertive',
    );
  });


  it('dismisses a banner', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();

    render(
      <Banner
        variant="success"
        onDismiss={onDismiss}
      >
        Saved
      </Banner>,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss this message',
      }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });


  it('renders and activates an action tile', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <BigActionTile
        icon={<span>Icon</span>}
        label="Appointments"
        description="View appointments"
        onClick={onClick}
        colour="warm"
      />,
    );

    const button = screen.getByRole('button', {
      name:
        'Appointments — View appointments',
    });

    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });


  it('disables an action tile', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <BigActionTile
        icon={<span />}
        label="Disabled action"
        onClick={onClick}
        disabled
      />,
    );

    const button = screen.getByRole('button', {
      name: 'Disabled action',
    });

    expect(button).toBeDisabled();

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });


  it('renders a labelled card with actions', () => {
    render(
      <Card
        heading="Medication summary"
        headingLevel={3}
        actions={<button>Action</button>}
      >
        Card body
      </Card>,
    );

    expect(
      screen.getByRole('region', {
        name: 'Medication summary',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Medication summary',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Card body'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Action',
      }),
    ).toBeInTheDocument();
  });


  it('renders an accessible normal input field', () => {
    render(
      <Field
        label="Email address"
        hint="Enter your email"
        required
      />,
    );

    const input = screen.getByLabelText(
      /Email address/,
    );

    expect(input).toHaveAttribute(
      'aria-required',
      'true',
    );

    expect(
      screen.getByText('Enter your email'),
    ).toBeInTheDocument();
  });


  it('renders an input error state', () => {
    render(
      <Field
        label="Name"
        error="Name is required"
      />,
    );

    const input =
      screen.getByLabelText('Name');

    expect(input).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Name is required',
    );
  });


  it('renders a multiline field', () => {
    render(
      <Field
        label="Notes"
        multiline
      />,
    );

    expect(
      screen.getByRole('textbox', {
        name: 'Notes',
      }).tagName,
    ).toBe('TEXTAREA');
  });

});