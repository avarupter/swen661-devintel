import {
  render,
  screen,
} from '@testing-library/react';

import {
  MemoryRouter,
} from 'react-router-dom';

import {
  describe,
  expect,
  it,
} from '@jest/globals';

import Landing from '../Landing.tsx';


function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}


describe('Landing', () => {

  it('renders accessible main content and hero', () => {
    renderLanding();

    expect(
      screen.getByRole('link', {
        name:
          'Skip to main content',
      }),
    ).toHaveAttribute(
      'href',
      '#main-content',
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(
      document.getElementById(
        'main-content',
      ),
    ).toBeInTheDocument();
  });


  it('provides login and sign-up navigation', () => {
    renderLanding();

    const loginLinks =
      screen.getAllByRole('link', {
        name: 'Login',
      });

    expect(
      loginLinks.length,
    ).toBeGreaterThanOrEqual(1);

    loginLinks.forEach(
      (link) => {
        expect(link).toHaveAttribute(
          'href',
          '/signin',
        );
      },
    );


    const signupLinks =
      screen.getAllByRole('link', {
        name: /Sign up/i,
      });

    expect(
      signupLinks.length,
    ).toBeGreaterThanOrEqual(1);

    signupLinks.forEach(
      (link) => {
        expect(link).toHaveAttribute(
          'href',
          '/signup',
        );
      },
    );
  });


  it('describes the major CareConnect capabilities', () => {
    renderLanding();

    const main =
      document.getElementById(
        'main-content',
      );

    expect(main).not.toBeNull();

    expect(main).toHaveTextContent(
      /medication/i,
    );

    expect(main).toHaveTextContent(
      /appointment/i,
    );

    expect(main).toHaveTextContent(
      /caregiver|care recipient|connected/i,
    );
  });


  it('describes both audiences', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', {
        name:
          'For care recipients',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name:
          'For caregivers',
      }),
    ).toBeInTheDocument();
  });


  it('renders the site footer', () => {
    renderLanding();

    expect(
      screen.getByRole(
        'contentinfo',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /For informational use only/i,
      ),
    ).toBeInTheDocument();
  });

});