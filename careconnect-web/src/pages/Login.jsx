import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Mark } from "../components/Icon.jsx";
import { useCareConnect } from "../context/CareConnectContext.jsx";

export default function Login() {
  const navigate = useNavigate();

  const {
    login,
    toast,
  } = useCareConnect();

  const [email, setEmail] = useState(
    "patient@careconnect.demo"
  );

  const [password, setPassword] = useState(
    "Care123!"
  );

  function handleSubmit(event) {
    event.preventDefault();

    if (login(email, password)) {
      navigate("/");
    }
  }

  return (
    <main
      className="cc-login"
      id="main"
      tabIndex={-1}
    >
      <div className="cc-login__shell">
        <section
          className="cc-login__welcome"
          aria-labelledby="login-welcome-heading"
        >
          <div className="cc-login__logo">
            <Mark size={56} />

            <div>
              <p className="cc-login__brand">
                CareConnect
              </p>

              <p className="cc-login__subbrand">
                Daily Compass
              </p>
            </div>
          </div>

          <h1
            className="cc-display"
            id="login-welcome-heading"
          >
            Your day, made easier.
          </h1>

          <p className="cc-body">
            Keep your medications, appointments,
            messages, daily activities, and care team
            together in one simple place.
          </p>

          <ul className="cc-login__benefits">
            <li>Easy-to-follow daily reminders</li>
            <li>Messages from people who support you</li>
            <li>Accessible on phone, tablet, and computer</li>
          </ul>
        </section>

        <section
          className="cc-login__card"
          aria-labelledby="signin-heading"
        >
          <p className="cc-body cc-muted">
            Patient account
          </p>

          <h2
            className="cc-title"
            id="signin-heading"
          >
            Welcome back, Joyce
          </h2>

          <p className="cc-body">
            Sign in to continue to your CareConnect
            Daily Compass.
          </p>

          {toast?.tone === "error" ? (
            <div
              className="cc-form-message is-error"
              role="alert"
            >
              {toast.text}
            </div>
          ) : null}

          <form
            className="cc-form"
            onSubmit={handleSubmit}
          >
            <div className="cc-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="cc-field">
              <label htmlFor="login-password">
                Password
              </label>

              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </div>

            <button
              className="cc-primary-action"
              type="submit"
            >
              Sign in
            </button>
          </form>

          <div className="cc-login__demo">
            <strong>Demo account</strong>

            <span>
              patient@careconnect.demo
            </span>

            <span>
              Password: Care123!
            </span>
          </div>

          <p className="cc-body cc-muted">
            Your information is private and secure.
          </p>
        </section>
      </div>
    </main>
  );
}