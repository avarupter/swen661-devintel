import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useCareConnect } from "../context/CareConnectContext.jsx";

const medicationFeedback = [
  "Feel better",
  "No change",
  "Could not sleep well",
  "Loss of appetite",
  "Felt tired",
  "Other concern",
];

function PageHeader({
  title,
  description,
}) {
  return (
    <header className="cc-feature-header">
      <p className="cc-body cc-muted">
        Patient account
      </p>

      <h1 className="cc-display">
        {title}
      </h1>

      {description ? (
        <p className="cc-body">
          {description}
        </p>
      ) : null}

      <nav
        className="cc-breadcrumb"
        aria-label="Breadcrumb"
      >
        <ol>
          <li>
            <Link to="/">
              Patient account
            </Link>
          </li>

          <li>
            <span aria-current="page">
              {title}
            </span>
          </li>
        </ol>
      </nav>
    </header>
  );
}

function routineState(routine) {
  if (routine.taken) {
    return {
      key: "taken",
      label:
        routine.kind === "activity"
          ? "Completed"
          : "Taken",
    };
  }

  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  if (currentMinutes > routine.minutes) {
    return {
      key: "missed",
      label: "Missed",
    };
  }

  const difference =
    routine.minutes - currentMinutes;

  if (difference <= 60) {
    return {
      key: "soon",
      label: "Due soon",
    };
  }

  return {
    key: "upcoming",
    label: "Upcoming",
  };
}

export function MedicationsPage() {
  const {
    routines,
    toggleRoutine,
    updateRoutineNotes,
    toggleRoutineFeedback,
  } = useCareConnect();

  return (
    <div className="cc-feature-page">
      <PageHeader
        title="Medications"
        description="Keep track of medications and daily activities at your own pace."
      />

      <section
        aria-labelledby="routine-heading"
        className="cc-feature-section"
      >
        <div className="cc-section-heading">
          <div>
            <h2
              className="cc-title"
              id="routine-heading"
            >
              Today's plan
            </h2>

            <p className="cc-body cc-muted">
              A missed time is shown with both text
              and color so the status never depends
              on color alone.
            </p>
          </div>
        </div>

        <div className="cc-routine-grid">
          {routines.map((routine) => {
            const status = routineState(routine);

            const controlLabel =
              routine.kind === "activity"
                ? routine.taken
                  ? "Mark not completed"
                  : "Mark complete"
                : routine.taken
                  ? "Mark as not taken"
                  : "Mark as taken";

            return (
              <article
                className={`cc-routine-card is-${status.key}`}
                key={routine.id}
                aria-labelledby={`${routine.id}-title`}
              >
                <div className="cc-routine-card__top">
                  <div>
                    <p className="cc-routine-type">
                      {routine.kind === "activity"
                        ? "Daily activity"
                        : "Medication"}
                    </p>

                    <h3
                      className="cc-section"
                      id={`${routine.id}-title`}
                    >
                      {routine.title}
                    </h3>
                  </div>

                  <span
                    className={`cc-status-pill is-${status.key}`}
                    aria-live="polite"
                  >
                    {status.label}
                  </span>
                </div>

                <p className="cc-routine-time">
                  {routine.time}
                </p>

                <p className="cc-body">
                  {routine.detail}
                </p>

                {routine.completedAt ? (
                  <p className="cc-body cc-muted">
                    Recorded at {routine.completedAt}
                  </p>
                ) : null}

                <button
                  className="cc-primary-action"
                  type="button"
                  onClick={() =>
                    toggleRoutine(routine.id)
                  }
                >
                  {controlLabel}
                </button>

                {routine.kind === "medication" ? (
                  <fieldset className="cc-feedback">
                    <legend>
                      How are you feeling?
                    </legend>

                    <p className="cc-body cc-muted">
                      Select any that apply.
                    </p>

                    <div className="cc-chip-group">
                      {medicationFeedback.map(
                        (feedbackItem) => {
                          const selected =
                            routine.feedback.includes(
                              feedbackItem
                            );

                          return (
                            <button
                              key={feedbackItem}
                              className={`cc-chip${
                                selected
                                  ? " is-selected"
                                  : ""
                              }`}
                              type="button"
                              aria-pressed={selected}
                              onClick={() =>
                                toggleRoutineFeedback(
                                  routine.id,
                                  feedbackItem
                                )
                              }
                            >
                              {feedbackItem}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </fieldset>
                ) : null}

                <div className="cc-field">
                  <label
                    htmlFor={`${routine.id}-notes`}
                  >
                    Notes
                  </label>

                  <textarea
                    id={`${routine.id}-notes`}
                    rows="3"
                    placeholder={
                      routine.kind === "activity"
                        ? "Add a note about your walk or activity."
                        : "Add a note about this medication."
                    }
                    value={routine.notes}
                    onChange={(event) =>
                      updateRoutineNotes(
                        routine.id,
                        event.target.value
                      )
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function appointmentForDate(
  appointments,
  dateKey
) {
  return appointments.filter(
    (appointment) =>
      appointment.dateKey === dateKey
  );
}

function dateKeyFor(year, month, day) {
  const monthText =
    String(month + 1).padStart(2, "0");

  const dayText =
    String(day).padStart(2, "0");

  return `${year}-${monthText}-${dayText}`;
}

function AppointmentSummary({
  appointment,
  confirmAppointment,
}) {
  return (
    <article
      className="cc-appointment-item"
      aria-labelledby={`${appointment.id}-heading`}
    >
      <div>
        <p className="cc-body cc-muted">
          {appointment.dateLabel}
          {" Â· "}
          {appointment.time}
        </p>

        <h3
          className="cc-section"
          id={`${appointment.id}-heading`}
        >
          {appointment.title}
        </h3>

        <p className="cc-body">
          {appointment.type}
        </p>

        <p className="cc-body">
          {appointment.detail}
        </p>

        <p className="cc-appointment-status">
          Status:
          {" "}
          {appointment.confirmed
            ? "Confirmed"
            : "Needs confirmation"}
        </p>
      </div>

      <button
        className="cc-secondary-action"
        type="button"
        disabled={appointment.confirmed}
        onClick={() =>
          confirmAppointment(appointment.id)
        }
      >
        {appointment.confirmed
          ? "Confirmed"
          : "Confirm appointment"}
      </button>
    </article>
  );
}

export function AppointmentsPage() {
  const {
    appointments,
    confirmAppointment,
  } = useCareConnect();

  const [view, setView] =
    useState("calendar");

  const [monthDate, setMonthDate] =
    useState(new Date(2026, 5, 1));

  const [
    selectedAppointmentId,
    setSelectedAppointmentId,
  ] = useState(null);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const monthLabel =
    monthDate.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );

  const firstWeekday =
    new Date(year, month, 1).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const calendarCells =
    Array.from(
      { length: 42 },
      (_, index) => {
        const day =
          index - firstWeekday + 1;

        if (
          day < 1 ||
          day > daysInMonth
        ) {
          return null;
        }

        return day;
      }
    );

  const selectedAppointment =
    appointments.find(
      (appointment) =>
        appointment.id ===
        selectedAppointmentId
    );

  return (
    <div className="cc-feature-page">
      <PageHeader
        title="Appointments"
        description="See appointments on a calendar or switch to an easy-to-read list."
      />

      <section
        className="cc-feature-section"
        aria-labelledby="appointments-heading"
      >
        <div className="cc-section-heading">
          <h2
            className="cc-title"
            id="appointments-heading"
          >
            Your appointments
          </h2>

          <div
            className="cc-view-toggle"
            aria-label="Appointment view"
          >
            <button
              type="button"
              aria-pressed={
                view === "calendar"
              }
              onClick={() =>
                setView("calendar")
              }
            >
              Calendar view
            </button>

            <button
              type="button"
              aria-pressed={
                view === "list"
              }
              onClick={() =>
                setView("list")
              }
            >
              List view
            </button>
          </div>
        </div>

        {view === "calendar" ? (
          <>
            <div className="cc-calendar-controls">
              <button
                type="button"
                className="cc-secondary-action"
                onClick={() =>
                  setMonthDate(
                    new Date(
                      year,
                      month - 1,
                      1
                    )
                  )
                }
                aria-label="Previous month"
              >
                Previous
              </button>

              <h3 className="cc-section">
                {monthLabel}
              </h3>

              <button
                type="button"
                className="cc-secondary-action"
                onClick={() =>
                  setMonthDate(
                    new Date(
                      year,
                      month + 1,
                      1
                    )
                  )
                }
                aria-label="Next month"
              >
                Next
              </button>
            </div>

            <div
              className="cc-calendar-wrap"
              tabIndex="0"
            >
              <table
                className="cc-calendar"
                aria-label={`${monthLabel} appointments calendar`}
              >
                <caption className="cc-sr-only">
                  {monthLabel} appointment calendar
                </caption>

                <thead>
                  <tr>
                    {[
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ].map((dayName) => (
                      <th
                        key={dayName}
                        scope="col"
                      >
                        {dayName}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Array.from(
                    { length: 6 },
                    (_, weekIndex) => (
                      <tr key={weekIndex}>
                        {calendarCells
                          .slice(
                            weekIndex * 7,
                            weekIndex * 7 + 7
                          )
                          .map(
                            (
                              day,
                              dayIndex
                            ) => {
                              if (!day) {
                                return (
                                  <td
                                    key={dayIndex}
                                    className="is-empty"
                                  />
                                );
                              }

                              const dateKey =
                                dateKeyFor(
                                  year,
                                  month,
                                  day
                                );

                              const dayAppointments =
                                appointmentForDate(
                                  appointments,
                                  dateKey
                                );

                              return (
                                <td
                                  key={dateKey}
                                >
                                  <span className="cc-calendar-day">
                                    {day}
                                  </span>

                                  {dayAppointments.map(
                                    (
                                      appointment
                                    ) => (
                                      <button
                                        type="button"
                                        className="cc-calendar-event"
                                        key={
                                          appointment.id
                                        }
                                        onClick={() =>
                                          setSelectedAppointmentId(
                                            appointment.id
                                          )
                                        }
                                        aria-label={`${appointment.title}, ${appointment.time}`}
                                      >
                                        {
                                          appointment.time
                                        }
                                        <span>
                                          {
                                            appointment.title
                                          }
                                        </span>
                                      </button>
                                    )
                                  )}
                                </td>
                              );
                            }
                          )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {selectedAppointment ? (
              <div className="cc-selected-appointment">
                <h3 className="cc-section">
                  Selected appointment
                </h3>

                <AppointmentSummary
                  appointment={
                    selectedAppointment
                  }
                  confirmAppointment={
                    confirmAppointment
                  }
                />
              </div>
            ) : (
              <p className="cc-body cc-muted">
                Select an appointment on the
                calendar to see its details.
              </p>
            )}
          </>
        ) : (
          <div className="cc-appointment-list">
            {appointments.map(
              (appointment) => (
                <AppointmentSummary
                  appointment={appointment}
                  confirmAppointment={
                    confirmAppointment
                  }
                  key={appointment.id}
                />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export function MessagesPage() {
  const {
    messages,
    sendMessage,
    markMessagesRead,
  } = useCareConnect();

  const [message, setMessage] =
    useState("");

  const markedRead = useRef(false);

  useEffect(() => {
    if (!markedRead.current) {
      markedRead.current = true;
      markMessagesRead();
    }
  }, [markMessagesRead]);

  function handleSubmit(event) {
    event.preventDefault();

    if (sendMessage(message)) {
      setMessage("");
    }
  }

  return (
    <div className="cc-feature-page">
      <PageHeader
        title="Messages"
        description="Stay connected with your care team and family support."
      />

      <section
        className="cc-feature-section"
        aria-labelledby="message-heading"
      >
        <h2
          className="cc-title"
          id="message-heading"
        >
          Message queue
        </h2>

        <div
          className="cc-message-list"
          role="list"
          aria-label="Patient messages"
        >
          {messages.map((item) => (
            <article
              className={`cc-message is-${item.direction}`}
              key={item.id}
              role="listitem"
            >
              <div className="cc-message__meta">
                <strong>
                  {item.sender}
                </strong>

                <span>
                  {item.time}
                </span>
              </div>

              <p className="cc-body">
                {item.text}
              </p>

              {item.direction === "inbound" &&
              !item.read ? (
                <span className="cc-message__unread">
                  Unread
                </span>
              ) : null}
            </article>
          ))}
        </div>

        <form
          className="cc-composer"
          onSubmit={handleSubmit}
        >
          <div className="cc-field">
            <label htmlFor="patient-message">
              Message your care team
            </label>

            <textarea
              id="patient-message"
              rows="5"
              placeholder="Type your message here."
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              required
            />
          </div>

          <button
            type="submit"
            className="cc-primary-action"
          >
            Send message
          </button>
        </form>
      </section>
    </div>
  );
}

const quickPrompts = [
  "Help with my medications",
  "Show me how appointments work",
  "How do I send a message?",
  "I need accessibility help",
  "How do I sign out?",
];

function assistantReply(question) {
  const text =
    question.toLowerCase();

  if (
    text.includes("emergency") ||
    text.includes("urgent")
  ) {
    return "If you are experiencing a medical emergency, call 911 now. For a non-emergency health concern, contact your care team through Messages.";
  }

  if (
    text.includes("medication") ||
    text.includes("medicine")
  ) {
    return "Open Medications to see today's medication schedule. You can mark a medication as taken, see when one is missed, add notes, and record how you felt afterward.";
  }

  if (
    text.includes("appointment") ||
    text.includes("calendar")
  ) {
    return "Open Appointments to use either Calendar view or List view. Select an appointment to see details and confirm visits that still need confirmation.";
  }

  if (
    text.includes("message")
  ) {
    return "Open Messages, type your message in the Message your care team box, and select Send message. CareConnect will confirm with a Message Sent notification.";
  }

  if (
    text.includes("accessibility") ||
    text.includes("keyboard")
  ) {
    return "CareConnect supports keyboard navigation, visible focus, labeled controls, screen-reader landmarks, non-color status labels, and responsive layouts. Use Tab to move forward and Shift plus Tab to move backward.";
  }

  if (
    text.includes("sign out") ||
    text.includes("logout")
  ) {
    return "Select Sign out near your account information. CareConnect will ask you to confirm before ending your session.";
  }

  if (
    text.includes("care team") ||
    text.includes("person")
  ) {
    return "I can help you navigate CareConnect. For personal medical advice or questions about your care, please message your care team.";
  }

  return "I can help with CareConnect medications, appointments, messages, accessibility, and account navigation. Choose one of the suggested questions or tell me what you need help finding.";
}

export function HelpPage() {
  const navigate = useNavigate();

  const [messages, setMessages] =
    useState([
      {
        id: "assistant-welcome",
        role: "assistant",
        text:
          "Hi Joyce. I'm your CareConnect Assistant. I can help you find your medications, appointments, messages, and other features. What would you like help with?",
      },
    ]);

  const [question, setQuestion] =
    useState("");

  function askAssistant(text) {
    const cleanQuestion =
      text.trim();

    if (!cleanQuestion) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: cleanQuestion,
      },
      {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        text:
          assistantReply(
            cleanQuestion
          ),
      },
    ]);

    setQuestion("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    askAssistant(question);
  }

  return (
    <div className="cc-feature-page">
      <PageHeader
        title="Help"
        description="Get simple guidance for using CareConnect."
      />

      <section
        className="cc-assistant"
        aria-labelledby="assistant-heading"
      >
        <div className="cc-assistant__header">
          <div>
            <p className="cc-assistant__eyebrow">
              CareConnect Assistant
            </p>

            <h2
              className="cc-title"
              id="assistant-heading"
            >
              How can I help?
            </h2>
          </div>

          <span className="cc-assistant__status">
            Available
          </span>
        </div>

        <p className="cc-body cc-muted">
          This assistant helps with using
          CareConnect. It does not diagnose
          medical conditions or replace your
          care team.
        </p>

        <div
          className="cc-assistant__messages"
          aria-live="polite"
          aria-label="Assistant conversation"
        >
          {messages.map((item) => (
            <div
              className={`cc-assistant-message is-${item.role}`}
              key={item.id}
            >
              <strong>
                {item.role === "assistant"
                  ? "CareConnect Assistant"
                  : "You"}
              </strong>

              <p>{item.text}</p>
            </div>
          ))}
        </div>

        <div
          className="cc-quick-prompts"
          aria-label="Suggested questions"
        >
          {quickPrompts.map(
            (prompt) => (
              <button
                type="button"
                className="cc-chip"
                key={prompt}
                onClick={() =>
                  askAssistant(prompt)
                }
              >
                {prompt}
              </button>
            )
          )}
        </div>

        <form
          className="cc-composer"
          onSubmit={handleSubmit}
        >
          <div className="cc-field">
            <label htmlFor="assistant-question">
              Ask the CareConnect Assistant
            </label>

            <input
              id="assistant-question"
              type="text"
              value={question}
              placeholder="Example: How do I check my medications?"
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
            />
          </div>

          <button
            type="submit"
            className="cc-primary-action"
          >
            Ask
          </button>
        </form>

        <div className="cc-human-help">
          <div>
            <h3 className="cc-section">
              Need a person?
            </h3>

            <p className="cc-body">
              Send a message directly to your
              care team.
            </p>
          </div>

          <button
            type="button"
            className="cc-secondary-action"
            onClick={() =>
              navigate("/messages")
            }
          >
            Message care team
          </button>
        </div>
      </section>
    </div>
  );
}