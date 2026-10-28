import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import {
  MemoryRouter,
  useLocation,
} from "react-router-dom";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AppointmentsPage,
  HelpPage,
  MedicationsPage,
  MessagesPage,
} from "../PatientPages.jsx";

import {
  CareConnectProvider,
  useCareConnect,
} from "../../context/CareConnectContext.jsx";

function StateProbe() {
  const {
    toast,
    unreadMessages,
  } = useCareConnect();

  const location =
    useLocation();

  return (
    <>
      <output data-testid="page-toast">
        {toast?.text ?? ""}
      </output>

      <output data-testid="unread-count">
        {unreadMessages}
      </output>

      <output data-testid="current-location">
        {location.pathname}
      </output>
    </>
  );
}

function renderPage(page) {
  return render(
    <MemoryRouter>
      <CareConnectProvider>
        {page}
        <StateProbe />
      </CareConnectProvider>
    </MemoryRouter>
  );
}

describe("MedicationsPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date(
        "2026-06-04T15:30:00"
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows taken, missed, due soon, and upcoming routine states", () => {
    renderPage(
      <MedicationsPage />
    );

    expect(
      screen.getAllByText("Taken")
        .length
    ).toBeGreaterThan(0);

    expect(
      screen.getByText("Missed")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Due soon")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Upcoming")
        .length
    ).toBeGreaterThan(0);
  });

  it("allows a missed medication to be marked taken", () => {
    renderPage(
      <MedicationsPage />
    );

    const article =
      screen.getByRole("article", {
        name:
          "Midday medication",
      });

    expect(
      within(article).getByText(
        "Missed"
      )
    ).toBeInTheDocument();

    fireEvent.click(
      within(article).getByRole(
        "button",
        {
          name: "Mark as taken",
        }
      )
    );

    expect(
      within(article).getByText(
        "Taken"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        "page-toast"
      )
    ).toHaveTextContent(
      "Daily routine status updated."
    );
  });

  it("lets the patient reverse a taken medication", () => {
    renderPage(
      <MedicationsPage />
    );

    const article =
      screen.getByRole("article", {
        name:
          "Morning medication",
      });

    fireEvent.click(
      within(article).getByRole(
        "button",
        {
          name:
            "Mark as not taken",
        }
      )
    );

    expect(
      within(article).queryByText(
        "Taken"
      )
    ).not.toBeInTheDocument();
  });

  it("tracks completion of the walking activity", () => {
    renderPage(
      <MedicationsPage />
    );

    const walk =
      screen.getByRole("article", {
        name: "Take a walk",
      });

    fireEvent.click(
      within(walk).getByRole(
        "button",
        {
          name: "Mark complete",
        }
      )
    );

    expect(
      within(walk).getByText(
        "Completed"
      )
    ).toBeInTheDocument();
  });

  it("records medication feedback", () => {
    renderPage(
      <MedicationsPage />
    );

    const article =
      screen.getByRole("article", {
        name:
          "Midday medication",
      });

    const feedbackButton =
      within(article).getByRole(
        "button",
        {
          name: "Feel better",
        }
      );

    expect(
      feedbackButton
    ).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    fireEvent.click(
      feedbackButton
    );

    expect(
      feedbackButton
    ).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(
      feedbackButton
    );

    expect(
      feedbackButton
    ).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("stores patient notes", () => {
    renderPage(
      <MedicationsPage />
    );

    const article =
      screen.getByRole("article", {
        name:
          "Evening medication",
      });

    const notes =
      within(article).getByLabelText(
        "Notes"
      );

    fireEvent.change(
      notes,
      {
        target: {
          value:
            "I felt sleepy afterward.",
        },
      }
    );

    expect(notes).toHaveValue(
      "I felt sleepy afterward."
    );
  });
});

describe("AppointmentsPage", () => {
  it("starts in calendar view", () => {
    renderPage(
      <AppointmentsPage />
    );

    expect(
      screen.getByRole(
        "table",
        {
          name:
            /June 2026 appointments calendar/i,
        }
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Calendar view",
      })
    ).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("moves between calendar months", () => {
    renderPage(
      <AppointmentsPage />
    );

    expect(
      screen.getByText(
        "June 2026"
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Next month",
      })
    );

    expect(
      screen.getByText(
        "July 2026"
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Previous month",
      })
    );

    expect(
      screen.getByText(
        "June 2026"
      )
    ).toBeInTheDocument();
  });

  it("opens an appointment from the calendar", () => {
    renderPage(
      <AppointmentsPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Wellness check, 10:30 am",
      })
    );

    expect(
      screen.getByText(
        "Selected appointment"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Routine wellness follow-up"
      )
    ).toBeInTheDocument();
  });

  it("confirms an appointment", () => {
    renderPage(
      <AppointmentsPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Wellness check, 10:30 am",
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Confirm appointment",
      })
    );

    expect(
      screen.getByTestId(
        "page-toast"
      )
    ).toHaveTextContent(
      "Appointment confirmed."
    );
  });

  it("switches to the non-calendar list view", () => {
    renderPage(
      <AppointmentsPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "List view",
      })
    );

    expect(
      screen.queryByRole(
        "table"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.getByText(
        "Physical therapy"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Nurse follow-up"
      )
    ).toBeInTheDocument();
  });
});

describe("MessagesPage", () => {
  it("shows the patient message queue", () => {
    renderPage(
      <MessagesPage />
    );

    expect(
      screen.getByText(
        /I will call you at 3:00 today/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /wellness appointment/i
      )
    ).toBeInTheDocument();
  });

  it("marks queued messages read when opened", () => {
    renderPage(
      <MessagesPage />
    );

    expect(
      screen.getByTestId(
        "unread-count"
      )
    ).toHaveTextContent("0");
  });

  it("sends a message and announces Message Sent", () => {
    renderPage(
      <MessagesPage />
    );

    fireEvent.change(
      screen.getByLabelText(
        "Message your care team"
      ),
      {
        target: {
          value:
            "I am feeling better today.",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Send message",
      })
    );

    expect(
      screen.getByText(
        "I am feeling better today."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        "page-toast"
      )
    ).toHaveTextContent(
      "Message Sent"
    );

    expect(
      screen.getByLabelText(
        "Message your care team"
      )
    ).toHaveValue("");
  });
});

describe("HelpPage CareConnect Assistant", () => {
  it("opens with patient prompts", () => {
    renderPage(
      <HelpPage />
    );

    expect(
      screen.getByText(
        /Hi Joyce/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name:
          "Help with my medications",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name:
          "Show me how appointments work",
      })
    ).toBeInTheDocument();
  });

  it("answers the medication prompt", () => {
    renderPage(
      <HelpPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Help with my medications",
      })
    );

    expect(
      screen.getByText(
        /mark a medication as taken/i
      )
    ).toBeInTheDocument();
  });

  it("answers appointment questions", () => {
    renderPage(
      <HelpPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Show me how appointments work",
      })
    );

    expect(
      screen.getByText(
        /Calendar view or List view/i
      )
    ).toBeInTheDocument();
  });

  it("answers message questions", () => {
    renderPage(
      <HelpPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "How do I send a message?",
      })
    );

    expect(
      screen.getByText(
        /Message Sent notification/i
      )
    ).toBeInTheDocument();
  });

  it("answers accessibility questions", () => {
    renderPage(
      <HelpPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "I need accessibility help",
      })
    );

    expect(
      screen.getByText(
        /keyboard navigation/i
      )
    ).toBeInTheDocument();
  });

  it("answers sign out questions", () => {
    renderPage(
      <HelpPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "How do I sign out?",
      })
    );

    expect(
      screen.getByText(
        /ask you to confirm/i
      )
    ).toBeInTheDocument();
  });

  it("handles emergency language safely", () => {
    renderPage(
      <HelpPage />
    );

    const input =
      screen.getByLabelText(
        "Ask the CareConnect Assistant"
      );

    fireEvent.change(
      input,
      {
        target: {
          value:
            "I have an emergency",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ask",
      })
    );

    expect(
      screen.getByText(
        /call 911 now/i
      )
    ).toBeInTheDocument();
  });

  it("directs personal care questions to the care team", () => {
    renderPage(
      <HelpPage />
    );

    const input =
      screen.getByLabelText(
        "Ask the CareConnect Assistant"
      );

    fireEvent.change(
      input,
      {
        target: {
          value:
            "I need my care team",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ask",
      })
    );

    expect(
      screen.getByText(
        /personal medical advice/i
      )
    ).toBeInTheDocument();
  });

  it("provides a fallback answer for an unknown question", () => {
    renderPage(
      <HelpPage />
    );

    const input =
      screen.getByLabelText(
        "Ask the CareConnect Assistant"
      );

    fireEvent.change(
      input,
      {
        target: {
          value:
            "Where is everything?",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ask",
      })
    );

    expect(
      screen.getByText(
        /I can help with CareConnect medications/i
      )
    ).toBeInTheDocument();
  });

  it("can send the patient to Messages", () => {
    renderPage(
      <HelpPage />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Message care team",
      })
    );

    expect(
      screen.getByTestId(
        "current-location"
      )
    ).toHaveTextContent(
      "/messages"
    );
  });
});