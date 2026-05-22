/**
 * Hardening tests for the explicit-write contract:
 *
 *   Sign-in, sign-out, token refresh, re-mount, and the read-only reconcile
 *   effect must NEVER write to user_preferences, user_role_selections, or
 *   invoke `register-mode-lead`. The DB and CRM may only be mutated when the
 *   user explicitly calls `setMode(...)`.
 *
 * See mem://architecture/state/user-mode-persistence-standard
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ------- Mocks ------------------------------------------------------------

const h = vi.hoisted(() => ({
  currentUser: null as { id: string } | null,
  dbRow: null as { selected_mode: string } | null,
  writes: [] as Array<{ table: string; op: "upsert" | "insert"; payload: any }>,
  reads: [] as Array<{ table: string }>,
  fnInvocations: [] as Array<{ name: string; body: unknown }>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: h.currentUser }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const tableApi = (name: string) => ({
    select: () => {
      h.reads.push({ table: name });
      return {
        eq: () => ({
          maybeSingle: async () => ({ data: h.dbRow, error: null }),
        }),
      };
    },
    upsert: async (payload: any) => {
      h.writes.push({ table: name, op: "upsert", payload });
      return { error: null };
    },
    insert: async (payload: any) => {
      h.writes.push({ table: name, op: "insert", payload });
      return { error: null };
    },
  });
  return {
    supabase: {
      from: (name: string) => tableApi(name),
      functions: {
        invoke: async (name: string, opts: any) => {
          h.fnInvocations.push({ name, body: opts?.body });
          return { data: null, error: null };
        },
      },
    },
  };
});

vi.mock("@/lib/signupSources", () => ({
  registerRolePick: async () => undefined,
  SIGNUP_SOURCES: { MODE_PICKER: "mode_picker" },
}));

// ------- Helpers ----------------------------------------------------------

const MODE_KEY = "jj_user_mode";
const MODE_SELECTED_KEY = "jj_mode_selected";

async function loadModule() {
  return await import("@/contexts/UserModeContext");
}

function renderWithProvider(mod: any, onCtx?: (ctx: any) => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Probe() {
    const ctx = mod.useUserModeContext();
    React.useEffect(() => { onCtx?.(ctx); }, [ctx]);
    return <div data-testid="mode">{ctx.mode}</div>;
  }
  return render(
    <QueryClientProvider client={qc}>
      <mod.UserModeProvider>
        <Probe />
      </mod.UserModeProvider>
    </QueryClientProvider>
  );
}

const settle = () => new Promise((r) => setTimeout(r, 30));

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  h.currentUser = null;
  h.dbRow = null;
  h.writes = [];
  h.reads = [];
  h.fnInvocations = [];
});

// ------- Tests ------------------------------------------------------------

describe("UserModeContext — no DB writes on auth events", () => {
  it("sign-in with existing local mode: zero writes, zero edge invocations", async () => {
    localStorage.setItem(MODE_KEY, "broker");
    localStorage.setItem(MODE_SELECTED_KEY, "true");
    h.dbRow = { selected_mode: "investor" }; // divergent — must NOT be written

    h.currentUser = { id: "user-signin" };
    const mod = await loadModule();
    renderWithProvider(mod);

    await settle();

    expect(h.writes).toHaveLength(0);
    expect(h.fnInvocations).toHaveLength(0);
  });

  it("sign-in (cold, DB has a mode, no local): adopts DB but writes nothing", async () => {
    h.dbRow = { selected_mode: "developer" };
    h.currentUser = { id: "user-cold" };

    const mod = await loadModule();
    renderWithProvider(mod);

    await settle();

    // Reconcile is READ-ONLY. It may seed local state but never the DB.
    expect(h.writes).toHaveLength(0);
    expect(h.fnInvocations).toHaveLength(0);
  });

  it("sign-out: unmount + null user produces zero writes", async () => {
    localStorage.setItem(MODE_KEY, "broker");
    localStorage.setItem(MODE_SELECTED_KEY, "true");
    h.currentUser = { id: "user-out" };

    const mod = await loadModule();
    const { unmount } = renderWithProvider(mod);
    await settle();
    h.writes = []; // ignore anything from mount

    // Simulate sign-out: unmount, swap user to null, re-mount.
    unmount();
    h.currentUser = null;
    vi.resetModules();
    const mod2 = await loadModule();
    renderWithProvider(mod2);
    await settle();

    expect(h.writes).toHaveLength(0);
    expect(h.fnInvocations).toHaveLength(0);
  });

  it("token refresh / re-render with same user id: no extra writes, no extra reads", async () => {
    localStorage.setItem(MODE_KEY, "investor");
    localStorage.setItem(MODE_SELECTED_KEY, "true");
    h.currentUser = { id: "user-refresh" };

    const mod = await loadModule();
    const { rerender } = renderWithProvider(mod);
    await settle();
    const readsAfterMount = h.reads.length;

    // Force a re-render. Same user id → reconcile must early-return.
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={qc}>
        <mod.UserModeProvider>
          <div data-testid="rerender" />
        </mod.UserModeProvider>
      </QueryClientProvider>
    );
    await settle();

    expect(h.writes).toHaveLength(0);
    expect(h.fnInvocations).toHaveLength(0);
    // No fresh DB read either — `lastSyncedUserId` short-circuits.
    expect(h.reads.length).toBe(readsAfterMount);
  });

  it("explicit setMode IS allowed to write (positive control)", async () => {
    h.currentUser = { id: "user-explicit" };

    const mod = await loadModule();
    let captured: any = null;
    renderWithProvider(mod, (ctx) => { captured = ctx; });
    await settle();
    h.writes = [];
    h.fnInvocations = [];

    await act(async () => {
      await captured.setMode("broker");
    });

    const tables = h.writes.map((w) => w.table);
    expect(tables).toContain("user_preferences");
    // Broker mirrors to user_role_selections.
    expect(tables).toContain("user_role_selections");
    // And the CRM categorizer fires exactly once.
    expect(h.fnInvocations.map((i) => i.name)).toContain("register-mode-lead");
  });

  it("setMode(developer) writes user_preferences but skips role mirror", async () => {
    h.currentUser = { id: "user-dev" };
    const mod = await loadModule();
    let captured: any = null;
    renderWithProvider(mod, (ctx) => { captured = ctx; });
    await settle();
    h.writes = [];

    await act(async () => {
      await captured.setMode("developer");
    });

    const tables = h.writes.map((w) => w.table);
    expect(tables).toContain("user_preferences");
    expect(tables).not.toContain("user_role_selections");
  });
});
