/**
 * Regression coverage for BrokerGuard's forbidden-prefix redirect
 * (src/components/BrokerGuard.tsx, the block that bounces brokers away from
 * owner/admin-prefixed routes back to /broker/crm).
 *
 * That redirect was gated only on `isBroker` - a flag the owner
 * short-circuit above it also sets to true - so it had no actual owner
 * exclusion despite its own header comment promising "Owners always bypass
 * this list". A dedicated `isOwner` flag now gates the redirect. These
 * tests pin both branches: an owner must NOT be bounced to /broker/crm, a
 * pure broker still must.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const h = vi.hoisted(() => ({
  authState: {
    user: null as null | { id: string; email: string },
    loading: false,
  },
  isOwnerResult: false,
  brokerRow: null as null | { id: string; blocked_at: string | null; is_active_broker: boolean },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => h.authState,
}));

vi.mock("@/hooks/useBrokerSessionTracking", () => ({
  useBrokerSessionTracking: () => {},
}));

vi.mock("@/utils/brokerAuthDebug", () => ({
  brokerLog: () => {},
  installBrokerNetworkLogger: () => {},
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: async (name: string) => {
        if (name === "verify-owner") {
          return { data: { isOwner: h.isOwnerResult }, error: null };
        }
        return { data: null, error: null };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: h.brokerRow, error: null }),
        }),
      }),
    }),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      signOut: async () => ({ error: null }),
    },
  },
}));

import BrokerGuard from "@/components/BrokerGuard";

const OWNER_EMAIL = "owner@example.com";
const BROKER_EMAIL = "broker@example.com";

beforeEach(() => {
  h.authState.user = null;
  h.authState.loading = false;
  h.isOwnerResult = false;
  // Active CRM broker row by default - takes the isActiveBroker branch
  // directly without exercising the self-heal / legacy-subscription paths,
  // which aren't what these two tests are checking.
  h.brokerRow = { id: "row1", blocked_at: null, is_active_broker: true };
});

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/broker/crm" element={<div>BROKER_CRM</div>} />
        <Route path="/403" element={<div>FORBIDDEN</div>} />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route
          path="*"
          element={
            <BrokerGuard>
              <div>PROTECTED_CONTENT</div>
            </BrokerGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BrokerGuard — forbidden-prefix redirect owner exclusion", () => {
  it("does NOT bounce an owner hitting an owner-prefixed path to /broker/crm", async () => {
    h.authState.user = { id: "u-owner", email: OWNER_EMAIL };
    h.isOwnerResult = true;
    renderAtPath("/owner/some-page");
    await waitFor(() => {
      expect(screen.getByText("PROTECTED_CONTENT")).toBeInTheDocument();
    });
    expect(screen.queryByText("BROKER_CRM")).not.toBeInTheDocument();
  });

  it("still bounces a pure broker hitting an owner-prefixed path to /broker/crm", async () => {
    h.authState.user = { id: "u-broker", email: BROKER_EMAIL };
    h.isOwnerResult = false;
    renderAtPath("/owner/some-page");
    await waitFor(() => {
      expect(screen.getByText("BROKER_CRM")).toBeInTheDocument();
    });
    expect(screen.queryByText("PROTECTED_CONTENT")).not.toBeInTheDocument();
  });
});
