#!/usr/bin/env python3
"""Prune unmatchable entries inside :is()/:where()/:not(a,b) argument lists.

Why this is safe:
  * :where(...) contributes ZERO specificity, so removing any argument cannot
    change the rule's specificity.
  * :is(...) / :not(a,b) take the MAX specificity of their arguments; an entry
    is only removed when the max weight of the remaining list is identical.
  * An entry is only considered removable when it references a JBJ-owned class
    (.jj-*/.mi-*) or a JBJ-owned data-attribute that appears NOWHERE in the
    codebase -- it can never match an element.

Third-party runtime attributes (Radix, Vaul, Sonner, Embla, Lucide, ...) and
Tailwind-utility guards are always preserved.
"""
import glob, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from css_consolidate import parse, render, lead_and_sel

FUNC_RE = re.compile(r'(:is|:where|:not)\(')
CLASS_RE = re.compile(r'\.(-?[_a-zA-Z][\w-]*)')
ATTR_RE = re.compile(r'\[([\w-]+)')
OWNED_CLASS = ('jj-', 'mi-')
LIB_ATTR = ('data-radix', 'data-state', 'data-side', 'data-slot', 'data-orientation',
            'data-disabled', 'data-highlighted', 'data-selected', 'data-swipe',
            'data-sonner', 'data-vaul', 'data-embla', 'data-lucide', 'data-theme',
            'data-collection', 'data-placeholder', 'data-value', 'data-align',
            'data-motion', 'data-panel', 'data-resize', 'data-chart')


def blob():
    parts = []
    for root, _d, files in os.walk('src'):
        for f in files:
            if f.endswith(('.tsx', '.ts', '.jsx', '.js', '.html', '.css', '.json', '.md')) and f != 'index.css':
                parts.append(open(os.path.join(root, f), errors='ignore').read())
    for pat in ('index.html', 'public/**/*.*', 'supabase/functions/**/*.ts', 'tailwind.config.*', 'scripts/**/*.*'):
        for f in glob.glob(pat, recursive=True):
            try: parts.append(open(f, errors='ignore').read())
            except Exception: pass
    return '\n'.join(parts)


def split_top(args: str):
    out, depth, buf = [], 0, ''
    for ch in args:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == ',' and depth == 0:
            out.append(buf); buf = ''
        else:
            buf += ch
    out.append(buf)
    return out


def weight(sel: str):
    """(#id, .class/attr/pseudo-class, type) specificity of a simple selector."""
    ids = len(re.findall(r'#[\w-]+', sel))
    cls = len(CLASS_RE.findall(sel)) + len(ATTR_RE.findall(sel)) + \
        len(re.findall(r'(?<!:):(?!:)(?:hover|focus|focus-visible|active|checked|disabled|first-child|last-child|nth-child|not|is|where|has)', sel))
    typ = len(re.findall(r'(?:^|[\s>+~(,])([a-zA-Z][\w-]*)', sel))
    return (ids, cls, typ)


def main(apply=False):
    B = blob()
    cache = {}

    def alive(entry: str) -> bool:
        """False only when provably unmatchable."""
        toks = [t for t in CLASS_RE.findall(entry) if t.startswith(OWNED_CLASS)]
        attrs = [a for a in ATTR_RE.findall(entry)
                 if a.startswith('data-') and not a.startswith(LIB_ATTR)]
        for t in toks:
            if t not in cache:
                cache[t] = t in B or any(
                    len('-'.join(t.split('-')[:i]) + '-') >= 4 and ('-'.join(t.split('-')[:i]) + '-') in B
                    for i in range(len(t.split('-')) - 1, 0, -1))
            if not cache[t]:
                return False
        for a in attrs:
            if a not in cache:
                cache[a] = a in B
            if not cache[a]:
                return False
        return True

    stats = {'entries': 0, 'lists': 0, 'blocked_specificity': 0}

    def prune_sel(sel: str) -> str:
        out, i = '', 0
        while i < len(sel):
            m = FUNC_RE.search(sel, i)
            if not m:
                out += sel[i:]
                break
            out += sel[i:m.start()]
            fname = m.group(1)
            depth, k = 0, m.end() - 1
            while k < len(sel):
                if sel[k] == '(':
                    depth += 1
                elif sel[k] == ')':
                    depth -= 1
                    if depth == 0:
                        break
                k += 1
            args = sel[m.end():k]
            entries = split_top(args)
            if len(entries) > 1:
                kept = [e for e in entries if alive(e)]
                if kept and len(kept) != len(entries):
                    if fname == ':where' or max(map(weight, kept)) == max(map(weight, entries)):
                        stats['entries'] += len(entries) - len(kept)
                        stats['lists'] += 1
                        args = ','.join(kept)
                    else:
                        stats['blocked_specificity'] += 1
            out += fname + '(' + prune_sel(args) + ')'
            i = k + 1
        return out

    src = open('src/index.css').read()
    items = parse(src)
    for idx, it in enumerate(items):
        if it[0] != 'rule':
            continue
        lead, sel = lead_and_sel(it[1])
        new = prune_sel(sel)
        if new != sel:
            items[idx] = ('rule', lead + new, it[2])
    new_src = render(items)
    print(f"list entries pruned      : {stats['entries']}")
    print(f"lists touched            : {stats['lists']}")
    print(f"skipped (would change specificity): {stats['blocked_specificity']}")
    print(f"bytes                    : {len(src):,} -> {len(new_src):,}  (-{len(src)-len(new_src):,})")
    if apply:
        open('src/index.css', 'w').write(new_src)
        print("APPLIED")


if __name__ == '__main__':
    main('--apply' in sys.argv)
