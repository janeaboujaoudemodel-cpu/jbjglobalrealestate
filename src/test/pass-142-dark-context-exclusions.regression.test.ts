/**
 * PASS 142 — static lock for the "Bright-background contract" exclusions.
 *
 * The global rule that forces ink-black text on champagne/light surfaces
 * must keep its recursive exclusion guards so that any heading rendered
 * inside a dark / emerald / ink / navy context stays light.
 *
 * Runtime half: tests/dark-surface-heading-contrast.spec.ts
 *
 * PASS 377 (2026-08): expanded REQUIRED_EXCLUSIONS from 10 → 18 to
 * cover all DARK_HOSTS in the Playwright spec. The 8 additions are
 * enforced by src/styles/pass-377-dark-host-heading-contract.css.
 *
 * Contract rule: REQUIRED_EXCLUSIONS must remain a superset of
 * DARK_HOSTS in tests/dark-surface-heading-contrast.spec.ts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const indexCss = readFileSync(resolve(__dirname, "..", "index.css"), "utf8");
const pass377  = readFileSync(
  resolve(__dirname, "..", "styles", "pass-377-dark-host-heading-contract.css"),
  "utf8",
);
const allCss = indexCss + "\n" + pass377;

const REQUIRED_EXCLUSIONS = [
  // Original PASS 142 set — guarded in index.css
  "[data-hero-dark]",
  "[data-on-dark]",
  '[data-surface="dark"]',
  '[data-surface="emerald"]',
  '[data-surface="ink"]',
  '[data-surface="navy"]',
  "[data-no-contrast-guard]",
  ".jj-surface-emerald",
  ".jj-cta-emerald",
  ".jj-pill-emerald-metallic",
  // PASS 377 additions — guarded in pass-377-dark-host-heading-contract.css
  ".jj-hero-fullscreen",
  ".jj-hero-neon",
  ".jj-cta-primary",
  ".jj-pill-emerald",
  ".jj-side-tile",
  ".surface-dark",
  ".surface-ink",
  ".surface-navy",
];

describe("PASS 142 — bright-background contract exclusions", () => {
  it("every required dark-context selector is present in the combined stylesheet", () => {
    const missing = REQUIRED_EXCLUSIONS.filter((sel) => !allCss.includes(sel));
    expect(
      missing,
      `Missing guards for: ${missing.join(", ")} — add to index.css :not() chains or pass-377-dark-host-heading-contract.css`,
    ).toEqual([]);
  });

  it("data-no-contrast-guard is used as a :not() exclusion at least once", () => {
    expect(/:not\(\[data-no-contrast-guard\]\)/.test(indexCss)).toBe(true);
  });

  it("dark-context selectors are used as descendant guards (… *)", () => {
    const hasDescendantGuard =
      /:not\([^)]*\[data-hero-dark\][^)]*\*\)/.test(indexCss) ||
      /:not\([^)]*\[data-on-dark\][^)]*\*\)/.test(indexCss) ||
      /:not\([^)]*\[data-surface="emerald"\][^)]*\*\)/.test(indexCss) ||
      /:not\([^)]*\[data-surface="dark"\][^)]*\*\)/.test(indexCss);
    expect(hasDescendantGuard).toBe(true);
  });
});

describe("PASS 142 — emerald/dark surfaces force WHITE foreground", () => {
  it("declares the white-on-emerald enforcement block", () => {
    expect(allCss).toMatch(/color:\s*#FFFFFF\s*!important/);
    expect(allCss).toMatch(/\[data-surface="emerald"\][\s\S]{0,4000}#FFFFFF/);
  });

  it("emerald CTA classes appear in the white-foreground enforcement block", () => {
    const block = indexCss.match(
      /\.jj-cta-emerald[^{}]{0,4000}\{[^}]*color:\s*#FFFFFF\s*!important[^}]*\}/,
    );
    expect(block, "Missing canonical white-on-emerald enforcement block").toBeTruthy();
  });
});

describe("PASS 377 — gap-fill file: deletion guard only", () => {
  // IMPORTANT: these tests verify that pass-377-dark-host-heading-contract.css
  // exists and contains the expected rules. They are deletion/drift guards —
  // NOT proof that contrast passes in the rendered DOM. The CSS asserting
  // against itself cannot substitute for a real browser check.
  //
  // Authoritative verification: Playwright dark-surface-heading-contrast.spec.ts
  // running against a deployed preview after the import is wired in main.tsx.

  it(".jj-hero-fullscreen headings are set to #FFFFFF", () => {
    expect(pass377).toMatch(/\.jj-hero-fullscreen[\s\S]{0,300}color:\s*#FFFFFF\s*!important/);
  });
  it(".jj-hero-neon headings are set to #FFFFFF", () => {
    expect(pass377).toMatch(/\.jj-hero-neon[\s\S]{0,300}color:\s*#FFFFFF\s*!important/);
  });
  it(".jj-cta-primary headings are set to #FFFFFF", () => {
    expect(pass377).toMatch(/\.jj-cta-primary[\s\S]{0,300}color:\s*#FFFFFF\s*!important/);
  });
  it(".jj-pill-emerald headings are set to #FFFFFF", () => {
    expect(pass377).toMatch(/\.jj-pill-emerald[\s\S]{0,300}color:\s*#FFFFFF\s*!important/);
  });
  it(".jj-side-tile.is-active headings are set to #FFFFFF", () => {
    expect(pass377).toMatch(/\.jj-side-tile\.is-active[\s\S]{0,300}color:\s*#FFFFFF\s*!important/);
  });
  it(".surface-dark / .surface-ink / .surface-navy headings are set to #FFFFFF", () => {
    expect(pass377).toMatch(/\.surface-dark[\s\S]{0,400}color:\s*#FFFFFF\s*!important/);
    expect(pass377).toMatch(/\.surface-ink[\s\S]{0,400}color:\s*#FFFFFF\s*!important/);
    expect(pass377).toMatch(/\.surface-navy[\s\S]{0,400}color:\s*#FFFFFF\s*!important/);
  });
});
