import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
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
      isInvestorMode: currentMode === "investor" || currentMode === "investor_broker",
      isBrokerMode: currentMode === "broker" || currentMode === "investor_broker",
      isCombinedMode: currentMode === "investor_broker",
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
  { label: string; base: string; lighter: string; dark: string }
> = {
  investor: {
    label: "Mode: Investor",
    base: "#F97316",     // orange
    lighter: "#FFF7ED",
    dark: "#9A3412",
  },
  broker: {
    label: "Mode: Broker",
    base: "#2563EB",     // blue
    lighter: "#EFF6FF",
    dark: "#1E3A8A",
  },
  investor_broker: {
    label: "Mode: Investor + Broker",
    base: "#16A34A",     // green
    lighter: "#F0FDF4",
    dark: "#14532D",
  },
  developer: {
    label: "Mode: Developer",
    base: "#7C3AED",     // purple
    lighter: "#F5F3FF",
    dark: "#4C1D95",
  },
};

// Normalize hex/rgb so style assertions are tolerant.
const norm = (v: string) => v.replace(/\s+/g, "").toLowerCase();

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

const styleMatches = (actual: string, expectedHex: string) => {
  const a = norm(actual);
  return a === norm(expectedHex) || a === norm(hexToRgb(expectedHex));
};

// --- Helpers -------------------------------------------------------------

const getTrigger = (): HTMLButtonElement => {
  // The shared trigger is the only button with aria-haspopup="menu" in our
  // isolated render.
  const btn = document.querySelector<HTMLButtonElement>(
    'button[aria-haspopup="menu"]',
  );
  if (!btn) throw new Error("Mode trigger button not found");
  return btn;
};

const findRowByLabel = (label: string): HTMLElement => {
  // Radix portals the dropdown content into <body>, so query the whole document.
  const matches = Array.from(
    document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  );
  const row = matches.find((el) => el.textContent?.includes(label));
  if (!row) {
    throw new Error(
      `Could not find menuitem row for "${label}". Found: ${matches
        .map((m) => m.textContent?.slice(0, 40))
        .join(" | ")}`,
    );
  }
  return row;
};

const openDropdown = () => {
  const trigger = getTrigger();
  // Radix DropdownMenu opens on pointerdown (not click) and requires button=0.
  fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });
  fireEvent.pointerUp(trigger, { button: 0, pointerType: "mouse" });
  fireEvent.click(trigger);
};

// --- Tests ---------------------------------------------------------------

describe("ModeSwitcher color regression", () => {
  beforeEach(() => {
    setModeMock.mockReset();
    // Clean up any leftover portals between tests
    document.body
      .querySelectorAll('[data-radix-popper-content-wrapper]')
      .forEach((n) => n.remove());
  });

  const modes: UserMode[] = ["investor", "broker", "investor_broker", "developer"];

  modes.forEach((activeMode) => {
    it(`renders correct palette for trigger + all rows when active mode is ${activeMode}`, () => {
      currentMode = activeMode;
      render(<ModeSwitcher variant="header" />);

      // Trigger button shows the active mode's colors.
      const { base, lighter, dark } = PALETTE[activeMode];
      const trigger = getTrigger();
      expect(
        styleMatches(trigger.style.backgroundColor, lighter),
        `${activeMode} trigger bg should be ${lighter}, got ${trigger.style.backgroundColor}`,
      ).toBe(true);
      expect(
        styleMatches(trigger.style.borderColor, base),
        `${activeMode} trigger border should be ${base}, got ${trigger.style.borderColor}`,
      ).toBe(true);
      expect(
        styleMatches(trigger.style.color, dark),
        `${activeMode} trigger text should be ${dark}, got ${trigger.style.color}`,
      ).toBe(true);

      // Open dropdown and check every row's color.
      openDropdown();

      (Object.keys(PALETTE) as UserMode[]).forEach((modeKey) => {
        const p = PALETTE[modeKey];
        const row = findRowByLabel(p.label);

        // Background uses the mode's lighter tint at rest.
        expect(
          styleMatches(row.style.backgroundColor, p.lighter),
          `${p.label} row bg should be ${p.lighter}, got ${row.style.backgroundColor}`,
        ).toBe(true);

        // Active row border equals the base color.
        if (currentMode === modeKey) {
          expect(
            styleMatches(row.style.borderColor, p.base),
            `${p.label} active row border should be ${p.base}, got ${row.style.borderColor}`,
          ).toBe(true);
        }

        // Dark text color on the row label.
        const labelEl = within(row).getByText(p.label) as HTMLElement;
        expect(
          styleMatches(labelEl.style.color, p.dark),
          `${p.label} label color should be ${p.dark}, got ${labelEl.style.color}`,
        ).toBe(true);
      });
    });
  });

  it("uses the same shared ModeSwitcher in header, footer, and account menu placements", async () => {
    // The three known placements (HorizontalUtilityBar, Footer, MegaMenuAccount)
    // all import the same component, so verifying its palette once covers all
    // three locations. This guard makes sure we notice if a one-off copy is
    // introduced later.
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
});
