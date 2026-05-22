/**
 * Regression tests for the locked rule:
 *   "The selected mode must never change on refresh, sign-out, or sign-in
 *    unless the user explicitly changes it via the mode switcher."
 *
 * See mem://architecture/state/user-mode-persistence-standard
 *
 * These tests mock the Supabase client and the AuthContext so we can drive
 * sign-in / sign-out transitions deterministically without a real backend.
 */
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ------- Mocks ------------------------------------------------------------

// Hoisted holder so vi.mock() factories can wire state controllable from tests.
const h = vi.hoisted(() => ({
  currentUser: null as { id: string } | null,
  // Default DB row returned by user_preferences.maybeSingle()
  dbRow: null as { selected_mode: string } | null,
  upserts: [] as Array<{ user_id: string; selected_mode: string }>,
  inserts: [] as Array<{ user_id: string; selected_mode: string }>,
  fnInvocations: [] as Array<{ name: string; body: unknown }>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: h.currentUser }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const tableApi = (name: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: h.dbRow, error: null }),
      }),
    }),
    upsert: async (payload: any) => {
      if (name === "user_preferences") h.upserts.push(payload);
      return { error: null };
    },
    insert: async (payload: any) => {
      if (name === "user_preferences") h.inserts.push(payload);
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

// Silence the dynamic signupSources import (it's non-essential side-effect).
vi.mock("@/lib/signupSources", () => ({
  registerRolePick: async () => undefined,
  SIGNUP_SOURCES: { MODE_PICKER: "mode_picker" },
}));

// ------- Helpers ----------------------------------------------------------

const MODE_KEY = "jj_user_mode";
const MODE_SELECTED_KEY = "jj_mode_selected";

async function loadModule() {
  // Re-import after resetModules() so the provider picks up fresh mocks/localStorage.
  return await import("@/contexts/UserModeContext");
}

function renderWithProvider(Provider: React.ComponentType<{ children: React.ReactNode }>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Probe() {
    const { useUserModeContext } = require("@/contexts/UserModeContext");
    const ctx = useUserModeContext();
    return <div data-testid="mode">{ctx.mode}</div>;
  }
  return render(
    <QueryClientProvider client={qc}>
      <Provider>
        <Probe />
      </Provider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  h.currentUser = null;
  h.dbRow = null;
  h.upserts = [];
  h.inserts = [];
  h.fnInvocations = [];
});

// ------- Tests ------------------------------------------------------------

describe("UserModeContext — persistence regression suite", () => {
  it("refresh: rehydrates the previously-chosen mode synchronously from localStorage", async () => {
    localStorage.setItem(MODE_KEY, "broker");
    localStorage.setItem(MODE_SELECTED_KEY, "true");

    const { UserModeProvider } = await loadModule();
    renderWithProvider(UserModeProvider);

    // No flicker: the very first render must already show 'broker'.
    expect(screen.getByTestId("mode").textContent).toBe("broker");
  });

  it("refresh: defaults to 'investor' only when nothing was ever chosen", async () => {
    const { UserModeProvider } = await loadModule();
    renderWithProvider(UserModeProvider);
    expect(screen.getByTestId("mode").textContent).toBe("investor");
  });

  it("sign-in: does NOT overwrite a local explicit selection with a divergent DB value", async () => {
    // User had explicitly picked broker locally.
    localStorage.setItem(MODE_KEY, "broker");
    localStorage.setItem(MODE_SELECTED_KEY, "true");
    // But the DB happens to hold a stale 'investor' row.
    h.dbRow = { selected_mode: "investor" };
    h.currentUser = { id: "user-1" };

    const { UserModeProvider } = await loadModule();
    renderWithProvider(UserModeProvider);

    // Wait for the reconcile effect to flush.
    await waitFor(() => expect(h.upserts.length).toBeGreaterThan(0));

    // Local choice wins.
    expect(screen.getByTestId("mode").textContent).toBe("broker");
    expect(localStorage.getItem(MODE_KEY)).toBe("broker");
    // And the divergence was pushed UP to the DB, not the other way around.
    expect(h.upserts[0]).toMatchObject({ user_id: "user-1", selected_mode: "broker" });
  });

  it("sign-in (first time, no local mode): adopts the DB mode without churn", async () => {
    h.dbRow = { selected_mode: "developer" };
    h.currentUser = { id: "user-2" };

    const { UserModeProvider } = await loadModule();
    renderWithProvider(UserModeProvider);

    await waitFor(() =>
      expect(screen.getByTestId("mode").textContent).toBe("developer")
    );
    expect(localStorage.getItem(MODE_KEY)).toBe("developer");
    expect(localStorage.getItem(MODE_SELECTED_KEY)).toBe("true");
    // No upsert needed: local and DB are in sync.
    expect(h.upserts).toHaveLength(0);
  });

  it("sign-out → sign-in: the locally-stored mode survives across the cycle", async () => {
    localStorage.setItem(MODE_KEY, "broker");
    localStorage.setItem(MODE_SELECTED_KEY, "true");
    h.dbRow = { selected_mode: "broker" };

    // Initial render: signed OUT.
    h.currentUser = null;
    const mod = await loadModule();
    const { rerender, unmount } = renderWithProvider(mod.UserModeProvider);
    expect(screen.getByTestId("mode").textContent).toBe("broker");
    unmount();

    // Now simulate a sign-in (new user object) by re-mounting.
    h.currentUser = { id: "user-3" };
    vi.resetModules();
    const mod2 = await loadModule();
    renderWithProvider(mod2.UserModeProvider);

    // Mode is still broker — sign-in did not override the user's choice.
    expect(screen.getByTestId("mode").textContent).toBe("broker");
    await waitFor(() => {
      // And since DB matched, no upsert was emitted.
      expect(h.upserts).toHaveLength(0);
    });
  });

  it("cross-tab: a storage event from another tab updates the mode in this tab", async () => {
    localStorage.setItem(MODE_KEY, "investor");
    localStorage.setItem(MODE_SELECTED_KEY, "true");

    const { UserModeProvider } = await loadModule();
    renderWithProvider(UserModeProvider);
    expect(screen.getByTestId("mode").textContent).toBe("investor");

    // Simulate another tab writing 'developer' and emitting a storage event.
    act(() => {
      localStorage.setItem(MODE_KEY, "developer");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: MODE_KEY,
          oldValue: "investor",
          newValue: "developer",
          storageArea: localStorage,
        })
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("mode").textContent).toBe("developer")
    );
  });

  it("cross-tab: storage events for unrelated keys are ignored", async () => {
    localStorage.setItem(MODE_KEY, "broker");
    localStorage.setItem(MODE_SELECTED_KEY, "true");

    const { UserModeProvider } = await loadModule();
    renderWithProvider(UserModeProvider);

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "some-other-key",
          oldValue: "a",
          newValue: "b",
          storageArea: localStorage,
        })
      );
    });

    expect(screen.getByTestId("mode").textContent).toBe("broker");
  });
});
