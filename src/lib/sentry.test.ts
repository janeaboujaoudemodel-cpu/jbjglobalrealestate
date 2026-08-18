import { describe, expect, it } from "vitest";
import { scrubPii } from "./sentry";

describe("scrubPii", () => {
  it("redacts values under PII-shaped keys", () => {
    expect(
      scrubPii({ email: "jane@example.com", phone: "+971501234567", listingId: "abc-123" }),
    ).toEqual({ email: "[redacted]", phone: "[redacted]", listingId: "abc-123" });
  });

  it("matches PII keys case-insensitively and inside compound names", () => {
    expect(
      scrubPii({ customerEmail: "a@b.com", USER_PHONE: "+971500000000", Full_Name: "Jane" }),
    ).toEqual({ customerEmail: "[redacted]", USER_PHONE: "[redacted]", Full_Name: "[redacted]" });
  });

  it("redacts emails and phone numbers embedded in free text", () => {
    expect(scrubPii({ note: "contact jane@example.com or +971 50 123 4567 today" })).toEqual({
      note: "contact [redacted] or [redacted] today",
    });
  });

  it("recurses into nested objects and arrays", () => {
    expect(
      scrubPii({ form: { fields: [{ email: "a@b.com" }, { city: "Dubai" }] } }),
    ).toEqual({ form: { fields: [{ email: "[redacted]" }, { city: "Dubai" }] } });
  });

  it("leaves non-PII primitives untouched", () => {
    expect(scrubPii({ count: 3, ok: true, missing: null })).toEqual({
      count: 3,
      ok: true,
      missing: null,
    });
  });

  it("does not hang on circular references", () => {
    const cyclic: Record<string, unknown> = { surface: "AppErrorBoundary" };
    cyclic.self = cyclic;
    expect(scrubPii(cyclic)).toEqual({ surface: "AppErrorBoundary", self: "[circular]" });
  });

  it("bounds recursion depth", () => {
    // 8 levels deep — deeper than the depth-6 cutoff.
    let deep: Record<string, unknown> = { email: "a@b.com" };
    for (let i = 0; i < 8; i++) deep = { nested: deep };
    expect(JSON.stringify(scrubPii(deep))).toContain("[truncated]");
  });

  it("scrubs a realistic error-boundary payload end to end", () => {
    const scrubbed = scrubPii({
      surface: "CheckoutErrorBoundary",
      formState: {
        fullName: "Jane Abou Jaoude",
        email: "jane@example.com",
        phone: "+971501234567",
        priceId: "price_broker_annual",
        message: "reach me at jane@example.com",
      },
      retryCount: 2,
    }) as Record<string, unknown>;

    expect(JSON.stringify(scrubbed)).not.toContain("jane@example.com");
    expect(JSON.stringify(scrubbed)).not.toContain("971501234567");
    // Non-PII diagnostic context must survive — the report is useless otherwise.
    expect(scrubbed.surface).toBe("CheckoutErrorBoundary");
    expect(scrubbed.retryCount).toBe(2);
    expect((scrubbed.formState as Record<string, unknown>).priceId).toBe("price_broker_annual");
  });
});
