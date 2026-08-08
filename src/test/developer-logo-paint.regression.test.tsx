import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DeveloperLogo, getLogoPaintStyle } from "@/components/ui/DeveloperLogo";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

describe("developer logo repository enforcement", () => {
  it("rejects raw image elements wired to developer logo fields", () => {
    const root = join(process.cwd(), "src");
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          walk(path);
          continue;
        }
        if (!/\.tsx?$/.test(path) || path.endsWith("DeveloperLogo.tsx")) continue;
        const source = readFileSync(path, "utf8");
        if (/<img[\s\S]{0,500}(?:developer|dev)\??\.(?:logo_url|logo_url_processed|developer_logo)/i.test(source)) {
          violations.push(path.replace(`${process.cwd()}/`, ""));
        }
      }
    };
    walk(root);
    expect(violations).toEqual([]);
  });

  it("rejects typed developer-logo fallback markers", () => {
    const component = readFileSync(join(process.cwd(), "src/components/ui/DeveloperLogo.tsx"), "utf8");
    expect(component).not.toContain('data-developer-logo={embedded ? undefined : "nameplate"}');
    expect(component).not.toContain("forceNameplate");
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
    "Hvm Living Real Estate Development L.L.C",
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

  it("renders HVM Living with its official white artwork on every canonical surface", () => {
    for (const variant of ["bare", "card", "nameplate", "tile"] as const) {
      const { container, queryByText, unmount } = renderLogo({
        name: "Hvm Living Real Estate Development L.L.C",
        alt: "HVM Living logo",
        src: "https://api.reelly.io/vault/example/opaque-logo.png",
        variant,
        loading: "eager",
      });
      const img = container.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toContain("hvm-living-white.png");
      expect(paint(img)).toEqual({ filter: "none", blend: "normal" });
      expect(queryByText("Hvm Living Real Estate Development L.L.C")).toBeNull();
      unmount();
    }
  });

  it("mounts real database artwork immediately so cross-origin logos never remain blank", () => {
    const { container } = renderLogo({
      name: "Some Unknown Developer",
      src: "https://cdn.example.com/logo.png",
      variant: "card",
    });
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/logo.png");
    expect(container.querySelector('[data-developer-logo="unresolved"]')).toBeNull();
    expect(container.textContent).not.toContain("Some Unknown Developer");
  });

  it("mounts light database artwork immediately while retaining its paint hint", () => {
    const { container } = renderLogo({
      name: "Light Artwork Developer",
      src: "https://cdn.example.com/white-logo.png",
      needsInvert: false,
      variant: "card",
    });
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/white-logo.png");
    expect(container.querySelector('[data-developer-logo="unresolved"]')).toBeNull();
    expect(container.textContent).not.toContain("Light Artwork Developer");
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

  it("keeps the whole identity plate hidden until its real artwork loads", () => {
    const { container } = renderLogo({
      name: "Some Unknown Developer",
      src: "https://cdn.example.com/logo.png",
      variant: "bare",
    });
    const plate = container.firstElementChild as HTMLElement;
    expect(plate.className).toMatch(/opacity-0/);
    expect(plate.getAttribute("data-logo-loaded")).toBe("false");
    expect(plate.getAttribute("data-developer-logo")).toBe("database");
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

  it.each(["ADE Properties", "Ag Properties", "Ahmadyar Developments"])("uses the shared visible scale for %s", (name) => {
    const { container } = renderLogo({ name, src: "https://cdn.example.com/logo.png" });
    expect(container.querySelector("img")?.className).toContain("scale-100");
  });

  it("never fabricates a typed logo when official artwork is unresolved", () => {
    const { container } = renderLogo({
      name: "Developer Without Logo",
      src: null,
      variant: "card",
    });
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).not.toContain("Developer Without Logo");
    expect(container.querySelector('[data-developer-logo="unresolved"]')).toBeTruthy();
    expect(container.firstElementChild?.className).toMatch(/#042C1C/);
  });

  it("never adds typed text to an unresolved gold identity plate", () => {
    const { container } = renderLogo({
      name: "Developer Without Logo",
      src: null,
      variant: "card",
      "data-keep-gold": true,
    });
    expect(container.textContent).not.toContain("Developer Without Logo");
  });
});
