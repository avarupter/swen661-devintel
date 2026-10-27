import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Nav from "../Nav.jsx";
import { CURRENT_DESTINATION, DESTINATIONS } from "../../data/patientToday.js";

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

/**
 * The accessible names are the same in all three presentations — that is the
 * whole point of the mobile abbreviation being aria-hidden. The Messages count
 * is announced after the destination, never before it.
 */
const ACCESSIBLE_NAMES = [
  "Home",
  "Medications",
  "Appointments",
  "Messages, 2 unread",
  "Help",
];

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

  it.each(ACCESSIBLE_NAMES)(
    "gives the destination the accessible name %s whatever the presentation",
    (name) => {
      render(<Nav variant={variant} current="home" />);

      expect(within(getNav()).getByRole("link", { name })).toBeInTheDocument();
    },
  );

  it.each([
    ["home", "Home"],
    ["medications", "Medications"],
    ["appointments", "Appointments"],
    ["messages", "Messages, 2 unread"],
    ["help", "Help"],
  ])("marks %s as the current page, and only that one", (current, name) => {
    render(<Nav variant={variant} current={current} />);

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
  });

  it("writes aria-current on exactly one element and leaves it off the rest", () => {
    render(<Nav variant={variant} current="appointments" />);

    // Counting the attribute, not the computed state: aria-current="false" is
    // normalised to "not current" by the role query but is still an attribute on
    // four extra elements, and the component is meant to omit it entirely.
    const marked = getNav().querySelectorAll("[aria-current]");

    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute("aria-current", "page");
    expect(marked[0]).toHaveAccessibleName("Appointments");
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
    render(<Nav variant={variant} current="home" />);

    // Found by a loose name, asserted against an exact one. Looking the link
    // up by the exact name it is then asserted to have would make every
    // assertion below circular — and the anchored regexes that used to stand
    // in for the ordering check matched nothing in either direction, so a
    // component announcing ", 2 unread Messages" passed them on a technicality
    // and was caught only by the strict lookup they were written to back up.
    const messages = within(getNav()).getByRole("link", { name: /Messages/ });

    // The visible badge is a single node inside the aria-hidden icon wrapper,
    // so the number reaches the screen reader once — from the sr-only suffix.
    const count = within(messages).getByText("2");
    expect(within(messages).getAllByText("2")).toHaveLength(1);
    expect(count.parentElement).toHaveAttribute("aria-hidden", "true");

    // The suffix is the sr-only one. Without the class it becomes visible text
    // reading ", 2 unread" beside the badge in all three presentations, and
    // every aria-hidden sweep in this file walks past it. Whether the class
    // then hides it is the Playwright sweep's to measure.
    expect(within(messages).getByText(/unread/)).toHaveClass("cc-sr-only");

    // The count never leads: "2 unread Messages" is the failure this
    // component's comment is about.
    expect(messages).toHaveAccessibleName("Messages, 2 unread");
    expect(screen.queryByRole("link", { name: /unread.*Messages/ })).toBeNull();
  });

  it.each(["Home", "Medications", "Appointments", "Help"])(
    "renders no count and no unread text for %s",
    (name) => {
      render(<Nav variant={variant} current="home" />);

      const link = screen.getByRole("link", { name });

      expect(link.textContent).not.toMatch(/\d/);
      expect(link.textContent).not.toMatch(/unread/i);
    },
  );

  it("mentions unread on the one destination that has a badge count", () => {
    render(<Nav variant={variant} current="home" />);

    expect(screen.getAllByText(/unread/)).toHaveLength(1);
  });
});

describe("Nav — bar variant abbreviations", () => {
  const ABBREVIATED = [
    { label: "Medications", shortLabel: "Meds", name: "Medications" },
    { label: "Appointments", shortLabel: "Visits", name: "Appointments" },
    { label: "Messages", shortLabel: "Inbox", name: "Messages, 2 unread" },
  ];

  it.each(ABBREVIATED)(
    "puts $shortLabel in the aria-hidden span and $label in the sr-only one, announcing $name",
    ({ label, shortLabel, name }) => {
      render(<Nav variant="bar" current="home" />);

      const link = screen.getByRole("link", { name });

      // Visible half: the abbreviation is the text the eye reads, and it is
      // hidden from assistive technology so it cannot join the name.
      const visible = within(link).getByText(shortLabel);
      expect(visible).toHaveAttribute("aria-hidden", "true");
      expect(visible).not.toHaveClass("cc-sr-only");

      // Announced half: the full destination is present as real text, not as an
      // aria-label, so it is translated and found by text search.
      const announced = within(link).getByText(label);
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
    render(<Nav variant="bar" current="home" />);

    const hiddenText = Array.from(
      getNav().querySelectorAll("[aria-hidden='true']"),
      (node) => node.textContent,
    ).filter(Boolean);

    expect(hiddenText.sort()).toEqual(["2", "Inbox", "Meds", "Visits"]);
  });
});

describe.each(["sidebar", "tabs"])("Nav — %s variant labels", (variant) => {
  const FULL = [
    { label: "Home", name: "Home" },
    { label: "Medications", name: "Medications" },
    { label: "Appointments", name: "Appointments" },
    { label: "Messages", name: "Messages, 2 unread" },
    { label: "Help", name: "Help" },
  ];

  it.each(FULL)(
    "renders $label once, unhidden and not sr-only, with no second copy",
    ({ label, name }) => {
      render(<Nav variant={variant} current="home" />);

      const link = screen.getByRole("link", { name });
      const labels = within(link).getAllByText(label);

      expect(labels).toHaveLength(1);
      expect(labels[0]).not.toHaveAttribute("aria-hidden");
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

  it("hides no text label from assistive technology", () => {
    render(<Nav variant={variant} current="home" />);

    // The only aria-hidden text anywhere in these two presentations is the
    // numeric badge; a hidden label here would mean a destination announced
    // twice or not at all.
    Array.from(getNav().querySelectorAll("[aria-hidden='true']")).forEach(
      (node) => {
        expect(node.textContent).not.toMatch(/[a-z]/i);
      },
    );
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
 * prop, so the two cases the shipped list cannot produce — a badge count of
 * zero and a label long enough to be worth worrying about — are covered by
 * standing in a different list. These also prove Nav renders whatever the
 * module declares instead of a hand-written copy of the five destinations.
 */
describe("Nav — against a stand-in destination list", () => {
  afterEach(() => {
    vi.doUnmock("../../data/patientToday.js");
    vi.resetModules();
  });

  async function renderWith(destinations) {
    vi.resetModules();
    vi.doMock("../../data/patientToday.js", () => ({
      DESTINATIONS: destinations,
      CURRENT_DESTINATION: "one",
    }));
    const { default: MockedNav } = await import("../Nav.jsx");
    return render(<MockedNav variant="bar" current="one" />);
  }

  it("renders a zero badge count as nothing at all", async () => {
    await renderWith([
      { id: "one", label: "Messages", shortLabel: "Inbox", icon: "chat", badgeCount: 0 },
    ]);

    const link = screen.getByRole("link", { name: "Messages" });

    expect(link.textContent).toBe("InboxMessages");
    expect(within(link).queryByText("0")).toBeNull();
    expect(screen.queryByText(/unread/)).toBeNull();
  });

  it("renders a count greater than nine in full, with the matching name", async () => {
    await renderWith([
      { id: "one", label: "Messages", shortLabel: "Inbox", icon: "chat", badgeCount: 12 },
    ]);

    expect(
      screen.getByRole("link", { name: "Messages, 12 unread" }),
    ).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders a long label in full rather than truncating it", async () => {
    const label = "Appointments and video visits with your care team";
    await renderWith([
      { id: "one", label, shortLabel: "Visits", icon: "calendar" },
    ]);

    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "Second" })).toBeInTheDocument();
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
    DESTINATIONS.forEach((d) => {
      expect(d.label, `${d.id} label`).toBeTruthy();
      expect(d.shortLabel, `${d.id} shortLabel`).toBeTruthy();
      expect(d.icon, `${d.id} icon`).toBeTruthy();
    });
  });

  it("gives Messages the only badge count", () => {
    expect(
      DESTINATIONS.filter((d) => d.badgeCount).map((d) => [d.id, d.badgeCount]),
    ).toEqual([["messages", 2]]);
  });

  it("points CURRENT_DESTINATION at a destination that exists", () => {
    expect(DESTINATIONS.some((d) => d.id === CURRENT_DESTINATION)).toBe(true);
  });
});
