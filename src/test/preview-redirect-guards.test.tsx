/**
 * Regression coverage for the owner ⇄ broker preview redirect guards.
 *
 * These guards previously produced a /broker-dashboard ⇄ /owner blink loop when
 * an owner-role user browsed in Broker mode. The tests below pin each branch so
 * the loop can never silently come back.
 *
 *   - OwnerGuard: protects /owner/* — only the registered owner email + Owner
 *     mode renders children; every other combination redirects to a single
 *     terminal destination (no bounce back into a guarded route).
 *
 *   - OwnerRedirectGuard: protects /broker/* — owner-role users in non-Owner
 *     mode must stay in the broker portal (never bounce to /owner). Only
 *     mode === 'owner' + isOwner pulls them out, and ?preview=1 keeps QA in.
 *
 *   - OwnerAwareBrokerRedirect: legacy /broker-dashboard entry — resolves to
 *     exactly one destination based on (mode, isOwner) with no ping-pong.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { UserMode } from "@/contexts/UserModeContext";

// ──────────────────────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────────────────────

const authState = {
  user: null as null | { id: string; email: string },
  loading: false,
  ownerLoading: false,
  ownerError: null as string | null,
  isOwner: false,
  refreshOwnerVerification: vi.fn(),
  signOut: vi.fn(),
};
const modeState = { mode: "investor" as UserMode };
const appOwnerState = { isOwner: false, isLoading: false };
const portalRoleState: { role: "owner" | "portal_developer" | "portal_rep" | null; isLoading: boolean } = {
  role: null,
  isLoading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));
vi.mock("@/contexts/UserModeContext", () => ({
  useUserModeContext: () => modeState,
}));
vi.mock("@/hooks/useIsAppOwner", () => ({
  useIsAppOwner: () => appOwnerState,
}));
vi.mock("@/hooks/usePortalRole", () => ({
  usePortalRole: () => portalRoleState,
}));

// OwnerGuard pulls in shadcn Button + lucide icons; both are jsdom-safe.
import OwnerGuard from "@/components/OwnerGuard";
import OwnerRedirectGuard from "@/components/broker-portal/OwnerRedirectGuard";
import { OwnerAwareBrokerRedirect } from "@/routes/PublicRoutes";
import PortalGuard from "@/components/developers-portal/PortalGuard";
import { PortalEntry } from "@/routes/DevelopersPortalRoutes";

const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";
const NON_OWNER_EMAIL = "someone.else@example.com";

beforeEach(() => {
  authState.user = null;
  authState.loading = false;
  authState.ownerLoading = false;
  authState.ownerError = null;
  authState.isOwner = false;
  modeState.mode = "investor";
  appOwnerState.isOwner = false;
  appOwnerState.isLoading = false;
  portalRoleState.role = null;
  portalRoleState.isLoading = false;
  try { sessionStorage.clear(); localStorage.clear(); } catch {}
});

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Render `element` at `initialPath` and surface the final pathname as text. */
function renderAtRoute(element: React.ReactNode, initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/owner" element={<div>OWNER_DASHBOARD</div>} />
        <Route path="/owner/*" element={<div>OWNER_DASHBOARD</div>} />
        <Route path="/owner/crm" element={<div>OWNER_CRM</div>} />
        <Route path="/broker/portal" element={<div>BROKER_PORTAL</div>} />
        <Route path="/broker/crm" element={<div>BROKER_CRM</div>} />
        <Route path="/broker-dashboard" element={element} />
        <Route path="/broker-portal" element={element} />
        <Route path="/broker-toolkit/dashboard" element={element} />
        <Route path="/developers-portal" element={<div>DEVELOPERS_PORTAL</div>} />
        <Route path="/investor-dashboard" element={<div>INVESTOR_DASHBOARD</div>} />
        <Route path="/403" element={<div>FORBIDDEN</div>} />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        {/* Mount the guard under test */}
        <Route path="/owner-test/*" element={element} />
        <Route path="/broker-test/*" element={element} />
      </Routes>
    </MemoryRouter>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// OwnerGuard — /owner/* protection
// ──────────────────────────────────────────────────────────────────────────────

describe("OwnerGuard", () => {
  it("redirects unauthenticated visitors to /auth (terminal, no loop)", () => {
    renderAtRoute(<OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>, "/owner-test/x");
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("OWNER_CONTENT")).not.toBeInTheDocument();
  });

  it("redirects a non-owner email in broker mode to /broker-dashboard (does not bounce back to /owner)", () => {
    authState.user = { id: "u1", email: NON_OWNER_EMAIL };
    modeState.mode = "broker";
    renderAtRoute(
      <OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>,
      "/owner-test/x"
    );
    // Reaches the legacy broker entry, which itself redirects deterministically.
    // What matters: OwnerGuard does NOT render OWNER_CONTENT.
    expect(screen.queryByText("OWNER_CONTENT")).not.toBeInTheDocument();
  });

  it("redirects a non-owner email in developer mode to /developers-portal", () => {
    authState.user = { id: "u1", email: NON_OWNER_EMAIL };
    modeState.mode = "developer";
    renderAtRoute(<OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>, "/owner-test/x");
    expect(screen.getByText("DEVELOPERS_PORTAL")).toBeInTheDocument();
  });

  it("redirects a non-owner email in investor mode to /investor-dashboard", () => {
    authState.user = { id: "u1", email: NON_OWNER_EMAIL };
    modeState.mode = "investor";
    renderAtRoute(<OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>, "/owner-test/x");
    expect(screen.getByText("INVESTOR_DASHBOARD")).toBeInTheDocument();
  });

  it("redirects the registered owner email out of /owner when mode is not 'owner'", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    modeState.mode = "broker"; // explicitly browsing as broker
    renderAtRoute(<OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>, "/owner-test/x");
    expect(screen.queryByText("OWNER_CONTENT")).not.toBeInTheDocument();
  });

  // Regression coverage for the inverted-condition bug fixed alongside this
  // file: the guard at OwnerGuard.tsx's "cached owner verification must never
  // leak" check was gated on `!isRegisteredOwnerEmail`, the opposite of who it
  // was meant to protect, so a registered owner browsing in Developer or
  // Investor mode fell through to the final "REGISTERED OWNER → allowed"
  // return and saw Owner content regardless of mode. The broker-mode case
  // above already covered one of the three non-owner modes; these two close
  // the other two so the exact bug can't come back in either branch unnoticed.
  it("redirects the registered owner email out of /owner when mode is 'developer'", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    modeState.mode = "developer";
    renderAtRoute(<OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>, "/owner-test/x");
    expect(screen.getByText("DEVELOPERS_PORTAL")).toBeInTheDocument();
    expect(screen.queryByText("OWNER_CONTENT")).not.toBeInTheDocument();
  });

  it("redirects the registered owner email out of /owner when mode is 'investor'", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    modeState.mode = "investor";
    renderAtRoute(<OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>, "/owner-test/x");
    expect(screen.getByText("INVESTOR_DASHBOARD")).toBeInTheDocument();
    expect(screen.queryByText("OWNER_CONTENT")).not.toBeInTheDocument();
  });

  it("renders children for the registered owner in Owner mode", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    modeState.mode = "owner";
    renderAtRoute(<OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>, "/owner-test/x");
    expect(screen.getByText("OWNER_CONTENT")).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// OwnerRedirectGuard — /broker/* protection
// ──────────────────────────────────────────────────────────────────────────────

describe("OwnerRedirectGuard (broker portal)", () => {
  it("renders broker children when mode is broker — even if isOwner is true (no /broker → /owner bounce)", () => {
    appOwnerState.isOwner = true;
    modeState.mode = "broker";
    renderAtRoute(
      <OwnerRedirectGuard><div>BROKER_CHILDREN</div></OwnerRedirectGuard>,
      "/broker-test/portal"
    );
    expect(screen.getByText("BROKER_CHILDREN")).toBeInTheDocument();
  });

  it("renders broker children for non-owner users in Owner mode (does nothing destructive)", () => {
    appOwnerState.isOwner = false;
    modeState.mode = "owner";
    renderAtRoute(
      <OwnerRedirectGuard><div>BROKER_CHILDREN</div></OwnerRedirectGuard>,
      "/broker-test/portal"
    );
    expect(screen.getByText("BROKER_CHILDREN")).toBeInTheDocument();
  });

  it("redirects owner + Owner mode out of /broker/portal to /owner", () => {
    appOwnerState.isOwner = true;
    modeState.mode = "owner";
    render(
      <MemoryRouter initialEntries={["/broker/portal"]}>
        <Routes>
          <Route path="/owner" element={<div>OWNER_DASHBOARD</div>} />
          <Route path="/owner/crm" element={<div>OWNER_CRM</div>} />
          <Route path="/broker/portal" element={
            <OwnerRedirectGuard><div>BROKER_CHILDREN</div></OwnerRedirectGuard>
          } />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("OWNER_DASHBOARD")).toBeInTheDocument();
    expect(screen.queryByText("BROKER_CHILDREN")).not.toBeInTheDocument();
  });

  it("redirects owner + Owner mode from /broker/crm to /owner/crm", () => {
    appOwnerState.isOwner = true;
    modeState.mode = "owner";
    render(
      <MemoryRouter initialEntries={["/broker/crm"]}>
        <Routes>
          <Route path="/owner/crm" element={<div>OWNER_CRM</div>} />
          <Route path="/broker/crm" element={
            <OwnerRedirectGuard><div>BROKER_CHILDREN</div></OwnerRedirectGuard>
          } />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("OWNER_CRM")).toBeInTheDocument();
  });

  it("keeps owner inside /broker/portal when ?preview=1 is set (QA escape hatch)", () => {
    appOwnerState.isOwner = true;
    modeState.mode = "owner";
    render(
      <MemoryRouter initialEntries={["/broker/portal?preview=1"]}>
        <Routes>
          <Route path="/owner" element={<div>OWNER_DASHBOARD</div>} />
          <Route path="/broker/portal" element={
            <OwnerRedirectGuard><div>BROKER_CHILDREN</div></OwnerRedirectGuard>
          } />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("BROKER_CHILDREN")).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// OwnerAwareBrokerRedirect — legacy /broker-dashboard, /broker-portal entries
// ──────────────────────────────────────────────────────────────────────────────

describe("OwnerAwareBrokerRedirect", () => {
  it("sends non-Owner mode straight to /broker/portal (no /owner detour)", () => {
    appOwnerState.isOwner = true; // owner role, but mode is broker
    modeState.mode = "broker";
    renderAtRoute(<OwnerAwareBrokerRedirect />, "/broker-dashboard");
    expect(screen.getByText("BROKER_PORTAL")).toBeInTheDocument();
  });

  it("sends investor mode to /broker/portal", () => {
    modeState.mode = "investor";
    renderAtRoute(<OwnerAwareBrokerRedirect />, "/broker-dashboard");
    expect(screen.getByText("BROKER_PORTAL")).toBeInTheDocument();
  });

  it("sends Owner mode + isOwner to /owner", () => {
    appOwnerState.isOwner = true;
    modeState.mode = "owner";
    renderAtRoute(<OwnerAwareBrokerRedirect />, "/broker-dashboard");
    expect(screen.getByText("OWNER_DASHBOARD")).toBeInTheDocument();
  });

  it("sends Owner mode + NOT isOwner to /broker/portal (never to /owner)", () => {
    appOwnerState.isOwner = false;
    modeState.mode = "owner";
    renderAtRoute(<OwnerAwareBrokerRedirect />, "/broker-dashboard");
    expect(screen.getByText("BROKER_PORTAL")).toBeInTheDocument();
  });

  it("renders nothing while owner verification is still loading (avoids flash redirect)", () => {
    appOwnerState.isOwner = false;
    appOwnerState.isLoading = true;
    modeState.mode = "owner";
    const { container } = renderAtRoute(<OwnerAwareBrokerRedirect />, "/broker-dashboard");
    expect(container.textContent).toBe("");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// No-loop invariant — composing OwnerGuard + OwnerRedirectGuard for the exact
// scenario that previously blinked: owner-role user, mode=broker, hitting /owner.
// OwnerGuard sends them to /broker-dashboard → OwnerAwareBrokerRedirect lands
// them at /broker/portal → OwnerRedirectGuard renders children. Single hop end.
// ──────────────────────────────────────────────────────────────────────────────

describe("composed guards — owner-role + Broker mode does not loop", () => {
  it("settles at /broker/portal in one redirect chain, never bounces back to /owner", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    appOwnerState.isOwner = true;
    modeState.mode = "broker";

    render(
      <MemoryRouter initialEntries={["/owner"]}>
        <Routes>
          <Route path="/owner" element={
            <OwnerGuard><div>OWNER_CONTENT</div></OwnerGuard>
          } />
          <Route path="/broker-dashboard" element={<OwnerAwareBrokerRedirect />} />
          <Route path="/broker/portal" element={
            <OwnerRedirectGuard><div>BROKER_PORTAL_CONTENT</div></OwnerRedirectGuard>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("BROKER_PORTAL_CONTENT")).toBeInTheDocument();
    expect(screen.queryByText("OWNER_CONTENT")).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// No-loop invariant — owner-role + Developer mode.
//
// PortalEntry (src/routes/DevelopersPortalRoutes.tsx) deliberately routes a
// registered owner from /developers-portal to /owner/developers — that
// richer owner's-eye view IS the intended Developer-mode destination. Before
// the fix, OwnerGuard treated every /owner/* path as off-limits outside
// Owner mode with no exception, so it bounced /owner/developers straight
// back to /developers-portal, which PortalEntry immediately routed to
// /owner/developers again: an infinite redirect loop (React throws "Maximum
// update depth exceeded" when this actually happens, which is exactly what
// the "confirms it loops" revert step below observes).
//
// The fix scopes an exception to /owner/developers specifically when mode is
// Developer. The two tests before the composed one confirm that scoping:
// every OTHER /owner/* path must still redirect away in Developer mode,
// same as before - only this one subtree is carved out.
// ──────────────────────────────────────────────────────────────────────────────

describe("OwnerGuard — Developer-mode /owner/developers carve-out", () => {
  it("still redirects a registered owner in Developer mode away from OTHER /owner/* paths (carve-out is scoped, not general)", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    modeState.mode = "developer";

    render(
      <MemoryRouter initialEntries={["/owner/crm"]}>
        <Routes>
          <Route path="/developers-portal" element={<div>DEVELOPERS_PORTAL</div>} />
          <Route
            path="/owner/crm"
            element={<OwnerGuard><div>OWNER_CRM_CONTENT</div></OwnerGuard>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("DEVELOPERS_PORTAL")).toBeInTheDocument();
    expect(screen.queryByText("OWNER_CRM_CONTENT")).not.toBeInTheDocument();
  });

  it("allows a registered owner in Developer mode to render /owner/developers directly (the intentional destination)", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    modeState.mode = "developer";

    render(
      <MemoryRouter initialEntries={["/owner/developers"]}>
        <Routes>
          <Route path="/developers-portal" element={<div>DEVELOPERS_PORTAL</div>} />
          <Route
            path="/owner/developers"
            element={<OwnerGuard><div>OWNER_DEVELOPERS_CONTENT</div></OwnerGuard>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("OWNER_DEVELOPERS_CONTENT")).toBeInTheDocument();
    expect(screen.queryByText("DEVELOPERS_PORTAL")).not.toBeInTheDocument();
  });
});

// Circuit breaker for the composed-loop test below. Confirmed by hand while
// developing this test that the pre-fix version of this exact scenario does
// NOT throw React's own "Maximum update depth exceeded" guard: PortalEntry
// and OwnerGuard are two DIFFERENT components alternately <Navigate>-ing
// each other via two DISTINCT <Route> entries, so each hop mounts a brand
// new component instance - there's no single component re-rendering itself
// for React's per-component render-count detector to catch. The result is a
// genuine unbounded synchronous loop: it hung the test process indefinitely
// (still consuming CPU past 60s, well beyond Vitest's default test timeout,
// with zero output - confirmed by manually killing it during development).
// A `timeout` option on `it()` can't help either: Vitest's timeout can't
// preempt a fully synchronous, non-yielding loop on a single-threaded
// worker. This wrapper is a self-contained fast-fail instead: every mount of
// either route increments a shared counter, and it throws a clear error well
// before a real loop could hang anything.
let devModeLoopHopCount = 0;
const MAX_DEV_MODE_LOOP_HOPS = 20;
function CountedRoute({ children }: { children: React.ReactNode }) {
  devModeLoopHopCount += 1;
  if (devModeLoopHopCount > MAX_DEV_MODE_LOOP_HOPS) {
    throw new Error(
      `Possible infinite redirect loop: exceeded ${MAX_DEV_MODE_LOOP_HOPS} mounts alternating ` +
        "between /developers-portal and /owner/developers.",
    );
  }
  return <>{children}</>;
}

describe("composed guards — owner-role + Developer mode does not loop", () => {
  beforeEach(() => {
    devModeLoopHopCount = 0;
  });

  it("settles at /owner/developers in one redirect hop, using the real PortalGuard + PortalEntry + OwnerGuard chain", () => {
    authState.user = { id: "u1", email: OWNER_EMAIL };
    authState.isOwner = true;
    modeState.mode = "developer";
    portalRoleState.role = "owner";
    portalRoleState.isLoading = false;

    render(
      <MemoryRouter initialEntries={["/developers-portal"]}>
        <Routes>
          <Route
            path="/developers-portal"
            element={<CountedRoute><PortalGuard><PortalEntry /></PortalGuard></CountedRoute>}
          />
          <Route
            path="/owner/developers"
            element={<CountedRoute><OwnerGuard><div>OWNER_DEVELOPERS_CONTENT</div></OwnerGuard></CountedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("OWNER_DEVELOPERS_CONTENT")).toBeInTheDocument();
  });
});
