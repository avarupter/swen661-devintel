import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App.jsx";

/**
 * The app shell: skip link, app bar, all three navigation presentations, the
 * main landmark and the evidence footer, plus the only piece of non-static
 * wiring in the app — the `useSyncExternalStore` read of `location.hash`.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT CLAIM
 * ------------------------------------------
 * jsdom has no layout engine and does not evaluate media queries, so it cannot
 * know which of the three navigation presentations is visible, how tall a
 * target is, or what a contrast ratio resolves to. All three navs are in the
 * DOM here at every "width", because width does not exist here. Nothing below
 * asserts on a class name as a proxy for layout: a test that reads
 * `.cc-nav--bar` and calls itself "mobile" would still pass with the
 * stylesheet deleted. The visible-layout half is measured for real in Chromium
 * by the team's Playwright script (README, "Verification").
 */

/**
 * The five destinations as a screen reader announces them, in DOM order.
 *
 * Written out rather than derived from DESTINATIONS, so that renaming a
 * destination in the data module makes these tests fail and someone has to
 * confirm the new wording is what the board asks for. Note "Messages, 2 unread"
 * — destination first, count second — and that the four unbadged destinations
 * carry no suffix at all.
 */
const DESTINATION_NAMES = [
  "Home",
  "Medications",
  "Appointments",
  "Messages, 2 unread",
  "Help",
];

const mainNavs = () => screen.getAllByRole("navigation", { name: "Main" });

/**
 * The shell's own <header> and <footer>, i.e. the banner and contentinfo
 * landmarks.
 *
 * Not `getByRole("banner")`: this version of testing-library maps EVERY
 * <header> and <footer> to banner/contentinfo, while a browser scopes those
 * roles out when the element sits inside main/section/article — and both
 * AppointmentCard and the page header use <header>/<footer> inside main. So
 * the landmark is defined here the way HTML-AAM defines it: the one outside
 * the main landmark. The length assertion is the real check — two headers
 * outside main would be two banner landmarks in a real browser.
 */
function shellLandmark(tag) {
  const main = screen.getByRole("main");
  const outside = Array.from(document.querySelectorAll(tag)).filter(
    (el) => !main.contains(el),
  );
  expect(outside).toHaveLength(1);
  return outside[0];
}

const appBar = () => shellLandmark("header");
const evidenceFooter = () => shellLandmark("footer");

/** Change the hash the way a browser does: mutate, then notify. */
function navigateTo(hash) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  });
}

describe("App shell", () => {
  it("opens with a skip link that points at a main landmark which exists", () => {
    render(<App />);

    const skip = screen.getByRole("link", { name: "Skip to main content" });
    const main = screen.getByRole("main");

    // A skip link whose target is missing fails silently — it moves focus
    // nowhere and no test of the href alone would notice.
    expect(skip).toHaveAttribute("href", "#main");
    expect(main).toHaveAttribute("id", "main");
    expect(document.getElementById("main")).toBe(main);

    // And it has to come before the thing it skips, or it skips nothing.
    expect(
      skip.compareDocumentPosition(appBar()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("puts the page content inside the main landmark", () => {
    render(<App />);

    expect(
      within(screen.getByRole("main")).getByRole("heading", { level: 1 }),
    ).toHaveTextContent("Good morning, Joyce");
  });

  it("renders the app name and the account line in the app bar", () => {
    render(<App />);
    const bar = within(appBar());

    expect(bar.getByText("Patient Today")).toBeInTheDocument();
    expect(bar.getByText("Joyce Harper · Patient account")).toBeInTheDocument();
  });

  it("keeps the mark and the avatar initials out of the accessibility tree", () => {
    const { container } = render(<App />);

    // "JH" would be announced letter-by-letter next to the name it abbreviates.
    expect(within(appBar()).getByText("JH")).toHaveAttribute("aria-hidden", "true");

    // SVG is not in the accessibility tree to query by role, so a container
    // query is the right tool here rather than a fallback.
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
    });
  });

  it("renders a footer link to the specimen sheet", () => {
    render(<App />);

    const evidence = within(evidenceFooter()).getByRole("link");
    expect(evidence).toHaveAccessibleName("Design system");
    expect(evidence).toHaveAttribute("href", "#specimens");
  });
});

describe("App navigation presentations", () => {
  /**
   * THREE landmarks is correct here and is NOT the accessibility claim.
   *
   * The shell renders the sidebar, tab and bar presentations unconditionally so
   * that the destination list and the current page cannot drift between them;
   * CSS sets `display: none` on two, which also removes them from the
   * accessibility tree, so a screen reader finds exactly ONE "Main" landmark at
   * any width. jsdom applies no CSS, so all three are present and queryable.
   *
   * Do not read this test as proving the one-landmark promise. That is checked
   * in a real browser at seven widths by the Playwright script, and this
   * assertion exists only to pin that App renders all three from one source.
   */
  it("renders all three navigation presentations from one source", () => {
    render(<App />);
    expect(mainNavs()).toHaveLength(3);
  });

  it("gives every presentation the same five destinations in the same order", () => {
    render(<App />);

    for (const nav of mainNavs()) {
      const links = within(nav).getAllByRole("link");
      expect(links).toHaveLength(DESTINATION_NAMES.length);
      links.forEach((link, i) => {
        expect(link).toHaveAccessibleName(DESTINATION_NAMES[i]);
      });
    }
  });

  it("marks exactly one current destination per presentation, and it is Home", () => {
    render(<App />);

    for (const nav of mainNavs()) {
      const links = within(nav).getAllByRole("link");
      const current = links.filter(
        (link) => link.getAttribute("aria-current") === "page",
      );

      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAccessibleName("Home");

      // The rest carry no aria-current at all, not aria-current="false".
      links
        .filter((link) => link !== current[0])
        .forEach((link) => expect(link).not.toHaveAttribute("aria-current"));
    }
  });

  it("announces the abbreviated labels by their full destination name", () => {
    render(<App />);

    // The abbreviations are rendered — the bar presentation is in the DOM —
    // but they are hidden, so they must never reach an accessible name.
    for (const abbreviation of ["Meds", "Visits", "Inbox"]) {
      expect(screen.getByText(abbreviation)).toHaveAttribute("aria-hidden", "true");
      expect(screen.queryAllByRole("link", { name: abbreviation })).toHaveLength(0);
    }

    // One link per presentation, each announcing the full destination.
    expect(screen.getAllByRole("link", { name: "Medications" })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Appointments" })).toHaveLength(3);
  });

  it("announces the unread count after the destination, never before it", () => {
    render(<App />);

    expect(screen.getAllByRole("link", { name: "Messages, 2 unread" })).toHaveLength(3);
    expect(screen.queryAllByRole("link", { name: /^2 unread/ })).toHaveLength(0);
    expect(screen.queryAllByRole("link", { name: "Messages" })).toHaveLength(0);

    // Only the badged destination gets a count; the visible badge is inside the
    // aria-hidden icon, so the number is announced once, not twice.
    for (const nav of mainNavs()) {
      expect(
        within(nav)
          .getAllByRole("link")
          .filter((link) => /unread/.test(link.textContent)),
      ).toHaveLength(1);
      expect(within(nav).getAllByText("2")).toHaveLength(1);
    }
  });
});

describe("App hash routing", () => {
  it("renders Patient Today when there is no hash", () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Good morning, Joyce",
    );
    expect(
      screen.queryByRole("heading", { name: /Foundations & component states/ }),
    ).not.toBeInTheDocument();
  });

  it("renders the foundations sheet at #specimens", () => {
    window.location.hash = "#specimens";
    render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Foundations & component states",
    );
    expect(
      screen.queryByRole("heading", { name: "Good morning, Joyce" }),
    ).not.toBeInTheDocument();
  });

  it("falls back to Patient Today for a destination hash that has no view", () => {
    // The five destinations are inert in this cut: #medications is a real href
    // in the nav, so landing on it must not blank the page.
    window.location.hash = "#medications";
    render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Good morning, Joyce",
    );
  });

  it("falls back to Patient Today for #home", () => {
    window.location.hash = "#home";
    render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Good morning, Joyce",
    );
  });

  it("re-renders in place when the hash changes, with no reload", () => {
    render(<App />);
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("Good morning, Joyce");

    navigateTo("#specimens");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Foundations & component states",
    );
    expect(
      screen.queryByRole("heading", { name: "Good morning, Joyce" }),
    ).not.toBeInTheDocument();
    // Same DOM node, updated: React re-rendered the live tree rather than the
    // document being replaced.
    expect(screen.getByRole("main")).toBe(main);
  });

  it("re-renders back again, so the subscription survives the first change", () => {
    window.location.hash = "#specimens";
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Foundations & component states",
    );

    navigateTo("#home");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Good morning, Joyce",
    );
  });

  it("flips the footer link's text and href with the view", () => {
    render(<App />);
    const footer = () => within(evidenceFooter()).getByRole("link");

    expect(footer()).toHaveAccessibleName("Design system");
    expect(footer()).toHaveAttribute("href", "#specimens");

    navigateTo("#specimens");

    expect(footer()).toHaveAccessibleName("Back to Patient Today");
    expect(footer()).toHaveAttribute("href", "#home");
    // "Design system" is still on the page as the sheet's eyebrow, but it is no
    // longer a link — the footer offers the way back, not a second way in.
    expect(screen.getByText("Design system")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Design system" })).not.toBeInTheDocument();
  });

  it("keeps the shell around both views", () => {
    window.location.hash = "#specimens";
    render(<App />);

    expect(appBar()).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to main content" })).toBeInTheDocument();
    expect(mainNavs()).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(3);
  });

  it("has exactly one level-1 heading in each view", () => {
    const { unmount } = render(<App />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    unmount();

    window.location.hash = "#specimens";
    render(<App />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("removes the exact hashchange listener it added when it unmounts", () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const hashchange = (spy) => spy.mock.calls.filter(([type]) => type === "hashchange");

    const { unmount } = render(<App />);
    const [subscribed] = hashchange(added);
    expect(subscribed).toBeDefined();
    expect(hashchange(removed)).toHaveLength(0);

    unmount();

    // Identity, not just the event name. A cleanup that calls
    // removeEventListener("hashchange", someOtherFunction) leaves the real
    // listener attached to window forever — the leak this test is named for —
    // and an assertion that only looks at the string "hashchange" calls that
    // green. Comparing the function reference is what tells the two apart.
    expect(hashchange(removed).map(([, listener]) => listener)).toContain(subscribed[1]);
  });

  describe("the hash is a route AND a fragment target", () => {
    it("stays on the sheet when the skip link is activated", async () => {
      const user = userEvent.setup();
      window.location.hash = "#specimens";
      render(<App />);
      expect(
        screen.getByRole("heading", { name: /Foundations & component states/i })
      ).toBeInTheDocument();

      // The skip link's href is "#main". Treated as a route, that hash is not
      // "#specimens", so the view used to flip back to Patient Today — the one
      // control a keyboard user reaches first threw away where they were.
      await user.click(screen.getByRole("link", { name: /skip to main content/i }));
      act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));

      expect(
        screen.getByRole("heading", { name: /Foundations & component states/i })
      ).toBeInTheDocument();
    });

    it("still switches views for a hash that names one", () => {
      window.location.hash = "#specimens";
      const { unmount } = render(<App />);
      expect(
        screen.getByRole("heading", { name: "Foundations & component states" }),
      ).toBeInTheDocument();
      unmount();

      window.location.hash = "#home";
      render(<App />);
      expect(
        screen.getByRole("heading", { name: "Good morning, Joyce" }),
      ).toBeInTheDocument();
    });

    it("marks no destination as the current page while the sheet is open", () => {
      window.location.hash = "#specimens";
      const { container } = render(<App />);
      expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
    });
  });
});
