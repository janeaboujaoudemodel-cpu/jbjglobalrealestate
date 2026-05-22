/**
 * Guards /brokers → /team redirect.
 *
 * Confirms:
 *  - bare /brokers redirects to /team
 *  - /our-brokers also redirects to /team
 *  - query string (?dept=sales) is preserved → department filtering survives
 *  - hash (#anchor) is preserved → in-page deep links survive
 *  - canonical /team continues to render the page (no accidental redirect loop)
 */
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { RedirectWithSearch } from "@/routes/RedirectWithSearch";

function TeamProbe() {
  const loc = useLocation();
  const url = `${loc.pathname}${loc.search}${loc.hash}`;
  return <div data-testid="team-url">{url}</div>;
}

function renderAt(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/team" element={<TeamProbe />} />
        <Route path="/brokers" element={<RedirectWithSearch to="/team" />} />
        <Route path="/our-brokers" element={<RedirectWithSearch to="/team" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("/brokers redirect", () => {
  it("redirects bare /brokers to /team", async () => {
    renderAt("/brokers");
    await waitFor(() => expect(screen.getByTestId("team-url")).toBeTruthy());
    expect(screen.getByTestId("team-url").textContent).toMatch(/^\/team/);
  });

  it("redirects /our-brokers to /team", async () => {
    renderAt("/our-brokers");
    await waitFor(() => expect(screen.getByTestId("team-url")).toBeTruthy());
    expect(screen.getByTestId("team-url").textContent).toMatch(/^\/team/);
  });

  it("preserves the query string so department filters survive", async () => {
    renderAt("/brokers?dept=sales&view=grid");
    await waitFor(() => expect(screen.getByTestId("team-url")).toBeTruthy());
    const url = screen.getByTestId("team-url").textContent ?? "";
    expect(url).toContain("dept=sales");
    expect(url).toContain("view=grid");
  });

  it("preserves the hash for in-page deep links", async () => {
    renderAt("/brokers#leadership");
    await waitFor(() => expect(screen.getByTestId("team-url")).toBeTruthy());
    expect(screen.getByTestId("team-url").textContent).toContain("#leadership");
  });

  it("preserves both query + hash together", async () => {
    renderAt("/brokers?dept=investment#meet");
    await waitFor(() => expect(screen.getByTestId("team-url")).toBeTruthy());
    const url = screen.getByTestId("team-url").textContent ?? "";
    expect(url).toContain("dept=investment");
    expect(url).toContain("#meet");
  });
});
