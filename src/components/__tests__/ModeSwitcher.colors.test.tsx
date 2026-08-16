import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import type { UserMode } from "@/contexts/UserModeContext";

// --- Mocks ---------------------------------------------------------------

const setModeMock = vi.fn();
let currentMode: UserMode = "investor";

vi.mock("@/contexts/UserModeContext", async () => {
  const actual = await vi.importActual<any>("@/contexts/UserModeContext");
  return {
    ...actual,
    useUserModeContext: () => ({
      mode: currentMode,
      isLoading: false,
      setMode: setModeMock,
      isInvestorMode: currentMode === "investor",
      isBrokerMode: currentMode === "broker",
      isCombinedMode: false,
      isDeveloperMode: currentMode === "developer",
      hasMadeInitialSelection: true,
    }),
  };
});

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({ hasSelectedRole: true, role: "investor" }),
}));

// ModeSwitcher reads `user` from AuthContext and owner status from
// useIsAppOwner (which itself needs AuthContext + a QueryClient). Mocking
// both keeps this file focused on ModeSwitcher's own render contract
// instead of pulling in auth/session and react-query plumbing.
// `isOwner: true` keeps the full mode-picker branch rendering (the one
// with per-mode rows this file asserts against) rather than the read-only
// "request a mode change" panel ModeSwitcher shows non-owners.
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user", email: "test@example.com" } }),
}));

vi.mock("@/hooks/useIsAppOwner", () => ({
  useIsAppOwner: () => ({ isOwner: true, isLoading: false }),
}));

// ModeSwitcher also calls useNavigate/useLocation on mount (for the
// mode-change redirect), which throw outside a <Router>. None of these
// tests exercise navigation, so a lightweight mock is enough — same
// approach as the AuthContext/useIsAppOwner mocks above.
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/" }),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// --- What actually varies per mode -----------------------------------------
//
// ModeSwitcher's MODE_CONFIG defines 8 color fields per mode (base, baseDark,
// rowFrom, rowTo, rowHover, dark, onBase, surface) — but none of them are read
// anywhere in ModeSwitcher.tsx (verified by grep: every `currentConfig`/
// `config` field access in that file is `.icon`, `.label`, `.description`, or
// `.shortLabel`). Actual trigger/dropdown colors come entirely from
// useControlSkin() — a global "champagne / emerald / clear" theme signal
// unrelated to which mode is active.
//
// This file used to keep a local PALETTE meant to mirror MODE_CONFIG's colors
// ("Locked mode palette (must match ModeSwitcher MODE_CONFIG)"). That premise
// no longer holds — the component doesn't render per-mode color at all — so
// this asserts the real contract instead: labels vary by mode (real, live
// behavior), colors vary by skin and are identical across every mode.
const MODE_LABELS: Record<UserMode, string> = {
  investor: "Mode: Investor",
  broker: "Mode: Broker",
  developer: "Mode: Developer",
  owner: "Mode: Owner",
};

// --- Helpers -------------------------------------------------------------

const norm = (v: string) => v.replace(/\s+/g, "").toLowerCase();
const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
};
const sameColor = (cssValue: string, hex: string) =>
  norm(cssValue) === norm(hex) || norm(cssValue) === norm(hexToRgb(hex));
// jsdom normalizes #rrggbb literals inside larger values (e.g. gradient stops)
// to rgb(...); convert before comparing so assertions don't depend on which
// form jsdom happens to serialize.
const hexToRgbInline = (s: string) => s.replace(/#([0-9a-f]{6})/gi, (_, h) => hexToRgb(`#${h}`));
const sameCss = (actual: string, expected: string) => norm(actual) === norm(hexToRgbInline(expected));

const getTrigger = (): HTMLButtonElement => {
  const btn = document.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
  if (!btn) throw new Error("Mode trigger button not found");
  return btn;
};

const findRowByLabel = (label: string): HTMLElement => {
  const matches = Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const row = matches.find((el) => el.textContent?.includes(label));
  if (!row) throw new Error(`Could not find menuitem row for "${label}"`);
  return row;
};

const openDropdown = () => {
  const trigger = getTrigger();
  fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });
  fireEvent.pointerUp(trigger, { button: 0, pointerType: "mouse" });
  fireEvent.click(trigger);
};

// ModeSwitcher's trigger skin comes from useControlSkin(), which reads DOM
// attributes synchronously at mount (readControlSkin() in
// src/hooks/use-chrome-skin.ts). Setting these before render exercises the
// real skin-resolution code path rather than mocking the hook.
type Skin = "champagne" | "emerald" | "clear";
const setSkin = (skin: Skin) => {
  document.documentElement.removeAttribute("data-jbj-theme");
  document.documentElement.removeAttribute("data-jbj-backend-lock");
  document.body.removeAttribute("data-jj-hero-chrome");
  if (skin === "champagne") document.documentElement.setAttribute("data-jbj-theme", "sun");
  if (skin === "clear") document.body.setAttribute("data-jj-hero-chrome", "clear");
  // "emerald" is readControlSkin()'s fallback when none of the above are set.
};

// --- Tests ---------------------------------------------------------------

describe("ModeSwitcher color regression", () => {
  beforeEach(() => {
    setModeMock.mockReset();
    document.body
      .querySelectorAll('[data-radix-popper-content-wrapper]')
      .forEach((n) => n.remove());
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-jbj-theme");
    document.documentElement.removeAttribute("data-jbj-backend-lock");
    document.body.removeAttribute("data-jj-hero-chrome");
  });

  const modes: UserMode[] = ["investor", "broker", "developer", "owner"];

  // Locks ModeSwitcher.tsx's actual triggerStyle ternary — the real,
  // current, skin-driven contract — for each of its three skins.
  const skins: { skin: Skin; expected: { backgroundImage: string; boxShadow: string; color: string } }[] = [
    {
      skin: "champagne",
      expected: {
        backgroundImage: "linear-gradient(90deg, #FDFBF7 0%, #F7F2EA 52%, #F2EBDC 100%)",
        boxShadow: "0 1px 2px rgba(26,26,26,0.08)",
        color: "#1A1A1A",
      },
    },
    {
      skin: "emerald",
      expected: {
        backgroundImage: "var(--jj-emerald-ombre)",
        boxShadow: "0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)",
        color: "#FFFFFF",
      },
    },
    {
      skin: "clear",
      expected: {
        backgroundImage: "none",
        boxShadow: "none",
        color: "#FFFFFF",
      },
    },
  ];

  skins.forEach(({ skin, expected }) => {
    it(`closed trigger color comes from the "${skin}" skin, identical across every mode`, () => {
      setSkin(skin);

      const snapshots = modes.map((mode) => {
        currentMode = mode;
        const { unmount } = render(<ModeSwitcher variant="header" />);
        const trigger = getTrigger();
        const snapshot = {
          backgroundImage: trigger.style.backgroundImage,
          boxShadow: trigger.style.boxShadow,
          color: trigger.style.color,
        };
        unmount();
        return { mode, snapshot };
      });

      for (const { mode, snapshot } of snapshots) {
        expect(
          sameCss(snapshot.backgroundImage, expected.backgroundImage),
          `${mode} trigger backgroundImage: expected ${expected.backgroundImage}, got ${snapshot.backgroundImage}`,
        ).toBe(true);
        expect(
          sameCss(snapshot.boxShadow, expected.boxShadow),
          `${mode} trigger boxShadow: expected ${expected.boxShadow}, got ${snapshot.boxShadow}`,
        ).toBe(true);
        expect(sameColor(snapshot.color, expected.color), `${mode} trigger color`).toBe(true);
      }

      // The actual "not per-mode" claim: no two modes differ from each other.
      const [first, ...rest] = snapshots.map((s) => s.snapshot);
      for (const snapshot of rest) {
        expect(snapshot).toEqual(first);
      }
    });
  });

  it("dropdown row styling is identical across modes — driven by active/idle state, not which mode the row represents", () => {
    setSkin("emerald");

    const perActiveMode = modes.map((activeMode) => {
      currentMode = activeMode;
      const { unmount } = render(<ModeSwitcher variant="header" />);
      openDropdown();

      const snapshot = modes.map((modeKey) => {
        const row = findRowByLabel(MODE_LABELS[modeKey]);
        const iconTile = row.querySelector<HTMLElement>(".mode-switcher-icon-tile");
        const selectedPill = row.querySelector<HTMLElement>(".mode-switcher-selected-pill");
        return {
          modeKey,
          isActive: modeKey === activeMode,
          iconTileBackground: iconTile?.style.background ?? "",
          hasSelectedPill: !!selectedPill,
          selectedPillBackground: selectedPill?.style.background ?? "",
          activeBorderClass: [...row.classList].find((c) => c.startsWith("border-[#064E3B]")),
          activeBgClass: [...row.classList].find((c) => c.startsWith("bg-[#064E3B]") || c.startsWith("bg-[#FFFFFF]")),
        };
      });

      unmount();
      return { activeMode, snapshot };
    });

    // Icon tile fill is the same fixed emerald wash for every row, in every mode.
    for (const { activeMode, snapshot } of perActiveMode) {
      for (const row of snapshot) {
        expect(
          norm(row.iconTileBackground),
          `${row.modeKey} icon tile (active=${activeMode})`,
        ).toBe(norm("rgba(6,78,59,0.06)"));
      }
    }

    // Exactly the active row shows the Selected pill, with the same fixed
    // color, no matter which mode is active.
    for (const { activeMode, snapshot } of perActiveMode) {
      const active = snapshot.find((r) => r.modeKey === activeMode)!;
      expect(active.hasSelectedPill, `${activeMode} row should show Selected pill`).toBe(true);
      expect(norm(active.selectedPillBackground)).toBe(norm("rgba(6,78,59,0.12)"));
      for (const row of snapshot.filter((r) => r.modeKey !== activeMode)) {
        expect(
          row.hasSelectedPill,
          `${row.modeKey} row should not show Selected pill while ${activeMode} is active`,
        ).toBe(false);
      }
    }

    // The active-row / idle-row class pattern is identical no matter which
    // specific mode is active — proves the look is state-driven, not
    // color-per-mode.
    const [reference, ...restModes] = perActiveMode;
    const referenceActive = reference.snapshot.find((r) => r.isActive)!;
    const referenceIdle = reference.snapshot.find((r) => !r.isActive)!;
    for (const { activeMode, snapshot } of restModes) {
      const thisActive = snapshot.find((r) => r.isActive)!;
      const thisIdle = snapshot.find((r) => !r.isActive)!;
      expect(thisActive.activeBorderClass, `${activeMode} active row border class`).toBe(
        referenceActive.activeBorderClass,
      );
      expect(thisActive.activeBgClass, `${activeMode} active row bg class`).toBe(referenceActive.activeBgClass);
      expect(thisIdle.activeBorderClass, `${activeMode} idle row border class`).toBe(
        referenceIdle.activeBorderClass,
      );
      expect(thisIdle.activeBgClass, `${activeMode} idle row bg class`).toBe(referenceIdle.activeBgClass);
    }
  });

  it("uses the same shared ModeSwitcher in header, footer, and account menu placements", async () => {
    const fs = await import("node:fs/promises");
    const files = [
      "src/components/navigation/HorizontalUtilityBar.tsx",
      "src/components/Footer.tsx",
      "src/components/header/MegaMenuAccount.tsx",
    ];
    for (const file of files) {
      const src = await fs.readFile(file, "utf8");
      expect(src, `${file} should mount the shared ModeSwitcher`).toMatch(
        /<ModeSwitcher\b[^>]*variant=["']header["']/,
      );
    }
  });

  it("never passes color-overriding className to ModeSwitcher in any placement", async () => {
    const fs = await import("node:fs/promises");
    const files = [
      "src/components/navigation/HorizontalUtilityBar.tsx",
      "src/components/Footer.tsx",
      "src/components/header/MegaMenuAccount.tsx",
    ];
    const usageRe = /<ModeSwitcher\b([^>]*?)\/?>/g;
    const forbidden = /className=["'`][^"'`]*\b(?:bg-|border-(?!2\b)|text-(?!xs\b|sm\b|base\b|lg\b|xl\b|left\b|center\b|right\b)|from-|to-|via-|ring-(?!2\b))/;
    for (const file of files) {
      const src = await fs.readFile(file, "utf8");
      const matches = [...src.matchAll(usageRe)];
      expect(matches.length, `${file} should mount ModeSwitcher`).toBeGreaterThan(0);
      for (const m of matches) {
        const propsStr = m[1] ?? "";
        expect(
          forbidden.test(propsStr),
          `${file} passes color-overriding className to ModeSwitcher: ${m[0]}`,
        ).toBe(false);
      }
    }
  });

  it("renders byte-identical trigger styles regardless of placement-passed props", () => {
    currentMode = "broker";
    setSkin("emerald");

    const placements = [
      { name: "HorizontalUtilityBar", node: <ModeSwitcher variant="header" showForUnselected /> },
      { name: "Footer", node: <ModeSwitcher variant="header" showForUnselected={true} side="top" /> },
      { name: "MegaMenuAccount", node: <ModeSwitcher variant="header" /> },
    ];

    const styles = placements.map(({ name, node }) => {
      const { unmount } = render(node);
      const trigger = getTrigger();
      const snapshot = {
        bgImage: trigger.style.backgroundImage,
        shadow: trigger.style.boxShadow,
        border: trigger.style.borderColor,
        color: trigger.style.color,
      };
      unmount();
      return { name, snapshot };
    });

    const reference = styles[0].snapshot;

    // Reference reflects the current emerald skin, not a mode-specific color.
    expect(norm(reference.bgImage)).toBe(norm("var(--jj-emerald-ombre)"));
    expect(sameColor(reference.color, "#FFFFFF")).toBe(true);

    // Every placement renders identical trigger styles — no placement can drift.
    for (const { name, snapshot } of styles.slice(1)) {
      expect(snapshot, `${name} trigger style must match HorizontalUtilityBar`).toEqual(reference);
    }
  });
});
