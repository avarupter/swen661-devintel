import { describe, test, expect, jest } from '@jest/globals';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Field from './Field';

describe('Field', () => {
  test('labels its input with the visible label', () => {
    render(<Field label="Email address" type="email" name="email" />);

    const input = screen.getByRole('textbox', { name: 'Email address' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).not.toBeRequired();
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  test('passes typing through to a controlled onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <Field
          label="Your name"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setValue(e.target.value);
          }}
        />
      );
    }
    render(<Controlled />);

    await user.type(screen.getByRole('textbox', { name: 'Your name' }), 'Ada');

    expect(screen.getByRole('textbox', { name: 'Your name' })).toHaveValue('Ada');
    expect(onChange).toHaveBeenLastCalledWith('Ada');
  });

  test('a required field says so to screen readers as well as visually', () => {
    render(<Field label="Your name" required />);

    // The visible "*" is aria-hidden; screen readers hear "(required)" instead.
    const input = screen.getByRole('textbox', { name: /^Your name\s*\(required\)$/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  test('a hint describes the input', () => {
    render(<Field label="Password" type="password" hint="At least 6 characters." />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAccessibleDescription('At least 6 characters.');
    expect(screen.getByText('At least 6 characters.')).toBeVisible();
  });

  test('an error marks the input invalid and is announced', () => {
    render(<Field label="Email address" error="Please enter your email address." />);

    const input = screen.getByRole('textbox', { name: 'Email address' });
    expect(input).toBeInvalid();
    // The "!" marker is aria-hidden, so the description is just the message.
    expect(input).toHaveAccessibleDescription('Please enter your email address.');
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email address.');
  });

  test('the error replaces the hint, but the input still points at the hint', () => {
    render(
      <Field
        label="Password"
        type="password"
        hint="At least 6 characters."
        error="Password must be at least 6 characters."
      />,
    );

    const input = screen.getByLabelText('Password');
    expect(screen.queryByText('At least 6 characters.')).toBeNull();
    expect(input).toHaveAccessibleDescription('Password must be at least 6 characters.');

    // BUG: aria-describedby is built from `hint` alone (Field.tsx:89), but
    // the hint is only rendered when there is no error (Field.tsx:151), so the
    // first id points at an element that does not exist.
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0])).toBeNull();
    expect(document.getElementById(ids[1])).toHaveTextContent(
      'Password must be at least 6 characters.',
    );
  });

  test('renders a textarea when multiline', async () => {
    const user = userEvent.setup();
    render(<Field label="Shift notes" multiline hint="What happened today?" />);

    const notes = screen.getByRole('textbox', { name: 'Shift notes' });
    expect(notes).toBeInstanceOf(HTMLTextAreaElement);
    expect(notes).toHaveAccessibleDescription('What happened today?');

    await user.type(notes, 'Ate well.{Enter}Slept after lunch.');
    expect(notes).toHaveValue('Ate well.\nSlept after lunch.');
  });

  test('a leading icon is decorative', () => {
    render(<Field label="Search" leadingIcon={<span>🔍</span>} />);

    const icon = screen.getByText('🔍');
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
  });

  test('each instance gets its own ids', () => {
    render(
      <>
        <Field label="Phone" hint="Mobile or landline" />
        <Field label="Phone" hint="Work number" />
      </>,
    );

    const [first, second] = screen.getAllByRole('textbox', { name: 'Phone' });
    expect(first.id).not.toBe(second.id);
    expect(first).toHaveAccessibleDescription('Mobile or landline');
    expect(second).toHaveAccessibleDescription('Work number');
  });
});
