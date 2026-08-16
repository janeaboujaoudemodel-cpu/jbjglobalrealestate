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
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";

const h = vi.hoisted(() => ({
  authState: {
    user: null as null | { id: string; email: string },
    loading: false,
  },
  isOwnerResult: false,
  brokerRow: null as null | { id: string; blocked_at: string | null; is_active_broker: boolean },
  // Set by individual tests to override the default resolved-value mocks
  // below with a promise the test controls the timing of.
  verifyOwnerImpl: null as null | (() => Promise<any>),
  crmBrokersImpl: null as null | (() => Promise<any>),
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
          if (h.verifyOwnerImpl) return h.verifyOwnerImpl();
          return { data: { isOwner: h.isOwnerResult }, error: null };
        }
        return { data: null, error: null };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (h.crmBrokersImpl) return h.crmBrokersImpl();
            return { data: h.brokerRow, error: null };
          },
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
  h.verifyOwnerImpl = null;
  h.crmBrokersImpl = null;
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

/** Exposes an in-place navigation trigger without unmounting BrokerGuard -
 * both target paths match the same wildcard <Route>, so React Router keeps
 * the element mounted and only useLocation()'s value changes, which is what
 * re-triggers BrokerGuard's status-check effect (location.pathname is one
 * of its dependencies). */
function NavHarness() {
  const navigate = useNavigate();
  return (
    <div>
      <div>PROTECTED_CONTENT</div>
      <button onClick={() => navigate("/owner/page-b")}>go</button>
    </div>
  );
}

function renderWithNav() {
  return render(
    <MemoryRouter initialEntries={["/owner/page-a"]}>
      <Routes>
        <Route path="/broker/crm" element={<div>BROKER_CRM</div>} />
        <Route path="/403" element={<div>FORBIDDEN</div>} />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route
          path="*"
          element={
            <BrokerGuard>
              <NavHarness />
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

  // The redirect condition alone isn't the whole story: isOwner and isBroker
  // aren't always updated in the same tick (only the confirmed-owner branch
  // batches them together - see the "not owner" branch, which resets isOwner
  // immediately but leaves isBroker to be reconfirmed several awaits later
  // via the crm_brokers lookup). A stale isBroker=true from a PRIOR
  // successful check, combined with a freshly-reset isOwner=false mid a
  // re-verification cycle, would satisfy the redirect condition. The render
  // gate must therefore cover the ENTIRE re-check, not just the first mount -
  // this pins that by forcing an owner through an in-place navigation
  // (effect re-runs; isLoading must be re-armed to true, not left at its
  // prior resolved `false`) while the re-check's verify-owner call resolves
  // negatively before the crm_brokers lookup that would reconfirm status.
  it("does not bounce a re-verifying owner to /broker/crm while isOwner and isBroker are mid-update", async () => {
    h.authState.user = { id: "u-owner", email: OWNER_EMAIL };
    h.isOwnerResult = true; // first (mount) check: confirmed owner

    renderWithNav();
    await waitFor(() => {
      expect(screen.getByText("PROTECTED_CONTENT")).toBeInTheDocument();
    });

    // Second check (triggered by the in-place navigation below): verify-owner
    // resolves quickly but negatively; the crm_brokers lookup that would
    // reconfirm isBroker is held pending under the test's control.
    let resolveCrmLookup: (v: unknown) => void = () => {};
    const pendingCrmLookup = new Promise((res) => {
      resolveCrmLookup = res;
    });
    h.verifyOwnerImpl = async () => ({ data: { isOwner: false }, error: null });
    h.crmBrokersImpl = () => pendingCrmLookup as any;

    fireEvent.click(screen.getByText("go"));

    // Flush the microtasks that carry verify-owner's response through to
    // setIsOwner(false) committing, while the crm_brokers lookup above is
    // still deliberately unresolved.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });

    // isOwner has flipped false by now; isBroker is still last-known-true
    // from the FIRST check, and the crm_brokers lookup that would actually
    // reconfirm it for THIS check hasn't resolved yet. Redirecting here
    // would be premature regardless of what crm_brokers eventually says -
    // and since <Navigate replace> is a real route change, BrokerGuard
    // would unmount for good right here, with no chance to self-correct
    // once the lookup resolves (even to a DIFFERENT answer than the stale
    // isBroker value this redirect would have fired on).
    expect(screen.queryByText("BROKER_CRM")).not.toBeInTheDocument();

    // Only once the pending lookup actually resolves does isBroker/isOwner
    // reflect this check's real answer - "confirmed broker, not owner" -
    // which correctly IS a /broker/crm redirect. The point isn't that this
    // destination is wrong; it's that it must not appear before the check
    // that determines it has actually finished.
    resolveCrmLookup({
      data: { id: "row1", blocked_at: null, is_active_broker: true },
      error: null,
    });
    await waitFor(() => {
      expect(screen.getByText("BROKER_CRM")).toBeInTheDocument();
    });
  });
});
