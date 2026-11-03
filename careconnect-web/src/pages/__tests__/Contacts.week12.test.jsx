import { render, screen } from '@testing-library/react';
import { describe, expect, it } from '@jest/globals';

import Contacts from '../Contacts.tsx';


describe('Contacts.tsx', () => {

  it('renders contact sections', () => {
    render(<Contacts />);

    expect(
      screen.getByRole('heading', {
        name: 'Contacts',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('region', {
        name: 'Emergency contacts',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('region', {
        name: 'Other contacts',
      }),
    ).toBeInTheDocument();
  });


  it('renders emergency and support contacts', () => {
    render(<Contacts />);

    expect(
      screen.getByRole('article', {
        name: 'Maria Thompson, Family',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('article', {
        name: 'Joyce Adeyemi, Carer',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('article', {
        name:
          'Emergency Services, Emergency',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('article', {
        name:
          'Dr. Priya Sharma, Doctor',
      }),
    ).toBeInTheDocument();
  });


  it('formats telephone links without spaces', () => {
    render(<Contacts />);

    expect(
      screen.getByRole('link', {
        name:
          'Call Maria Thompson on 07700 900 123',
      }),
    ).toHaveAttribute(
      'href',
      'tel:07700900123',
    );

    expect(
      screen.getByRole('link', {
        name:
          'Call Emergency Services on 999',
      }),
    ).toHaveAttribute(
      'href',
      'tel:999',
    );
  });

});