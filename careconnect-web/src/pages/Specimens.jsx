import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import Icon from "../components/Icon.jsx";
import TextField from "../components/TextField.jsx";
import { COLOR_TOKENS, STATUS_BADGES, TYPE_STEPS } from "../data/foundations.js";

/**
 * The foundations & component-states sheet from the Figma handoff.
 *
 * Two deliberate choices worth knowing before reading the markup:
 *
 * 1. Nothing here repeats a value the stylesheet already owns. The swatch
 *    captions and the type metrics are read from the live computed styles after
 *    mount, so the sheet reports what the app actually renders rather than a
 *    hand-copied duplicate that can drift out of date.
 *
 * 2. A focus state cannot be screenshotted without something genuinely being
 *    focused, so the focus specimens are REAL controls and the ring you see is
 *    the app's own :focus-visible ring, not a painted imitation. The default
 *    and selected navigation specimens are the opposite case: they are pictures
 *    of a state, so they render as <span>, which cannot be focused or activated
 *    and cannot make the false claim that this page is the current page.
 */
/**
 * Reads what the stylesheet actually resolves to, once per page load.
 *
 * Memoised at module scope rather than held in state: the values cannot change
 * without a reload, so state would only buy a second render and one frame of
 * placeholder dashes in the captions. The probe element is appended and removed
 * within this call, so React never sees a DOM it did not write.
 *
 * No guard against a missing `document`: this runs during render, and the app
 * mounts with createRoot rather than hydrateRoot, so there is no pass in which
 * a document does not exist.
 */

/**
 * Six digits, always. The production CSS minifier rewrites #ffffff as #fff, so
 * reading the token back gives a different string in a built bundle than in dev
 * — both truthful, but a reference sheet that prints #FFF next to #F7F9FC is
 * reporting the minifier rather than the palette.
 */
function sixDigitHex(value) {
  const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`.toUpperCase() : value;
}

let measured = null;
function measure() {
  if (measured) return measured;

  const root = getComputedStyle(document.documentElement);
  const colors = Object.fromEntries(
    COLOR_TOKENS.map((c) => [
      c.token,
      sixDigitHex(root.getPropertyValue(c.token).trim()).toUpperCase(),
    ])
  );

  const probe = document.createElement("p");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.textContent = "probe";
  document.body.append(probe);
  const type = Object.fromEntries(
    TYPE_STEPS.map((t) => {
      probe.className = t.className;
      const cs = getComputedStyle(probe);
      return [t.className, `${cs.fontSize} / ${cs.lineHeight} · ${cs.fontWeight}`];
    })
  );
  probe.remove();

  measured = { colors, type };
  return measured;
}

export default function Specimens() {
  const resolved = measure();

  return (
    <>
      <header className="cc-page__header">
        <p className="cc-sheet__eyebrow">Design system</p>
        <h1 className="cc-display">Foundations &amp; component states</h1>
        <p className="cc-body cc-muted cc-sheet__lede">
          Every state below is a static specimen rendered by the same components
          the Patient Today screen uses. They are examples of the interface, not
          a record of anyone&rsquo;s care.
        </p>
      </header>

      <section className="cc-sheet__group" aria-labelledby="sheet-color">
        <h2 className="cc-section" id="sheet-color">
          Colour
        </h2>
        <ul className="cc-swatches">
          {COLOR_TOKENS.map((c) => (
            <li className="cc-swatch" key={c.token}>
              <span
                className="cc-swatch__chip"
                style={{ background: `var(${c.token})` }}
                aria-hidden="true"
              />
              <span className="cc-swatch__text">
                <span className="cc-swatch__name">{c.token.replace("--cc-", "")}</span>
                <span className="cc-swatch__hex">
                  {resolved.colors[c.token]}
                </span>
                <span className="cc-swatch__role">{c.role}</span>
                {c.note ? <span className="cc-swatch__note">{c.note}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cc-sheet__group" aria-labelledby="sheet-type">
        <h2 className="cc-section" id="sheet-type">
          Type
        </h2>
        <ul className="cc-typelist">
          {TYPE_STEPS.map((t) => (
            <li className="cc-typerow" key={t.className}>
              <p className={t.className}>{t.sample}</p>
              <p className="cc-sheet__meta">
                {t.name} · {resolved.type[t.className]}
                {t.note ? ` · ${t.note}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cc-sheet__group" aria-labelledby="sheet-buttons">
        <h2 className="cc-section" id="sheet-buttons">
          Buttons
        </h2>
        <ul className="cc-specimens">
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <Button variant="primary">I&rsquo;m ready</Button>
            </div>
            <p className="cc-sheet__meta">Primary · default</p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <Button variant="primary">I&rsquo;m ready</Button>
            </div>
            <p className="cc-sheet__meta">
              Primary · keyboard focus <span className="cc-sheet__hint">press Tab</span>
            </p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <Button variant="primary" disabled>
                I&rsquo;m ready
              </Button>
            </div>
            <p className="cc-sheet__meta">Primary · disabled, not actionable</p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <Button variant="secondary" icon="chat">
                Message care team
              </Button>
            </div>
            <p className="cc-sheet__meta">Secondary · default</p>
          </li>
        </ul>
      </section>

      <section className="cc-sheet__group" aria-labelledby="sheet-fields">
        <h2 className="cc-section" id="sheet-fields">
          Text fields
        </h2>
        <ul className="cc-specimens">
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <TextField
                label="Message subject"
                placeholder="Question about my day"
                helperText="Give your care team a short summary."
              />
            </div>
            <p className="cc-sheet__meta">Default</p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <TextField
                label="Message subject"
                placeholder="Question about my day"
                helperText="Give your care team a short summary."
              />
            </div>
            <p className="cc-sheet__meta">
              Keyboard focus <span className="cc-sheet__hint">press Tab</span>
            </p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <TextField
                label="Message subject"
                placeholder="Question about my day"
                errorText="Error: Enter a subject before sending."
              />
            </div>
            <p className="cc-sheet__meta">Error · stated in words, not colour alone</p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <TextField
                label="Message subject"
                placeholder="Not available"
                helperText="Messaging is unavailable in this example."
                disabled
              />
            </div>
            <p className="cc-sheet__meta">Disabled · label stays legible</p>
          </li>
        </ul>
      </section>

      <section className="cc-sheet__group" aria-labelledby="sheet-nav">
        <h2 className="cc-section" id="sheet-nav">
          Navigation
        </h2>
        <ul className="cc-specimens">
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <span className="cc-nav__link">
                <span className="cc-nav__icon" aria-hidden="true">
                  <Icon name="pill" size={24} />
                </span>
                <span className="cc-nav__label">Medications</span>
              </span>
            </div>
            <p className="cc-sheet__meta">Default</p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <span className="cc-nav__link is-current">
                <span className="cc-nav__icon" aria-hidden="true">
                  <Icon name="home" size={24} />
                </span>
                <span className="cc-nav__label">Home</span>
              </span>
            </div>
            <p className="cc-sheet__meta">Selected · tint plus aria-current=&quot;page&quot;</p>
          </li>
          <li className="cc-specimen">
            <div className="cc-specimen__stage">
              <a className="cc-nav__link" href="#specimens">
                <span className="cc-nav__icon" aria-hidden="true">
                  <Icon name="calendar" size={24} />
                </span>
                <span className="cc-nav__label">Appointments</span>
              </a>
            </div>
            <p className="cc-sheet__meta">
              Keyboard focus · distinct from selection{" "}
              <span className="cc-sheet__hint">press Tab</span>
            </p>
          </li>
        </ul>
      </section>

      <section className="cc-sheet__group" aria-labelledby="sheet-badges">
        <h2 className="cc-section" id="sheet-badges">
          Status badges
        </h2>
        <p className="cc-body cc-muted cc-sheet__lede">
          Informational, not controls. The word carries the meaning; the check
          mark on the success tones is decorative and hidden from assistive
          technology, so &ldquo;Taken&rdquo; is never announced as
          &ldquo;check Taken&rdquo;.
        </p>
        <ul className="cc-badgerow">
          {STATUS_BADGES.map((b) => (
            <li key={b.label}>
              <Badge tone={b.tone}>{b.label}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
