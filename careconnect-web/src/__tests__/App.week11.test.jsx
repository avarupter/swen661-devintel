import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import App from "../App.jsx";

function renderApp() {
  window.history.replaceState(
    {},
    "",
    "/"
  );

  return render(<App />);
}

describe("App Week 11 interactions", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.location.hash = "";
  });

  it("asks for confirmation before signing out", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    expect(
      screen.getByRole("dialog")
    ).toBeInTheDocument();

    expect(
      screen.getByRole(
        "heading",
        {
          name:
            "Are you sure you want to sign out?",
        }
      )
    ).toBeInTheDocument();
  });

  it("allows the patient to stay signed in", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Stay signed in",
      })
    );

    expect(
      screen.queryByRole("dialog")
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole(
        "heading",
        {
          name:
            "Good morning, Joyce",
        }
      )
    ).toBeInTheDocument();
  });

  it("closes the sign-out dialog with Escape", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    const dialog =
      screen.getByRole("dialog");

    fireEvent.keyDown(
      dialog.parentElement,
      {
        key: "Escape",
      }
    );

    expect(
      screen.queryByRole("dialog")
    ).not.toBeInTheDocument();
  });

  it("traps keyboard focus inside the sign-out dialog", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    const stay =
      screen.getByRole("button", {
        name:
          "Stay signed in",
      });

    const signOutButtons =
      screen.getAllByRole(
        "button",
        {
          name: "Sign out",
        }
      );

    const confirm =
      signOutButtons[
        signOutButtons.length - 1
      ];

    expect(stay).toHaveFocus();

    fireEvent.keyDown(
      stay.closest(
        ".cc-dialog-backdrop"
      ),
      {
        key: "Tab",
        shiftKey: true,
      }
    );

    expect(confirm).toHaveFocus();

    fireEvent.keyDown(
      confirm.closest(
        ".cc-dialog-backdrop"
      ),
      {
        key: "Tab",
      }
    );

    expect(stay).toHaveFocus();
  });

  it("signs out only after confirmation", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    const signOutButtons =
      screen.getAllByRole(
        "button",
        {
          name: "Sign out",
        }
      );

    fireEvent.click(
      signOutButtons[
        signOutButtons.length - 1
      ]
    );

    expect(
      screen.getByRole(
        "heading",
        {
          name:
            "Your day, made easier.",
        }
      )
    ).toBeInTheDocument();
  });

  it("shows and dismisses an ADA live notification", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: "I'm ready",
      })
    );

    expect(
      screen.getByRole("status")
    ).toHaveTextContent(
      /marked ready/i
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Dismiss notification",
      })
    );

    expect(
      screen.queryByRole("status")
    ).not.toBeInTheDocument();
  });

  it("navigates through the patient tabs", () => {
    renderApp();

    fireEvent.click(
      screen.getAllByRole("link", {
        name: "Medications",
      })[0]
    );

    expect(
      screen.getByRole(
        "heading",
        {
          name: "Medications",
        }
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("link", {
        name: "Appointments",
      })[0]
    );

    expect(
      screen.getByRole(
        "heading",
        {
          name: "Appointments",
        }
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("link", {
        name:
          /Messages/,
      })[0]
    );

    expect(
      screen.getByRole(
        "heading",
        {
          name: "Messages",
        }
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("link", {
        name: "Help",
      })[0]
    );

    expect(
      screen.getByRole(
        "heading",
        {
          name: "Help",
        }
      )
    ).toBeInTheDocument();
  });
});