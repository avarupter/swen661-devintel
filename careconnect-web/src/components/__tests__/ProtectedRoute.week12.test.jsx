import {
  render,
  screen,
} from '@testing-library/react';

import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { useAuth } from '../../auth/AuthContext';

import {
  ProtectedRoute,
  RoleRoute,
  AuthRoute,
} from '../ProtectedRoute';


jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));


function renderRoutes(element, initial = '/test') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route
          path="/test"
          element={element}
        />

        <Route
          path="/"
          element={
            <div>Landing destination</div>
          }
        />

        <Route
          path="/role"
          element={
            <div>Role destination</div>
          }
        />

        <Route
          path="/app"
          element={
            <div>App destination</div>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}


describe('ProtectedRoute', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('shows an accessible loading status', () => {
    useAuth.mockReturnValue({
      user: null,
      role: null,
      loading: true,
    });

    renderRoutes(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );

    expect(
      screen.getByRole('status', {
        name: 'Loading, please wait',
      }),
    ).toBeInTheDocument();
  });


  it('redirects unauthenticated users to landing', () => {
    useAuth.mockReturnValue({
      user: null,
      role: null,
      loading: false,
    });

    renderRoutes(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );

    expect(
      screen.getByText(
        'Landing destination',
      ),
    ).toBeInTheDocument();
  });


  it('redirects authenticated users without a role', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: null,
      loading: false,
    });

    renderRoutes(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );

    expect(
      screen.getByText(
        'Role destination',
      ),
    ).toBeInTheDocument();
  });


  it('renders protected content for user with role', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: 'patient',
      loading: false,
    });

    renderRoutes(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );

    expect(
      screen.getByText(
        'Protected content',
      ),
    ).toBeInTheDocument();
  });

});


describe('RoleRoute', () => {

  it('shows loading state', () => {
    useAuth.mockReturnValue({
      user: null,
      role: null,
      loading: true,
    });

    renderRoutes(
      <RoleRoute>
        <div>Choose role</div>
      </RoleRoute>,
    );

    expect(
      screen.getByRole('status'),
    ).toBeInTheDocument();
  });


  it('redirects unauthenticated user to landing', () => {
    useAuth.mockReturnValue({
      user: null,
      role: null,
      loading: false,
    });

    renderRoutes(
      <RoleRoute>
        <div>Choose role</div>
      </RoleRoute>,
    );

    expect(
      screen.getByText(
        'Landing destination',
      ),
    ).toBeInTheDocument();
  });


  it('redirects users who already have a role to app', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: 'caregiver',
      loading: false,
    });

    renderRoutes(
      <RoleRoute>
        <div>Choose role</div>
      </RoleRoute>,
    );

    expect(
      screen.getByText(
        'App destination',
      ),
    ).toBeInTheDocument();
  });


  it('renders role chooser content for user without role', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: null,
      loading: false,
    });

    renderRoutes(
      <RoleRoute>
        <div>Choose role</div>
      </RoleRoute>,
    );

    expect(
      screen.getByText(
        'Choose role',
      ),
    ).toBeInTheDocument();
  });

});


describe('AuthRoute', () => {

  it('shows loading state', () => {
    useAuth.mockReturnValue({
      user: null,
      role: null,
      loading: true,
    });

    renderRoutes(
      <AuthRoute>
        <div>Authentication page</div>
      </AuthRoute>,
    );

    expect(
      screen.getByRole('status'),
    ).toBeInTheDocument();
  });


  it('redirects user with role into app', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: 'patient',
      loading: false,
    });

    renderRoutes(
      <AuthRoute>
        <div>Authentication page</div>
      </AuthRoute>,
    );

    expect(
      screen.getByText(
        'App destination',
      ),
    ).toBeInTheDocument();
  });


  it('redirects authenticated user without role to chooser', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: null,
      loading: false,
    });

    renderRoutes(
      <AuthRoute>
        <div>Authentication page</div>
      </AuthRoute>,
    );

    expect(
      screen.getByText(
        'Role destination',
      ),
    ).toBeInTheDocument();
  });


  it('renders authentication page for signed-out user', () => {
    useAuth.mockReturnValue({
      user: null,
      role: null,
      loading: false,
    });

    renderRoutes(
      <AuthRoute>
        <div>Authentication page</div>
      </AuthRoute>,
    );

    expect(
      screen.getByText(
        'Authentication page',
      ),
    ).toBeInTheDocument();
  });

});