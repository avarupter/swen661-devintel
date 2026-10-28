import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const CareConnectContext = createContext({
  isAuthenticated: true,
  ready: false,
  routines: [],
  appointments: [],
  messages: [],
  unreadMessages: 0,
  toast: null,
  login: () => false,
  logout: () => {},
  markReady: () => {},
  callCaregiver: () => {},
  toggleRoutine: () => {},
  updateRoutineNotes: () => {},
  toggleRoutineFeedback: () => {},
  confirmAppointment: () => {},
  sendMessage: () => false,
  markMessagesRead: () => {},
  notify: () => {},
  clearToast: () => {},
});

const initialRoutines = [
  {
    id: "morning-medication",
    kind: "medication",
    title: "Morning medication",
    detail: "1 tablet with breakfast",
    time: "8:00 am",
    minutes: 480,
    taken: true,
    completedAt: "8:05 am",
    notes: "",
    feedback: [],
  },
  {
    id: "vitamin-d",
    kind: "medication",
    title: "Vitamin D",
    detail: "Take with your morning meal",
    time: "9:00 am",
    minutes: 540,
    taken: true,
    completedAt: "9:10 am",
    notes: "",
    feedback: [],
  },
  {
    id: "midday-medication",
    kind: "medication",
    title: "Midday medication",
    detail: "1 tablet with water",
    time: "12:30 pm",
    minutes: 750,
    taken: false,
    completedAt: null,
    notes: "",
    feedback: [],
  },
  {
    id: "afternoon-walk",
    kind: "activity",
    title: "Take a walk",
    detail: "15â€“20 minutes at a comfortable pace",
    time: "4:00 pm",
    minutes: 960,
    taken: false,
    completedAt: null,
    notes: "",
    feedback: [],
  },
  {
    id: "evening-medication",
    kind: "medication",
    title: "Evening medication",
    detail: "Take with a glass of water",
    time: "6:00 pm",
    minutes: 1080,
    taken: false,
    completedAt: null,
    notes: "",
    feedback: [],
  },
  {
    id: "bedtime-medication",
    kind: "medication",
    title: "Bedtime medication",
    detail: "Take before preparing for bed",
    time: "9:00 pm",
    minutes: 1260,
    taken: false,
    completedAt: null,
    notes: "",
    feedback: [],
  },
];

const initialAppointments = [
  {
    id: "maria-video",
    dateKey: "2026-06-04",
    dateLabel: "Thursday, June 4",
    time: "3:00 pm",
    title: "Video call with Maria",
    type: "Video visit",
    detail: "Your daughter â€” she will call you",
    confirmed: true,
  },
  {
    id: "wellness-check",
    dateKey: "2026-06-12",
    dateLabel: "Friday, June 12",
    time: "10:30 am",
    title: "Wellness check",
    type: "Care appointment",
    detail: "Routine wellness follow-up",
    confirmed: false,
  },
  {
    id: "therapy",
    dateKey: "2026-06-18",
    dateLabel: "Thursday, June 18",
    time: "2:00 pm",
    title: "Physical therapy",
    type: "In-person appointment",
    detail: "Mobility and strength follow-up",
    confirmed: true,
  },
  {
    id: "nurse-follow-up",
    dateKey: "2026-06-25",
    dateLabel: "Thursday, June 25",
    time: "11:00 am",
    title: "Nurse follow-up",
    type: "Phone appointment",
    detail: "Review how your week has been going",
    confirmed: false,
  },
];

const initialMessages = [
  {
    id: "message-1",
    sender: "Maria",
    direction: "inbound",
    text: "Good morning, Mom. I will call you at 3:00 today.",
    time: "8:15 am",
    read: false,
  },
  {
    id: "message-2",
    sender: "Care team",
    direction: "inbound",
    text: "Your wellness appointment is coming up next week.",
    time: "9:40 am",
    read: false,
  },
  {
    id: "message-3",
    sender: "Joyce",
    direction: "outbound",
    text: "Thank you. I have it on my calendar.",
    time: "10:05 am",
    read: true,
  },
];

function startingAuthentication() {
  if (import.meta.env.MODE === "test") {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem("cc-auth") === "true";
}

export function CareConnectProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    startingAuthentication
  );

  const [ready, setReady] = useState(false);
  const [routines, setRoutines] = useState(initialRoutines);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [messages, setMessages] = useState(initialMessages);
  const [toast, setToast] = useState(null);

  const notify = useCallback((text, tone = "info") => {
    setToast({
      id: Date.now(),
      text,
      tone,
    });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const login = useCallback(
    (email, password) => {
      const validEmail =
        email.trim().toLowerCase() === "patient@careconnect.demo";

      const validPassword = password === "Care123!";

      if (!validEmail || !validPassword) {
        notify(
          "The email or password did not match the CareConnect demo account.",
          "error"
        );

        return false;
      }

      window.sessionStorage.setItem("cc-auth", "true");
      setIsAuthenticated(true);

      notify("Welcome back, Joyce.", "success");

      return true;
    },
    [notify]
  );

  const logout = useCallback(() => {
    window.sessionStorage.removeItem("cc-auth");
    setIsAuthenticated(false);
    notify("You have signed out.", "info");
  }, [notify]);

  const markReady = useCallback(() => {
    setReady(true);

    notify(
      "You are marked ready for your 3:00 pm appointment.",
      "success"
    );
  }, [notify]);

  const callCaregiver = useCallback(() => {
    notify(
      "Caregiver call request started. This demonstration does not place a real phone call.",
      "info"
    );
  }, [notify]);

  const toggleRoutine = useCallback(
    (id) => {
      setRoutines((current) =>
        current.map((routine) => {
          if (routine.id !== id) {
            return routine;
          }

          const nextTaken = !routine.taken;

          return {
            ...routine,
            taken: nextTaken,
            completedAt: nextTaken
              ? new Date().toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : null,
          };
        })
      );

      notify("Daily routine status updated.", "success");
    },
    [notify]
  );

  const updateRoutineNotes = useCallback((id, notes) => {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === id
          ? {
              ...routine,
              notes,
            }
          : routine
      )
    );
  }, []);

  const toggleRoutineFeedback = useCallback((id, feedbackItem) => {
    setRoutines((current) =>
      current.map((routine) => {
        if (routine.id !== id) {
          return routine;
        }

        const selected = routine.feedback.includes(feedbackItem);

        return {
          ...routine,
          feedback: selected
            ? routine.feedback.filter((item) => item !== feedbackItem)
            : [...routine.feedback, feedbackItem],
        };
      })
    );
  }, []);

  const confirmAppointment = useCallback(
    (id) => {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === id
            ? {
                ...appointment,
                confirmed: true,
              }
            : appointment
        )
      );

      notify("Appointment confirmed.", "success");
    },
    [notify]
  );

  const sendMessage = useCallback(
    (text) => {
      const cleanMessage = text.trim();

      if (!cleanMessage) {
        notify("Enter a message before sending.", "error");
        return false;
      }

      setMessages((current) => [
        ...current,
        {
          id: `message-${Date.now()}`,
          sender: "Joyce",
          direction: "outbound",
          text: cleanMessage,
          time: new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          read: true,
        },
      ]);

      notify("Message Sent", "success");

      return true;
    },
    [notify]
  );

  const markMessagesRead = useCallback(() => {
    setMessages((current) =>
      current.map((message) =>
        message.direction === "inbound"
          ? {
              ...message,
              read: true,
            }
          : message
      )
    );
  }, []);

  const unreadMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.direction === "inbound" && !message.read
      ).length,
    [messages]
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      ready,
      routines,
      appointments,
      messages,
      unreadMessages,
      toast,
      login,
      logout,
      markReady,
      callCaregiver,
      toggleRoutine,
      updateRoutineNotes,
      toggleRoutineFeedback,
      confirmAppointment,
      sendMessage,
      markMessagesRead,
      notify,
      clearToast,
    }),
    [
      isAuthenticated,
      ready,
      routines,
      appointments,
      messages,
      unreadMessages,
      toast,
      login,
      logout,
      markReady,
      callCaregiver,
      toggleRoutine,
      updateRoutineNotes,
      toggleRoutineFeedback,
      confirmAppointment,
      sendMessage,
      markMessagesRead,
      notify,
      clearToast,
    ]
  );

  return (
    <CareConnectContext.Provider value={value}>
      {children}
    </CareConnectContext.Provider>
  );
}

export function useCareConnect() {
  return useContext(CareConnectContext);
}