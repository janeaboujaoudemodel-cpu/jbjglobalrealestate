/**
 * PASS 142 — static lock for the "Bright-background contract" exclusions.
 *
 * The global rule that forces ink-black text on champagne/light surfaces
 * must keep its recursive exclusion guards so that any heading rendered
 * inside a dark / emerald / ink / navy context stays light. If a future
 * refactor strips these `:not(...)` clauses, headings inside dark heroes,
 * emerald CTAs and sidebar tiles silently flip back to ink-black.
 *
 * This file owns the contract at the CSS level so we catch regressions
 * without spinning up Playwright. The runtime DOM half lives in
 * tests/dark-surface-heading-contrast.spec.ts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "..", "index.css"), "utf8");

const REQUIRED_EXCLUSIONS = [
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
];

describe("PASS 142 — bright-background contract exclusions", () => {
  it("every required dark-context selector is excluded somewhere in index.css", () => {
    const missing = REQUIRED_EXCLUSIONS.filter((sel) => !css.includes(sel));
    expect(
      missing,
      `index.css is missing exclusion guards for: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("data-no-contrast-guard is used as a :not() exclusion at least once", () => {
    expect(/:not\(\[data-no-contrast-guard\]\)/.test(css)).toBe(true);
  });

  it("dark-context selectors are used as descendant guards (… *)", () => {
    // At least one :not() clause must chain "<dark-host> *" so descendants
    // of a dark host stay exempt from the bright-bg ink-flip.
    const hasDescendantGuard =
      /:not\([^)]*\[data-hero-dark\][^)]*\*\)/.test(css) ||
      /:not\([^)]*\[data-on-dark\][^)]*\*\)/.test(css) ||
      /:not\([^)]*\[data-surface="emerald"\][^)]*\*\)/.test(css) ||
      /:not\([^)]*\[data-surface="dark"\][^)]*\*\)/.test(css);
    expect(hasDescendantGuard).toBe(true);
  });
});

describe("PASS 142 — emerald/dark surfaces force WHITE foreground", () => {
  it("declares the white-on-emerald enforcement block", () => {
    // The block at ~line 18060 enforces #FFFFFF on every dark-surface descendant.
    expect(css).toMatch(/color:\s*#FFFFFF\s*!important/);
    expect(css).toMatch(/\[data-surface="emerald"\][\s\S]{0,4000}#FFFFFF/);
  });

  it("emerald CTA classes are referenced inside the white-foreground enforcement block", () => {
    // Ensure .jj-cta-emerald / .jj-pill-emerald-metallic appear in a selector
    // list that ends with `color: #FFFFFF !important` (the PASS 130/142 lock).
    const block = css.match(
      /\.jj-cta-emerald[^{}]{0,4000}\{[^}]*color:\s*#FFFFFF\s*!important[^}]*\}/,
    );
    expect(block, "Missing canonical white-on-emerald enforcement block").toBeTruthy();
  });
});

