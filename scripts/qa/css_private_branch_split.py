#!/usr/bin/env python3
"""BRANCH-level private split for src/index.css.

Why this exists next to css_private_split.py
--------------------------------------------
`css_private_split.py` moves a rule only when EVERY branch of its selector
list is private. After 290 design passes almost every guard rule is a MIXED
selector list (a few public branches + dozens of owner/CRM branches), so the
rule-level tool can no longer move anything (measured: 2 rules).

Measured cost of the leftover mass on the public listing page: deleting the
`[data-…]` guard families at runtime takes a filter-dropdown open from
~2700 ms to ~500 ms. The rules are needed — but only on the routes whose DOM
can actually contain those attributes.

Method (sound, not heuristic)
-----------------------------
For every style rule we classify each selector BRANCH. A branch is private
when it carries a namespaced back-office token that exists ONLY in private
source files. If a rule has both public and private branches, it is SPLIT:

  index.css                 keeps the public branches, same declarations
  private-surfaces.css      gets the private branches, same declarations

Splitting a selector list into two rules with identical declarations is
semantically identical for every element, because a comma-separated list is
by definition a union of independent branches. Relative order of the moved
branches is preserved, and the private sheet is appended after index.css
(same contract the rule-level tool already relies on).

Usage:
  python3 scripts/qa/css_private_branch_split.py --report
  python3 scripts/qa/css_private_branch_split.py --apply
"""
from __future__ import annotations
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cssparse import parse, serialize, Block, split_selector_list  # noqa: E402
from css_private_split import (  # noqa: E402
    ENTRY, OUT, CLASS_RE, ATTR_RE, GENERIC_ATTR, collect_sources, read, token_index,
)

TRIGGER_RE = re.compile(
    r"^(data-(owner|backend|admin|crm|studio|document|branded|relationships|"
    r"inbox|recommendation|campaign|enrichment|listings|upload|project-upload|"
    r"sidebar|back-to-portal|ai-listing|citi-lock|cal-|empty-state|source-examples|"
    r"recipient|jbj-campaign|chrome)|owner-|jc-|rh-|crm-|jbj-doc|mi-)",
    re.I,
)

BANNER = (
    "/* ==========================================================================\n"
    "   AUTO-GENERATED — appended by scripts/qa/css_private_branch_split.py\n"
    "   Private-surface selector BRANCHES lifted out of src/index.css so public\n"
    "   routes never pay their style-recalculation cost. Loaded lazily by\n"
    "   src/components/util/PrivateSurfaceStyles.tsx.\n"
    "   ========================================================================== */\n"
)


def main() -> int:
    apply = "--apply" in sys.argv
    pub_files, priv_files = collect_sources()
    pub_tok = token_index(read(pub_files))
    priv_tok = token_index(read(priv_files))

    def tok_private(t: str) -> bool:
        return bool(TRIGGER_RE.match(t)) and t in priv_tok and t not in pub_tok

    def branch_private(branch: str) -> bool:
        toks = set(CLASS_RE.findall(branch))
        toks |= {a for a in ATTR_RE.findall(branch) if a not in GENERIC_ATTR}
        return any(tok_private(t) for t in toks)

    text = open(ENTRY).read()
    nodes = parse(text)

    moved: list[tuple[list[str], str, str]] = []  # (wrappers, selector, body)
    stats = {"rules": 0, "split": 0, "whole": 0, "branches": 0, "kept": 0}

    def walk(children, wrappers):
        for n in list(children):
            if not isinstance(n, Block):
                continue
            if n.at_rule:
                p = n.prelude.strip()
                if p.startswith(("@media", "@supports", "@container")):
                    walk(n.children, wrappers + [n.prelude])
                continue
            stats["rules"] += 1
            branches = [b.strip() for b in split_selector_list(n.selector) if b.strip()]
            if not branches:
                walk(n.children, wrappers)
                continue
            priv = [b for b in branches if branch_private(b)]
            pub = [b for b in branches if not branch_private(b)]
            stats["kept"] += len(pub)
            if not priv:
                walk(n.children, wrappers)
                continue
            body = "".join(c.render() for c in n.children)
            moved.append((wrappers, ",\n".join(priv), body))
            stats["branches"] += len(priv)
            if pub:
                stats["split"] += 1
                n.prelude = ",\n".join(pub) + " "
            else:
                stats["whole"] += 1
                n.dead = True

    walk(nodes, [])

    print(
        f"style rules: {stats['rules']}  rules split: {stats['split']}  "
        f"rules fully moved: {stats['whole']}  branches moved: {stats['branches']}  "
        f"public branches kept: {stats['kept']}"
    )
    if not moved:
        return 0

    chunks = [BANNER]
    for wrappers, sel, body in moved:
        css = f"{sel} {{{body}}}\n"
        for w in reversed(wrappers):
            css = f"{w.strip()} {{\n{css}}}\n"
        chunks.append(css)
    extracted = "".join(chunks)
    new_entry = serialize(nodes)

    print(f"index.css: {len(text):,} -> {len(new_entry):,} bytes  extracted: {len(extracted):,} bytes")

    if apply:
        open(ENTRY, "w").write(new_entry)
        prev = open(OUT).read() if os.path.exists(OUT) else ""
        open(OUT, "w").write(prev.rstrip() + "\n\n" + extracted)
        print(f"APPLIED -> {ENTRY} + {OUT}")
    else:
        open("/tmp/private-branches.preview.css", "w").write(extracted)
        open("/tmp/index.branchsplit.preview.css", "w").write(new_entry)
        print("dry run -> /tmp/private-branches.preview.css , /tmp/index.branchsplit.preview.css")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
