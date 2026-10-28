import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import Nav from "../Nav.jsx";
import { DESTINATION_IDS as ROUTE_DESTINATIONS } from "../../app/routes.js";
import { DESTINATIONS } from "../../data/patientToday.js";
import { readableTextNodes } from "../../test/a11y.js";

/**
 * Nav renders one list of destinations in three presentations. These tests
 * cover what jsdom can prove: the markup, the accessible names, the ARIA state
 * wiring and the data contract the three presentations share.
 *
 * The class names that exist purely as stylesheet hooks — `cc-nav--<variant>`,
 * `is-current`, `cc-sr-only` — ARE asserted, but only as wiring: that the prop
 * or the branch reaches the class the stylesheet selects on. Each harness owns
 * half of those guarantees and neither half is worth much alone. Whether the
 * CSS then hides the span, hides two of the three presentations, tints the
 * current destination, how tall a bar destination is and whether that tint
 * carries enough contrast are measured for real in Chromium by the Playwright
 * script described in README "Verification"; nothing here can see any of it.
 */

const VARIANTS = ["sidebar", "tabs", "bar"];

/** The unread count App passes from the demo store: the seed has two unread. */
const COUNTS = { messages: 2 };

/**
 * The accessible names in the sidebar and the tabs. The Messages count is
 * announced after the destination, never before it.
 */
const ACCESSIBLE_NAMES = [
  "Home",
  "Medications",
  "Appointments",
  "Messages, 2 unread",
  "Help",
];

/**
 * The bar's names: an abbreviated destination is named with the word it shows
 * first, then the full destination (D8, WCAG 2.5.3 Label in Name).
 */
const BAR_NAMES = [
  "Home",
  "Meds (Medications)",
  "Visits (Appointments)",
  "Inbox (Messages), 2 unread",
  "Help",
];

const NAMES = { sidebar: ACCESSIBLE_NAMES, tabs: ACCESSIBLE_NAMES, bar: BAR_NAMES };

const DESTINATION_IDS = [
  "home",
  "medications",
  "appointments",
  "messages",
  "help",
];

const getNav = () => screen.getByRole("navigation", { name: "Main" });

describe.each(VARIANTS)("Nav — %s variant", (variant) => {
  it("is a navigation landmark labelled Main", () => {
    render(<Nav variant={variant} current="home" />);

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("passes the variant through to the stylesheet hook", () => {
    render(<Nav variant={variant} current="home" />);

    // All three presentations render identical markup, so this class is the
    // only thing that tells them apart — and App mounts all three Navs at
    // once, leaning on layout.css to hide two of them. Drop the modifier and
    // every width shows three stacked navigations while every assertion in
    // this file stays green. Which one is actually visible is measured in
    // Chromium by the Playwright sweep; this pins only that the prop lands.
    expect(getNav()).toHaveClass("cc-nav", `cc-nav--${variant}`);
  });

  it("renders all five destinations as links, in the order DESTINATIONS declares", () => {
    render(<Nav variant={variant} current="home" />);

    const links = within(getNav()).getAllByRole("link");

    expect(links).toHaveLength(5);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      DESTINATIONS.map((d) => `#${d.id}`),
    );
  });

  it("renders the destinations as a single list", () => {
    render(<Nav variant={variant} current="home" />);

    const items = within(getNav()).getAllByRole("listitem");

    expect(within(getNav()).getAllByRole("list")).toHaveLength(1);
    expect(items).toHaveLength(5);
    items.forEach((item) => {
      expect(within(item).getAllByRole("link")).toHaveLength(1);
    });
  });

  it.each(NAMES[variant])(
    "gives a destination the accessible name %s in this presentation",
    (name) => {
      render(<Nav variant={variant} current="home" counts={COUNTS} />);

      expect(within(getNav()).getByRole("link", { name })).toBeInTheDocument();
    },
  );

  it.each(DESTINATION_IDS.map((id, i) => [id, NAMES[variant][i]]))(
    "marks %s as the current page, and only that one",
    (current, name) => {
      render(<Nav variant={variant} current={current} counts={COUNTS} />);

      const marked = screen.getAllByRole("link", { current: "page" });

      expect(marked).toHaveLength(1);
      expect(marked[0]).toHaveAccessibleName(name);
      expect(marked[0]).toHaveAttribute("href", `#${current}`);
      // The visual half of the same fact. aria-current is pinned three ways
      // over above; the class the tint hangs off was pinned nowhere, here or in
      // the Playwright sweep, so losing it would strip the sighted cue in
      // silence. What the tint then looks like is Chromium's to measure.
      expect(marked[0]).toHaveClass("is-current");
      expect(getNav().querySelectorAll(".is-current")).toHaveLength(1);
    },
  );

  it("writes aria-current on exactly one element and leaves it off the rest", () => {
    render(<Nav variant={variant} current="appointments" />);

    // Counting the attribute, not the computed state: aria-current="false" is
    // normalised to "not current" by the role query but is still an attribute on
    // four extra elements, and the component is meant to omit it entirely.
    const marked = getNav().querySelectorAll("[aria-current]");

    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute("aria-current", "page");
    expect(marked[0]).toHaveAccessibleName(
      NAMES[variant][DESTINATION_IDS.indexOf("appointments")],
    );
  });

  it("marks nothing when current matches no destination", () => {
    render(<Nav variant={variant} current="settings" />);

    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
    expect(getNav().querySelectorAll("[aria-current]")).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("marks nothing when current is omitted altogether", () => {
    render(<Nav variant={variant} />);

    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
    expect(getNav().querySelectorAll("[aria-current]")).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("matches current against the destination id, not its label", () => {
    render(<Nav variant={variant} current="Home" />);

    expect(getNav().querySelectorAll("[aria-current]")).toHaveLength(0);
  });

  it("hides every icon from assistive technology", () => {
    render(<Nav variant={variant} current="home" />);

    const icons = getNav().querySelectorAll("svg");

    expect(icons).toHaveLength(5);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
      // Wrapped in an aria-hidden container too, so neither the glyph nor the
      // badge that sits beside it can leak into a destination's name.
      expect(icon.parentElement).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("announces the Messages count after the destination, and only once", () => {
    render(<Nav variant={variant} current="home" counts={COUNTS} />);

    // Found by a loose name, asserted against an exact one. Looking the link
    // up by the exact name it is then asserted to have would make every
    // assertion below circular — and the anchored regexes that used to stand
    // in for the ordering check matched nothing in either direction, so a
    // component announcing ", 2 unread Messages" passed them on a technicality
    // and was caught only by the strict lookup they were written to back up.
    const messages = within(getNav()).getByRole("link", { name: /Messages/ });

    // The visible badge is a single node inside the aria-hidden icon wrapper,
    // so the number reaches the screen reader once — from the one sr-only span
    // that holds the whole name (R9).
    const count = within(messages).getByText("2");
    expect(within(messages).getAllByText("2")).toHaveLength(1);
    expect(count.parentElement).toHaveAttribute("aria-hidden", "true");

    // The name, count included, is that one sr-only span. Without the class
    // it becomes visible text reading "Messages, 2 unread" beside the label in
    // all three presentations, and every aria-hidden sweep in this file walks
    // past it. Whether the class then hides it is the Playwright sweep's to
    // measure.
    expect(within(messages).getByText(/unread/)).toHaveClass("cc-sr-only");

    // The count never leads: "2 unread Messages" is the failure this
    // component's comment is about.
    expect(messages).toHaveAccessibleName(
      NAMES[variant][DESTINATION_IDS.indexOf("messages")],
    );
    expect(screen.queryByRole("link", { name: /unread.*Messages/ })).toBeNull();
  });

  it.each(["Home", "Medications", "Appointments", "Help"])(
    "renders no count and no unread text for %s",
    (label) => {
      render(<Nav variant={variant} current="home" counts={COUNTS} />);

      const name = NAMES[variant][ACCESSIBLE_NAMES.indexOf(label)];
      const link = screen.getByRole("link", { name });

      expect(link.textContent).not.toMatch(/\d/);
      expect(link.textContent).not.toMatch(/unread/i);
    },
  );

  it("mentions unread on the one destination that has a badge count", () => {
    render(<Nav variant={variant} current="home" counts={COUNTS} />);

    expect(screen.getAllByText(/unread/)).toHaveLength(1);
  });
});

describe("Nav — bar variant abbreviations", () => {
  const ABBREVIATED = [
    { label: "Medications", shortLabel: "Meds", name: "Meds (Medications)" },
    { label: "Appointments", shortLabel: "Visits", name: "Visits (Appointments)" },
    { label: "Messages", shortLabel: "Inbox", name: "Inbox (Messages), 2 unread" },
  ];

  it.each(ABBREVIATED)(
    "puts $shortLabel in the aria-hidden span and the whole name, with $label, in the sr-only one, announcing $name",
    ({ label, shortLabel, name }) => {
      render(<Nav variant="bar" current="home" counts={COUNTS} />);

      const link = screen.getByRole("link", { name });

      // Visible half: the abbreviation is the text the eye reads, and it is
      // hidden from assistive technology so it cannot join the name.
      const visible = within(link).getByText(shortLabel);
      expect(visible).toHaveAttribute("aria-hidden", "true");
      expect(visible).not.toHaveClass("cc-sr-only");

      // Announced half: the whole name, which starts with the abbreviation
      // and carries the full destination (D8), is present as real text, not as
      // an aria-label, so it is translated and found by text search.
      const announced = within(link).getByText(name);
      expect(announced).toHaveTextContent(label);
      expect(announced).not.toHaveAttribute("aria-hidden");
      expect(announced).not.toBe(visible);

      // And it is in the visually hidden span specifically — the half the
      // stylesheet acts on. Swap `cc-sr-only` for a plain span and every
      // accessible name here still passes while the tab visibly reads
      // "MedsMedications". jsdom cannot see that the span is hidden; it can
      // see that the component routed the full name into the one the CSS
      // hides, which is the wiring the Chromium sweep's half depends on.
      expect(announced).toHaveClass("cc-sr-only");
    },
  );

  it.each(["Meds", "Visits", "Inbox"])(
    "never lets %s be the accessible name of a destination",
    (shortLabel) => {
      render(<Nav variant="bar" current="home" />);

      expect(screen.queryByRole("link", { name: shortLabel })).toBeNull();
    },
  );

  it.each(["Home", "Help"])(
    "does not double up %s, whose abbreviation is the label itself",
    (label) => {
      render(<Nav variant="bar" current="home" />);

      const link = screen.getByRole("link", { name: label });
      const labels = within(link).getAllByText(label);

      // One text node, not an aria-hidden copy plus an sr-only copy — a
      // duplicate here would announce the destination twice.
      expect(labels).toHaveLength(1);
      expect(labels[0]).not.toHaveAttribute("aria-hidden");
      expect(link.textContent).toBe(label);
    },
  );

  it("hides nothing from assistive technology but the abbreviations and the badge number", () => {
    render(<Nav variant="bar" current="home" counts={COUNTS} />);

    const hiddenText = Array.from(
      getNav().querySelectorAll("[aria-hidden='true']"),
      (node) => node.textContent,
    ).filter(Boolean);

    expect(hiddenText.sort()).toEqual(["2", "Inbox", "Meds", "Visits"]);
  });
});

describe.each(["sidebar", "tabs"])("Nav — %s variant labels", (variant) => {
  // `hidden`: a name that adds a count to the label is one sr-only span, so
  // the visible label is aria-hidden and the name is read once (R9). Every
  // other label is its own name and is never hidden.
  const FULL = [
    { label: "Home", name: "Home", hidden: false },
    { label: "Medications", name: "Medications", hidden: false },
    { label: "Appointments", name: "Appointments", hidden: false },
    { label: "Messages", name: "Messages, 2 unread", hidden: true },
    { label: "Help", name: "Help", hidden: false },
  ];

  it.each(FULL)(
    "renders $label once and not sr-only, with no second copy, hidden only when its name adds a count",
    ({ label, name, hidden }) => {
      render(<Nav variant={variant} current="home" counts={COUNTS} />);

      const link = screen.getByRole("link", { name });
      const labels = within(link).getAllByText(label);

      expect(labels).toHaveLength(1);
      expect(labels[0].getAttribute("aria-hidden")).toBe(hidden ? "true" : null);
      // Not the visually hidden span either: the unabbreviated branch is the
      // one the eye reads on tablet and desktop, and sending it down the
      // sr-only path leaves one text node, unhidden from AT, and a nav with
      // no readable labels at all.
      expect(labels[0]).not.toHaveClass("cc-sr-only");
    },
  );

  it.each(["Meds", "Visits", "Inbox"])(
    "never renders the mobile abbreviation %s",
    (shortLabel) => {
      render(<Nav variant={variant} current="home" />);

      expect(screen.queryByText(shortLabel)).toBeNull();
    },
  );

  it("hides no text label from assistive technology, except where one span carries the whole name", () => {
    render(<Nav variant={variant} current="home" counts={COUNTS} />);
    const links = within(getNav()).getAllByRole("link");

    // R9: a link whose name adds a count to its label ("Messages, 2 unread") is
    // named by one visually hidden span, so its label and badge are hidden on
    // purpose; "a composed name is one visually hidden span" below pins that
    // case. Every other label is its own name, and hiding one would leave its
    // destination announced not at all.
    const plain = links.filter((link) => link.querySelector(".cc-sr-only") === null);
    expect(plain.map((link) => link.getAttribute("href"))).toEqual([
      "#home",
      "#medications",
      "#appointments",
      "#help",
    ]);
    plain.forEach((link) => {
      link.querySelectorAll("[aria-hidden='true']").forEach((node) => {
        expect(node.textContent).not.toMatch(/[a-z]/i);
      });
    });
  });
});

describe("Nav — unrecognised variant", () => {
  it.each([undefined, "bogus"])(
    "renders the full labels when variant is %s",
    (variant) => {
      render(<Nav variant={variant} current="home" />);

      expect(
        screen.getByRole("link", { name: "Medications" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Medications")).not.toHaveAttribute("aria-hidden");
      expect(screen.queryByText("Meds")).toBeNull();
      expect(screen.getAllByRole("link")).toHaveLength(5);
    },
  );
});

/**
 * Nav reads the destinations from the data module rather than taking them as a
 * prop, so a label long enough to be worth worrying about is covered by
 * standing in a different list, and the counts the shipped seed never has (0,
 * and more than nine) ride along through the `counts` prop. These also prove
 * Nav renders whatever the module declares instead of a hand-written copy of
 * the five destinations.
 */
describe("Nav — against a stand-in destination list", () => {
  afterEach(() => {
    jest.dontMock("../../data/patientToday.js");
    jest.resetModules();
  });

  async function renderWith(destinations, counts) {
    jest.resetModules();
    jest.doMock("../../data/patientToday.js", () => ({
      DESTINATIONS: destinations,
    }));
    const { default: MockedNav } = await import("../Nav.jsx");
    return render(<MockedNav variant="bar" current="one" counts={counts} />);
  }

  it("renders a zero badge count as nothing at all", async () => {
    await renderWith(
      [{ id: "messages", label: "Messages", shortLabel: "Inbox", icon: "chat" }],
      { messages: 0 },
    );

    const link = screen.getByRole("link", { name: "Inbox (Messages)" });

    expect(link.textContent).toBe("InboxInbox (Messages)");
    expect(within(link).queryByText("0")).toBeNull();
    expect(screen.queryByText(/unread/)).toBeNull();
  });

  it("renders a count greater than nine in full, with the matching name", async () => {
    await renderWith(
      [{ id: "messages", label: "Messages", shortLabel: "Inbox", icon: "chat" }],
      { messages: 12 },
    );

    expect(
      screen.getByRole("link", { name: "Inbox (Messages), 12 unread" }),
    ).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders a long label in full rather than truncating it", async () => {
    const label = "Appointments and video visits with your care team";
    const name = `Visits (${label})`;
    await renderWith([
      { id: "one", label, shortLabel: "Visits", icon: "calendar" },
    ]);

    expect(screen.getByRole("link", { name })).toBeInTheDocument();
    expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByText("Visits")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders however many destinations the module declares", async () => {
    await renderWith([
      { id: "one", label: "First", shortLabel: "First", icon: "home" },
      { id: "two", label: "Second", shortLabel: "2nd", icon: "help" },
    ]);

    const links = screen.getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#one",
      "#two",
    ]);
    expect(screen.getByRole("link", { name: "2nd (Second)" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
  });

  it("renders no destinations, and no empty landmark content, for an empty list", async () => {
    await renderWith([]);

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

/**
 * The contract Nav leans on. Nav's guarantees — five destinations, one
 * aria-current, a full accessible name for every presentation — are only as
 * true as the list it renders, so the parts it depends on are pinned here.
 */
describe("Nav — the destination data contract", () => {
  it("declares five destinations in a fixed order", () => {
    expect(DESTINATIONS.map((d) => d.id)).toEqual(DESTINATION_IDS);
  });

  it("gives every destination a unique id, which is what keeps aria-current to one", () => {
    expect(new Set(DESTINATIONS.map((d) => d.id)).size).toBe(
      DESTINATIONS.length,
    );
  });

  it("gives every destination a label, a short label and an icon", () => {
    const incomplete = DESTINATIONS.filter((d) => !d.label || !d.shortLabel || !d.icon).map((d) => d.id);
    expect(incomplete).toEqual([]);
  });

  it("carries no badge count: the count comes from the store, as the counts prop", () => {
    // App passes Nav the number of unread conversations in the demo store. A
    // count written here as well would be a second source, and a stale one.
    expect(
      DESTINATIONS.filter((d) => Object.hasOwn(d, "badgeCount")).map((d) => d.id),
    ).toEqual([]);
  });

  it("declares exactly the destinations the route can make current", () => {
    // App passes the route's destination (app/routes.js) as `current`. An id
    // the router produces that is missing here would mark nothing at all.
    expect(DESTINATIONS.map((d) => d.id)).toEqual(ROUTE_DESTINATIONS);
  });
});

describe("Nav — Label in Name in the bar (Task 2, D8)", () => {
  it.each([
    ["Meds", "medications", "Meds (Medications)"],
    ["Visits", "appointments", "Visits (Appointments)"],
    ["Inbox", "messages", "Inbox (Messages), 2 unread"],
  ])("names the bar's %s destination with its visible label first", (visible, id, name) => {
    render(<Nav variant="bar" current="home" counts={COUNTS} />);
    // Found by where it goes, not by its name, so the name is measured below
    // rather than assumed by the lookup.
    const link = getNav().querySelector(`a[href="#${id}"]`);
    // The words on screen: the link's label, read from the page.
    const shown = link.querySelector(".cc-nav__label").textContent;

    expect(shown).toBe(visible);
    expect(link).toHaveAccessibleName(name);
    // Label in Name: the computed name starts with the words on screen, so a
    // voice-control user can say what they see, then names the destination.
    expect(link).toHaveAccessibleName(new RegExp(`^${shown} \\(`));
  });

  it.each(["sidebar", "tabs"])("keeps the full names in the %s", (variant) => {
    render(<Nav variant={variant} current="home" counts={COUNTS} />);
    const links = within(getNav()).getAllByRole("link");

    expect(links).toHaveLength(ACCESSIBLE_NAMES.length);
    links.forEach((link, i) => {
      expect(link).toHaveAccessibleName(ACCESSIBLE_NAMES[i]);
    });
    // Only the bar abbreviates, so only the bar names a link "<short> (<label>)".
    expect(screen.queryByRole("link", { name: /\(/ })).toBeNull();
  });
});

describe.each(VARIANTS)("Nav — %s variant, counts.messages", (variant) => {
  const destination = variant === "bar" ? "Inbox (Messages)" : "Messages";

  it.each([
    [0, destination, []],
    [1, `${destination}, 1 unread`, ["1"]],
    [2, `${destination}, 2 unread`, ["2"]],
    [12, `${destination}, 12 unread`, ["12"]],
  ])("with %i unread, names the link %j and shows %j", (count, name, shown) => {
    render(<Nav variant={variant} current="home" counts={{ messages: count }} />);
    const link = screen.getByRole("link", { name });
    const numbers = within(link).queryAllByText(/^\d+$/);

    expect(numbers.map((node) => node.textContent)).toEqual(shown);
    // The number on screen is hidden; the name says it, once.
    numbers.forEach((node) => {
      expect(node.closest('[aria-hidden="true"]')).not.toBeNull();
    });
    expect(screen.queryAllByRole("link", { name: /unread/ })).toHaveLength(count > 0 ? 1 : 0);
  });

  it.each([
    ["{}", {}],
    ["omitted", undefined],
    ["null", null],
  ])("names Messages with no count when counts is %s", (_case, counts) => {
    render(<Nav variant={variant} current="home" counts={counts} />);

    expect(screen.getByRole("link", { name: destination })).toBeInTheDocument();
    expect(screen.queryByText(/unread/)).toBeNull();
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it("reads every destination's name from exactly one text node (R9)", () => {
    render(<Nav variant={variant} current="home" counts={COUNTS} />);

    within(getNav())
      .getAllByRole("link")
      .forEach((link, i) => {
        expect(readableTextNodes(link).map((node) => node.textContent)).toEqual([
          NAMES[variant][i],
        ]);
      });
  });
});

describe("Nav — a composed name is one visually hidden span (R9)", () => {
  // The visible parts each composed link shows: its label, and the count.
  it.each([
    ["sidebar", "Messages, 2 unread", ["2", "Messages"]],
    ["tabs", "Messages, 2 unread", ["2", "Messages"]],
    ["bar", "Meds (Medications)", ["Meds"]],
    ["bar", "Visits (Appointments)", ["Visits"]],
    ["bar", "Inbox (Messages), 2 unread", ["2", "Inbox"]],
  ])("in the %s, puts %j in one sr-only span and hides what is on screen", (variant, name, visible) => {
    render(<Nav variant={variant} current="home" counts={COUNTS} />);
    const link = screen.getByRole("link", { name });
    const [node] = readableTextNodes(link);

    expect(node.parentElement).toHaveClass("cc-sr-only");
    expect(link.querySelectorAll(".cc-sr-only")).toHaveLength(1);
    expect(
      Array.from(link.querySelectorAll('[aria-hidden="true"]'), (el) => el.textContent)
        .filter(Boolean)
        .sort(),
    ).toEqual(visible);
  });

  it.each(VARIANTS)("in the %s, leaves a plain label as its own, unhidden name", (variant) => {
    render(<Nav variant={variant} current="home" counts={COUNTS} />);
    const link = screen.getByRole("link", { name: "Home" });
    const [node] = readableTextNodes(link);

    expect(node.parentElement).not.toHaveClass("cc-sr-only");
    expect(link.querySelector(".cc-sr-only")).toBeNull();
  });
});
