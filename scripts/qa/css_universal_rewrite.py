#!/usr/bin/env python3
"""Rewrite universal RIGHTMOST compounds in src/index.css.

WHY (measured): Chromium buckets style rules by the rightmost compound
(id / class / attribute / tag). A rule whose rightmost compound is `*`
cannot be bucketed, so it lands in the "universal" bucket that is
evaluated against EVERY element in the document. With ~750 such rules and
~3k-9k elements per page that is millions of selector matches per style
recalculation — the dominant cost measured by scripts/qa/css_ablate.py.

WHAT: the guard rules exist to paint text/icon colour on all descendants of
a surface (`[data-surface="emerald"] *`). Replacing the trailing `*` with
`:where(<every element that can paint text or icons>)` keeps identical
visual output (specificity of `:where()` is 0, exactly like `*`) while
letting Chromium bucket the rule by tag name.

Usage: python3 scripts/qa/css_universal_rewrite.py [--apply]
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cssparse import parse, serialize, iter_style_rules, split_selector_list  # noqa: E402

CSS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "index.css")

# Every element that can render text, an icon, a border or a background.
TAGS = (
    "a,abbr,address,article,aside,b,blockquote,button,canvas,caption,circle,cite,code,dd,"
    "details,dfn,div,dl,dt,ellipse,em,fieldset,figcaption,figure,footer,form,g,h1,h2,h3,h4,"
    "h5,h6,header,hgroup,hr,i,iframe,img,input,ins,kbd,label,legend,li,line,main,mark,nav,"
    "ol,option,optgroup,output,p,path,picture,polygon,polyline,pre,q,rect,s,samp,section,"
    "select,small,span,strong,sub,summary,sup,svg,table,tbody,td,text,textarea,tfoot,th,"
    "thead,time,tr,tspan,u,ul,use,var,video"
)
REPL = f":where({TAGS})"

FUNCS = (":is(", ":where(", ":matches(", ":-webkit-any(", ":any(")


def split_compounds(sel: str) -> list[str]:
    """Split a complex selector into [compound, combinator, compound, ...] pieces."""
    out: list[str] = []
    buf = ""
    depth = 0
    quote = None
    i = 0
    while i < len(sel):
        ch = sel[i]
        if quote:
            buf += ch
            if ch == "\\":
                if i + 1 < len(sel):
                    buf += sel[i + 1]
                    i += 2
                    continue
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch == "\\":
            buf += ch + (sel[i + 1] if i + 1 < len(sel) else "")
            i += 2
            continue
        if ch in "\"'":
            quote = ch
            buf += ch
            i += 1
            continue
        if ch in "([":
            depth += 1
            buf += ch
            i += 1
            continue
        if ch in ")]":
            depth -= 1
            buf += ch
            i += 1
            continue
        if depth == 0 and (ch.isspace() or ch in ">+~"):
            j = i
            comb = ""
            while j < len(sel) and (sel[j].isspace() or sel[j] in ">+~"):
                comb += sel[j]
                j += 1
            out.append(buf)
            out.append(comb)
            buf = ""
            i = j
            continue
        buf += ch
        i += 1
    out.append(buf)
    return out


def _match_paren(s: str, open_idx: int) -> int:
    """Index of the paren closing the one at open_idx, or -1."""
    depth = 0
    i = open_idx
    while i < len(s):
        ch = s[i]
        if ch == "\\":
            i += 2
            continue
        if ch in "\"'":
            q = ch
            i += 1
            while i < len(s):
                if s[i] == "\\":
                    i += 2
                    continue
                if s[i] == q:
                    break
                i += 1
            i += 1
            continue
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def rewrite_compound(comp: str) -> tuple[str, int]:
    """Rewrite a rightmost compound if its subject is universal."""
    if not comp:
        return comp, 0
    for fn in FUNCS:
        if comp.startswith(fn):
            close = _match_paren(comp, len(fn) - 1)
            if close < 0:
                return comp, 0
            inner = comp[len(fn):close]
            rest = comp[close + 1:]
            changed = 0
            new_branches = []
            for br in split_selector_list(inner):
                nb, c = rewrite_complex(br)
                changed += c
                new_branches.append(nb)
            if changed:
                return f"{fn}{', '.join(new_branches)}){rest}", changed
            return comp, 0
    if comp == "*":
        return REPL, 1
    if comp.startswith("*") and len(comp) > 1 and comp[1] in ":[.#":
        return REPL + comp[1:], 1
    return comp, 0


def rewrite_complex(sel: str) -> tuple[str, int]:
    parts = split_compounds(sel.strip())
    if not parts:
        return sel, 0
    new, changed = rewrite_compound(parts[-1])
    if not changed:
        return sel, 0
    parts[-1] = new
    return "".join(parts), changed


def rewrite_selector_list(sel: str) -> tuple[str, int]:
    branches = split_selector_list(sel)
    total = 0
    out = []
    for br in branches:
        lead = br[: len(br) - len(br.lstrip())]
        nb, c = rewrite_complex(br)
        total += c
        out.append(lead + nb.lstrip() if c else br)
    if not total:
        return sel, 0
    return ",".join(out), total


def main() -> None:
    apply = "--apply" in sys.argv
    src = open(CSS).read()
    nodes = parse(src)
    # Not an `assert`: `python -O` strips assert statements, which would silently
    # delete this guard and let a lossy parse overwrite the 32k-line index.css.
    if serialize(nodes) != src:
        raise SystemExit(
            f"parser round-trip failed on {CSS} — refusing to write. "
            "The parser did not reproduce the source byte-for-byte, so any "
            "rewrite would lose or corrupt CSS."
        )
    rules = list(iter_style_rules(nodes))
    touched = 0
    branches = 0
    for r in rules:
        if r.at_rule:
            continue
        pre = r.prelude
        core = pre.strip()
        new, c = rewrite_selector_list(core)
        if c:
            touched += 1
            branches += c
            if apply:
                head = pre[: len(pre) - len(pre.lstrip())]
                tail = pre[len(pre.rstrip()):]
                r.prelude = head + new + tail
    print(f"rules with universal rightmost compound: {touched} (branches rewritten: {branches})")
    if apply:
        out = serialize(nodes)
        open(CSS, "w").write(out)
        print(f"written: {len(src)} -> {len(out)} bytes")
        # verify no rightmost `*` remains
        again = list(iter_style_rules(parse(out)))
        left = sum(1 for r in again if not r.at_rule and rewrite_selector_list(r.selector)[1])
        print(f"remaining universal-rightmost rules: {left}")


if __name__ == "__main__":
    main()
