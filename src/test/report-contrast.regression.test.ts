/**
 * Lightweight visual-regression guard for the AI Home Finder report
 * (Live Preview + exported PDF — both render from the same ReportEngine).
 *
 * This test does NOT spin up a browser. Instead it:
 *
 *  1. Locks the report design tokens (page, surface, ink, gold, emerald) so a
 *     silent palette change immediately fails CI.
 *  2. Asserts WCAG AA contrast (>= 4.5:1) for the two contracts the report
 *     relies on everywhere:
 *        - white text on the emerald gradient
 *        - ink (#1A1A1A) text on champagne (page / surface / raised)
 *  3. Statically scans ReportEngine.tsx for the contrast contract on every
 *     emerald-painted block:
 *        - any inline style with `T.emeraldGradient` or `T.emeraldDeep`
 *          MUST also set `color: WHITE` in the same style object.
 *  4. Ensures the offscreen PDF host in renderReportToPdf paints onto the
 *     champagne page background (#FDFBF7) so light text never lands on white.
 *
 * Keep this file fast — no DOM, no Playwright, no Vite transform.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPORT_TOKENS } from "../components/ai-home-finder/report/tokens";

// ---------- helpers ----------

const HEX = (h: string) => {
  const v = h.replace("#", "");
  const n = parseInt(
    v.length === 3 ? v.split("").map((c) => c + c).join("") : v,
    16,
  );
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const relLum = (hex: string) => {
  const { r, g, b } = HEX(hex);
  const conv = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * conv(r) + 0.7152 * conv(g) + 0.0722 * conv(b);
};

const contrast = (a: string, b: string) => {
  const L1 = relLum(a);
  const L2 = relLum(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
};

const read = (p: string) =>
  readFileSync(resolve(__dirname, "..", p), "utf8");

// ---------- 1. Token lock ----------

describe("report tokens (locked palette)", () => {
  it("keeps the champagne + emerald + gold contract", () => {
    // If any of these change, audit the report visually before updating.
    expect(REPORT_TOKENS.page).toBe("#FDFBF7");
    expect(REPORT_TOKENS.surface).toBe("#F7F2EA");
    expect(REPORT_TOKENS.raised).toBe("#EFE6D6");
    expect(REPORT_TOKENS.ink).toBe("#1A1A1A");
    expect(REPORT_TOKENS.gold).toBe("#B89555");
    expect(REPORT_TOKENS.emerald).toBe("#064E3B");
    expect(REPORT_TOKENS.emeraldDeep).toBe("#042c1c");
    expect(REPORT_TOKENS.emeraldGradient).toMatch(/064E3B/);
    expect(REPORT_TOKENS.emeraldGradient).toMatch(/042c1c/);
  });
});

// ---------- 2. WCAG contrast lock ----------

describe("report contrast (WCAG AA)", () => {
  it("white on emerald gradient end-stops passes AA", () => {
    expect(contrast("#FFFFFF", REPORT_TOKENS.emerald)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#FFFFFF", REPORT_TOKENS.emeraldDeep)).toBeGreaterThanOrEqual(4.5);
  });

  it("ink on champagne surfaces passes AA", () => {
    expect(contrast(REPORT_TOKENS.ink, REPORT_TOKENS.page)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(REPORT_TOKENS.ink, REPORT_TOKENS.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(REPORT_TOKENS.ink, REPORT_TOKENS.raised)).toBeGreaterThanOrEqual(4.5);
  });

  it("ink (not white) is enforced on champagne — white on champagne is a fail", () => {
    expect(contrast("#FFFFFF", REPORT_TOKENS.page)).toBeLessThan(2);
    expect(contrast("#FFFFFF", REPORT_TOKENS.surface)).toBeLessThan(2);
  });
});

// ---------- 3. Static scan of ReportEngine ----------

/**
 * Extracts every `style={{ ... }}` object literal from a TSX source so we can
 * check inline color/background pairs without needing a full parser.
 */
function extractInlineStyleBlocks(src: string): string[] {
  const out: string[] = [];
  const needle = "style={{";
  let i = 0;
  while (i < src.length) {
    const start = src.indexOf(needle, i);
    if (start < 0) break;
    let depth = 0;
    let j = start + needle.length - 1; // points at first `{` after `style=`
    // walk braces, ignoring those inside strings
    let inStr: '"' | "'" | "`" | null = null;
    for (; j < src.length; j++) {
      const c = src[j];
      const prev = src[j - 1];
      if (inStr) {
        if (c === inStr && prev !== "\\") inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (j < src.length) out.push(src.slice(start + needle.length - 1, j + 1));
    i = j + 1;
  }
  return out;
}

describe("ReportEngine inline-style contrast contract", () => {
  const src = read("components/ai-home-finder/report/ReportEngine.tsx");
  const blocks = extractInlineStyleBlocks(src);

  it("scanner finds a meaningful number of inline style blocks", () => {
    // sanity — if this drops to ~0 the extractor is broken, not the report
    expect(blocks.length).toBeGreaterThan(40);
  });

  it("every emerald-painted block also sets WHITE foreground", () => {
    const offenders: string[] = [];
    for (const block of blocks) {
      // Only treat blocks that actually paint an emerald BACKGROUND as
      // contrast-critical. `T.emeraldGradient` / `T.emeraldDeep` are exclusively
      // backgrounds; bare `T.emerald` is also used as a foreground accent, so we
      // only flag it when it appears in a background property.
      const paintsEmerald =
        block.includes("T.emeraldGradient") ||
        block.includes("T.emeraldDeep") ||
        /background(?:Color|Image)?:\s*T\.emerald\b(?!Hair)/.test(block);
      if (!paintsEmerald) continue;
      const setsWhiteFg =
        /color:\s*WHITE/.test(block) || /color:\s*"#FFFFFF"/i.test(block);
      if (!setsWhiteFg) {
        offenders.push(block.slice(0, 220).replace(/\s+/g, " "));
      }
    }
    expect(
      offenders,
      `Emerald block(s) missing \`color: WHITE\` — would render dark text on emerald:\n${offenders.join("\n---\n")}`,
    ).toEqual([]);
  });

  it("no inline block paints WHITE text on a champagne surface", () => {
    const offenders: string[] = [];
    for (const block of blocks) {
      const paintsChampagne =
        /background[A-Za-z]*:\s*T\.(page|surface|raised)\b/.test(block) ||
        block.includes("background: WHITE") ||
        block.includes('background: "#FFFFFF"');
      if (!paintsChampagne) continue;
      if (/color:\s*WHITE/.test(block)) {
        offenders.push(block.slice(0, 220).replace(/\s+/g, " "));
      }
    }
    expect(
      offenders,
      `Champagne block(s) using WHITE text — would render invisible on cream:\n${offenders.join("\n---\n")}`,
    ).toEqual([]);
  });
});

// ---------- 4. PDF host paints onto champagne ----------

describe("renderReportToPdf host", () => {
  const src = read("utils/renderReportToPdf.ts");
  it("html2canvas captures on the champagne page color, never pure white", () => {
    expect(src).toMatch(/backgroundColor:\s*["']#FDFBF7["']/);
  });
  it("renders the same ReportEngine the preview uses (no parallel layout)", () => {
    expect(src).toMatch(/ReportEngine/);
    expect(src).toMatch(/mode:\s*["']pdf["']/);
  });
});
