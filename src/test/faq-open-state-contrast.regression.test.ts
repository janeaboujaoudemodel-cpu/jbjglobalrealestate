import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "..", "index.css"), "utf8");

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
  });
});