import { describe, it, expect } from "vitest";
import { encodeFilters, decodeFilters } from "../filterUrl";
import { defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";

/**
 * URL codec contract for the global filter bar.
 *
 * These tests pin every single field so that adding/renaming a filter
 * field without updating the codec fails CI immediately, instead of
 * silently dropping the field from shared / refreshed URLs.
 */
describe("encodeFilters", () => {
  it("returns an empty query string for default state", () => {
    expect(encodeFilters(defaultShortcutFilters).toString()).toBe("");
  });

  it("omits null sortBy and null propertyCategory", () => {
    const qs = encodeFilters({
      ...defaultShortcutFilters,
      sortBy: null,
      propertyCategory: null,
    }).toString();
    expect(qs).not.toMatch(/sortBy/);
    expect(qs).not.toMatch(/category/);
  });

  it("omits hideSoldOut when false, sets '1' when true", () => {
    expect(encodeFilters(defaultShortcutFilters).get("hideSoldOut")).toBeNull();
    const p = encodeFilters({ ...defaultShortcutFilters, hideSoldOut: true });
    expect(p.get("hideSoldOut")).toBe("1");
  });

  it("joins every multi-select array with commas", () => {
    const p = encodeFilters({
      ...defaultShortcutFilters,
      bedrooms: ["studio", "2", "3"],
      emirates: ["Dubai", "Abu Dhabi"],
      areas: ["Downtown", "Marina"],
      developers: ["emaar", "damac"],
      propertyTypes: ["apartments", "villa"],
      statuses: ["On Sale", "Sold Out"],
      constructionStatuses: ["Completed"],
      views: ["Sea", "Park"],
    });
    expect(p.get("bedrooms")).toBe("studio,2,3");
    expect(p.get("emirates")).toBe("Dubai,Abu Dhabi");
    expect(p.get("areas")).toBe("Downtown,Marina");
    expect(p.get("developers")).toBe("emaar,damac");
    expect(p.get("propertyTypes")).toBe("apartments,villa");
    expect(p.get("statuses")).toBe("On Sale,Sold Out");
    expect(p.get("constructionStatuses")).toBe("Completed");
    expect(p.get("views")).toBe("Sea,Park");
  });

  it("preserves price/size raw string values", () => {
    const p = encodeFilters({
      ...defaultShortcutFilters,
      priceMin: "500000",
      priceMax: "2500000",
      sizeMin: "800",
      sizeMax: "3200",
    });
    expect(p.get("priceMin")).toBe("500000");
    expect(p.get("priceMax")).toBe("2500000");
    expect(p.get("sizeMin")).toBe("800");
    expect(p.get("sizeMax")).toBe("3200");
  });

  it("encodes searchQuery under 'q' (canonical key)", () => {
    const p = encodeFilters({
      ...defaultShortcutFilters,
      searchQuery: "marina view",
    });
    expect(p.get("q")).toBe("marina view");
  });

  it("encodes propertyCategory and sortBy when set", () => {
    const p = encodeFilters({
      ...defaultShortcutFilters,
      propertyCategory: "residential",
      sortBy: "price_desc",
    });
    expect(p.get("category")).toBe("residential");
    expect(p.get("sortBy")).toBe("price_desc");
  });
});

describe("decodeFilters", () => {
  it("missing keys fall back to defaults", () => {
    const decoded = decodeFilters(new URLSearchParams(""));
    expect(decoded).toEqual(defaultShortcutFilters);
  });

  it("multi-select fields split on comma and drop empty entries", () => {
    const p = new URLSearchParams(
      "bedrooms=studio,2,3&emirates=Dubai,Abu Dhabi&views=Sea,,Park",
    );
    const d = decodeFilters(p);
    expect(d.bedrooms).toEqual(["studio", "2", "3"]);
    expect(d.emirates).toEqual(["Dubai", "Abu Dhabi"]);
    expect(d.views).toEqual(["Sea", "Park"]);
  });

  it("hideSoldOut decodes only when value is exactly '1'", () => {
    expect(decodeFilters(new URLSearchParams("hideSoldOut=1")).hideSoldOut).toBe(true);
    expect(decodeFilters(new URLSearchParams("hideSoldOut=true")).hideSoldOut).toBe(false);
    expect(decodeFilters(new URLSearchParams("")).hideSoldOut).toBe(false);
  });

  it("legacy ?keyword= and ?search= map to searchQuery", () => {
    expect(decodeFilters(new URLSearchParams("keyword=foo")).searchQuery).toBe("foo");
    expect(decodeFilters(new URLSearchParams("search=bar")).searchQuery).toBe("bar");
    // canonical 'q' wins when present alongside legacy keys
    expect(
      decodeFilters(new URLSearchParams("q=primary&keyword=legacy")).searchQuery,
    ).toBe("primary");
  });

  it("legacy ?emirate= (singular) becomes a one-item emirates array", () => {
    expect(decodeFilters(new URLSearchParams("emirate=Dubai")).emirates).toEqual([
      "Dubai",
    ]);
  });

  it("legacy ?area= (singular, slugged) is title-cased into a one-item areas array", () => {
    expect(
      decodeFilters(new URLSearchParams("area=palm-jumeirah")).areas,
    ).toEqual(["Palm Jumeirah"]);
  });

  it("legacy ?status= (singular) becomes a one-item statuses array", () => {
    expect(
      decodeFilters(new URLSearchParams("status=On Sale")).statuses,
    ).toEqual(["On Sale"]);
  });

  it("propertyCategory decodes residential/commercial, falls back to null", () => {
    expect(
      decodeFilters(new URLSearchParams("category=residential")).propertyCategory,
    ).toBe("residential");
    expect(
      decodeFilters(new URLSearchParams("category=commercial")).propertyCategory,
    ).toBe("commercial");
    expect(decodeFilters(new URLSearchParams("")).propertyCategory).toBeNull();
  });
});

describe("encodeFilters ↔ decodeFilters round-trip", () => {
  it("is idempotent for a fully-populated state", () => {
    const populated = {
      ...defaultShortcutFilters,
      searchQuery: "skyline",
      priceMin: "1000000",
      priceMax: "5000000",
      sizeMin: "900",
      sizeMax: "2400",
      bedrooms: ["2", "3"],
      emirates: ["Dubai"],
      areas: ["Downtown", "Marina"],
      developers: ["emaar", "damac"],
      propertyTypes: ["apartments", "penthouse"],
      statuses: ["On Sale"],
      constructionStatuses: ["Completed", "Under Construction"],
      sortBy: "price_asc" as const,
      hideSoldOut: true,
      views: ["Sea"],
      propertyCategory: "residential" as const,
    };
    const once = decodeFilters(encodeFilters(populated));
    const twice = decodeFilters(encodeFilters(once));
    // Decoded state matches the encoded subset (defaults fill the rest).
    expect(once).toEqual({ ...defaultShortcutFilters, ...populated });
    // And re-encoding produces the same query string (stable order/shape).
    expect(encodeFilters(once).toString()).toBe(encodeFilters(twice).toString());
  });
});
