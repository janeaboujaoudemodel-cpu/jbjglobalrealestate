#!/usr/bin/env python3
"""Controlled CSS ablation over the PRODUCTION stylesheet.

Usage:
  python3 scripts/qa/css_ablate.py build            # measure families
  python3 scripts/qa/css_ablate.py segments 8       # binary-search segments
  python3 scripts/qa/css_ablate.py report

Method
------
1. Locate the entry stylesheet in dist/assets (largest .css referenced by index.html).
2. Parse it with the validated parser (scripts/qa/cssparse.py).
3. For each candidate family, emit a variant of dist/ with ONLY the rules whose
   selector carries that tag removed (declarations preserved elsewhere).
4. Serve each variant on its own port and measure the SAME metrics as the
   baseline harness: CSSOM rules, RecalcStyleDuration, LayoutDuration,
   long-task total, FCP/LCP.
5. Every variant is measured N times and the MEDIAN is reported, so a single
   noisy run can never look like a win.
"""
from __future__ import annotations

import asyncio
import json
import os
import re
import shutil
import statistics
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cssparse import classify, iter_style_rules, parse, serialize  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
DIST = os.path.join(ROOT, "dist")
WORK = "/tmp/abl"
PORT0 = 8710
REPEATS = 3

ROUTES = {
    "home": "/",
    "project": "/project/77s-tower-77-shades-of-green-business-bay",
}
FAMILIES = ["deep5", "deep4", "universal", "style-attr", "svg", "has",
            "is-where", "giant-list", "bg-utility", "important"]

INIT = """
window.__lt=[];window.__lcp=0;
try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(e.duration)}).observe({type:'longtask',buffered:true})}catch(e){}
try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch(e){}
"""
COUNT = """()=>{let r=0;const walk=(rs)=>{for(const x of rs){r++;if(x.cssRules)walk(x.cssRules)}};
for(const sh of document.styleSheets){try{walk(sh.cssRules)}catch(e){}}
const pe=performance.getEntriesByType('paint').find(x=>x.name==='first-contentful-paint');
return {rules:r,fcp:Math.round(pe?pe.startTime:0),lcp:Math.round(window.__lcp),
 longTasks:window.__lt.length,longTaskMs:Math.round(window.__lt.reduce((a,b)=>a+b,0))};}"""


def entry_css() -> str:
    html = open(os.path.join(DIST, "index.html")).read()
    hits = re.findall(r'href="/(assets/[^"]+\.css)"', html)
    if not hits:
        raise SystemExit("no entry css in dist/index.html")
    return max((os.path.join(DIST, h) for h in hits), key=os.path.getsize)


def tag_rules(css_path: str):
    nodes = parse(open(css_path).read())
    rules = list(iter_style_rules(nodes))
    tagged = []
    for r in rules:
        tags = classify(r.selector)
        if "!important" in "".join(c.render() for c in r.children):
            tags.add("important")
        tagged.append((r, tags))
    return nodes, tagged


def make_variant(name: str, nodes, tagged, predicate) -> tuple[str, int]:
    """Render dist/ with matching rules removed (rest byte-identical)."""
    hit = [r for r, t in tagged if predicate(r, t)]
    for r in hit:
        r.dead = True
    css = serialize(nodes)
    for r in hit:
        r.dead = False
    d = os.path.join(WORK, name)
    if os.path.exists(d):
        shutil.rmtree(d)
    shutil.copytree(DIST, d, symlinks=True)
    rel = os.path.relpath(entry_css(), DIST)
    open(os.path.join(d, rel), "w").write(css)
    return d, len(hit)


async def measure(dirpath: str, port: int) -> dict:
    srv = subprocess.Popen(["python3", os.path.join(ROOT, "scripts/qa/spaserve.py"), dirpath, str(port)])
    time.sleep(1.2)
    out = {}
    try:
        async with async_playwright() as p:
            for device, vp, cpu in (("desktop", {"width": 1280, "height": 1800}, 1),
                                    ("mobile", {"width": 390, "height": 844}, 4)):
                b = await p.chromium.launch(headless=True, args=["--no-sandbox"])
                for rname, path in ROUTES.items():
                    runs = []
                    attempts = 0
                    while len(runs) < REPEATS and attempts < REPEATS * 3:
                        attempts += 1
                        ctx = await b.new_context(viewport=vp, device_scale_factor=1)
                        pg = await ctx.new_page()
                        await pg.add_init_script(INIT)
                        cdp = await ctx.new_cdp_session(pg)
                        if cpu > 1:
                            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": cpu})
                        await cdp.send("Performance.enable")
                        try:
                            await pg.goto(f"http://127.0.0.1:{port}{path}", wait_until="load", timeout=90000)
                        except Exception as e:  # noqa: BLE001
                            print("NAVFAIL", device, rname, e)
                        await pg.wait_for_timeout(6000 if cpu > 1 else 4000)
                        m = {x["name"]: x["value"] for x in (await cdp.send("Performance.getMetrics"))["metrics"]}
                        try:
                            d = await pg.evaluate(COUNT)
                        except Exception as e:  # noqa: BLE001
                            print("    eval failed, retry:", str(e)[:80], flush=True)
                            await ctx.close()
                            continue
                        d["recalcMs"] = round(m.get("RecalcStyleDuration", 0) * 1000, 1)
                        d["layoutMs"] = round(m.get("LayoutDuration", 0) * 1000, 1)
                        d["scriptMs"] = round(m.get("ScriptDuration", 0) * 1000, 1)
                        d["nodes"] = m.get("Nodes", 0)
                        await ctx.close()
                        # Guard: a page that never hydrated (blank shell) must never
                        # be averaged into a measurement — retry instead.
                        if d["rules"] < 500 or d["nodes"] < 300:
                            print("    discard non-hydrated run", d["rules"], d["nodes"], flush=True)
                            continue
                        runs.append(d)
                    if not runs:
                        out[f"{device}/{rname}"] = {"error": "no valid run"}
                        continue
                    med = {k: (round(statistics.median([r[k] for r in runs]), 1)) for k in runs[0]}
                    out[f"{device}/{rname}"] = med
                    print(f"  {device}/{rname}", json.dumps(med), flush=True)
                await b.close()
    finally:
        srv.kill()
    return out


def spaserve_exists():
    p = os.path.join(ROOT, "scripts/qa/spaserve.py")
    if not os.path.exists(p):
        shutil.copy("/tmp/browser/perf/spaserve.py", p)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    os.makedirs(WORK, exist_ok=True)
    spaserve_exists()
    css_path = entry_css()
    nodes, tagged = tag_rules(css_path)
    print(f"entry css: {os.path.relpath(css_path, ROOT)}  {os.path.getsize(css_path):,} bytes  "
          f"{len(tagged):,} style rules")
    counts = {}
    for _, t in tagged:
        for tag in t:
            counts[tag] = counts.get(tag, 0) + 1
    print("family counts:", json.dumps(dict(sorted(counts.items(), key=lambda x: -x[1]))))

    results = {}
    rf = os.path.join(WORK, "results.json")
    if os.path.exists(rf):
        results = json.load(open(rf))

    if cmd == "families":
        targets = sys.argv[2:] or FAMILIES
        for i, fam in enumerate(targets):
            d, n = make_variant(f"no-{fam}", nodes, tagged, lambda r, t, f=fam: f in t)
            print(f"[{fam}] removed {n} rules")
            results[f"no-{fam}"] = {"removed": n, **await_measure(d, PORT0 + 1 + i)}
            json.dump(results, open(rf, "w"), indent=1)
    elif cmd == "baseline":
        d, _ = make_variant("baseline", nodes, tagged, lambda r, t: False)
        results["baseline"] = {"removed": 0, **await_measure(d, PORT0)}
        json.dump(results, open(rf, "w"), indent=1)
    elif cmd == "segments":
        k = int(sys.argv[2]) if len(sys.argv) > 2 else 8
        total = len(tagged)
        for s in range(k):
            lo, hi = total * s // k, total * (s + 1) // k
            ids = {id(r) for r, _ in tagged[lo:hi]}
            d, n = make_variant(f"seg{s}", nodes, tagged, lambda r, t, ids=ids: id(r) in ids)
            print(f"[seg{s}] rules {lo}-{hi} removed {n}")
            results[f"seg{s}"] = {"removed": n, "range": [lo, hi], **await_measure(d, PORT0 + 20 + s)}
            json.dump(results, open(rf, "w"), indent=1)
    elif cmd == "report":
        base = results.get("baseline", {})
        print(f"{'variant':22} {'rules-':>7} " + " ".join(f"{k:>26}" for k in ROUTES))
        for name, r in results.items():
            row = f"{name:22} {r.get('removed', 0):>7} "
            for dev in ("desktop", "mobile"):
                for rt in ROUTES:
                    m = r.get(f"{dev}/{rt}", {})
                    b = base.get(f"{dev}/{rt}", {})
                    if not m:
                        continue
                    delta = ""
                    if b:
                        delta = f" ({m['recalcMs'] - b['recalcMs']:+.0f})"
                    row += f" {dev[:4]}/{rt[:4]} recalc={m['recalcMs']}{delta} lt={m['longTaskMs']}"
            print(row)
    json.dump(results, open(rf, "w"), indent=1)


def await_measure(d, port):
    return asyncio.run(measure(d, port))


if __name__ == "__main__":
    main()
