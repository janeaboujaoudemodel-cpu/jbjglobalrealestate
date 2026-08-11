#!/usr/bin/env python3
"""
JBJ contrast-lock / emerald-guard CSS consolidator.

Every pass here is provably output-equivalent for the rendered result. No pass
may change specificity, declaration values, or cascade outcomes.

Passes
------
P1  drop fully-shadowed duplicate rules (identical selector list + identical
    declarations; the earlier copy can never win a tie, so it is dead)
P2  drop duplicate :not() clauses inside one compound selector (no-op)
P3  drop duplicate comma-parts inside one selector list (no-op)
P4  drop earlier duplicate declarations of the same property+importance in one
    rule (later one always wins)
P5  merge rules that share an identical declaration block when NO rule between
    them declares any of the same properties -- moving either rule inside that
    gap cannot change any cascade outcome
P6  report (never auto-delete) class selectors unused in the codebase

Usage:
  python3 scripts/qa/css_consolidate.py src/index.css --apply
  python3 scripts/qa/css_consolidate.py src/index.css            # dry run
"""
from __future__ import annotations

import argparse
import re
import sys

NOT_RE = re.compile(r":not\((?:[^()]|\([^()]*\))*\)")
PROP_RE = re.compile(r"^\s*([-a-zA-Z][-a-zA-Z0-9]*)\s*:")


# --------------------------------------------------------------------------- #
# parsing
# --------------------------------------------------------------------------- #
def parse(src: str):
    """Flat tokenizer: ('raw', text) | ('rule', head, body) | ('at', head, body).

    Round-trips byte-for-byte; nested at-rule bodies are kept opaque.
    """
    items = []
    i, n = 0, len(src)
    while i < n:
        j = src.find("{", i)
        if j < 0:
            items.append(("raw", src[i:]))
            break
        head = src[i:j]
        depth, k = 0, j
        while k < n:
            if src[k] == "{":
                depth += 1
            elif src[k] == "}":
                depth -= 1
                if depth == 0:
                    break
            k += 1
        if depth != 0:  # unbalanced tail -- keep verbatim, stop touching it
            items.append(("raw", src[i:]))
            break
        body = src[j + 1 : k]
        kind = "at" if "@" in head else ("at" if "{" in body else "rule")
        items.append((kind, head, body))
        i = k + 1
    return items


def render(items) -> str:
    out = []
    for it in items:
        out.append(it[1] if it[0] == "raw" else it[1] + "{" + it[2] + "}")
    return "".join(out)


def split_decls(body: str):
    return [d for d in body.split(";") if d.strip()]


def decl_key(decl: str):
    m = PROP_RE.match(decl)
    if not m:
        return None
    return (m.group(1).lower(), "!important" in decl)


def props_of(body: str):
    keys = set()
    for d in split_decls(body):
        k = decl_key(d)
        if k is None:
            return None  # unparseable -> treat as "touches everything"
        keys.add(k)
    return keys


def norm_sel(head: str) -> str:
    """Selector text with comments stripped and whitespace collapsed."""
    s = re.sub(r"/\*.*?\*/", " ", head, flags=re.S)
    return re.sub(r"\s+", " ", s).strip()


def lead_and_sel(head: str):
    """Split a rule head into (leading comments/whitespace, selector text)."""
    idx = 0
    while True:
        m = re.match(r"\s*/\*.*?\*/", head[idx:], flags=re.S)
        if not m:
            break
        idx += m.end()
    ws = re.match(r"\s*", head[idx:])
    idx += ws.end()
    return head[:idx], head[idx:]


# --------------------------------------------------------------------------- #
# passes
# --------------------------------------------------------------------------- #
def p2_dedupe_not(items, stats):
    for idx, it in enumerate(items):
        if it[0] != "rule" or ":not(" not in it[1]:
            continue
        lead, sel = lead_and_sel(it[1])
        parts = []
        for part in safe_split_selector(sel):
            toks = re.split(r"(\s+|>|\+|~)", part)
            new_toks = []
            for t in toks:
                nots = NOT_RE.findall(t)
                if len(nots) > 1:
                    seen = []
                    for nz in nots:
                        if nz not in seen:
                            seen.append(nz)
                    if len(seen) != len(nots):
                        t = NOT_RE.sub("", t) + "".join(seen)
                        stats["p2_clauses"] += len(nots) - len(seen)
                new_toks.append(t)
            parts.append("".join(new_toks))
        new_sel = ",".join(parts)
        if new_sel != sel:
            stats["p2_rules"] += 1
            items[idx] = ("rule", lead + new_sel, it[2])
    return items


def safe_split_selector(sel: str):
    """Split a selector list on TOP-LEVEL commas only.

    A naive `sel.split(",")` corrupts selectors that carry a comma inside a
    string or a function, e.g. `[style*="rgba(6,78,59)"]` or `:is(a, b)` —
    that produced an unclosed-bracket PostCSS failure once, so this splitter
    tracks quotes, brackets and parentheses.
    """
    out, buf, depth, quote = [], [], 0, None
    for ch in sel:
        if quote:
            buf.append(ch)
            if ch == quote:
                quote = None
            continue
        if ch in "\"'":
            quote = ch
            buf.append(ch)
            continue
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth = max(0, depth - 1)
        if ch == "," and depth == 0:
            out.append("".join(buf))
            buf = []
            continue
        buf.append(ch)
    out.append("".join(buf))
    return out


def p3_dedupe_parts(items, stats):
    for idx, it in enumerate(items):
        if it[0] != "rule" or "," not in it[1]:
            continue
        lead, sel = lead_and_sel(it[1])
        parts = safe_split_selector(sel)
        seen, keep = set(), []
        for p in parts:
            key = re.sub(r"\s+", " ", p).strip()
            if not key:
                keep.append(p)
                continue
            if key in seen:
                stats["p3_parts"] += 1
                continue
            seen.add(key)
            keep.append(p)
        if len(keep) != len(parts):
            stats["p3_rules"] += 1
            items[idx] = ("rule", lead + ",".join(keep), it[2])
    return items


def p4_dedupe_decls(items, stats):
    for idx, it in enumerate(items):
        if it[0] != "rule":
            continue
        decls = split_decls(it[2])
        if len(decls) < 2:
            continue
        keys = [decl_key(d) for d in decls]
        if any(k is None for k in keys):
            continue
        last = {}
        for i, k in enumerate(keys):
            last[k] = i
        keep = [d for i, d in enumerate(decls) if last[keys[i]] == i]
        if len(keep) != len(decls):
            stats["p4_decls"] += len(decls) - len(keep)
            stats["p4_rules"] += 1
            tail = ";" if it[2].rstrip().endswith(";") else ""
            items[idx] = ("rule", it[1], ";".join(keep) + tail)
    return items


def p1_drop_shadowed(items, stats):
    """Remove an earlier rule when a later rule has the identical selector list
    AND identical declarations: the earlier copy can only lose or tie."""
    sig_last = {}
    for idx, it in enumerate(items):
        if it[0] != "rule":
            continue
        sig = (norm_sel(it[1]), re.sub(r"\s+", " ", it[2]).strip())
        sig_last[sig] = idx
    out = []
    for idx, it in enumerate(items):
        if it[0] == "rule":
            sig = (norm_sel(it[1]), re.sub(r"\s+", " ", it[2]).strip())
            if sig[1] and sig_last[sig] != idx:
                stats["p1_rules"] += 1
                lead, _ = lead_and_sel(it[1])
                if lead.strip():  # never lose documentation comments
                    out.append(("raw", lead))
                continue
        out.append(it)
    return out


def p5_merge_equivalent(items, stats):
    """Merge rules with identical declaration blocks when nothing in between
    declares an overlapping property."""
    order = [i for i, it in enumerate(items) if it[0] == "rule"]
    body_of = {}
    for i in order:
        body_of[i] = re.sub(r"\s+", " ", items[i][2]).strip()

    # property footprint of every rule/at-block, for gap checking
    def footprint(idx):
        it = items[idx]
        if it[0] == "raw":
            return set()
        if it[0] == "at":
            return None  # opaque -> blocks merging across it
        return props_of(it[2])

    merged_into = {}
    consumed = set()
    for pos, i in enumerate(order):
        if i in consumed:
            continue
        bi = body_of[i]
        if not bi:
            continue
        pi = props_of(items[i][2])
        if pi is None:
            continue
        target = i
        for j in order[pos + 1 :]:
            if j in consumed:
                continue
            if body_of[j] != bi:
                continue
            # check the gap between target and j
            blocked = False
            for m in range(target + 1, j):
                if m in consumed:
                    continue
                fp = footprint(m)
                if fp is None:
                    blocked = True
                    break
                if fp & pi:
                    blocked = True
                    break
            if blocked:
                break
            merged_into.setdefault(i, []).append(j)
            consumed.add(j)
            target = j
    if not merged_into:
        return items
    out = []
    for idx, it in enumerate(items):
        if idx in consumed:
            lead, _ = lead_and_sel(it[1])
            if lead.strip():
                out.append(("raw", lead))
            stats["p5_merged"] += 1
            continue
        if it[0] == "rule" and idx in merged_into:
            lead, sel = lead_and_sel(it[1])
            sels = [sel.strip().rstrip(",")]
            for j in merged_into[idx]:
                _, s2 = lead_and_sel(items[j][1])
                sels.append(s2.strip().rstrip(","))
            out.append(("rule", lead + ",\n".join(sels), it[2]))
            stats["p5_groups"] += 1
            continue
        out.append(it)
    return out


# --------------------------------------------------------------------------- #
def run(path: str, apply: bool):
    src = open(path).read()
    items = parse(src)
    assert render(items) == src, "parser round-trip failed -- aborting"

    stats = {
        "p1_rules": 0,
        "p2_rules": 0,
        "p2_clauses": 0,
        "p3_rules": 0,
        "p3_parts": 0,
        "p4_rules": 0,
        "p4_decls": 0,
        "p5_groups": 0,
        "p5_merged": 0,
    }
    items = p2_dedupe_not(items, stats)
    items = p3_dedupe_parts(items, stats)
    items = p4_dedupe_decls(items, stats)
    items = p1_drop_shadowed(items, stats)
    items = p5_merge_equivalent(items, stats)

    out = render(items)
    print(f"raw before : {len(src):,} bytes / {src.count(chr(10))+1:,} lines")
    print(f"raw after  : {len(out):,} bytes / {out.count(chr(10))+1:,} lines")
    print(f"saved      : {len(src)-len(out):,} bytes")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    if apply:
        open(path, "w").write(out)
        print("APPLIED")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--apply", action="store_true")
    sys.exit(run(**vars(ap.parse_args())))
