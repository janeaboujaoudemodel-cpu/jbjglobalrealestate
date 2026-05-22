import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// --- Locked mode palette (must match ModeSwitcher MODE_CONFIG) -----------

const PALETTE: Record<
  UserMode,
  { label: string; base: string; baseDark: string; rowFrom: string; dark: string; onBase: string; surface: string }
> = {
  investor: {
    label: "Mode: Investor",
    base: "#B89555",
    baseDark: "#8A6E3D",
    rowFrom: "#FDFBF7",
    dark: "#1A1A1A",
    onBase: "#1A1A1A",
    surface: "gold",
  },
  broker: {
    label: "Mode: Broker",
    base: "#1A1A1A",
    baseDark: "#0A0A0A",
    rowFrom: "#FDFBF7",
    dark: "#1A1A1A",
    onBase: "#FFFFFF",
    surface: "ink",
  },
  // investor_broker mode removed — strictly 3 categories.
  developer: {
    label: "Mode: Developer",
    base: "#3A2D1D",
    baseDark: "#1F1810",
    rowFrom: "#FDFBF7",
    dark: "#1A1A1A",
    onBase: "#FFFFFF",
    surface: "espresso",
  },
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
const containsHex = (cssValue: string, hex: string) => {
  const v = norm(cssValue);
  return v.includes(norm(hex)) || v.includes(norm(hexToRgb(hex)));
};

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

// --- Tests ---------------------------------------------------------------

describe("ModeSwitcher color regression", () => {
  beforeEach(() => {
    setModeMock.mockReset();
    document.body
      .querySelectorAll('[data-radix-popper-content-wrapper]')
      .forEach((n) => n.remove());
  });

  const modes: UserMode[] = ["investor", "broker", "developer"];

  modes.forEach((activeMode) => {
    it(`closed trigger reflects the active mode color (${activeMode})`, () => {
      currentMode = activeMode;
      render(<ModeSwitcher variant="header" />);

      const { base } = PALETTE[activeMode];
      const trigger = getTrigger();

      // The trigger is a champagne chip with the active mode color in the inset rail.
      expect(
        containsHex(trigger.style.boxShadow, base),
        `${activeMode} trigger rail should contain ${base}, got ${trigger.style.boxShadow}`,
      ).toBe(true);
      // Champagne/no-gold-fills standard: trigger text is ink (#1A1A1A), not white.
      expect(
        norm(trigger.style.color) === "#1a1a1a" || norm(trigger.style.color) === "rgb(26,26,26)",
        `${activeMode} trigger text should be ink #1A1A1A, got ${trigger.style.color}`,
      ).toBe(true);
    });

    it(`every dropdown row shows its own mode color when active=${activeMode}`, () => {
      currentMode = activeMode;
      render(<ModeSwitcher variant="header" />);
      openDropdown();

      (Object.keys(PALETTE) as UserMode[]).forEach((modeKey) => {
        const p = PALETTE[modeKey];
        const row = findRowByLabel(p.label);

        // Each row's gradient must contain its own tint start color.
        expect(
          containsHex(row.style.backgroundImage, p.rowFrom),
          `${p.label} row gradient should contain ${p.rowFrom}, got ${row.style.backgroundImage}`,
        ).toBe(true);

        // Border is always the saturated mode color (not pale).
        expect(
          containsHex(row.style.borderColor, p.base),
          `${p.label} row border should be ${p.base}, got ${row.style.borderColor}`,
        ).toBe(true);

        // Text on the row uses the dark mode color for legibility on the tint.
        expect(
          containsHex(row.style.color, p.dark),
          `${p.label} row text should be ${p.dark}, got ${row.style.color}`,
        ).toBe(true);

        const iconTile = row.querySelector<HTMLElement>(".mode-switcher-icon-tile");
        expect(iconTile, `${p.label} should render a mode icon tile`).toBeTruthy();
        expect(iconTile?.dataset.modeIconTile).toBe(p.surface);
        expect(
          containsHex(iconTile?.style.backgroundImage ?? "", p.base),
          `${p.label} icon tile must use its own mode fill ${p.base}, got ${iconTile?.style.backgroundImage}`,
        ).toBe(true);

        if (modeKey === activeMode) {
          const selected = row.querySelector<HTMLElement>(".mode-switcher-selected-pill");
          expect(selected, `${p.label} active row should render Selected pill`).toBeTruthy();
          expect(selected?.dataset.modeSelectedPill).toBe(p.surface);
          expect(containsHex(selected?.style.backgroundColor ?? "", p.base)).toBe(true);
          expect(containsHex(selected?.style.color ?? "", p.onBase)).toBe(true);
        }
      });
    });
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
    const { base } = PALETTE.broker;

    // Reference reflects the active broker palette in the rail, not a blacked-out chip.
    expect(containsHex(reference.shadow, base)).toBe(true);
    expect(
      norm(reference.color) === "#1a1a1a" || norm(reference.color) === "rgb(26,26,26)",
    ).toBe(true);

    // Every placement renders identical trigger styles — no placement can drift.
    for (const { name, snapshot } of styles.slice(1)) {
      expect(snapshot, `${name} trigger style must match HorizontalUtilityBar`).toEqual(reference);
    }
  });
});
