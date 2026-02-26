import { describe, expect, it } from "vitest";
import {
  hasTransparentHeader,
  isBackOfficeRoute,
  needsHeaderSpacing,
} from "@/config/mainLayoutRoutes";

describe("main layout route rules", () => {
  it("marks all service routes as transparent-header", () => {
    expect(hasTransparentHeader("/services/property-management")).toBe(true);
    expect(hasTransparentHeader("/services/buying-advisory")).toBe(true);
    expect(hasTransparentHeader("/services/investment-advisory")).toBe(true);
  });

  it("keeps back-office routes solid", () => {
    expect(isBackOfficeRoute("/admin")).toBe(true);
    expect(isBackOfficeRoute("/listing-admin/projects")).toBe(true);
    expect(isBackOfficeRoute("/broker-dashboard")).toBe(true);
    expect(hasTransparentHeader("/admin")).toBe(false);
  });

  it("computes stable spacing deterministically from pathname", () => {
    expect(needsHeaderSpacing("/services/property-management")).toBe(false);
    expect(needsHeaderSpacing("/contact")).toBe(true);
  });
});
