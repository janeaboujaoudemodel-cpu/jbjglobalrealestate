import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AdaptiveHairline } from "../AdaptiveHairline";

/**
 * AdaptiveHairline is a permanent no-op per the global "no hairline
 * dividers between sections" design rule (see the component's own
 * doc comment / mem://constraints/no-gray-surfaces) — it renders
 * nothing, for every variant and prop combination. This file asserts
 * that contract instead of the pre-disablement rendered-stroke styling
 * it used to check.
 */
describe("<AdaptiveHairline />", () => {
  it.each(["accent", "nav", "soft"] as const)(
    "renders nothing for variant=%s",
    (variant) => {
      const { container } = render(<AdaptiveHairline variant={variant} />);
      expect(container.firstElementChild).toBeNull();
    },
  );

  it("renders nothing even when a layout className is forwarded", () => {
    const { container } = render(
      <AdaptiveHairline variant="nav" className="max-w-7xl mx-auto" />,
    );
    expect(container.firstElementChild).toBeNull();
  });

  it("renders nothing with no props at all", () => {
    const { container } = render(<AdaptiveHairline />);
    expect(container.firstElementChild).toBeNull();
  });
});
