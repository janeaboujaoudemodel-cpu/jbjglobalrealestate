import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DeveloperLogo, getLogoPaintStyle } from "@/components/ui/DeveloperLogo";

/**
 * LOGO RENDERING GUARD
 * Locks the two failure modes the owner rejected:
 *  1. Light/white artwork must never be inverted (turns black or erases to blank).
 *  2. A logo plate must never render as a white block, and never as an empty slot.
 */

const paint = (el: HTMLElement) => ({
  filter: el.style.filter,
  blend: el.style.mixBlendMode,
});

describe("getLogoPaintStyle", () => {
  it("never inverts curated white artwork", () => {
    expect(getLogoPaintStyle({ isLightArtwork: true })).toEqual({
      filter: "none",
      mixBlendMode: "normal",
    });
  });

  it("never inverts artwork flagged as already light", () => {
    expect(getLogoPaintStyle({ needsInvert: false })).toEqual({
      filter: "none",
      mixBlendMode: "normal",
    });
  });

  it("never inverts the gold identity plate", () => {
    expect(getLogoPaintStyle({ keepGold: true })).toEqual({
      filter: "none",
      mixBlendMode: "normal",
    });
  });

  it("knocks unknown/dark artwork out to white with screen blending", () => {
    expect(getLogoPaintStyle({ needsInvert: true })).toEqual({
      filter: "brightness(0) invert(1)",
      mixBlendMode: "screen",
    });
  });

  it("honors curated per-developer overrides", () => {
    expect(
      getLogoPaintStyle({
        needsInvert: true,
        overrideFilter: "none",
        overrideBlendMode: "normal",
      }),
    ).toEqual({ filter: "none", mixBlendMode: "normal" });
  });
});

const renderLogo = (props: Parameters<typeof DeveloperLogo>[0]) =>
  render(
    <MemoryRouter>
      <DeveloperLogo {...props} />
    </MemoryRouter>,
  );

describe("DeveloperLogo rendering guard", () => {
  const curated = [
    "ADE Properties",
    "AG Properties",
    "AIZN Development",
    "AMIS Development",
    "ANAX Developments",
    "Dubai South Properties",
    "Tiger Properties",
    "Tiger Group",
  ];

  it.each(curated)("renders %s curated artwork uninverted", (name) => {
    const { container } = renderLogo({ name, alt: name, variant: "card" });
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(paint(img)).toEqual({ filter: "none", blend: "normal" });
  });

  it.each([
    ["Aldar", "/developers/logos/aldar-logo.png"],
    ["Aldar Properties", "/developers/logos/aldar-logo.png"],
    ["Dubai Properties", "/developers/logos/dubai-properties-logo.webp"],
    ["Condor Developers", "/developers/logos/condor-developers-logo.png"],
  ])("renders the official %s artwork instead of typed fallback text", (name, expectedSrc) => {
    const { container, queryByText } = renderLogo({
      name,
      alt: name,
      src: null,
      variant: "bare",
      loading: "eager",
    });
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe(expectedSrc);
    expect(queryByText(name)).toBeNull();
  });

  it("never paints unverified database artwork before its transparency audit", () => {
    const { container, getByText } = renderLogo({
      name: "Some Unknown Developer",
      src: "https://cdn.example.com/logo.png",
      variant: "card",
    });
    expect(container.querySelector("img")).toBeNull();
    expect(getByText("Some Unknown Developer")).toBeTruthy();
  });

  it("does not trust an unaudited database image solely from a paint hint", () => {
    const { container, getByText } = renderLogo({
      name: "Light Artwork Developer",
      src: "https://cdn.example.com/white-logo.png",
      needsInvert: false,
      variant: "card",
    });
    expect(container.querySelector("img")).toBeNull();
    expect(getByText("Light Artwork Developer")).toBeTruthy();
  });

  it("never paints a white plate background on any variant", () => {
    for (const variant of ["tile", "bare", "card", "nameplate"] as const) {
      const { container, unmount } = renderLogo({
        name: "Some Unknown Developer",
        src: "https://cdn.example.com/logo.png",
        variant,
      });
      const plate = container.firstElementChild as HTMLElement;
      const cls = plate.className;
      expect(cls).not.toMatch(/bg-white|bg-\[#fff|bg-ivory|bg-background/i);
      expect(cls).toMatch(/#042C1C/);
      unmount();
    }
  });

  it("shows one complete emerald identity plate while artwork is audited", () => {
    const { container, getByText } = renderLogo({
      name: "Some Unknown Developer",
      src: "https://cdn.example.com/logo.png",
      variant: "bare",
    });
    const plate = container.firstElementChild as HTMLElement;
    expect(plate.className).not.toMatch(/opacity-0/);
    expect(plate.getAttribute("data-logo-loaded")).toBe("false");
    expect(getByText("Some Unknown Developer")).toBeTruthy();
  });

  it("uses the premium wide plate dimensions for listing logos", () => {
    const { container } = renderLogo({
      name: "Some Unknown Developer",
      src: "https://cdn.example.com/logo.png",
      variant: "bare",
      size: "md",
    });
    expect(container.firstElementChild?.className).toMatch(/h-\[72px\].*w-36/);
  });

  it.each([
    ["ADE Properties", "scale-[1.45]"],
    ["Ag Properties", "scale-[1.18]"],
    ["Ahmadyar Developments", "scale-[1.32]"],
  ])("normalizes the visible scale of %s without replacing its mark", (name, scaleClass) => {
    const { container } = renderLogo({ name, src: "https://cdn.example.com/logo.png" });
    expect(container.querySelector("img")?.className).toContain(scaleClass);
  });

  it("falls back to a readable white wordmark instead of an empty slot", () => {
    const { container, getByText } = renderLogo({
      name: "Developer Without Logo",
      src: null,
      variant: "card",
    });
    expect(container.querySelector("img")).toBeNull();
    const label = getByText("Developer Without Logo");
    expect(label.className).toMatch(/text-white/);
    expect(container.firstElementChild?.className).toMatch(/#042C1C/);
  });

  it("uses dark text on the gold identity plate for contrast", () => {
    const { getByText } = renderLogo({
      name: "Developer Without Logo",
      src: null,
      variant: "card",
      "data-keep-gold": true,
    });
    expect(getByText("Developer Without Logo").className).toMatch(/#042C1C/);
  });
});
