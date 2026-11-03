import { render, screen } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';

import Help from '../Help.tsx';
import MedicationEnhanced from '../MedicationEnhanced.tsx';


jest.mock('../../components/ChatBot', () => ({
  __esModule: true,
  default: ({ variant }) => (
    <div data-testid="chatbot">
      {variant}
    </div>
  ),
}));

jest.mock(
  '../../components/MedicationMemoryPanel',
  () => ({
    __esModule: true,
    default: () => (
      <div>Medication Memory Panel</div>
    ),
  }),
);

jest.mock('../Medications', () => ({
  __esModule: true,
  default: () => (
    <div>Medications Main Page</div>
  ),
}));


describe('simple wrapper pages', () => {

  it('renders Help with embedded assistant', () => {
    render(<Help />);

    expect(
      screen.getByRole('heading', {
        name: 'Help',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('chatbot'),
    ).toHaveTextContent('embedded');
  });


  it('renders enhanced medications wrapper', () => {
    render(<MedicationEnhanced />);

    expect(
      screen.getByText(
        'Medication Memory Panel',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Medications Main Page',
      ),
    ).toBeInTheDocument();
  });

});