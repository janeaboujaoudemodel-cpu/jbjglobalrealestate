/**
 * UI Regression: DeveloperLink gold contract
 * --------------------------------------------------------------
 * Locks the "by <gold name>" pattern. As of PASS 269 (see the component's
 * own doc comment), the name renders an animated champagne->gold GRADIENT
 * via `background-clip: text` + `color: transparent` — applied
 * imperatively in a useEffect, which is why this asserts post-effect
 * jsdom state rather than the plain inline `style={{ color: '#B89555' }}`
 * pre-effect fallback. If any refactor drops the gradient fill, the
 * animation, or the "by " prefix, this test fails.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DeveloperLink } from "@/components/ui/developer-link";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("DeveloperLink regression", () => {
  it("renders the 'by ' prefix in ink and the developer name as a gold gradient", () => {
    renderWithRouter(<DeveloperLink name="Emaar Properties" slug="emaar" />);

    expect(screen.getByText("by")).toBeInTheDocument();

    const nameNode = screen.getByText("Emaar Properties");
    // PASS 269: gradient text — the solid colour is transparent, the gold
    // comes from the background-image clipped to the text.
    expect(nameNode.style.color).toBe("transparent");
    expect(nameNode.style.webkitTextFillColor || nameNode.style.getPropertyValue("-webkit-text-fill-color"))
      .toBe("transparent");
    expect(nameNode.style.backgroundImage).toContain("linear-gradient");
    // jsdom normalizes the -webkit-background-clip we set into plain background-clip.
    expect(nameNode.style.backgroundClip).toBe("text");
    expect(nameNode).toHaveAttribute("data-developer-gold");
    expect(nameNode).toHaveAttribute("data-no-contrast-guard");
    expect(nameNode.className).toMatch(/developer-name-gold/);
  });

  it("links to /developer/:slug when slug is provided", () => {
    renderWithRouter(<DeveloperLink name="DAMAC" slug="damac" />);
    const nameNode = screen.getByText("DAMAC");
    expect(nameNode).toHaveAttribute("data-href", "/developer/damac");
  });

  it("falls back to a search query when slug is missing but stays a gold gradient", () => {
    renderWithRouter(<DeveloperLink name="Unknown Dev" />);
    const nameNode = screen.getByText("Unknown Dev");
    expect(nameNode.getAttribute("data-href")).toBe(
      "/developers?search=Unknown%20Dev"
    );
    expect(nameNode.style.color).toBe("transparent");
    expect(nameNode.style.backgroundImage).toContain("linear-gradient");
  });

  it("can hide the 'by' prefix when embedded in custom copy", () => {
    renderWithRouter(<DeveloperLink name="Sobha" slug="sobha" showPrefix={false} />);
    expect(screen.queryByText("by")).toBeNull();
    expect(screen.getByText("Sobha")).toHaveAttribute("data-developer-gold");
  });
});
