/**
 * UI Regression: VerifiedMedia fallback rendering
 * --------------------------------------------------------------
 * Listing cards must never render a broken / blank image area.
 * When the URL is missing or invalid, a champagne placeholder
 * (role="img" + ImageOff icon) is shown instead.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerifiedMedia } from "@/components/ui/verified-media";

describe("VerifiedMedia regression", () => {
  it("shows the placeholder when src is null", () => {
    render(<VerifiedMedia src={null} alt="Aynur Apartments" />);
    const placeholder = screen.getByRole("img", { name: "Aynur Apartments" });
    expect(placeholder).toBeInTheDocument();
    // The placeholder is a div with the ImageOff icon, NOT an <img>
    expect(placeholder.tagName.toLowerCase()).toBe("div");
  });

  it("shows the placeholder when src is whitespace only", () => {
    render(<VerifiedMedia src="   " alt="Spaces" />);
    expect(screen.getByRole("img", { name: "Spaces" }).tagName.toLowerCase()).toBe("div");
  });

  it("shows the placeholder for obviously invalid URLs", () => {
    render(<VerifiedMedia src="not-a-url" alt="Invalid" />);
    expect(screen.getByRole("img", { name: "Invalid" }).tagName.toLowerCase()).toBe("div");
  });

  it("renders a real <img> for an http(s) URL", () => {
    render(
      <VerifiedMedia
        src="https://example.com/photo.jpg"
        alt="Real photo"
        priority
      />
    );
    const img = screen.getByAltText("Real photo") as HTMLImageElement;
    expect(img.tagName.toLowerCase()).toBe("img");
    expect(img.getAttribute("src")).toMatch(/^https:\/\/example\.com\//);
  });

  it("shows a custom placeholder label when provided", () => {
    render(
      <VerifiedMedia src={null} alt="Tower" placeholderLabel="Awaiting photo" />
    );
    expect(screen.getByText("Awaiting photo")).toBeInTheDocument();
  });
});
