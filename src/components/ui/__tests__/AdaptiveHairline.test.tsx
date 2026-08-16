import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AdaptiveHairline } from "../AdaptiveHairline";

/**
 * AdaptiveHairline is a permanent no-op per the "no hairline dividers
 * between sections" design rule (see the component's own doc comment and
 * mem://constraints/no-gray-surfaces) — it always renders null. Call sites
 * are kept only so existing `<AdaptiveHairline variant="..." />` usages
 * still compile; this test locks that contract rather than any visual
 * rendering, which no longer exists.
 */
describe("<AdaptiveHairline />", () => {
  it("renders nothing for every variant", () => {
    for (const variant of ["accent", "nav", "soft"] as const) {
      const { container } = render(<AdaptiveHairline variant={variant} />);
      expect(container).toBeEmptyDOMElement();
    }
  });

  it("renders nothing even when passed a className (no-op ignores all props)", () => {
    const { container } = render(
      <AdaptiveHairline variant="nav" className="max-w-7xl mx-auto" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
