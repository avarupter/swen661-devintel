import AppointmentCard from "../components/AppointmentCard.jsx";
import Button from "../components/Button.jsx";
import CareTeamCard from "../components/CareTeamCard.jsx";
import GlanceCard from "../components/GlanceCard.jsx";
import Icon from "../components/Icon.jsx";
import LaterItem from "../components/LaterItem.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { patientToday as d } from "../data/patientToday.js";
import { useCareConnect } from "../context/CareConnectContext.jsx";

function activateRoute(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new window.PopStateEvent("popstate"));
}

function actionClicked(event) {
  return Boolean(
    event.target.closest("button, a")
  );
}

export default function PatientToday() {
  const {
    ready,
    markReady,
    callCaregiver,
  } = useCareConnect();

  const plan = ready
    ? {
        ...d.plan,
        progressPercent: 40,
        progressLabel: "4 of 10 things done today",
        encouragement:
          "You're ready for your next appointment",
      }
    : d.plan;

  const next = ready
    ? {
        ...d.next,
        badge: "Ready",
        readiness: "You are ready",
        action: "Ready",
      }
    : d.next;

  const glance = ready
    ? {
        ...d.glance,
        items: d.glance.items.map((item) =>
          item.id === "completed"
            ? {
                ...item,
                value: "4 things done",
              }
            : item
        ),
      }
    : d.glance;

  return (
    <>
      <div className="cc-page__main">
        <header className="cc-page__header">
          <p className="cc-body cc-muted">
            {d.header.meta}
          </p>

          <h1 className="cc-display">
            {d.header.greeting}
          </h1>

          <nav
            className="cc-breadcrumb"
            aria-label="Breadcrumb"
          >
            <ol>
              {d.header.breadcrumb.map((crumb, index) => {
                const isLast =
                  index === d.header.breadcrumb.length - 1;

                return (
                  <li key={crumb}>
                    {isLast ? (
                      <span aria-current="page">
                        {crumb}
                      </span>
                    ) : (
                      <a href="#home">
                        {crumb}
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div
            className="cc-page__headerAction"
            onClick={(event) => {
              if (actionClicked(event)) {
                callCaregiver();
              }
            }}
          >
            <Button
              variant="primary"
              icon="phone"
              fullWidth
            >
              {d.header.callAction}
            </Button>
          </div>
        </header>

        <section
          className="cc-plan"
          aria-labelledby="cc-plan-heading"
        >
          <h2
            className="cc-title"
            id="cc-plan-heading"
          >
            {plan.heading}
          </h2>

          <ProgressBar
            percent={plan.progressPercent}
            label={plan.progressLabel}
          />

          <p className="cc-plan__note">
            {plan.encouragement}
          </p>
        </section>

        <div
          className="cc-page__next"
          onClick={(event) => {
            if (
              actionClicked(event) &&
              !ready
            ) {
              markReady();
            }
          }}
        >
          <AppointmentCard data={next} />
        </div>

        <section
          className="cc-page__later"
          aria-labelledby="cc-later-heading"
        >
          <h2
            className="cc-section"
            id="cc-later-heading"
          >
            {d.later.heading}
          </h2>

          <ul className="cc-later__list">
            {d.later.items.map((item) => (
              <LaterItem
                item={item}
                key={item.id}
              />
            ))}
          </ul>
        </section>
      </div>

      <div className="cc-page__support">
        <div className="cc-page__glance">
          <GlanceCard data={glance} />
        </div>

        <div
          className="cc-page__care"
          onClick={(event) => {
            if (actionClicked(event)) {
              activateRoute("/messages");
            }
          }}
        >
          <CareTeamCard data={d.careTeam} />
        </div>
      </div>

      <p className="cc-privacy">
        <Icon
          name="shield"
          size={20}
        />

        <span>{d.privacy}</span>
      </p>
    </>
  );
}