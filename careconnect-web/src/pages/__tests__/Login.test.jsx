import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import Login from "../Login.jsx";

import {
  CareConnectProvider,
} from "../../context/CareConnectContext.jsx";

function renderLogin() {
  return render(
    <MemoryRouter
      initialEntries={["/login"]}
    >
      <CareConnectProvider>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/"
            element={
              <h1>
                Patient home loaded
              </h1>
            }
          />
        </Routes>
      </CareConnectProvider>
    </MemoryRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("renders the welcoming CareConnect login experience", () => {
    renderLogin();

    expect(
      screen.getByRole(
        "heading",
        {
          name:
            "Your day, made easier.",
        }
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "CareConnect"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        "Email address"
      )
    ).toHaveValue(
      "patient@careconnect.demo"
    );

    expect(
      screen.getByLabelText(
        "Password"
      )
    ).toHaveValue(
      "Care123!"
    );
  });

  it("shows an accessible error for invalid credentials", () => {
    renderLogin();

    fireEvent.change(
      screen.getByLabelText(
        "Email address"
      ),
      {
        target: {
          value:
            "wrong@example.com",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      })
    );

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      /did not match/i
    );
  });

  it("signs in with the demo account", () => {
    renderLogin();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      })
    );

    expect(
      screen.getByRole(
        "heading",
        {
          name:
            "Patient home loaded",
        }
      )
    ).toBeInTheDocument();
  });
});