/**
 * PASS 142 companion — Section Heading `label` Class Lint
 *
 * Enforces the global title contract: every section heading (<h2>) in
 * `src/**` must include the `label` utility class so it inherits the
 * standardized #1A1A1A ink-black styling from the design system.
 *
 * A heading is exempt only when it opts out explicitly via one of:
 *   - `data-no-label-lint` attribute
 *   - lives inside a file listed in `EXEMPT_FILES` below
 *   - is a dynamically-composed heading (e.g. `<Tag>` where Tag is a var)
 *
 * When this test fails, either add `label` to the className, wrap the
 * title in <SectionTitle />, or add `data-no-label-lint` with a code
 * comment explaining why.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');

// Files that legitimately render <h2> in a non-section context
// (dropdown captions, dialog titles, modal chrome, etc.).
const EXEMPT_FILES = new Set<string>([
  'src/components/ui/dialog.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/alert-dialog.tsx',
  'src/components/ui/drawer.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/SectionTitle.tsx',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === 'node_modules' || name === '__generated__') continue;
      walk(p, out);
    } else if (name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

// Match a literal <h2 ...> opening tag, capturing its attribute block.
// Dynamic <Tag>…</Tag> / <Heading> / etc. are intentionally out of scope.
const H2_OPEN = /<h2\b([^>]*)>/g;

// Ratcheting baseline — the codebase currently has this many literal
// <h2> tags missing the `label` class. New violations MUST NOT push
// this number up. When you clean offenders up, lower this baseline in
// the same commit to lock the improvement in.
const OFFENSE_BASELINE = 643;

interface Offense {
  file: string;
  line: number;
  snippet: string;
}

describe('Section heading `label` class lint (PASS 142)', () => {
  it('literal <h2> count without `label` never exceeds baseline', () => {
    const offenses: Offense[] = [];
    const files = walk(ROOT);

    for (const abs of files) {
      const rel = relative(process.cwd(), abs).replace(/\\/g, '/');
      if (EXEMPT_FILES.has(rel)) continue;

      const src = readFileSync(abs, 'utf8');
      if (!src.includes('<h2')) continue;

      const lines = src.split('\n');
      let m: RegExpExecArray | null;
      H2_OPEN.lastIndex = 0;
      while ((m = H2_OPEN.exec(src)) !== null) {
        const attrs = m[1] ?? '';
        if (/data-no-label-lint/.test(attrs)) continue;
        if (/\blabel\b/.test(attrs)) continue;

        const line = src.slice(0, m.index).split('\n').length;
        offenses.push({
          file: rel,
          line,
          snippet: (lines[line - 1] ?? '').trim().slice(0, 160),
        });
      }
    }

    if (offenses.length > OFFENSE_BASELINE) {
      const extras = offenses.length - OFFENSE_BASELINE;
      const report = offenses
        .slice(0, 40)
        .map((o) => `  ${o.file}:${o.line}\n    ${o.snippet}`)
        .join('\n');
      // eslint-disable-next-line no-console
      console.error(
        `\n[section-heading-label-class] +${extras} new <h2> without "label" ` +
          `(total ${offenses.length}, baseline ${OFFENSE_BASELINE}).\n` +
          `First offenders:\n${report}\n\n` +
          `Fix: add the "label" class, wrap in <SectionTitle />, or add ` +
          `data-no-label-lint with a justification.\n`,
      );
    } else if (offenses.length < OFFENSE_BASELINE) {
      // eslint-disable-next-line no-console
      console.info(
        `[section-heading-label-class] baseline can be lowered: ` +
          `${offenses.length} offenders (baseline ${OFFENSE_BASELINE}). ` +
          `Update OFFENSE_BASELINE to lock the improvement.`,
      );
    }

    expect(
      offenses.length,
      `Section headings without "label" grew past baseline (${OFFENSE_BASELINE}). ` +
        `See console output for offenders.`,
    ).toBeLessThanOrEqual(OFFENSE_BASELINE);
  });
});
