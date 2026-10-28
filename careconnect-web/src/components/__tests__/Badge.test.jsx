import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import Badge from "../Badge.jsx";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>Coming up</Badge>);
    expect(screen.getByText("Coming up")).toBeInTheDocument();
  });

  it("announces only the word on a success tone, never the check mark", () => {
    const { container } = render(<Badge tone="success">Taken</Badge>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.textContent).toBe("Taken");
  });
});
