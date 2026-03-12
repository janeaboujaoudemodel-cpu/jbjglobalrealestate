import { describe, it, expect } from "vitest";
import { sanitizeForDisplay, sanitizeHtml, stripHtmlTags, stripCompetitorUrls, stripCompetitorNames } from "@/utils/contentSanitizer";

describe("contentSanitizer", () => {
  describe("stripHtmlTags", () => {
    it("strips anchor tags preserving inner text", () => {
      const input = 'Visit <a href="https://providentestate.com/project">Sobha Seahaven</a> for details';
      expect(stripHtmlTags(input)).toBe("Visit Sobha Seahaven for details");
    });

    it("strips paragraph and div tags", () => {
      const input = "<p>Hello</p><div>World</div>";
      expect(stripHtmlTags(input)).toBe("HelloWorld");
    });

    it("handles nested tags", () => {
      const input = '<p><strong>Bold <a href="#">link</a></strong></p>';
      expect(stripHtmlTags(input)).toBe("Bold link");
    });

    it("returns empty string for empty input", () => {
      expect(stripHtmlTags("")).toBe("");
    });
  });

  describe("stripCompetitorUrls", () => {
    it("removes providentestate.com URLs", () => {
      const input = "Check https://providentestate.com/new-projects/sobha for info";
      expect(stripCompetitorUrls(input)).toBe("Check  for info");
    });

    it("removes reelly.io URLs", () => {
      const input = "Source: https://reelly.io/project/123";
      expect(stripCompetitorUrls(input)).toBe("Source: ");
    });

    it("removes provident.ae URLs", () => {
      const input = "See https://provident.ae/listing/abc";
      expect(stripCompetitorUrls(input)).toBe("See ");
    });

    it("leaves non-competitor URLs intact", () => {
      const input = "Visit https://example.com for details";
      expect(stripCompetitorUrls(input)).toBe("Visit https://example.com for details");
    });
  });

  describe("stripCompetitorNames", () => {
    it("removes 'Provident' mentions", () => {
      expect(stripCompetitorNames("Listed on Provident website")).toBe("Listed on  website");
    });

    it("removes 'Provident Estate' mentions", () => {
      expect(stripCompetitorNames("Data from Provident Estate")).toBe("Data from ");
    });

    it("removes 'Reelly' mentions", () => {
      expect(stripCompetitorNames("Imported via Reelly API")).toBe("Imported via  API");
    });

    it("is case insensitive", () => {
      expect(stripCompetitorNames("PROVIDENT data")).toBe(" data");
      expect(stripCompetitorNames("reelly source")).toBe(" source");
    });

    it("leaves unrelated text intact", () => {
      expect(stripCompetitorNames("Dubai Marina luxury apartment")).toBe("Dubai Marina luxury apartment");
    });
  });

  describe("sanitizeForDisplay", () => {
    it("strips HTML tags and competitor URLs from descriptions", () => {
      const input = '<p>Beautiful project by <a href="https://providentestate.com/dev">Developer</a>. Located in Dubai.</p>';
      const result = sanitizeForDisplay(input);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
      expect(result).not.toContain("providentestate");
      expect(result).toContain("Beautiful project");
      expect(result).toContain("Developer");
      expect(result).toContain("Dubai");
    });

    it("removes competitor name mentions", () => {
      const input = "This project is listed on Provident Estate and Reelly marketplace";
      const result = sanitizeForDisplay(input);
      expect(result).not.toContain("Provident");
      expect(result).not.toContain("Reelly");
    });

    it("removes attribution patterns", () => {
      const input = "Source: external data. Extracted from listing page.";
      const result = sanitizeForDisplay(input);
      expect(result).not.toMatch(/source\s*:/i);
      expect(result).not.toMatch(/extracted\s+from/i);
    });

    it("cleans up empty parentheses and brackets", () => {
      const input = "Project () details []";
      const result = sanitizeForDisplay(input);
      expect(result).not.toContain("()");
      expect(result).not.toContain("[]");
    });

    it("handles null and undefined", () => {
      expect(sanitizeForDisplay(null)).toBe("");
      expect(sanitizeForDisplay(undefined)).toBe("");
    });

    it("handles complex real-world description with embedded HTML", () => {
      const input = 'Sobha Seahaven is a luxury project. <a href="https://providentestate.com/new-projects/sobha-seahaven/" target="_blank" rel="noopener noreferrer">View on Provident Estate</a>. Source: Provident. Features include pool, gym.';
      const result = sanitizeForDisplay(input);
      expect(result).not.toContain("<a");
      expect(result).not.toContain("</a>");
      expect(result).not.toContain("providentestate.com");
      expect(result).not.toContain("Provident");
      expect(result).toContain("Sobha Seahaven");
      expect(result).toContain("luxury project");
      expect(result).toContain("pool");
    });
  });

  describe("sanitizeHtml", () => {
    it("converts competitor anchor tags to plain text", () => {
      const input = '<a href="https://providentestate.com/project/abc">View Project</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("<a");
      expect(result).not.toContain("providentestate");
      expect(result).toContain("View Project");
    });

    it("leaves non-competitor anchor tags intact", () => {
      const input = '<a href="https://example.com" class="text-gold">Example</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain("<a");
      expect(result).toContain("Example");
    });

    it("removes competitor names from HTML content", () => {
      const input = '<p>Data provided by Provident Estate</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("Provident");
    });

    it("handles null and undefined", () => {
      expect(sanitizeHtml(null)).toBe("");
      expect(sanitizeHtml(undefined)).toBe("");
    });
  });
});
