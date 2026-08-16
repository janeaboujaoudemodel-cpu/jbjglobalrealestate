import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Read the whole shipped stylesheet, not just its entry point.
 *
 * `src/index.css` used to be the only sheet, so guards like this one read it
 * directly. The CSS-debt work then extracted route-scoped rules into
 * `src/styles/*.css` (loaded by RouteSurfaceStyles), and this guard's subject —
 * the Insights bright-card ink guard — moved to `route-surfaces.css`. The rule
 * and its `:not(.jj-faq-item *)` exclusion were both intact; only the guard's
 * hard-coded path was stale, which failed the whole Vitest job.
 *
 * Reading every sheet keeps the contract asserted wherever extraction puts it.
 */
const STYLE_DIR = resolve(__dirname, "..", "styles");

const css = [
  readFileSync(resolve(__dirname, "..", "index.css"), "utf8"),
  ...readdirSync(STYLE_DIR)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(resolve(STYLE_DIR, f), "utf8")),
].join("\n");

describe("FAQ open-state contrast cascade", () => {
  it("excludes FAQ descendants from the Insights bright-card ink guard", () => {
    const inkGuard = css.match(
      /\[data-insights-page\][^{}]+:is\(h1,h2,h3,h4,h5,h6,p,span,a,li,small,strong,em,div,label,button\)[^{]+\{\s*color:\s*var\(--jj-insights-ink\)\s*!important;/,
    );

    expect(inkGuard, "Insights bright-card ink guard was not found").toBeTruthy();
    expect(inkGuard?.[0]).toContain(":not(.jj-faq-item *)");
  });

  it("keeps the shared FAQ component state contract", () => {
    const component = readFileSync(
      resolve(__dirname, "..", "components", "content-page", "FAQPageShell.tsx"),
      "utf8",
    );

    expect(component).toContain("data-no-contrast-guard");
    expect(component).toContain("data-[state=open]:bg-[image:var(--jj-emerald-ombre)]");
    expect(component).toContain("data-[state=open]:text-white");
    expect(css).toContain('.jj-faq-item[data-state="closed"]');
    expect(css).toContain('.jj-faq-item[data-state="open"]');
  });
});