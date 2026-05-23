/**
 * UI Regression: PricePill visual contract
 * --------------------------------------------------------------
 * Guards the locked "gold / champagne / orange" price pill so a
 * future refactor cannot quietly drop the eyebrow or the orange value.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PricePill } from "@/components/ui/price-pill";

describe("PricePill regression", () => {
  it("renders ink 'From' eyebrow and orange value when a price is provided", () => {
    const { container } = render(<PricePill price={1_500_000} currency="AED" />);

    const pill = container.querySelector("[data-price-badge]") as HTMLElement;
    expect(pill).toBeInTheDocument();
    expect(pill.className).toMatch(/price-pill-premium/);

    const eyebrow = container.querySelector(".price-pill-eyebrow");
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow?.textContent).toBe("From");

    const value = container.querySelector(".price-pill-value");
    expect(value).toBeInTheDocument();
    expect(value?.textContent).toMatch(/AED\s*1\.5M/);
  });

  it("hides the eyebrow and shows a fallback string when price is missing", () => {
    const { container } = render(<PricePill price={null} fallback="Price on request" />);
    expect(container.querySelector(".price-pill-eyebrow")).toBeNull();
    expect(screen.getByText("Price on request")).toHaveClass("price-pill-value");
  });

  it("opts out of the universal contrast guard so orange value is preserved", () => {
    const { container } = render(<PricePill price={500_000} />);
    expect(container.querySelector("[data-no-contrast-guard]")).not.toBeNull();
  });

  it("supports floating placement over a media area", () => {
    const { container } = render(<PricePill price={1_000_000} floating />);
    const pill = container.querySelector("[data-price-badge]")!;
    expect(pill.className).toMatch(/absolute/);
    expect(pill.className).toMatch(/bottom-3/);
    expect(pill.className).toMatch(/right-3/);
  });
});
