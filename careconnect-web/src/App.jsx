import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Nav from "./components/Nav.jsx";
import PatientToday from "./pages/PatientToday.jsx";
import Specimens from "./pages/Specimens.jsx";
import Login from "./pages/Login.jsx";

import {
  AppointmentsPage,
  HelpPage,
  MedicationsPage,
  MessagesPage,
} from "./pages/PatientPages.jsx";

import { Mark } from "./components/Icon.jsx";

import {
  patientToday as d,
} from "./data/patientToday.js";

import {
  CareConnectProvider,
  useCareConnect,
} from "./context/CareConnectContext.jsx";

import "./styles/index.css";
import "./styles/week11.css";

function subscribeToHash(onChange) {
  window.addEventListener(
    "hashchange",
    onChange
  );

  return () =>
    window.removeEventListener(
      "hashchange",
      onChange
    );
}

let evidenceView = "app";

function readEvidenceView() {
  const hash =
    window.location.hash;

  if (hash === "#specimens") {
    evidenceView = "sheet";
    return evidenceView;
  }

  if (
    hash === "#main" ||
    hash === "#"
  ) {
    return evidenceView;
  }

  evidenceView = "app";
  return evidenceView;
}

const PATH_TO_DESTINATION = {
  "/": "home",
  "/medications": "medications",
  "/appointments": "appointments",
  "/messages": "messages",
  "/help": "help",
};

function PatientRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<PatientToday />}
      />

      <Route
        path="/medications"
        element={<MedicationsPage />}
      />

      <Route
        path="/appointments"
        element={<AppointmentsPage />}
      />

      <Route
        path="/messages"
        element={<MessagesPage />}
      />

      <Route
        path="/help"
        element={<HelpPage />}
      />

      <Route
        path="*"
        element={<PatientToday />}
      />
    </Routes>
  );
}

function Toast({
  toast,
  clearToast,
}) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        clearToast,
        4500
      );

    return () =>
      window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) {
    return null;
  }

  return (
    <div
      className={`cc-toast is-${toast.tone}`}
      role={
        toast.tone === "error"
          ? "alert"
          : "status"
      }
      aria-live={
        toast.tone === "error"
          ? "assertive"
          : "polite"
      }
    >
      <span>
        {toast.text}
      </span>

      <button
        type="button"
        onClick={clearToast}
        aria-label="Dismiss notification"
      >
        Dismiss
      </button>
    </div>
  );
}

function SignOutDialog({
  open,
  onCancel,
  onConfirm,
}) {
  const stayButton =
    useRef(null);

  const signOutButton =
    useRef(null);

  useEffect(() => {
    if (open) {
      stayButton.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    if (
      event.shiftKey &&
      document.activeElement ===
        stayButton.current
    ) {
      event.preventDefault();
      signOutButton.current?.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement ===
        signOutButton.current
    ) {
      event.preventDefault();
      stayButton.current?.focus();
    }
  }

  return (
    <div
      className="cc-dialog-backdrop"
      onKeyDown={handleKeyDown}
    >
      <section
        className="cc-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-heading"
        aria-describedby="signout-description"
      >
        <h2
          className="cc-title"
          id="signout-heading"
        >
          Are you sure you want to sign out?
        </h2>

        <p
          className="cc-body"
          id="signout-description"
        >
          You will need to sign in again to
          return to your CareConnect Daily
          Compass.
        </p>

        <div className="cc-dialog__actions">
          <button
            ref={stayButton}
            className="cc-secondary-action"
            type="button"
            onClick={onCancel}
          >
            Stay signed in
          </button>

          <button
            ref={signOutButton}
            className="cc-primary-action"
            type="button"
            onClick={onConfirm}
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

function AppShell() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const {
    isAuthenticated,
    unreadMessages,
    toast,
    clearToast,
    logout,
  } = useCareConnect();

  const [
    confirmingSignOut,
    setConfirmingSignOut,
  ] = useState(false);

  const showsSheet =
    useSyncExternalStore(
      subscribeToHash,
      readEvidenceView
    ) === "sheet";

  if (
    location.pathname === "/login" ||
    !isAuthenticated
  ) {
    return (
      <>
        <Login />

        <Toast
          toast={
            toast?.tone === "error"
              ? toast
              : null
          }
          clearToast={clearToast}
        />
      </>
    );
  }

  const currentDestination =
    showsSheet
      ? null
      : PATH_TO_DESTINATION[
          location.pathname
        ] ?? "home";

  function confirmLogout() {
    setConfirmingSignOut(false);
    logout();
    navigate("/login");
  }

  return (
    <div className="cc-app">
      <a
        className="cc-skip"
        href="#main"
      >
        Skip to main content
      </a>

      <header className="cc-appbar">
        <div className="cc-appbar__brand">
          <Mark size={40} />

          <span className="cc-appbar__name">
            {d.appName}
          </span>
        </div>

        <div className="cc-account-actions">
          <p className="cc-appbar__account">
            <span className="cc-appbar__accountText">
              {`${d.account.name} · ${d.account.role}`}
            </span>

            <span
              className="cc-appbar__avatar"
              aria-hidden="true"
            >
              {d.account.initials}
            </span>
          </p>

          <button
            className="cc-signout"
            type="button"
            onClick={() =>
              setConfirmingSignOut(true)
            }
          >
            Sign out
          </button>
        </div>
      </header>

      <Nav
        variant="tabs"
        current={currentDestination}
        unreadMessages={
          unreadMessages
        }
      />

      <div className="cc-shell">
        <Nav
          variant="sidebar"
          current={
            currentDestination
          }
          unreadMessages={
            unreadMessages
          }
        />

        <main
          className={`cc-page${
            showsSheet
              ? " cc-page--sheet"
              : ""
          }`}
          id="main"
          tabIndex={-1}
        >
          {showsSheet ? (
            <Specimens />
          ) : (
            <PatientRoutes />
          )}
        </main>
      </div>

      <footer className="cc-evidence-nav">
        <a
          href={
            showsSheet
              ? "#home"
              : "#specimens"
          }
        >
          {showsSheet
            ? "Back to Patient Today"
            : "Design system"}
        </a>
      </footer>

      <Nav
        variant="bar"
        current={currentDestination}
        unreadMessages={
          unreadMessages
        }
      />

      <Toast
        toast={toast}
        clearToast={clearToast}
      />

      <SignOutDialog
        open={confirmingSignOut}
        onCancel={() =>
          setConfirmingSignOut(false)
        }
        onConfirm={confirmLogout}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CareConnectProvider>
        <AppShell />
      </CareConnectProvider>
    </BrowserRouter>
  );
}