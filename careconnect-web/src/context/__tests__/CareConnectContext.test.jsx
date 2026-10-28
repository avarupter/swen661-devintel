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

import {
  CareConnectProvider,
  useCareConnect,
} from "../CareConnectContext.jsx";

function Harness() {
  const care = useCareConnect();

  const midday =
    care.routines.find(
      (item) =>
        item.id === "midday-medication"
    );

  const wellness =
    care.appointments.find(
      (item) =>
        item.id === "wellness-check"
    );

  return (
    <div>
      <output data-testid="authenticated">
        {String(care.isAuthenticated)}
      </output>

      <output data-testid="ready">
        {String(care.ready)}
      </output>

      <output data-testid="unread">
        {care.unreadMessages}
      </output>

      <output data-testid="midday-status">
        {String(midday.taken)}
      </output>

      <output data-testid="midday-notes">
        {midday.notes}
      </output>

      <output data-testid="feedback">
        {midday.feedback.join(",")}
      </output>

      <output data-testid="appointment">
        {String(wellness.confirmed)}
      </output>

      <output data-testid="message-count">
        {care.messages.length}
      </output>

      <output data-testid="toast">
        {care.toast?.text ?? ""}
      </output>

      <output data-testid="toast-tone">
        {care.toast?.tone ?? ""}
      </output>

      <button
        type="button"
        onClick={() =>
          care.login(
            "wrong@example.com",
            "bad"
          )
        }
      >
        Invalid login
      </button>

      <button
        type="button"
        onClick={() =>
          care.login(
            "patient@careconnect.demo",
            "Care123!"
          )
        }
      >
        Valid login
      </button>

      <button
        type="button"
        onClick={care.logout}
      >
        Logout
      </button>

      <button
        type="button"
        onClick={care.markReady}
      >
        Ready
      </button>

      <button
        type="button"
        onClick={care.callCaregiver}
      >
        Call caregiver
      </button>

      <button
        type="button"
        onClick={() =>
          care.toggleRoutine(
            "midday-medication"
          )
        }
      >
        Toggle medication
      </button>

      <button
        type="button"
        onClick={() =>
          care.updateRoutineNotes(
            "midday-medication",
            "Feeling okay today"
          )
        }
      >
        Add note
      </button>

      <button
        type="button"
        onClick={() =>
          care.toggleRoutineFeedback(
            "midday-medication",
            "Feel better"
          )
        }
      >
        Toggle feedback
      </button>

      <button
        type="button"
        onClick={() =>
          care.confirmAppointment(
            "wellness-check"
          )
        }
      >
        Confirm appointment
      </button>

      <button
        type="button"
        onClick={() =>
          care.sendMessage("")
        }
      >
        Empty message
      </button>

      <button
        type="button"
        onClick={() =>
          care.sendMessage(
            "Testing CareConnect"
          )
        }
      >
        Send message
      </button>

      <button
        type="button"
        onClick={care.markMessagesRead}
      >
        Mark messages read
      </button>

      <button
        type="button"
        onClick={care.clearToast}
      >
        Clear notification
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <CareConnectProvider>
      <Harness />
    </CareConnectProvider>
  );
}

describe("CareConnectContext", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("provides the initial patient state", () => {
    renderHarness();

    expect(
      screen.getByTestId("authenticated")
    ).toHaveTextContent("true");

    expect(
      screen.getByTestId("ready")
    ).toHaveTextContent("false");

    expect(
      screen.getByTestId("unread")
    ).toHaveTextContent("2");

    expect(
      screen.getByTestId("message-count")
    ).toHaveTextContent("3");
  });

  it("rejects an invalid login", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Invalid login",
      })
    );

    expect(
      screen.getByTestId("toast")
    ).toHaveTextContent(
      /did not match/i
    );

    expect(
      screen.getByTestId("toast-tone")
    ).toHaveTextContent("error");
  });

  it("logs out and signs back in", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Logout",
      })
    );

    expect(
      screen.getByTestId("authenticated")
    ).toHaveTextContent("false");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Valid login",
      })
    );

    expect(
      screen.getByTestId("authenticated")
    ).toHaveTextContent("true");

    expect(
      window.sessionStorage.getItem(
        "cc-auth"
      )
    ).toBe("true");

    expect(
      screen.getByTestId("toast")
    ).toHaveTextContent(
      "Welcome back, Joyce."
    );
  });

  it("marks the patient ready", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ready",
      })
    );

    expect(
      screen.getByTestId("ready")
    ).toHaveTextContent("true");

    expect(
      screen.getByTestId("toast")
    ).toHaveTextContent(
      /marked ready/i
    );
  });

  it("starts the caregiver call request", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Call caregiver",
      })
    );

    expect(
      screen.getByTestId("toast")
    ).toHaveTextContent(
      /caregiver call request/i
    );
  });

  it("toggles a medication taken and not taken", () => {
    renderHarness();

    const button =
      screen.getByRole("button", {
        name: "Toggle medication",
      });

    expect(
      screen.getByTestId(
        "midday-status"
      )
    ).toHaveTextContent("false");

    fireEvent.click(button);

    expect(
      screen.getByTestId(
        "midday-status"
      )
    ).toHaveTextContent("true");

    fireEvent.click(button);

    expect(
      screen.getByTestId(
        "midday-status"
      )
    ).toHaveTextContent("false");
  });

  it("stores routine notes", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add note",
      })
    );

    expect(
      screen.getByTestId(
        "midday-notes"
      )
    ).toHaveTextContent(
      "Feeling okay today"
    );
  });

  it("adds and removes medication feedback", () => {
    renderHarness();

    const button =
      screen.getByRole("button", {
        name: "Toggle feedback",
      });

    fireEvent.click(button);

    expect(
      screen.getByTestId("feedback")
    ).toHaveTextContent(
      "Feel better"
    );

    fireEvent.click(button);

    expect(
      screen.getByTestId("feedback")
    ).toHaveTextContent("");
  });

  it("confirms an appointment", () => {
    renderHarness();

    expect(
      screen.getByTestId(
        "appointment"
      )
    ).toHaveTextContent("false");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirm appointment",
      })
    );

    expect(
      screen.getByTestId(
        "appointment"
      )
    ).toHaveTextContent("true");
  });

  it("rejects an empty message", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Empty message",
      })
    );

    expect(
      screen.getByTestId("toast")
    ).toHaveTextContent(
      "Enter a message before sending."
    );

    expect(
      screen.getByTestId(
        "message-count"
      )
    ).toHaveTextContent("3");
  });

  it("sends a patient message", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Send message",
      })
    );

    expect(
      screen.getByTestId(
        "message-count"
      )
    ).toHaveTextContent("4");

    expect(
      screen.getByTestId("toast")
    ).toHaveTextContent(
      "Message Sent"
    );
  });

  it("marks inbound messages read", () => {
    renderHarness();

    expect(
      screen.getByTestId("unread")
    ).toHaveTextContent("2");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark messages read",
      })
    );

    expect(
      screen.getByTestId("unread")
    ).toHaveTextContent("0");
  });

  it("clears notifications", () => {
    renderHarness();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ready",
      })
    );

    expect(
      screen.getByTestId("toast")
    ).not.toHaveTextContent("");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear notification",
      })
    );

    expect(
      screen.getByTestId("toast")
    ).toHaveTextContent("");
  });
});