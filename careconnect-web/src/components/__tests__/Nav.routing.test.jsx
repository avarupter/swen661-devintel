import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  useLocation,
} from "react-router-dom";

import {
  describe,
  expect,
  it,
} from "vitest";

import Nav from "../Nav.jsx";

function LocationProbe() {
  const location =
    useLocation();

  return (
    <output data-testid="location">
      {location.pathname}
    </output>
  );
}

describe("Nav routing", () => {
  it("uses React Router when rendered inside a router", () => {
    render(
      <MemoryRouter
        initialEntries={["/"]}
      >
        <Nav
          variant="sidebar"
          current="home"
          unreadMessages={4}
        />

        <LocationProbe />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "Medications",
      })
    );

    expect(
      screen.getByTestId("location")
    ).toHaveTextContent(
      "/medications"
    );
  });

  it("uses the real unread message count", () => {
    render(
      <MemoryRouter>
        <Nav
          variant="sidebar"
          current="home"
          unreadMessages={4}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", {
        name:
          "Messages, 4 unread",
      })
    ).toBeInTheDocument();
  });
});