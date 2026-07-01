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

interface Offense {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

describe('Section heading `label` class lint (PASS 142)', () => {
  it('every literal <h2> in src/** carries the `label` class', () => {
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
        // Skip explicit opt-outs.
        if (/data-no-label-lint/.test(attrs)) continue;

        // Consider both className="…label…" and className={cn('label', …)}.
        const hasLabel = /\blabel\b/.test(attrs);
        if (hasLabel) continue;

        const line = src.slice(0, m.index).split('\n').length;
        offenses.push({
          file: rel,
          line,
          snippet: (lines[line - 1] ?? '').trim().slice(0, 160),
          reason: 'missing `label` class (required for #1A1A1A ink styling)',
        });
      }
    }

    if (offenses.length > 0) {
      const report = offenses
        .map((o) => `  ${o.file}:${o.line} — ${o.reason}\n    ${o.snippet}`)
        .join('\n');
      // eslint-disable-next-line no-console
      console.error(
        `\n[section-heading-label-class] ${offenses.length} offending <h2>:\n${report}\n\n` +
          `Fix by adding the "label" class, wrapping in <SectionTitle />, ` +
          `or adding data-no-label-lint with a justification comment.\n`,
      );
    }

    expect(
      offenses,
      `Section headings must use the "label" class so they render #1A1A1A. ` +
        `See console output above for the full list.`,
    ).toEqual([]);
  });
});
