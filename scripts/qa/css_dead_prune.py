#!/usr/bin/env python3
"""Prune provably unmatchable JBJ-owned selectors from src/index.css.

A comma-part is removed only when it references a JBJ-owned class
(.jj-* / .mi-*) that appears NOWHERE in the codebase (no literal, no
hyphen-prefix that could be built dynamically). Such a part can never match an
element, so removing it cannot change rendering.

Tailwind-utility guards (.bg-*, .text-*, ...) are intentionally KEPT even when
currently unused: they are defensive contrast locks by design.
"""
import glob, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from css_consolidate import parse, render, lead_and_sel, NOT_RE

OWNED = ('jj-', 'mi-')
CLASS_RE = re.compile(r'\.(-?[_a-zA-Z][\w-]*)')

def codebase_blob():
    parts = []
    for root, _dirs, files in os.walk('src'):
        for f in files:
            if f.endswith(('.tsx','.ts','.jsx','.js','.html','.css','.json','.md')) and f != 'index.css':
                parts.append(open(os.path.join(root, f), errors='ignore').read())
    for pat in ('index.html','public/**/*.*','supabase/functions/**/*.ts','tailwind.config.*','scripts/**/*.*'):
        for f in glob.glob(pat, recursive=True):
            try: parts.append(open(f, errors='ignore').read())
            except Exception: pass
    return '\n'.join(parts)

def strip_nots(s):
    prev = None
    while prev != s:
        prev, s = s, NOT_RE.sub('', s)
    return s

def main(apply=False):
    blob = codebase_blob()
    def used(c):
        if c in blob: return True
        segs = c.split('-')
        for i in range(len(segs) - 1, 0, -1):
            p = '-'.join(segs[:i]) + '-'
            if len(p) >= 4 and p in blob: return True
        return False
    cache, src = {}, open('src/index.css').read()
    items = parse(src)
    out, killed_parts, killed_rules = [], 0, 0
    for it in items:
        if it[0] != 'rule':
            out.append(it); continue
        lead, sel = lead_and_sel(it[1])
        parts = split_top(sel)
        keep = []
        for p in parts:
            dead = False
            for t in CLASS_RE.findall(strip_nots(p)):
                if not t.startswith(OWNED): continue
                if t not in cache: cache[t] = used(t)
                if not cache[t]: dead = True; break
            if dead: killed_parts += 1
            else: keep.append(p)
        if not [k for k in keep if k.strip()]:
            killed_rules += 1
            if lead.strip(): out.append(('raw', lead))
            continue
        if len(keep) != len(parts):
            out.append(('rule', lead + ','.join(keep), it[2]))
        else:
            out.append(it)
    new = render(out)
    print(f"dead selector parts removed : {killed_parts}")
    print(f"fully dead rules removed    : {killed_rules}")
    print(f"bytes                       : {len(src):,} -> {len(new):,}  (-{len(src)-len(new):,})")
    if apply:
        open('src/index.css', 'w').write(new)
        print("APPLIED")

if __name__ == '__main__':
    main('--apply' in sys.argv)
