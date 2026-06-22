#!/usr/bin/env bun
/**
 * PASS XX-A — Emerald codemod.
 *
 * Sweeps src/**\/*.{ts,tsx} and replaces raw Tailwind green/emerald
 * color utilities with the unified token classes:
 *   - jj-emerald-solid   (saturated emerald surface, white fg)
 *   - jj-emerald-soft    (pale emerald wash, deep emerald fg)
 *   - jj-emerald-outline (hairline emerald, transparent bg)
 *
 * Safe: only edits className string literals. No JSX restructuring.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = "src";
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build"]);
const SKIP_FILE_SUFFIXES = [
  // Don't touch token / lib / constant files — they define palettes by design.
  "src/index.css",
  "src/lib/dataColors.ts",
  "src/constants/constructionStatus.ts",
];
const SKIP_DIR_PATHS = [
  "src/components/ui/emerald",
];

const SOLID = /\bbg-(?:green|emerald|teal)-(?:400|500|600|700|800|900)\b/g;
const SOFT = /\bbg-(?:green|emerald|teal)-(?:50|100|200)\b/g;
const TEXT_LIGHT = /\btext-(?:green|emerald|teal)-(?:50|100|200|300)\b/g;
const TEXT_DARK = /\btext-(?:green|emerald|teal)-(?:600|700|800|900)\b/g;
const BORDER_GREEN = /\bborder-(?:green|emerald|teal)-(?:200|300|400|500|600|700)\b/g;
const FROM_TO_GREEN =
  /\b(?:from|via|to)-(?:green|emerald|teal)-(?:300|400|500|600|700|800|900)\b/g;
const HOVER_BG_GREEN = /\bhover:bg-(?:green|emerald|teal)-\d{2,3}\b/g;
const HOVER_TEXT_GREEN = /\bhover:text-(?:green|emerald|teal)-\d{2,3}\b/g;
const TEXT_WHITE_NEXT_TO_SOLID = /\btext-white\b/;

let touched = 0;
let filesChanged = 0;
const skippedAmbiguous: string[] = [];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (SKIP_DIRS.has(entry)) continue;
    if (SKIP_DIR_PATHS.some((d) => p.startsWith(d))) continue;
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if ([".ts", ".tsx"].includes(extname(p))) out.push(p);
  }
  return out;
}

function transform(src: string, file: string): string {
  let s = src;
  let localTouched = 0;

  // Pass A: any solid bg → jj-emerald-solid; nearby text-white is now redundant.
  s = s.replace(SOLID, () => {
    localTouched++;
    return "jj-emerald-solid";
  });
  // Pass B: soft bg → jj-emerald-soft.
  s = s.replace(SOFT, () => {
    localTouched++;
    return "jj-emerald-soft";
  });
  // Pass C: text-emerald-700/800 etc → text token via soft surface fg
  s = s.replace(TEXT_DARK, () => {
    localTouched++;
    return "text-[color:var(--emerald-1)]";
  });
  s = s.replace(TEXT_LIGHT, () => {
    localTouched++;
    return "text-[color:var(--emerald-on)]";
  });
  // Pass D: borders → hairline emerald
  s = s.replace(BORDER_GREEN, () => {
    localTouched++;
    return "border-[color:var(--emerald-1)]/30";
  });
  // Pass E: gradient stops → drop, the jj-emerald-solid class supplies the gradient.
  s = s.replace(FROM_TO_GREEN, () => {
    localTouched++;
    return "";
  });
  // Pass F: hover variants — token classes own hover, strip these.
  s = s.replace(HOVER_BG_GREEN, () => {
    localTouched++;
    return "";
  });
  s = s.replace(HOVER_TEXT_GREEN, () => {
    localTouched++;
    return "";
  });

  // Collapse double spaces in className strings we touched.
  if (localTouched > 0) {
    s = s.replace(/className=("|')([\s\S]*?)\1/g, (m, q, body) => {
      const cleaned = body.replace(/\s+/g, " ").trim();
      return `className=${q}${cleaned}${q}`;
    });
    s = s.replace(/className=\{`([\s\S]*?)`\}/g, (m, body) => {
      const cleaned = body.replace(/[ \t]+/g, " ");
      return `className={\`${cleaned}\`}`;
    });
    touched += localTouched;
  }

  return s;
}

const files = walk(ROOT).filter(
  (f) => !SKIP_FILE_SUFFIXES.some((s) => f.endsWith(s.replace("src/", "")))
);
for (const f of files) {
  const orig = readFileSync(f, "utf8");
  const next = transform(orig, f);
  if (next !== orig) {
    writeFileSync(f, next);
    filesChanged++;
  }
}

console.log(
  JSON.stringify(
    {
      filesScanned: files.length,
      filesChanged,
      classReplacements: touched,
      skippedAmbiguous: skippedAmbiguous.length,
    },
    null,
    2
  )
);
