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

let BASELINE = new Set();
try {
  const al = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  BASELINE = new Set(al.staticAriaBaseline?.entries ?? []);
} catch {
  // allowlist optional during initial bootstrap
}

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

for (const file of walk(SRC)) {
  // Skip test files and the scanner's own dogfood targets.
  if (/\.(test|spec)\.(t|j)sx?$/.test(file)) continue;
  const source = fs.readFileSync(file, 'utf8');

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

const newFindings = findings.filter((f) => !BASELINE.has(f.key));

const reportDir = path.join(root, 'artifacts', 'a11y');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, 'static-aria.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: findings.length,
      baseline: findings.length - newFindings.length,
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
  `✓ No new static a11y violations (${findings.length} baseline entries tolerated).`,
);
