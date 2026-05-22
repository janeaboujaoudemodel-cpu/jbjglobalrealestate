import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import ModeSelectionModal from "@/components/ModeSelectionModal";
import type { UserMode } from "@/contexts/UserModeContext";

// --- Mocks ---------------------------------------------------------------

const setModeMock = vi.fn(async (_m: UserMode) => {});
let hasMadeInitialSelection = false;

vi.mock("@/contexts/UserModeContext", async () => {
  const actual = await vi.importActual<any>("@/contexts/UserModeContext");
  return {
    ...actual,
    useUserModeContext: () => ({
      mode: "investor",
      isLoading: false,
      setMode: setModeMock,
      isInvestorMode: true,
      isBrokerMode: false,
      isCombinedMode: false,
      isDeveloperMode: false,
      hasMadeInitialSelection,
    }),
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

// Simple stand-in for the coordinator: any popup requesting to show is visible.
vi.mock("@/contexts/PopupCoordinatorContext", () => ({
  usePopupVisibility: (_id: string) => {
    const [visible, setVisible] = require("react").useState(false);
    return {
      requestToShow: () => setVisible(true),
      dismiss: () => setVisible(false),
      isVisible: visible,
      isMobile: false,
    };
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// --- Tests ---------------------------------------------------------------

describe("ModeSelectionModal", () => {
  beforeEach(() => {
    setModeMock.mockClear();
    hasMadeInitialSelection = false;
    document.body.innerHTML = "";
  });

  it("renders strictly the 3 categories and no Visitor option", () => {
    render(<ModeSelectionModal />);
    expect(screen.getByText("Investor")).toBeInTheDocument();
    expect(screen.getByText("Broker")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.queryByText(/visitor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/partnership/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/investor \+ broker/i)).not.toBeInTheDocument();
  });

  it("Continue button is disabled until a mode is picked (no skip path)", () => {
    render(<ModeSelectionModal />);
    const cta = screen.getByRole("button", { name: /continue/i });
    expect(cta).toBeDisabled();

    fireEvent.click(screen.getByText("Broker"));
    expect(cta).not.toBeDisabled();
  });

  it("does not render Radix's built-in close (X) button", () => {
    render(<ModeSelectionModal />);
    // Radix Dialog's built-in close has aria-label="Close" and is hidden via
    // [&>button]:hidden — querying confirms no visible close affordance exists.
    const closes = screen
      .queryAllByRole("button")
      .filter((b) => /close/i.test(b.getAttribute("aria-label") || ""));
    closes.forEach((c) => expect(c).not.toBeVisible());
  });

  it("Escape key does NOT dismiss the dialog", async () => {
    render(<ModeSelectionModal />);
    expect(screen.getByText(/Welcome to JBJ Global Real Estate/i)).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });
    // Still on screen — escape is intercepted.
    await waitFor(() =>
      expect(screen.getByText(/Welcome to JBJ Global Real Estate/i)).toBeInTheDocument(),
    );
  });

  it("selecting a mode calls setMode with the exact value", async () => {
    render(<ModeSelectionModal />);
    fireEvent.click(screen.getByText("Developer"));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => expect(setModeMock).toHaveBeenCalledWith("developer"));
  });

  it("returns null once the user has already selected a mode", () => {
    hasMadeInitialSelection = true;
    const { container } = render(<ModeSelectionModal />);
    expect(container.firstChild).toBeNull();
  });
});
