#!/usr/bin/env python3
"""Correct-by-construction CSS tokenizer / rule splitter for JBJ perf tooling.

Why this exists
---------------
The previous ablation tooling split `src/index.css` on naive brace/comma scans.
That corrupts on:
  * quoted strings containing `{`, `}`, `,`, `;`  (e.g. content: "a,b{")
  * escaped characters (`\\{`, `\\"`, Tailwind's `.w-\\[10px\\]`)
  * `url(...)` with unquoted parens / data URIs holding inline SVG markup
  * nested functions: `:is(a:not(b,c), d)`, `color-mix(in srgb, var(--x), #fff)`
  * comments containing braces
Because a corrupted split mis-assigns declarations to selectors, every
family-level ablation built on it is unsound. Nothing in this module guesses:
it walks the byte stream with an explicit state machine.

Public API
----------
parse(text)              -> list[Node]
serialize(nodes)         -> str            (byte-preserving round trip)
iter_style_rules(nodes)  -> generator of StyleRule nodes (recursive)
split_selector_list(sel) -> list[str]      (top-level commas only)
classify(selector)       -> set[str]       (selector family tags)
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable, Iterator


# ---------------------------------------------------------------- node types
@dataclass
class Raw:
    """Comment / whitespace / stray text kept verbatim."""
    text: str

    def render(self) -> str:
        return self.text


@dataclass
class Decl:
    """A declaration or an at-statement terminated by `;`."""
    text: str

    def render(self) -> str:
        return self.text


@dataclass
class Block:
    """Any `prelude { children }` construct."""
    prelude: str
    children: list = field(default_factory=list)
    lead: str = ""          # whitespace/comments captured before the prelude
    dead: bool = False      # ablation flag: render as nothing (lead kept)

    @property
    def at_rule(self) -> bool:
        return self.prelude.lstrip().startswith("@")

    @property
    def selector(self) -> str:
        return self.prelude.strip()

    def render(self) -> str:
        if self.dead:
            return self.lead
        return f"{self.lead}{self.prelude}{{{''.join(c.render() for c in self.children)}}}"


StyleRule = Block  # alias for readability


# ---------------------------------------------------------------- tokenizer
def _scan(text: str, i: int) -> tuple[int, str]:
    """Consume one 'atomic' construct at i; return (next_index, kind).

    kind is one of: 'string', 'comment', 'url', 'escape', 'char'.
    Guarantees: the returned slice never contains a *structural* character
    that the caller must interpret.
    """
    c = text[i]
    if c == "\\":
        return min(i + 2, len(text)), "escape"
    if c in "\"'":
        q = c
        j = i + 1
        while j < len(text):
            if text[j] == "\\":
                j += 2
                continue
            if text[j] == q:
                return j + 1, "string"
            if text[j] == "\n":       # unterminated string ends at newline (CSS spec)
                return j, "string"
            j += 1
        return len(text), "string"
    if c == "/" and text.startswith("/*", i):
        j = text.find("*/", i + 2)
        return (len(text) if j < 0 else j + 2), "comment"
    if c in "uU" and re.match(r"url\(", text[i:i + 4], re.I):
        # url( ... ) — may hold a quoted or unquoted (data:) payload
        j = i + 4
        while j < len(text):
            if text[j] in "\"'\\":
                j, _ = _scan(text, j)
                continue
            if text[j] == ")":
                return j + 1, "url"
            j += 1
        return len(text), "url"
    return i + 1, "char"


def parse(text: str) -> list:
    """Parse a stylesheet into a node list. Round-trips byte-for-byte."""
    nodes, i = [], 0
    buf_start = 0
    depth_paren = 0
    stack: list[tuple[list, str, str]] = []   # (parent_nodes, prelude, lead)
    cur = nodes

    def flush_upto(end: int, as_raw: bool):
        nonlocal buf_start
        if end > buf_start:
            chunk = text[buf_start:end]
            if chunk.strip():
                cur.append(Raw(chunk) if as_raw else Decl(chunk))
            elif chunk:
                cur.append(Raw(chunk))
        buf_start = end

    while i < len(text):
        j, kind = _scan(text, i)
        if kind != "char":
            i = j
            continue
        c = text[i]
        if c == "(":
            depth_paren += 1
        elif c == ")":
            depth_paren = max(0, depth_paren - 1)
        elif depth_paren == 0 and c == "{":
            prelude = text[buf_start:i]
            # split trailing prelude from any preceding whitespace/comment run
            m = re.match(r"^([\s]*(?:/\*.*?\*/[\s]*)*)", prelude, re.S)
            lead = m.group(1) if m else ""
            blk = Block(prelude=prelude[len(lead):], lead=lead)
            cur.append(blk)
            stack.append((cur, blk.prelude, blk.lead))
            cur = blk.children
            buf_start = i + 1
        elif depth_paren == 0 and c == "}":
            flush_upto(i, as_raw=False)
            if stack:
                cur, _, _ = stack.pop()
            buf_start = i + 1
        elif depth_paren == 0 and c == ";":
            flush_upto(i + 1, as_raw=False)
        i = j

    flush_upto(len(text), as_raw=False)
    return nodes


def serialize(nodes: Iterable) -> str:
    return "".join(n.render() for n in nodes)


def iter_style_rules(nodes: Iterable) -> Iterator[Block]:
    for n in nodes:
        if isinstance(n, Block):
            if n.at_rule:
                yield from iter_style_rules(n.children)
            else:
                yield n
                yield from iter_style_rules(n.children)


def split_selector_list(sel: str) -> list[str]:
    """Split on top-level commas only (strings/(), [] safe)."""
    out, start, depth, i = [], 0, 0, 0
    while i < len(sel):
        j, kind = _scan(sel, i)
        if kind != "char":
            i = j
            continue
        c = sel[i]
        if c in "([":
            depth += 1
        elif c in ")]":
            depth = max(0, depth - 1)
        elif c == "," and depth == 0:
            out.append(sel[start:i])
            start = i + 1
        i = j
    out.append(sel[start:])
    return [s for s in out]


# ------------------------------------------------------------- classification
_COMBINATOR = re.compile(r"[\s>+~]+")


def _depth(part: str) -> int:
    """Number of compound selectors in one selector part (functions collapsed)."""
    flat, i = [], 0
    depth = 0
    while i < len(part):
        j, kind = _scan(part, i)
        if kind != "char":
            flat.append(" " if kind in ("string", "comment") else part[i:j])
            i = j
            continue
        c = part[i]
        if c in "([":
            depth += 1
            if depth == 1:
                flat.append("(")
            i = j
            continue
        if c in ")]":
            depth = max(0, depth - 1)
            if depth == 0:
                flat.append(")")
            i = j
            continue
        flat.append("X" if depth else c)
        i = j
    s = "".join(flat)
    s = re.sub(r"\([^()]*\)", "F", s)
    return len([t for t in _COMBINATOR.split(s.strip()) if t])


def classify(selector: str) -> set[str]:
    """Tag a full selector list with the families we can ablate."""
    tags: set[str] = set()
    parts = split_selector_list(selector)
    for raw in parts:
        p = raw.strip()
        if not p:
            continue
        d = _depth(p)
        if d >= 5:
            tags.add("deep5")
        elif d == 4:
            tags.add("deep4")
        if re.search(r"(^|[\s>+~(,])\*", p):
            tags.add("universal")
        if "[style*=" in p.replace(" ", ""):
            tags.add("style-attr")
        if re.search(r"\b(svg|path|circle|rect|g)\b", p):
            tags.add("svg")
        if ":has(" in p:
            tags.add("has")
        if re.search(r":is\(|:where\(", p):
            tags.add("is-where")
        if re.search(r"\[data-", p):
            tags.add("data-attr")
        if re.search(r"\.(bg|from|via|to)-", p):
            tags.add("bg-utility")
    if len(parts) >= 12:
        tags.add("giant-list")
    return tags


def declarations_of(rule: Block) -> str:
    return "".join(c.render() for c in rule.children)
