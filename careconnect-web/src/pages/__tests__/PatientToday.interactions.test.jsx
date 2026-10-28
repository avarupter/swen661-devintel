import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import PatientToday from "../PatientToday.jsx";

import {
  CareConnectProvider,
  useCareConnect,
} from "../../context/CareConnectContext.jsx";

function Probe() {
  const {
    toast,
  } = useCareConnect();

  return (
    <output data-testid="today-toast">
      {toast?.text ?? ""}
    </output>
  );
}

function renderToday() {
  window.history.replaceState(
    {},
    "",
    "/"
  );

  return render(
    <CareConnectProvider>
      <PatientToday />
      <Probe />
    </CareConnectProvider>
  );
}

describe("PatientToday interactions", () => {
  it("activates the caregiver call action", () => {
    renderToday();

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Call my caregiver",
      })
    );

    expect(
      screen.getByTestId(
        "today-toast"
      )
    ).toHaveTextContent(
      /caregiver call request/i
    );
  });

  it("marks the patient ready and updates progress", () => {
    renderToday();

    expect(
      screen.getByText(
        "3 of 10 things done today"
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "I'm ready",
      })
    );

    expect(
      screen.getByText(
        "4 of 10 things done today"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "You are ready"
      )
    ).toBeInTheDocument();
  });

  it("opens Messages from the care-team action", () => {
    renderToday();

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Message care team",
      })
    );

    expect(
      window.location.pathname
    ).toBe("/messages");
  });
});