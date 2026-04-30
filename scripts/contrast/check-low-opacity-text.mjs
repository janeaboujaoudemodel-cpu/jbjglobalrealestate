#!/usr/bin/env node
/**
 * Static "near-transparent text" rule — fails when text utilities use an
 * opacity below the configured floor, which makes copy effectively invisible
 * regardless of the underlay (a common side-effect of global text-color
 * overrides like `text-foreground/10`).
 *
 * Catches:
 *   - text-white/NN, text-black/NN, text-foreground/NN, text-muted-foreground/NN,
 *     text-primary/NN, text-card-foreground/NN, text-zinc-XXX/NN, etc.
 *   - opacity-[0.NN] / opacity-XX applied to elements that also carry a text-
 *     class (heuristic: same className segment).
 *
 * MIN_TEXT_ALPHA — minimum readable opacity for body text. Decorative
 * watermarks / ambient labels can opt out with the `// contrast-ok` comment.
 *
 * Exit 1 on violations.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const SRC = path.join(root, 'src');
const allowlistPath = path.join(__dirname, 'allowlist.json');

// Anything strictly below this is treated as effectively invisible body text.
// 40 is the practical floor: text-white/40 on black is ~3.7:1, below AA but
// readable for accents. Below 40 the glyphs disappear into the background.
const MIN_TEXT_ALPHA = 40;

// Pre-existing hits captured the day this rule was introduced; new
// regressions are blocked but historical ones are tolerated until cleaned up.
let BASELINE = new Set();
try {
  const al = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  BASELINE = new Set(al.lowOpacityTextBaseline?.entries ?? []);
} catch {
  // allowlist optional
}

// Match: text-<color>/<NN>  → capture the slash number.
//   - color must look like a Tailwind color/token (letters, digits, hyphens)
//   - exclude state prefixes by requiring no `:` immediately before
const TEXT_ALPHA_RE = /(?<![:\w-])text-[a-z][a-z0-9-]*\/(\d{1,3})\b/g;

// opacity-[0.NN] or opacity-NN (bare numeric variant).
const OPACITY_BRACKET_RE = /\bopacity-\[0?\.(\d{1,2})\]/g;
const OPACITY_NUM_RE = /\bopacity-(\d{1,3})(?!\w)/g;

// We only flag opacity-* when applied near a text- utility in the same segment.
const HAS_TEXT_UTIL_RE = /\btext-[a-z][a-z0-9-]*\b/;

const exts = new Set(['.tsx', '.jsx']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

function check() {
  const files = walk(SRC);
  const violations = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('contrast-ok')) return;

      // Heuristic: lines that style an icon-shaped element are reported as
      // warnings, not hard failures. Icons use `text-*` to drive currentColor
      // but a faded icon is rarely the same regression as faded body copy.
      const isIconLine =
        /<svg\b/.test(line) ||
        // Self-closing JSX of a PascalCase component carrying icon-shaped
        // size utilities (w-N h-N or size-N) — covers Lucide-style icons.
        (/<[A-Z][A-Za-z0-9]*\b[^>]*\/>/.test(line) &&
          /\b(?:w-\d{1,2}|size-\d{1,2})\b/.test(line) &&
          /\b(?:h-\d{1,2}|size-\d{1,2})\b/.test(line));

      const segments = line.split(/['"`]|\?|,|\$\{|\}/);
      for (const seg of segments) {
        // Skip segments where the low alpha is part of a state-driven
        // reveal pattern — intentionally invisible at rest, becomes visible
        // via a paired *:opacity-100 / *:text-…/100 utility.
        const hasRevealPair =
          /(?:hover|focus|focus-visible|focus-within|active|disabled|peer-[a-z-]+|group-[a-z-]+|data-\[[^\]]+\]|aria-\w+|open|in|has-\[[^\]]+\]):(?:opacity-\d{2,3}|opacity-100|text-[a-z][a-z0-9-]*\/\d{2,3})/.test(
            seg,
          );
        // Also skip if the low value is itself prefixed with a state (e.g.
        // `disabled:opacity-30`, `hover:text-white/20`) — that's the
        // *target* state, not the resting one.
        const isStatePrefixed =
          /(?:hover|focus|focus-visible|focus-within|active|disabled|peer-[a-z-]+|group-[a-z-]+|data-\[[^\]]+\]|aria-\w+|open|in|has-\[[^\]]+\]):(?:opacity-(?:\[0?\.\d{1,2}\]|\d{1,3})|text-[a-z][a-z0-9-]*\/\d{1,3})/.test(
            seg,
          );

        // 1) text-foo/NN
        let m;
        TEXT_ALPHA_RE.lastIndex = 0;
        while ((m = TEXT_ALPHA_RE.exec(seg))) {
          const alpha = Number(m[1]);
          if (alpha < MIN_TEXT_ALPHA && !hasRevealPair && !isStatePrefixed) {
            violations.push({
              file: path.relative(root, file),
              line: idx + 1,
              kind: `text-*/${alpha}`,
              isIcon: isIconLine,
              snippet: line.trim().slice(0, 200),
            });
          }
        }

        // 2) opacity-[0.NN] / opacity-NN applied to a text element
        if (HAS_TEXT_UTIL_RE.test(seg) && !hasRevealPair && !isStatePrefixed) {
          OPACITY_BRACKET_RE.lastIndex = 0;
          while ((m = OPACITY_BRACKET_RE.exec(seg))) {
            const alphaPct = m[1].length === 1 ? Number(m[1]) * 10 : Number(m[1]);
            if (alphaPct < MIN_TEXT_ALPHA) {
              violations.push({
                file: path.relative(root, file),
                line: idx + 1,
                kind: `opacity-[0.${m[1]}]`,
                isIcon: isIconLine,
                snippet: line.trim().slice(0, 200),
              });
            }
          }
          OPACITY_NUM_RE.lastIndex = 0;
          while ((m = OPACITY_NUM_RE.exec(seg))) {
            const v = Number(m[1]);
            if (v < MIN_TEXT_ALPHA) {
              violations.push({
                file: path.relative(root, file),
                line: idx + 1,
                kind: `opacity-${v}`,
                isIcon: isIconLine,
                snippet: line.trim().slice(0, 200),
              });
            }
          }
        }
      }
    });
  }

  // Dedupe (same file:line:kind), then filter out baseline entries.
  const seen = new Set();
  const baselineHit = new Set();
  const unique = violations.filter((v) => {
    const k = `${v.file}:${v.line}:${v.kind}`;
    if (seen.has(k)) return false;
    seen.add(k);
    if (BASELINE.has(k)) {
      baselineHit.add(k);
      return false;
    }
    return true;
  });

  const textHits = unique.filter((v) => !v.isIcon);
  const iconHits = unique.filter((v) => v.isIcon);

  // Stale baseline entries — fixed in code but still listed.
  const staleBaseline = [...BASELINE].filter((k) => !baselineHit.has(k));
  if (staleBaseline.length > 0) {
    console.warn(`⚠ ${staleBaseline.length} stale baseline entr(y/ies) — remove from allowlist.json:`);
    for (const k of staleBaseline) console.warn(`  ${k}`);
    console.warn('');
  }

  if (textHits.length === 0 && iconHits.length === 0) {
    console.log(`✓ No near-transparent text below alpha ${MIN_TEXT_ALPHA} found.`);
    return;
  }

  if (iconHits.length > 0) {
    console.warn(`⚠ ${iconHits.length} faded-icon warning(s) (alpha < ${MIN_TEXT_ALPHA}) — non-blocking:`);
    for (const v of iconHits.slice(0, 20)) {
      console.warn(`  ${v.file}:${v.line}  [${v.kind}]`);
    }
    if (iconHits.length > 20) console.warn(`  …and ${iconHits.length - 20} more`);
    console.warn('');
  }

  if (textHits.length === 0) {
    console.log(`✓ No near-transparent body-text regressions found.`);
    return;
  }

  console.error(`✗ Found ${textHits.length} near-transparent text risk(s) (alpha < ${MIN_TEXT_ALPHA}):\n`);
  for (const v of textHits) {
    console.error(`  ${v.file}:${v.line}  [${v.kind}]`);
    console.error(`    ${v.snippet}`);
  }
  console.error(
    '\nFix: raise the alpha to /60 or higher, use text-muted-foreground for de-emphasis, or add // contrast-ok if the element is decorative (watermark / ambient label).',
  );
  process.exit(1);
}

check();
