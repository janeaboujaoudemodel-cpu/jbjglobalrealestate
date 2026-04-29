import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// IMPORTANT: hoist-friendly mock of useNavigate. Must come before the
// component import so the component resolves the mocked module.
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import FilterShortcutBar, {
  defaultShortcutFilters,
  type ShortcutFilterState,
} from "../FilterShortcutBar";
import { LanguageProvider } from "@/contexts/LanguageContext";

/**
 * Reset-all behavior contract.
 *
 * The "Reset all" pill is the user's single guaranteed escape hatch:
 *   1. it must wipe every filter back to defaults,
 *   2. close every popover the bar owns,
 *   3. navigate to /properties with no query string.
 *
 * Each assertion here corresponds to one of those guarantees.
 */
function Harness({
  initial,
  onChange,
}: {
  initial: ShortcutFilterState;
  onChange: (f: ShortcutFilterState) => void;
}) {
  const [filters, setFilters] = useState<ShortcutFilterState>(initial);
  return (
    <MemoryRouter>
      <LanguageProvider>
        <FilterShortcutBar
          variant="light"
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            onChange(f);
          }}
        />
      </LanguageProvider>
    </MemoryRouter>
  );
}

const fullyPopulated: ShortcutFilterState = {
  ...defaultShortcutFilters,
  searchQuery: "skyline",
  priceMin: "1000000",
  priceMax: "5000000",
  sizeMin: "900",
  sizeMax: "2400",
  bedrooms: ["2", "3"],
  emirates: ["Dubai"],
  areas: ["Downtown"],
  developers: ["emaar"],
  propertyTypes: ["apartments"],
  statuses: ["On Sale"],
  constructionStatuses: ["Completed"],
  sortBy: "price_asc",
  hideSoldOut: true,
  views: ["Sea"],
  propertyCategory: "residential",
};

const findResetAll = () =>
  screen
    .getAllByRole("button")
    .find((b) => /reset all/i.test(b.getAttribute("aria-label") || b.textContent || ""));

describe("<FilterShortcutBar /> Reset all", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    localStorage.clear();
  });

  it("is hidden when no filters are active", () => {
    render(<Harness initial={defaultShortcutFilters} onChange={vi.fn()} />);
    expect(findResetAll()).toBeUndefined();
  });

  it.each([
    ["searchQuery", { searchQuery: "marina" }],
    ["bedrooms multi-select", { bedrooms: ["2"] }],
    ["emirates multi-select", { emirates: ["Dubai"] }],
    ["areas multi-select", { areas: ["Downtown"] }],
    ["developers multi-select", { developers: ["emaar"] }],
    ["sizeMin", { sizeMin: "800" }],
    ["sortBy", { sortBy: "newest" as const }],
    ["hideSoldOut", { hideSoldOut: true }],
  ])("is visible when only %s is active", (_label, partial) => {
    render(
      <Harness
        initial={{ ...defaultShortcutFilters, ...partial }}
        onChange={vi.fn()}
      />,
    );
    expect(findResetAll()).toBeTruthy();
  });

  it("clicking Reset all calls onFilterChange with the canonical defaults", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={fullyPopulated} onChange={onChange} />);

    await user.click(findResetAll()!);

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)![0]).toEqual(defaultShortcutFilters);
  });

  it("clicking Reset all closes any popover that was open", async () => {
    const user = userEvent.setup();
    render(<Harness initial={fullyPopulated} onChange={vi.fn()} />);

    // Open Bedrooms first.
    const bedroomsTrigger = screen
      .getAllByRole("button")
      .find((b) => /bedrooms?/i.test(b.textContent || ""))!;
    await user.click(bedroomsTrigger);
    await waitFor(() => {
      expect(bedroomsTrigger.getAttribute("aria-expanded")).toBe("true");
    });

    // Now reset.
    await user.click(findResetAll()!);

    await waitFor(() => {
      expect(bedroomsTrigger.getAttribute("aria-expanded")).toBe("false");
    });
  });

  it("clicking Reset all navigates to /properties with no query string", async () => {
    const user = userEvent.setup();
    render(<Harness initial={fullyPopulated} onChange={vi.fn()} />);

    await user.click(findResetAll()!);

    // resetAll defers navigation in a setTimeout(0) so popover-close
    // animations can settle. waitFor handles the microtask.
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/properties");
    });
  });
});
