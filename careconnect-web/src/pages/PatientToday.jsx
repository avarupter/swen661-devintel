import AppointmentCard from "../components/AppointmentCard.jsx";
import Button from "../components/Button.jsx";
import CareTeamCard from "../components/CareTeamCard.jsx";
import GlanceCard from "../components/GlanceCard.jsx";
import Icon from "../components/Icon.jsx";
import LaterItem from "../components/LaterItem.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { patientToday as d } from "../data/patientToday.js";

/**
 * Patient Today.
 *
 * There is ONE DOM order here and all three layouts use it:
 *
 *   header (meta, greeting, breadcrumb, call action)
 *   → plan (heading, progress, encouragement)
 *   → next thing to do
 *   → later today
 *   → today at a glance
 *   → your care team
 *   → privacy note
 *
 * That order reads correctly with a keyboard and a screen reader at every
 * width, so nothing needs CSS reordering. On desktop the last two become a
 * right-hand supporting column, which `grid-template-areas` does without
 * moving them in the DOM — the visual column is to the right, but tab order
 * still goes plan-then-support, which is the order the content makes sense in.
 */
export default function PatientToday() {
  return (
    <>
      <div className="cc-page__main">
        <header className="cc-page__header">
          <p className="cc-body cc-muted">{d.header.meta}</p>
          <h1 className="cc-display">{d.header.greeting}</h1>
          <nav className="cc-breadcrumb" aria-label="Breadcrumb">
            <ol>
              {d.header.breadcrumb.map((crumb, i) => {
                const isLast = i === d.header.breadcrumb.length - 1;
                return (
                  <li key={crumb}>
                    {isLast ? (
                      <span aria-current="page">{crumb}</span>
                    ) : (
                      <a href="#home">{crumb}</a>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="cc-page__headerAction">
            <Button variant="primary" icon="phone" fullWidth>
              {d.header.callAction}
            </Button>
          </div>
        </header>

        <section className="cc-plan" aria-labelledby="cc-plan-heading">
          <h2 className="cc-title" id="cc-plan-heading">
            {d.plan.heading}
          </h2>
          <ProgressBar
            percent={d.plan.progressPercent}
            label={d.plan.progressLabel}
          />
          <p className="cc-plan__note">{d.plan.encouragement}</p>
        </section>

        <div className="cc-page__next">
          <AppointmentCard data={d.next} />
        </div>

        <section className="cc-page__later" aria-labelledby="cc-later-heading">
          <h2 className="cc-section" id="cc-later-heading">
            {d.later.heading}
          </h2>
          <ul className="cc-later__list">
            {d.later.items.map((item) => (
              <LaterItem item={item} key={item.id} />
            ))}
          </ul>
        </section>
      </div>

      <div className="cc-page__support">
        <div className="cc-page__glance">
          <GlanceCard data={d.glance} />
        </div>

        <div className="cc-page__care">
          <CareTeamCard data={d.careTeam} />
        </div>
      </div>

      <p className="cc-privacy">
        <Icon name="shield" size={20} />
        <span>{d.privacy}</span>
      </p>
    </>
  );
}
