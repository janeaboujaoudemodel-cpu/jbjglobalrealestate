import { describe, it, expect, vi, beforeEach } from "vitest";
import { render as rtlRender, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
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

vi.mock("@/hooks/useIsAppOwner", () => ({
  useIsAppOwner: () => ({ isOwner: true }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "owner@jbj.ae" } }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// --- Locked brand palette (uniform across EVERY mode) --------------------
//
// The platform was intentionally migrated to ONE brand palette — emerald /
// ink / champagne / gold — for all modes. There is no per-mode hue any more
// (no orange investor, no blue broker, no green combined, no purple
// developer). This test guards that uniformity: every mode must render the
// same locked tones, and no foreign hue may appear.
//
// See:
//   .lovable/memory/style/color-palette/ink-emerald-gradient-standard.md
//   .lovable/memory/style/color-palette/emerald-pair-lock.md

const EMERALD = "#064E3B";
const EMERALD_DEEP = "#042C1C";
const INK = "#1A1A1A";
const WHITE = "#FFFFFF";
const CHAMPAGNE = ["#FDFBF7", "#F7F2EA", "#F2EBDC", "#EFE6D6"];
const GOLD = "#B89555";

const MODE_LABELS: Record<UserMode, string> = {
  investor: "Mode: Investor",
  broker: "Mode: Broker",
  developer: "Mode: Developer",
  owner: "Mode: Owner",
};

// Hues that belonged to the retired per-mode tinting pattern.
const FORBIDDEN_HUES = [
  "orange",
  "purple",
  "violet",
  "indigo",
  "#f97316",
  "#fb923c",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#22c55e",
  "#16a34a",
  "#8b5cf6",
  "#a855f7",
];

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
const isOneOf = (cssValue: string, hexes: string[]) =>
  hexes.some((h) => containsHex(cssValue, h));

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

const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

const openDropdown = () => {
  const trigger = getTrigger();
  fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });
  fireEvent.pointerUp(trigger, { button: 0, pointerType: "mouse" });
  fireEvent.click(trigger);
};

const triggerSnapshot = (trigger: HTMLButtonElement) => ({
  bgImage: trigger.style.backgroundImage,
  bgColor: trigger.style.backgroundColor,
  shadow: trigger.style.boxShadow,
  border: trigger.style.borderColor,
  color: trigger.style.color,
});

// --- Tests ---------------------------------------------------------------

describe("ModeSwitcher uniform brand palette", () => {
  beforeEach(() => {
    setModeMock.mockReset();
    document.body
      .querySelectorAll('[data-radix-popper-content-wrapper]')
      .forEach((n) => n.remove());
  });

  const modes: UserMode[] = ["investor", "broker", "developer", "owner"];

  modes.forEach((activeMode) => {
    it(`closed trigger stays in the locked emerald/ink/champagne/gold palette (${activeMode})`, () => {
      currentMode = activeMode;
      render(<ModeSwitcher variant="header" />);

      const trigger = getTrigger();
      const snap = triggerSnapshot(trigger);
      const all = Object.values(snap).join(" ");

      // Ink is either pure white (emerald chrome) or brand ink (champagne chrome).
      expect(
        isOneOf(snap.color, [WHITE, INK]),
        `${activeMode} trigger ink must be #FFFFFF or #1A1A1A, got ${snap.color}`,
      ).toBe(true);

      // Fill is the emerald ombre var, champagne gradient, or a clear/no-fill chip.
      expect(
        snap.bgImage === "" ||
          snap.bgImage === "none" ||
          snap.bgImage.includes("--jj-emerald-ombre") ||
          isOneOf(snap.bgImage, [...CHAMPAGNE, EMERALD, EMERALD_DEEP]),
        `${activeMode} trigger fill must be emerald ombre or champagne, got ${snap.bgImage}`,
      ).toBe(true);

      // No retired per-mode hue anywhere on the trigger.
      FORBIDDEN_HUES.forEach((hue) => {
        expect(
          norm(all).includes(norm(hue)),
          `${activeMode} trigger must not contain retired hue ${hue}: ${all}`,
        ).toBe(false);
      });
    });

    it(`every dropdown row uses the same emerald/champagne branding (active=${activeMode})`, () => {
      currentMode = activeMode;
      render(<ModeSwitcher variant="header" />);
      openDropdown();

      modes.forEach((modeKey) => {
        const row = findRowByLabel(MODE_LABELS[modeKey]);
        const rowStyles = `${row.className} ${row.getAttribute("style") ?? ""}`;

        // Rows are branded emerald — never a per-mode hue.
        expect(
          norm(rowStyles).includes(norm(EMERALD)) ||
            norm(rowStyles).includes(norm("6,78,59")),
          `${MODE_LABELS[modeKey]} row must be emerald-branded, got ${rowStyles}`,
        ).toBe(true);

        FORBIDDEN_HUES.forEach((hue) => {
          expect(
            norm(rowStyles).includes(norm(hue)),
            `${MODE_LABELS[modeKey]} row must not contain retired hue ${hue}`,
          ).toBe(false);
        });

        const iconTile = row.querySelector<HTMLElement>(".mode-switcher-icon-tile");
        expect(iconTile, `${MODE_LABELS[modeKey]} should render a mode icon tile`).toBeTruthy();
        const tileStyles = `${iconTile?.className ?? ""} ${iconTile?.getAttribute("style") ?? ""}`;
        expect(
          norm(tileStyles).includes(norm("6,78,59")) || norm(tileStyles).includes(norm(EMERALD)),
          `${MODE_LABELS[modeKey]} icon tile must use the shared emerald tint, got ${tileStyles}`,
        ).toBe(true);

        if (modeKey === activeMode) {
          const selected = row.querySelector<HTMLElement>(".mode-switcher-selected-pill");
          expect(selected, `${MODE_LABELS[modeKey]} active row should render Selected pill`).toBeTruthy();
          const pillStyles = `${selected?.className ?? ""} ${selected?.getAttribute("style") ?? ""}`;
          expect(
            norm(pillStyles).includes(norm("6,78,59")) || norm(pillStyles).includes(norm(EMERALD)),
            `active pill must be emerald, got ${pillStyles}`,
          ).toBe(true);
        }
      });
    });
  });

  it("renders an identical trigger for every mode — no per-mode tinting", () => {
    const snapshots = modes.map((m) => {
      currentMode = m;
      const { unmount } = render(<ModeSwitcher variant="header" />);
      const snap = triggerSnapshot(getTrigger());
      unmount();
      return { m, snap };
    });

    const reference = snapshots[0].snap;
    for (const { m, snap } of snapshots.slice(1)) {
      expect(snap, `${m} trigger style must match ${snapshots[0].m} — branding is uniform`).toEqual(
        reference,
      );
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

    const placements = [
      { name: "HorizontalUtilityBar", node: <ModeSwitcher variant="header" showForUnselected /> },
      { name: "Footer", node: <ModeSwitcher variant="header" showForUnselected={true} side="top" /> },
      { name: "MegaMenuAccount", node: <ModeSwitcher variant="header" /> },
    ];

    const styles = placements.map(({ name, node }) => {
      const { unmount } = render(node);
      const snapshot = triggerSnapshot(getTrigger());
      unmount();
      return { name, snapshot };
    });

    const reference = styles[0].snapshot;
    expect(isOneOf(reference.color, [WHITE, INK])).toBe(true);
    expect(containsHex(reference.color, GOLD)).toBe(false);

    for (const { name, snapshot } of styles.slice(1)) {
      expect(snapshot, `${name} trigger style must match HorizontalUtilityBar`).toEqual(reference);
    }
  });
});
