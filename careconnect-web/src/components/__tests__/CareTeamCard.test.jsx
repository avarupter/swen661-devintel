import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { patientToday } from "../../data/patientToday.js";
import CareTeamCard from "../CareTeamCard.jsx";

/**
 * Four things come out of the data here — heading, availability line, body copy
 * and the action label — and the fixture below gives each of them a string that
 * could not be mistaken for any of the others, so a test cannot pass by finding
 * the right text in the wrong place.
 *
 * The soft surface itself (#F4F8FF) is a computed background: not something
 * jsdom can report. It is measured in Chromium (README, "Verification").
 */
const careTeam = {
  heading: "Heading from the data",
  availability: "Availability from the data",
  body: "Body copy from the data.",
  action: "Action from the data",
};

describe("CareTeamCard", () => {
  describe("heading", () => {
    it("renders the heading from the data as a level-2 heading", () => {
      render(<CareTeamCard data={careTeam} />);

      expect(
        screen.getByRole("heading", { level: 2, name: careTeam.heading }),
      ).toBeInTheDocument();
    });

    it("names the region with that heading, so the id wiring has to match", () => {
      render(<CareTeamCard data={careTeam} />);

      expect(
        screen.getByRole("region", { name: careTeam.heading }),
      ).toBeInTheDocument();
    });

    it("leaves the availability line out of the heading and out of the region name", () => {
      render(<CareTeamCard data={careTeam} />);
      const heading = screen.getByRole("heading", { level: 2 });

      expect(heading).toHaveTextContent(careTeam.heading);
      expect(heading).not.toHaveTextContent(careTeam.availability);
      expect(screen.getByRole("region")).toHaveAccessibleName(
        careTeam.heading,
      );
    });
  });

  describe("availability and body copy", () => {
    it("renders the availability line outside the heading, as a sibling of it", () => {
      render(<CareTeamCard data={careTeam} />);
      const line = screen.getByText(careTeam.availability);
      const heading = screen.getByRole("heading", { level: 2 });

      // Checked in the direction that can really happen: the line folded INTO
      // the <h2>. Asserting the reverse (the line containing the heading) sat
      // here and stayed green through exactly that mutation. `getByText`
      // already throws when the line is missing, so presence needs no
      // assertion of its own.
      expect(heading).not.toContainElement(line);
      expect(line.parentElement).toBe(heading.parentElement);
    });

    it("renders the body copy in its own paragraph, not merged into the availability line", () => {
      render(<CareTeamCard data={careTeam} />);
      const body = screen.getByText(careTeam.body);
      const availability = screen.getByText(careTeam.availability);

      // Containment alone is not enough in either direction: wrapping both
      // strings in sibling spans inside the one <p class="cc-care__available">
      // leaves neither containing the other, and leaves container.textContent
      // identical, so the "announces nothing but the four strings" test below
      // does not see it either. The paragraph identity is what catches it.
      expect(body).not.toContainElement(availability);
      expect(availability).not.toContainElement(body);
      expect(body.closest("p")).not.toBe(availability.closest("p"));
    });

    it("renders the shipped Patient Today copy in full", () => {
      render(<CareTeamCard data={patientToday.careTeam} />);

      expect(
        screen.getByRole("region", { name: "Your care team" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Available today")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Questions about your day? Send a message and your care team will get back to you.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Message care team" }),
      ).toBeInTheDocument();
    });
  });

  describe("the action", () => {
    it("renders a button whose accessible name is exactly the action label", () => {
      render(<CareTeamCard data={careTeam} />);
      const action = screen.getByRole("button", { name: careTeam.action });

      // Exactly: the chat icon beside the label must contribute nothing.
      expect(action).toHaveAccessibleName(careTeam.action);
    });

    it("renders it as a plain button, so it cannot submit a surrounding form", () => {
      render(
        <form>
          <CareTeamCard data={careTeam} />
        </form>,
      );

      expect(
        screen.getByRole("button", { name: careTeam.action }),
      ).toHaveAttribute("type", "button");
    });

    it("leaves the action enabled, and never uses aria-disabled to say otherwise", () => {
      render(<CareTeamCard data={careTeam} />);
      const action = screen.getByRole("button", { name: careTeam.action });

      expect(action).toBeEnabled();
      expect(action).not.toHaveAttribute("aria-disabled");
      expect(action).not.toHaveAttribute("disabled");
    });

    it("keeps a long action label whole in the accessible name", () => {
      const longAction =
        "Message your care team about today's visiting nurse appointment";
      render(<CareTeamCard data={{ ...careTeam, action: longAction }} />);

      expect(
        screen.getByRole("button", { name: longAction }),
      ).toHaveAccessibleName(longAction);
    });

    it("renders exactly one action", () => {
      render(<CareTeamCard data={careTeam} />);
      expect(screen.getAllByRole("button")).toHaveLength(1);
    });
  });

  describe("decorative icons", () => {
    it("hides both the shield and the chat icon from assistive technology", () => {
      const { container } = render(<CareTeamCard data={careTeam} />);
      const icons = container.querySelectorAll("svg");

      expect(icons).toHaveLength(2);
      for (const icon of icons) {
        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(icon).toHaveAttribute("focusable", "false");
      }
    });

    it("announces nothing but the four strings from the data", () => {
      const { container } = render(<CareTeamCard data={careTeam} />);

      expect(container.textContent).toBe(
        careTeam.heading +
          careTeam.availability +
          careTeam.body +
          careTeam.action,
      );
    });
  });

  describe("the shell it asks Card for", () => {
    it("renders as a section element", () => {
      const { container } = render(<CareTeamCard data={careTeam} />);
      expect(container.firstElementChild.tagName).toBe("SECTION");
    });

    it("asks for the soft tone, which is the modifier the stylesheet selects on", () => {
      const { container } = render(<CareTeamCard data={careTeam} />);
      const shell = container.firstElementChild;

      expect(shell).toHaveClass("cc-card", "cc-card--soft", "cc-care");
      expect(shell).not.toHaveClass("cc-card--surface");
    });

    it("asks Button for the secondary, full-width modifiers the stylesheet selects on", () => {
      // The modifiers only. Whether the result is actually outlined, and
      // actually spans the card, is measured in Chromium (README,
      // "Verification").
      render(<CareTeamCard data={careTeam} />);

      expect(screen.getByRole("button", { name: careTeam.action })).toHaveClass(
        "cc-btn",
        "cc-btn--secondary",
        "cc-btn--full",
      );
    });
  });
});
