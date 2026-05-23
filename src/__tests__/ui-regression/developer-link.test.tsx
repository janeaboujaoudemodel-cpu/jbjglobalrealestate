/**
 * UI Regression: DeveloperLink gold contract
 * --------------------------------------------------------------
 * Locks the "by <gold name>" pattern. If any refactor drops the
 * inline gold colour, the gold underline, or the "by " prefix,
 * this test fails.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DeveloperLink } from "@/components/ui/developer-link";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

// #B89555 in the rgb form jsdom emits
const GOLD_RGB = "rgb(184, 149, 85)";

describe("DeveloperLink regression", () => {
  it("renders the 'by ' prefix in ink and the developer name in gold", () => {
    renderWithRouter(<DeveloperLink name="Emaar Properties" slug="emaar" />);

    expect(screen.getByText("by")).toBeInTheDocument();

    const nameNode = screen.getByText("Emaar Properties");
    expect(nameNode.style.color).toBe(GOLD_RGB);
    expect(nameNode.style.webkitTextFillColor || nameNode.style.getPropertyValue("-webkit-text-fill-color"))
      .toBe(GOLD_RGB);
    expect(nameNode).toHaveAttribute("data-developer-gold");
    expect(nameNode).toHaveAttribute("data-no-contrast-guard");
    expect(nameNode.className).toMatch(/developer-name-gold/);
  });

  it("links to /developer/:slug when slug is provided", () => {
    renderWithRouter(<DeveloperLink name="DAMAC" slug="damac" />);
    const nameNode = screen.getByText("DAMAC");
    expect(nameNode).toHaveAttribute("data-href", "/developer/damac");
  });

  it("falls back to a search query when slug is missing but stays gold", () => {
    renderWithRouter(<DeveloperLink name="Unknown Dev" />);
    const nameNode = screen.getByText("Unknown Dev");
    expect(nameNode.getAttribute("data-href")).toBe(
      "/developers?search=Unknown%20Dev"
    );
    expect(nameNode.style.color).toBe(GOLD_RGB);
  });

  it("can hide the 'by' prefix when embedded in custom copy", () => {
    renderWithRouter(<DeveloperLink name="Sobha" slug="sobha" showPrefix={false} />);
    expect(screen.queryByText("by")).toBeNull();
    expect(screen.getByText("Sobha")).toHaveAttribute("data-developer-gold");
  });
});
