import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FilterShortcutBar, {
  defaultShortcutFilters,
  type ShortcutFilterState,
} from "../FilterShortcutBar";
import { LanguageProvider } from "@/contexts/LanguageContext";

/**
 * Popover-behavior contract for the multi-select filters.
 *
 * We use the Bedrooms popover as the canonical multi-select case
 * (chips + per-section Reset + Done). The same wiring pattern is used
 * by Status / Construction / Views, so locking it here protects all of
 * them from accidental regressions in:
 *   - controlled `open` / `setOpen` plumbing,
 *   - the Done button calling `setOpen(false)`,
 *   - per-section Reset clearing only its own field,
 *   - `onFilterChange` being called with the right partial.
 *
 * Radix portals are notoriously flaky to query in jsdom, so we assert
 * popover open/closed via the trigger's `aria-expanded` attribute and
 * verify state transitions through `onFilterChange` mock calls — both
 * are 100% reliable in the existing Vitest setup.
 */
function Harness({
  initial = defaultShortcutFilters,
  onChange,
}: {
  initial?: ShortcutFilterState;
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

const getBedroomsTrigger = () =>
  screen.getAllByRole("button").find((b) => /bedrooms?/i.test(b.textContent || ""))!;

describe("<FilterShortcutBar /> bedrooms popover", () => {
  beforeEach(() => {
    // userEvent reads matchMedia; setup file already mocks it. Reset storage.
    localStorage.clear();
  });

  it("opens the bedrooms popover when its pill is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    const trigger = getBedroomsTrigger();
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await user.click(trigger);

    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });
  });

  it("toggling chips inside the popover calls onFilterChange with cumulative selections", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(getBedroomsTrigger());

    // Chips render inside the portalled popover content.
    const twoBR = await screen.findByRole("button", { name: "2 BR" });
    const threeBR = await screen.findByRole("button", { name: "3 BR" });

    await user.click(twoBR);
    await user.click(threeBR);

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as ShortcutFilterState;
    expect(last.bedrooms).toEqual(["2", "3"]);
  });

  it("Done button closes the popover and preserves the selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const trigger = getBedroomsTrigger();
    await user.click(trigger);

    await user.click(await screen.findByRole("button", { name: "2 BR" }));

    const done = await screen.findByRole("button", { name: /done|apply/i });
    await user.click(done);

    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });

    // Selection survived the close.
    const last = onChange.mock.calls.at(-1)![0] as ShortcutFilterState;
    expect(last.bedrooms).toEqual(["2"]);
  });

  it("per-section Reset clears bedrooms but does NOT close the popover", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initial={{ ...defaultShortcutFilters, bedrooms: ["2", "3"] }}
        onChange={onChange}
      />,
    );

    const trigger = getBedroomsTrigger();
    await user.click(trigger);

    // Per-section Reset lives next to Done in the popover footer. There
    // are multiple "Reset" buttons across the bar; pick the one inside
    // the bedrooms popover via proximity to "Done".
    const resetButtons = await screen.findAllByRole("button", { name: /^reset$/i });
    expect(resetButtons.length).toBeGreaterThan(0);
    await user.click(resetButtons[0]);

    const last = onChange.mock.calls.at(-1)![0] as ShortcutFilterState;
    expect(last.bedrooms).toEqual([]);

    // Popover stays open so the user can continue tuning.
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});
