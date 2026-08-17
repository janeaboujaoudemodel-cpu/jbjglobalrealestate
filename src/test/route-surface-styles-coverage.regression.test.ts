import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * `src/styles/route-surfaces.css` carries ~280 rules scoped to
 * `[data-insights-page]` and the comparison shells. It is loaded lazily, so a
 * page that renders the scope token without requesting the sheet renders with
 * none of those rules and no error anywhere — the failure is silent.
 *
 * That is exactly what happened: the loader gated on a seven-entry URL prefix
 * list while `InsightsPageScope` grew to wrap ~55 routes, so /faq, /about,
 * /market-intelligence and /company-profile shipped the token and zero rules.
 *
 * This locks the invariant at the only place it can be checked cheaply: any
 * source file that writes `data-insights-page` must also request the sheet.
 */

const SRC = resolve(__dirname, "..");
const LOADER = "ensureRouteSurfaceStyles";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe("route-surfaces.css coverage", () => {
  const sources = walk(SRC).map((path) => ({ path, text: readFileSync(path, "utf8") }));

  it("finds the scope token in the codebase at all (guards against a silent rename)", () => {
    const scopeSites = sources.filter((f) => /\sdata-insights-page\b/.test(f.text));
    expect(scopeSites.length).toBeGreaterThan(0);
  });

  it("every file that renders data-insights-page also requests the sheet", () => {
    const missing = sources
      .filter((f) => /\sdata-insights-page\b/.test(f.text))
      .filter((f) => !f.text.includes(LOADER))
      .map((f) => relative(SRC, f.path));

    expect(
      missing,
      `These files render [data-insights-page] but never call ${LOADER}(), so the ` +
        `rules scoped to that token will not load on their routes:\n` +
        missing.map((m) => `  src/${m}`).join("\n"),
    ).toEqual([]);
  });

  it("the loader is exported and idempotent", () => {
    const loader = readFileSync(resolve(SRC, "components/util/RouteSurfaceStyles.tsx"), "utf8");
    expect(loader).toContain(`export function ${LOADER}`);
    // A latch that is never reset on failure would permanently wedge the sheet
    // off after one transient chunk-load error.
    expect(loader).toMatch(/catch\(\(\) => \{\s*loaded = false;/);
  });
});
