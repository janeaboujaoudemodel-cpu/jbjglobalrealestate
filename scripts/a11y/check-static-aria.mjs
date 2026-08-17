#!/usr/bin/env node
/**
 * Static a11y scan — sub-second, runs in lint-staged pre-commit.
 *
 * Catches deterministic mistakes that cause icon-only controls and form
 * inputs to be unreadable to screen readers, without needing a running app:
 *
 *   1. Icon-only <button> / <a> with no aria-label, aria-labelledby, title,
 *      or visible text child.
 *   2. <img> tags missing an alt attribute (alt="" is fine — explicit
 *      decorative).
 *   3. Custom interactive elements (<div onClick>, <span onClick>) without
 *      role + tabIndex + onKeyDown (keyboard-inaccessible click handlers).
 *
 * Mirrors the architecture of scripts/contrast/check-low-opacity-text.mjs:
 * regex-based scan, baseline allowlist for pre-existing hits, exit 1 on
 * any new violation. Refresh the baseline with --print-baseline.
 *
 * lint-staged invokes this with the staged .tsx/.jsx file paths as CLI
 * args — only those are scanned. Run with no file args (npm run
 * check:a11y:static, CI, --print-baseline) to scan the whole src/ tree.
 *
 * NOTE: This is a heuristic scan, not a full TS/JSX AST parse. It errs on
 * the side of false positives, which the allowlist mops up. Anything that
 * needs full type information should go in the rendered axe sweep instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const SRC = path.join(root, 'src');
const allowlistPath = path.join(__dirname, 'allowlist.json');
const PRINT_BASELINE = process.argv.includes('--print-baseline');

const exts = new Set(['.tsx', '.jsx']);

/**
 * File arguments, as lint-staged appends them.
 *
 * Without this the pre-commit hook scanned all of `src` on every commit, so a
 * one-line change to one component was rejected for hundreds of pre-existing
 * violations in files the author never touched — an unskippable hook that had
 * to be bypassed to commit anything.
 */
const TARGETS = process.argv
  .slice(2)
  .filter((a) => !a.startsWith('-'))
  .map((a) => path.resolve(root, a))
  .filter((p) => exts.has(path.extname(p)) && fs.existsSync(p));
const SCOPED = TARGETS.length > 0;

/**
 * Baseline of pre-existing hits, indexed two ways.
 *
 * Entries are `file:line:rule`, so they are invalidated by any edit that shifts
 * a line — adding an import at the top of a file re-reported every violation
 * below it as new. Exact keys are still matched first; what an exact match
 * can't cover falls back to a per-(file, rule) budget, which survives line
 * drift while still failing the moment a file gains *more* violations of a rule
 * than the baseline recorded.
 */
let BASELINE = new Set();
const BASELINE_BUDGET = new Map(); // `rel|rule` -> count
try {
  const al = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  BASELINE = new Set(al.staticAriaBaseline?.entries ?? []);
  for (const entry of BASELINE) {
    const idx = entry.lastIndexOf(':');
    const rule = entry.slice(idx + 1);
    const rel = entry.slice(0, entry.indexOf(':'));
    const k = `${rel}|${rule}`;
    BASELINE_BUDGET.set(k, (BASELINE_BUDGET.get(k) ?? 0) + 1);
  }
} catch {
  // allowlist optional during initial bootstrap
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

// PRINT_BASELINE always scans the full tree — it is a manual baseline
// snapshot, not a pre-commit run, and needs every file to be meaningful.
function filesToScan() {
  if (PRINT_BASELINE || !SCOPED) return walk(SRC);
  return TARGETS;
}

/* ----------------------------- detectors ---------------------------------- */

// Match a complete opening tag (single-line or multi-line) for a target name.
// We capture the attributes blob between the tag name and the `>` (or `/>`).
function matchOpenTags(source, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*?)(/?>)`, 'gs');
  const out = [];
  let m;
  while ((m = re.exec(source)) !== null) {
    out.push({ index: m.index, attrs: m[1], selfClosing: m[2] === '/>' });
  }
  return out;
}

// Replace comment CONTENT with spaces (newlines preserved) so tag-shaped
// text inside `//` and `/* */` comments — e.g. a prose description of what
// an <img> tag looks like — can't be mistaken for real JSX. Preserves
// string length/line numbers exactly, so every downstream index/line
// computation on the returned text still lines up with the original file.
// A quote-parity guard on `//` skips anything that's plausibly inside a
// string (e.g. a "https://" URL) rather than risk masking real code.
function maskComments(source) {
  let out = source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '));
  out = out
    .split('\n')
    .map((line) => {
      let searchFrom = 0;
      while (true) {
        const idx = line.indexOf('//', searchFrom);
        if (idx === -1) return line;
        const before = line.slice(0, idx);
        const quoteCount = (before.match(/["'`]/g) || []).length;
        if (quoteCount % 2 === 0) {
          return before + ' '.repeat(line.length - idx);
        }
        searchFrom = idx + 2;
      }
    })
    .join('\n');
  return out;
}

// Find body of an element opened at `openIndex` (matches first closing tag).
// Returns null for self-closing.
function elementBody(source, openIndex, tagName, selfClosing) {
  if (selfClosing) return '';
  const closeRe = new RegExp(`</${tagName}>`, 'g');
  closeRe.lastIndex = openIndex;
  const closeMatch = closeRe.exec(source);
  if (!closeMatch) return null;
  // Body = from after the `>` of the open tag to the `<` of the close tag.
  const openEnd = source.indexOf('>', openIndex);
  return source.slice(openEnd + 1, closeMatch.index);
}

function attrsHave(attrs, names) {
  return names.some((n) => new RegExp(`\\b${n}\\s*=`).test(attrs));
}

function bodyHasVisibleText(body) {
  if (!body) return false;
  // Strip JSX comments
  const stripped = body.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
  // Look for any text outside of JSX tags / expressions that is non-whitespace.
  // Heuristic: remove all <...> (icons, child components) and {...} (expressions).
  const noTags = stripped.replace(/<[^>]*>/g, '').replace(/\{[^{}]*\}/g, '');
  return /\S/.test(noTags);
}

function bodyHasOnlyIcon(body) {
  if (body == null) return false;
  // Strip whitespace and JSX comments.
  const t = body.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').trim();
  if (t === '') return false;
  // Common icon component names: lucide-react PascalCase icons + <svg>.
  // Heuristic: body is one or more JSX elements and contains zero readable text.
  if (bodyHasVisibleText(body)) return false;
  // Must contain at least one element-looking thing (so empty bodies don't trip).
  return /<[A-Z][A-Za-z0-9]*\b|<svg\b/.test(t);
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

/* ----------------------------- main scan ---------------------------------- */

const findings = [];

function record(file, line, rule, snippet) {
  const rel = path.relative(root, file);
  const key = `${rel}:${line}:${rule}`;
  findings.push({ key, rel, line, rule, snippet: snippet.slice(0, 120) });
}

for (const file of filesToScan()) {
  // Skip test files and the scanner's own dogfood targets.
  if (/\.(test|spec)\.(t|j)sx?$/.test(file)) continue;
  const source = maskComments(fs.readFileSync(file, 'utf8'));

  /* 1. Icon-only button / a */
  for (const tagName of ['button', 'Button', 'a', 'Link']) {
    for (const tag of matchOpenTags(source, tagName)) {
      // Skip if the opening tag itself carries an accessible-name attr.
      if (
        attrsHave(tag.attrs, [
          'aria-label',
          'aria-labelledby',
          'title',
          'aria-describedby',
        ])
      ) {
        continue;
      }
      const body = elementBody(source, tag.index, tagName, tag.selfClosing);
      if (body == null) continue;
      if (!bodyHasOnlyIcon(body)) continue;
      const line = lineNumberAt(source, tag.index);
      record(
        file,
        line,
        'button-name',
        source.slice(tag.index, tag.index + 100).replace(/\s+/g, ' '),
      );
    }
  }

  /* 2. <img> without alt — DOM-level only (Next/Image-style components vary). */
  for (const tag of matchOpenTags(source, 'img')) {
    if (attrsHave(tag.attrs, ['alt'])) continue;
    const line = lineNumberAt(source, tag.index);
    record(file, line, 'image-alt', source.slice(tag.index, tag.index + 100).replace(/\s+/g, ' '));
  }

  /* 3. Custom interactive: onClick on div/span without keyboard support. */
  for (const tagName of ['div', 'span']) {
    for (const tag of matchOpenTags(source, tagName)) {
      if (!/\bonClick\s*=/.test(tag.attrs)) continue;
      const hasKbd = /\bonKeyDown\s*=|\bonKeyUp\s*=|\bonKeyPress\s*=/.test(tag.attrs);
      const hasRole = /\brole\s*=/.test(tag.attrs);
      const hasTabIdx = /\btabIndex\s*=/.test(tag.attrs);
      if (hasKbd && hasRole && hasTabIdx) continue;
      const line = lineNumberAt(source, tag.index);
      record(
        file,
        line,
        'click-events-have-key-events',
        source.slice(tag.index, tag.index + 120).replace(/\s+/g, ' '),
      );
    }
  }
}

/* ----------------------------- output ------------------------------------- */

if (PRINT_BASELINE) {
  const out = {
    description:
      'Pre-existing static a11y hits captured at suite introduction. New regressions are blocked; historical hits are tolerated until cleanup.',
    entries: findings.map((f) => f.key).sort(),
  };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  process.exit(0);
}

/**
 * Split findings into pre-existing and new.
 *
 * Exact `file:line:rule` matches are consumed first, so an untouched violation
 * always matches itself. Whatever is left draws on the remaining per-(file,
 * rule) budget, which is what absorbs line drift. A file that gains a violation
 * beyond its recorded count still fails — the budget is spent, not ignored.
 */
function classify(all) {
  const budget = new Map(BASELINE_BUDGET);
  const fresh = [];
  const exact = [];
  for (const f of all) {
    if (BASELINE.has(f.key)) {
      exact.push(f);
      const k = `${f.rel}|${f.rule}`;
      budget.set(k, (budget.get(k) ?? 1) - 1);
    }
  }
  for (const f of all) {
    if (BASELINE.has(f.key)) continue;
    const k = `${f.rel}|${f.rule}`;
    const left = budget.get(k) ?? 0;
    if (left > 0) {
      budget.set(k, left - 1);
      continue; // same file, same rule, moved line — not a new violation
    }
    fresh.push(f);
  }
  return { newFindings: fresh, driftTolerated: all.length - exact.length - fresh.length };
}

const { newFindings, driftTolerated } = classify(findings);

const reportDir = path.join(root, 'artifacts', 'a11y');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, 'static-aria.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      scope: SCOPED ? TARGETS.map((p) => path.relative(root, p)) : 'src/**',
      total: findings.length,
      baseline: findings.length - newFindings.length,
      driftTolerated,
      new: newFindings.length,
      findings,
    },
    null,
    2,
  ),
);
let md = `## ♿ Static A11y Scan\n\nTotal: ${findings.length} · Baseline: ${findings.length - newFindings.length} · New: ${newFindings.length}\n\n`;
if (newFindings.length) {
  md += `### New violations\n\n| File | Line | Rule | Snippet |\n|---|---|---|---|\n`;
  for (const f of newFindings) {
    md += `| \`${f.rel}\` | ${f.line} | ${f.rule} | \`${f.snippet.replace(/\|/g, '\\|')}\` |\n`;
  }
}
fs.writeFileSync(path.join(reportDir, 'static-aria.md'), md);

if (newFindings.length) {
  console.error(`✗ ${newFindings.length} new static a11y violation(s):\n`);
  for (const f of newFindings) {
    console.error(`  ${f.rel}:${f.line}  [${f.rule}]`);
  }
  console.error(
    `\nRun \`node scripts/a11y/check-static-aria.mjs --print-baseline > scripts/a11y/baseline.tmp.json\` to refresh the baseline (only after fixing or explicitly waiving).`,
  );
  process.exit(1);
}

console.log(
  `✓ No new static a11y violations` +
    ` (${SCOPED ? `${TARGETS.length} file(s) scanned` : 'src/** scanned'};` +
    ` ${findings.length} pre-existing tolerated, ${driftTolerated} of them matched past a line shift).`,
);
