import { describe, expect, it } from "vitest";
import {
  getVerifiedDeveloperFlagship,
  isUsableDeveloperCover,
} from "@/utils/developerFlagshipMedia";

describe("developer flagship media guard", () => {
  it("locks Emaar to a verified master-community cover", () => {
    expect(getVerifiedDeveloperFlagship("Emaar Properties", "emaar-properties"))
      .toContain("emaar-dubai-creek-harbour-master-community.jpg");
  });

  it("locks Nakheel to Palm Jebel Ali master-community media", () => {
    expect(getVerifiedDeveloperFlagship("Nakheel", "nakheel"))
      .toContain("nakheel-palm-jebel-ali-master-community.jpg");
  });

  it.each([
    "https://example.com/nakheel_app_banner_2416x947.jpg",
    "https://example.com/iphone-download.jpg",
    "https://example.com/company-logo.png",
    "https://example.com/team-celebration.jpg",
    "https://example.com/meeting-room.jpg",
  ])("rejects non-development cover media: %s", (url) => {
    expect(isUsableDeveloperCover(url)).toBe(false);
  });

  it("accepts a real master-community image", () => {
    expect(isUsableDeveloperCover("https://example.com/palm-jebel-ali-master-community.jpg"))
      .toBe(true);
  });
});