import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Regression cover for scripts/contrast/check-contrast-architecture.mjs — the
 * blocking first step of `check:contrast:pr-gate`.
 *
 * The guard reads one bounded block out of a ~32k-line stylesheet. Two ways it
 * has silently misread that block, both of which turned the PR gate red on
 * every run without pointing at a real regression:
 *
 *   1. The end boundary was pinned to the literal `/* PASS 200`. The section
 *      that follows the contract got reformatted into a boxed comment, the
 *      sentinel stopped matching, and the slice widened to end-of-file — so
 *      every later pass in the stylesheet was audited as if it were part of
 *      the contract.
 *   2. `color:\s*(?!inherit|currentColor)` let `\s*` backtrack to zero width,
 *      which put the negative lookahead on the space instead of the value. The
 *      two values the rule explicitly permits were reported as violations.
 *
 * These tests drive the guard over fixtures so both directions are proven: a
 * clean contract passes, and a contract that really does leak still fails.
 */

const GUARD = resolve(__dirname, "..", "..", "scripts", "contrast", "check-contrast-architecture.mjs");

function runGuard(css: string): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(tmpdir(), "contrast-guard-"));
  const file = join(dir, "fixture.css");
  writeFileSync(file, css, "utf8");
  try {
    const output = execFileSync("node", [GUARD, `--css=${file}`], { encoding: "utf8", stdio: "pipe" });
    return { ok: true, output };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

const header = `/* ============================================================
   GLOBAL SEMANTIC CONTRAST CONTRACT
   ============================================================ */`;

/** A boxed section after the contract — the real end boundary. */
const nextSection = `/* ============================================================
   PASS 200 — SELF-DECLARED DARK SECTIONS KEEP THEIR DARK SURFACE
   ============================================================ */`;

describe("contrast architecture guard", () => {
  it("passes on the real src/index.css", () => {
    const output = execFileSync("node", [GUARD], { encoding: "utf8", stdio: "pipe" });
    expect(output).toContain("Contrast architecture guard passed");
  });

  it("accepts inherit / currentColor on a surface descendant reset", () => {
    const { ok, output } = runGuard(`${header}
html body #root :where([data-surface], .surface-light) :where(h1,h2,p) {
  color: inherit !important;
  -webkit-text-fill-color: currentColor !important;
}
${nextSection}`);
    expect(output).toContain("Contrast architecture guard passed");
    expect(ok).toBe(true);
  });

  it("still fails when a surface descendant paints a literal foreground", () => {
    const { ok, output } = runGuard(`${header}
html body #root :where([data-surface], .surface-light) :where(h1,h2,p) {
  color: #1A1A1A !important;
}
${nextSection}`);
    expect(ok).toBe(false);
    expect(output).toContain("descendant paint leaks across nested surfaces");
  });

  it("still fails when the contract paints generic div descendants", () => {
    const { ok, output } = runGuard(`${header}
html body #root [data-legal-section-card] :is(h1,h2,p,div) {
  color: #1A1A1A !important;
}
${nextSection}`);
    expect(ok).toBe(false);
    expect(output).toContain("must not target generic div/[role] descendants");
  });

  it("does not audit rules that sit outside the contract block", () => {
    const { ok } = runGuard(`${header}
html body #root [data-surface="light"] {
  color: #1A1A1A !important;
}
${nextSection}
html body #root [data-account-menu-content][data-surface="emerald"] :where(h1,h2,div) {
  color: #FFFFFF !important;
}`);
    expect(ok).toBe(true);
  });

  it("does not read comment prose as a selector", () => {
    const { ok } = runGuard(`${header}
/* Any element rendering the emerald pair paints white text on a div wrapper. */
html body #root .jj-surface-emerald {
  color: #FFFFFF !important;
}
${nextSection}`);
    expect(ok).toBe(true);
  });
});
