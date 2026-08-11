#!/usr/bin/env python3
"""Validation tests for scripts/qa/cssparse.py.

Run: python3 scripts/qa/cssparse_test.py
Every ablation result MUST be preceded by a green run of this file.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cssparse import (classify, iter_style_rules, parse, serialize,
                      split_selector_list, declarations_of)

FAIL = []


def ok(cond, msg):
    if not cond:
        FAIL.append(msg)


CASES = [
    # (css, expected top-level style-rule selectors)
    ('a{color:red}', ['a']),
    # braces inside strings
    ('a{content:"}{"}b{color:red}', ['a', 'b']),
    # semicolons + commas inside strings
    ('a::after{content:"x;y,z"}b{color:red}', ['a::after', 'b']),
    # escaped Tailwind class with brackets
    (r'.w-\[10px\]{width:10px}.h-\{x\}{height:1px}', [r'.w-\[10px\]', r'.h-\{x\}']),
    # url() with unquoted data URI holding inline SVG (braces + commas + quotes)
    ('.i{background:url(data:image/svg+xml,%3Csvg viewBox="0 0 1 1"%3E%3Cpath d="M0,0h1{"/%3E%3C/svg%3E)}.j{color:red}',
     ['.i', '.j']),
    # nested functions with commas
    ('.a:is(.b:not(.c,.d),.e){color:color-mix(in srgb,var(--x),#fff)}', ['.a:is(.b:not(.c,.d),.e)']),
    # comment containing braces
    ('/* { } */ a{color:red}', ['a']),
    # attribute selector containing comma and quotes
    ('[data-x="a,b{c}"]{color:red}', ['[data-x="a,b{c}"]']),
]

for css, expected in CASES:
    nodes = parse(css)
    ok(serialize(nodes) == css, f"round-trip failed for {css!r}")
    tops = [r.selector for r in nodes if hasattr(r, "children") and not r.at_rule]
    ok(tops == expected, f"selectors {tops} != {expected} for {css!r}")

# at-rule nesting: media > rule
css = '@media (min-width:1px){a{color:red}b{color:blue}}'
nodes = parse(css)
ok(serialize(nodes) == css, "media round-trip")
rules = [r.selector for r in iter_style_rules(nodes)]
ok(rules == ['a', 'b'], f"media children {rules}")

# @supports inside @media, and a bare @import statement
css = '@import url(x.css);@media screen{@supports (d:grid){.g{display:grid}}}'
nodes = parse(css)
ok(serialize(nodes) == css, "supports round-trip")
ok([r.selector for r in iter_style_rules(nodes)] == ['.g'], "supports child")

# declarations are attached to the right rule
nodes = parse('a{color:red;background:url(data:,{;)}b{color:blue}')
rs = list(iter_style_rules(nodes))
ok('color:red' in declarations_of(rs[0]) and 'blue' not in declarations_of(rs[0]), "decl leak")
ok('color:blue' in declarations_of(rs[1]), "second decl")

# selector list splitting
ok(split_selector_list('a,b') == ['a', 'b'], "simple split")
ok(split_selector_list(':is(a,b),c') == [':is(a,b)', 'c'], "func split")
ok(split_selector_list('[x="a,b"],c') == ['[x="a,b"]', 'c'], "attr split")

# classification: big background utility must NOT be tagged deep/universal
ok('deep5' not in classify('.bg-hero'), "bg utility depth")
ok('universal' in classify('.a *'), "universal detect")
ok('universal' not in classify('.a\\*b'), "escaped star not universal")
ok('deep5' in classify('html body #root main div span'), "deep5 detect")
ok('deep5' not in classify('html body:is(a b c d e f)'), "function collapsed in depth")
ok('style-attr' in classify('[style*="rgb"]'), "style attr detect")
ok('giant-list' in classify(','.join(f'.c{i}' for i in range(12))), "giant list")

# real stylesheet: round-trip src/index.css byte-for-byte
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'index.css')
if os.path.exists(p):
    src = open(p).read()
    ok(serialize(parse(src)) == src, "src/index.css round-trip")

if FAIL:
    print("FAIL:")
    for f in FAIL:
        print("  -", f)
    sys.exit(1)
print(f"cssparse: all {len(CASES) * 2 + 16} assertions passed")
