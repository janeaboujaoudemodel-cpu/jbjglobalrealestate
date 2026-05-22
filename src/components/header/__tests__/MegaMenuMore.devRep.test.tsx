import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MegaMenuMore from "@/components/header/MegaMenuMore";
import type { UserMode } from "@/contexts/UserModeContext";

// --- Mocks ---------------------------------------------------------------

let currentMode: UserMode = "investor";

vi.mock("@/contexts/UserModeContext", async () => {
  const actual = await vi.importActual<any>("@/contexts/UserModeContext");
  return {
    ...actual,
    useUserModeContext: () => ({
      mode: currentMode,
      isLoading: false,
      setMode: vi.fn(),
      isInvestorMode: currentMode === "investor",
      isBrokerMode: currentMode === "broker",
      isCombinedMode: false,
      isDeveloperMode: currentMode === "developer",
      hasMadeInitialSelection: true,
    }),
  };
});

vi.mock("@/contexts/FounderVisibilityContext", () => ({
  useFounderVisibility: () => ({ isFounderVisible: false }),
}));

const DEV_REP_HREF = "/careers/developer-representative";
const DEV_REP_LABEL = /Careers\s*—\s*Developer Rep/i;

const renderMenu = () =>
  render(
    <MemoryRouter>
      <MegaMenuMore onClose={() => {}} />
    </MemoryRouter>,
  );

const findDevRepLink = () =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>(`a[href="${DEV_REP_HREF}"]`));

describe("MegaMenuMore — Developer Representative careers link", () => {
  beforeEach(() => {
    cleanup();
  });

  it("is HIDDEN in investor mode", () => {
    currentMode = "investor";
    renderMenu();
    expect(findDevRepLink()).toHaveLength(0);
    expect(screen.queryByText(DEV_REP_LABEL)).not.toBeInTheDocument();
  });

  it("is HIDDEN in broker mode", () => {
    currentMode = "broker";
    renderMenu();
    expect(findDevRepLink()).toHaveLength(0);
    expect(screen.queryByText(DEV_REP_LABEL)).not.toBeInTheDocument();
  });

  it("is VISIBLE in developer mode and points to /careers/developer-representative", () => {
    currentMode = "developer";
    renderMenu();
    const links = findDevRepLink();
    expect(links.length).toBeGreaterThan(0);
    expect(screen.getByText(DEV_REP_LABEL)).toBeInTheDocument();
  });

  it("does not duplicate the standard /join Careers link", () => {
    currentMode = "developer";
    renderMenu();
    const careers = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href="/join"]'),
    );
    expect(careers.length).toBe(1);
  });
});
