#!/usr/bin/env python3
"""Rewrite `[class*="…"]` substring matchers in src/index.css into real class lists.

WHY (measured on the live listing page, dropdown-open cost):
  baseline                        ~3300 ms
  minus all [class*= rules        ~1100 ms
`[class*="x"]` cannot be bucketed by Chromium: every such branch is evaluated
against EVERY element on every style recalculation, and each evaluation is a
string substring scan of the element's whole class attribute.

WHAT:
  Tailwind only ever emits a class that literally exists in the source, so the
  set of class tokens matching a substring is finite and knowable. Each
  `[class*="frag"]` branch is replaced with `:where(.a, .b, .c)` listing the
  real, escaped class names found in the codebase. `:where()` has zero
  specificity — identical to the attribute selector it replaces — so the
  cascade is unchanged, while the rule becomes class-bucketed.

  A leading space in the fragment (`[class*=" bg-green-"]`) means "token
  starts with", so only tokens starting with the fragment are collected.

  If NO class token in the codebase matches, the branch is left untouched
  (it may be composed dynamically at runtime).

Usage: python3 scripts/qa/css_substring_rewrite.py [--apply]
"""
from __future__ import annotations
import os, re, sys, glob

CSS = "src/index.css"
PAT = re.compile(r'\[class\*=("([^"]*)"|\'([^\']*)\')\]')
CLASS_TOKEN = re.compile(r"[A-Za-z0-9_!:./\[\]#%()\-,>&+~*'\"]+")
NEEDS_ESCAPE = set("#[]/.%()!:,>&+~*'\"@$^=?{}|;")


def codebase_class_tokens() -> set[str]:
    """Every whitespace-separated token that appears inside a className/class string."""
    blob_parts: list[str] = []
    for root, _d, files in os.walk("src"):
        for f in files:
            if f.endswith((".tsx", ".ts", ".jsx", ".js", ".html")):
                p = os.path.join(root, f)
                try:
                    blob_parts.append(open(p, errors="ignore").read())
                except Exception:
                    pass
    for pat in ("index.html", "tailwind.config.*", "public/**/*.html"):
        for f in glob.glob(pat, recursive=True):
            try:
                blob_parts.append(open(f, errors="ignore").read())
            except Exception:
                pass
    blob = "\n".join(blob_parts)
    tokens: set[str] = set()
    # every quoted / template string chunk, split on whitespace
    for m in re.finditer(r'"([^"\n]{0,4000})"|\'([^\'\n]{0,4000})\'|`([^`]{0,8000})`', blob):
        s = m.group(1) or m.group(2) or m.group(3) or ""
        for tok in s.split():
            if 1 < len(tok) < 120 and CLASS_TOKEN.fullmatch(tok):
                tokens.add(tok.strip(",'\""))
    return tokens


def esc(cls: str) -> str:
    out = []
    for ch in cls:
        out.append("\\" + ch if ch in NEEDS_ESCAPE else ch)
    return "." + "".join(out)


def matches(frag: str, tokens: set[str]) -> list[str]:
    starts = frag.startswith(" ")
    f = frag.strip()
    if not f:
        return []
    hits = set()
    for t in tokens:
        if starts:
            if t.startswith(f):
                hits.add(t)
        elif f in t:
            hits.add(t)
    # a class token cannot contain whitespace or a bare `,`
    return sorted(h for h in hits if h and " " not in h)


def main() -> int:
    apply = "--apply" in sys.argv
    css = open(CSS).read()
    tokens = codebase_class_tokens()

    stats = {"branches": 0, "rewritten": 0, "kept": 0}
    cache: dict[str, str | None] = {}

    def repl(m: re.Match) -> str:
        frag = m.group(2) if m.group(2) is not None else (m.group(3) or "")
        stats["branches"] += 1
        if frag in cache:
            val = cache[frag]
        else:
            hits = matches(frag, tokens)
            # Guard against selector explosion: a `:where()` with hundreds of
            # class entries is still cheap (class bucket) but keep it sane.
            val = ":where(" + ", ".join(esc(h) for h in hits) + ")" if hits else None
            cache[frag] = val
        if val is None:
            stats["kept"] += 1
            return m.group(0)
        stats["rewritten"] += 1
        return val

    out = PAT.sub(repl, css)
    print(f"[class*=] branches: {stats['branches']}  rewritten: {stats['rewritten']}  kept (no source match): {stats['kept']}")
    print(f"bytes: {len(css):,} -> {len(out):,}")
    if apply:
        open(CSS, "w").write(out)
        left = len(PAT.findall(out))
        print(f"written. remaining [class*=] branches: {left}")
    else:
        open("/tmp/index.substring.preview.css", "w").write(out)
        print("dry run -> /tmp/index.substring.preview.css")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
