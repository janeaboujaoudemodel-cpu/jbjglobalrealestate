"""Site-wide rendered contrast + visual sweep with pixel ground truth.

Usage:
    python3 scripts/contrast/sitewide-sweep.py [--routes file] [--limit N]
        [--offset N] [--viewport laptop|ipad|phone|all] [--out DIR] [--workers N]

For every static route (public frontend + authenticated backend) it:
  * restores the managed Supabase session,
  * screenshots the viewport,
  * measures every visible text/icon element's foreground against the ACTUAL
    rendered pixels behind it (so gradients, images and blended surfaces are
    judged correctly),
  * and for each WCAG failure reports the CSS rule that won the cascade
    (stylesheet + selector + !important), so fixes can be made at the root.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
from pathlib import Path

import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

BASE = os.environ.get("SWEEP_BASE_URL", "http://localhost:8080")

VIEWPORTS = {
    "laptop": {"width": 1440, "height": 900},
    "ipad": {"width": 1024, "height": 1366},
    "phone": {"width": 390, "height": 844},
}

CANDIDATES_JS = r"""
() => {
  const parseRgb = (s) => {
    const m = String(s || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    if (parseFloat(cs.opacity) < 0.2) return false;
    const r = el.getBoundingClientRect();
    if (!(r.width > 3 && r.height > 3 && r.top >= 0 && r.left >= 0 &&
      r.bottom <= innerHeight && r.right <= innerWidth)) return false;
    // Ancestor chain must not be collapsed/faded/clipped away.
    let cur = el.parentElement;
    while (cur && cur.nodeType === 1) {
      const pcs = getComputedStyle(cur);
      if (pcs.visibility === 'hidden' || pcs.display === 'none') return false;
      if (parseFloat(pcs.opacity) < 0.2) return false;
      const pr = cur.getBoundingClientRect();
      if (pcs.overflow !== 'visible' && (pr.height < 4 || pr.width < 4)) return false;
      cur = cur.parentElement;
    }
    // Must actually be the topmost painted thing at its own centre.
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hit) return false;
    if (!(el.contains(hit) || hit.contains(el))) return false;
    return true;
  };

  const ownText = (el) => Array.from(el.childNodes)
    .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
  const describe = (el) => {
    let parts = [], cur = el;
    while (cur && cur.nodeType === 1 && parts.length < 4) {
      let s = cur.tagName.toLowerCase();
      const cls = (cur.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 3);
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s); cur = cur.parentElement;
    }
    return parts.join(' > ');
  };

  window.__sweepEls = [];
  const selector = 'h1,h2,h3,h4,h5,h6,p,span,li,label,a,button,summary,td,th,strong,em,small,input,textarea,svg';
  const out = [];
  for (const el of Array.from(document.querySelectorAll(selector))) {
    if (out.length >= 500) break;
    if (!visible(el)) continue;
    const tag = el.tagName.toLowerCase();
    const isSvg = tag === 'svg';
    const isField = ['input', 'textarea'].includes(tag);
    const text = isSvg ? '' : (ownText(el) || (isField ? (el.getAttribute('placeholder') || '') : ''));
    if (!isSvg && !text) continue;
    const cs = getComputedStyle(el);
    let fgRaw = cs.webkitTextFillColor && cs.webkitTextFillColor !== 'rgba(0, 0, 0, 0)'
      ? cs.webkitTextFillColor : cs.color;
    if (isSvg) {
      const stroke = cs.stroke && cs.stroke !== 'none' ? cs.stroke : null;
      const fill = cs.fill && cs.fill !== 'none' && cs.fill !== 'rgba(0, 0, 0, 0)' ? cs.fill : null;
      fgRaw = stroke || fill || cs.color;
    }
    const fg = parseRgb(fgRaw);
    if (!fg || fg[3] < 0.45) continue;
    const size = parseFloat(cs.fontSize) || 16;
    const bold = parseInt(cs.fontWeight, 10) >= 600;
    const large = size >= 24 || (size >= 18.66 && bold);
    const r = el.getBoundingClientRect();
    window.__sweepEls.push(el);
    out.push({
      i: out.length, tag: el.tagName, isSvg, text: (text || el.getAttribute('aria-label') || '')
        .replace(/\s+/g, ' ').slice(0, 70),
      fg: [fg[0], fg[1], fg[2]], fgRaw,
      threshold: isSvg ? 2.6 : (large ? 3.0 : 4.5),
      rect: [r.left, r.top, r.width, r.height],
      where: describe(el),
      surface: el.closest('[data-surface]') ? el.closest('[data-surface]').getAttribute('data-surface') : '',
    });
  }
  const doc = document.documentElement;
  return { candidates: out, overflow: doc.scrollWidth - doc.clientWidth,
           bodyText: (document.body.innerText || '').trim().length, url: location.pathname };
}
"""

RULES_JS = r"""
(indexes) => {
  const winning = (el) => {
    let best = null;
    const walk = (rules, sheetName) => {
      for (const rule of rules) {
        if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules, sheetName); continue; }
        if (!rule.selectorText || !rule.style) continue;
        const decl = rule.style.getPropertyValue('color')
          || rule.style.getPropertyValue('-webkit-text-fill-color')
          || rule.style.getPropertyValue('--jbj-surface-foreground');
        if (!decl) continue;
        let matches = false;
        try { matches = el.matches(rule.selectorText); } catch (e) { continue; }
        if (!matches) continue;
        const important = rule.style.getPropertyPriority('color') === 'important'
          || rule.style.getPropertyPriority('-webkit-text-fill-color') === 'important';
        const score = (important ? 1e6 : 0) + rule.selectorText.length;
        if (!best || score >= best.score) {
          best = { score, selector: rule.selectorText.slice(0, 300), value: decl, important, sheet: sheetName };
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      let rules = null;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (rules) walk(rules, sheet.href ? sheet.href.split('/').pop() : 'inline');
    }
    return best;
  };
  const res = {};
  for (const i of indexes) {
    const el = (window.__sweepEls || [])[i];
    if (el) res[i] = winning(el);
  }
  return res;
}
"""


def slug(route: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", route).strip("-") or "home"


def discover_static_routes() -> list[str]:
    """Build a canonical proof inventory, resolving nested relative routes."""
    route_files = sorted(Path("src/routes").glob("*.tsx"))
    route_files.extend([Path("src/App.tsx")])
    found: set[str] = set()
    dynamic = re.compile(r"[:*]")

    def add_route(path: str) -> None:
        if not path.startswith("/") or dynamic.search(path):
            return
        found.add(path.rstrip("/") or "/")

    for route_file in route_files:
        if not route_file.exists():
            continue
        text = route_file.read_text(errors="ignore")
        for path in re.findall(r'path=["\']([^"\']+)', text):
            add_route(path)

        # Route-group files use one absolute parent and relative children. A
        # JSX parser is unnecessary here because these groups have a single
        # shell parent; resolving the quoted declarations gives complete,
        # deterministic coverage without inventing URLs from component names.
        absolute_paths = re.findall(r'path=["\'](/[^"\']+)', text)
        if len(absolute_paths) == 1:
            parent = absolute_paths[0].rstrip("/")
            for child in re.findall(r'path=["\']([^/][^"\']*)', text):
                if not dynamic.search(child):
                    add_route(f"{parent}/{child}")
    return sorted(found, key=lambda value: (value.count("/"), value))


def _lum(c):
    c = np.asarray(c, dtype=float) / 255.0
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]


def ratio(fg, bg):
    l1, l2 = _lum(fg), _lum(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return float((hi + 0.05) / (lo + 0.05))


def measure(img: np.ndarray, cand: dict, scale: float = 1.0):
    """Return (background rgb, ratio) using real pixels behind the element."""
    x, y, w, h = [v * scale for v in cand["rect"]]
    x0, y0 = int(max(0, x)), int(max(0, y))
    x1, y1 = int(min(img.shape[1], x + w)), int(min(img.shape[0], y + h))
    if x1 - x0 < 2 or y1 - y0 < 2:
        return None, None
    region = img[y0:y1, x0:x1, :3].reshape(-1, 3).astype(float)
    fg = np.asarray(cand["fg"], dtype=float)
    dist = np.linalg.norm(region - fg, axis=1)
    bgpx = region[dist > 60]
    if bgpx.shape[0] < max(4, 0.15 * region.shape[0]):
        bgpx = region
    bg = np.median(bgpx, axis=0)
    return bg.tolist(), ratio(fg, bg)


async def restore_session(context, page):
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE
        await context.add_cookies(cookies)
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    await page.goto(BASE, wait_until="domcontentloaded")
    if storage_key and session_json:
        await page.evaluate(
            "window.localStorage.setItem(%s, %s)"
            % (json.dumps(storage_key), json.dumps(session_json))
        )
    # The consent banner is a separate audited component. Suppress it in route
    # albums so fixed overlays cannot contaminate page contrast measurements.
    await page.evaluate(
        "window.localStorage.setItem('jj_cookies_consent', "
        "JSON.stringify({status:'all',timestamp:new Date().toISOString()}))"
    )


async def audit(page, route, viewport_name, shots: Path, console_sink: list):
    entry = {"route": route, "viewport": viewport_name, "failures": [], "errors": []}
    console_sink.clear()
    try:
        response = await page.goto(f"{BASE}{route}", wait_until="domcontentloaded", timeout=45000)
        entry["httpStatus"] = response.status if response else None
        if response and response.status >= 400:
            entry["errors"].append(f"HTTP {response.status}")
        try:
            await page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:  # noqa: BLE001
            pass
        # Freeze animations/transitions so screenshots and computed styles agree.
        await page.add_style_tag(content=(
            "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;"
            "transition-duration:0s!important;transition-delay:0s!important}"
        ))
        # A shell/sidebar can paint thousands of characters before its lazy route
        # module arrives. Wait for the actual content gutter to contain non-loader
        # content, then require two stable samples before capturing proof.
        stable_samples = 0
        previous_sample = ""
        for _ in range(60):
            await page.wait_for_timeout(500)
            try:
                sample = await page.evaluate(
                    """() => {
                      const gutter = document.querySelector('[data-content-gutter]');
                      if (!gutter) return '';
                      const visibleText = (gutter.innerText || '').trim();
                      const hasPage = gutter.matches('main, [role="main"], article, form, [data-page-ready]')
                        || !!gutter.querySelector('h1, [role="main"], main, article, form, [data-page-ready]');
                      return hasPage && visibleText.length > 40 ? visibleText.slice(0, 500) : '';
                    }"""
                )
            except Exception:  # noqa: BLE001 - mid-navigation context swap
                sample = ""
            stable_samples = stable_samples + 1 if sample and sample == previous_sample else 0
            previous_sample = sample
            if stable_samples >= 2:
                break
        if stable_samples < 2:
            entry["errors"].append("route content did not hydrate before the 30s proof timeout")
        await page.wait_for_timeout(300)
        data = await page.evaluate(CANDIDATES_JS)
        entry["overflow"] = data["overflow"]
        entry["blank"] = data["bodyText"] < 40
        entry["landed"] = data["url"]
        entry["redirected"] = data["url"].rstrip("/") != route.rstrip("/")
        entry["notFound"] = await page.locator('[data-route-status="not-found"]').count() > 0
        protected_prefixes = ("/owner", "/broker", "/developer", "/account", "/automations", "/favorites")
        entry["unexpectedProtectedRedirect"] = entry["redirected"] and route.startswith(protected_prefixes)
        entry["candidates"] = len(data["candidates"])

        if entry["notFound"]:
            entry["errors"].append("rendered not-found route")
        if entry["blank"]:
            entry["errors"].append("blank route")
        if entry["redirected"]:
            entry["errors"].append(f"unexpected redirect to {entry['landed']}")

        provisional = shots.parent / "failures" / viewport_name / f"{slug(route)}--{viewport_name}.png"
        provisional.parent.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(provisional))

        img = np.array(Image.open(provisional).convert("RGB"))
        scale = img.shape[1] / VIEWPORTS[viewport_name]["width"]
        flagged = []
        for cand in data["candidates"]:
            bg, r = measure(img, cand, scale)
            if bg is None:
                continue
            fg = cand["fg"]
            white = min(fg) > 232
            dark = max(fg) < 70
            light_bg = _lum(np.asarray(bg)) > 0.5
            dark_bg = _lum(np.asarray(bg)) < 0.16
            tokens = []
            if white and light_bg:
                tokens.append("white-on-light")
            if dark and dark_bg:
                tokens.append("dark-on-dark")
            if r < cand["threshold"]:
                tokens.append("low-ratio")
            if not tokens:
                continue
            flagged.append({**{k: cand[k] for k in ("tag", "text", "where", "surface", "threshold", "fgRaw", "i")},
                            "bg": [round(v) for v in bg], "ratio": round(r, 2), "tokens": tokens,
                            "rect": [round(v) for v in cand["rect"]]})
        if flagged:
            rules = await page.evaluate(RULES_JS, [f["i"] for f in flagged])
            for f in flagged:
                f["rule"] = rules.get(str(f["i"])) or rules.get(f["i"])
        entry["failures"] = flagged
        entry["valid"] = not flagged and not entry["errors"] and (entry.get("overflow") or 0) <= 2
        if entry["valid"]:
            admitted = shots / provisional.name
            provisional.replace(admitted)
            entry["screenshot"] = admitted.name
        else:
            entry["failureScreenshot"] = str(provisional.relative_to(shots.parent))
    except Exception as exc:  # noqa: BLE001
        entry["errors"].append(str(exc)[:200])
    entry["consoleErrors"] = list(console_sink)[:5]
    return entry


async def worker(browser, routes, viewport_name, shots, results):
    ctx = await browser.new_context(viewport=VIEWPORTS[viewport_name])
    page = await ctx.new_page()
    sink: list = []
    page.on("console", lambda m: sink.append(m.text[:200]) if m.type == "error" else None)
    await restore_session(ctx, page)
    for route in routes:
        entry = await audit(page, route, viewport_name, shots, sink)
        results.append(entry)
        n = len(entry["failures"])
        mark = "." if entry.get("valid") else "x"
        print(f"{mark} [{viewport_name}] {route} fails={n} {';'.join(entry['errors'])[:70]}", flush=True)
    await ctx.close()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--routes", default="/tmp/audit/static-routes.json")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--viewport", default="laptop", choices=["laptop", "ipad", "phone", "all"])
    ap.add_argument("--out", default="/mnt/documents/sitewide-audit")
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    routes_path = Path(args.routes)
    routes = (json.loads(routes_path.read_text()) if routes_path.exists() else discover_static_routes())[args.offset:]
    if args.limit:
        routes = routes[: args.limit]

    out = Path(args.out)
    views = list(VIEWPORTS) if args.viewport == "all" else [args.viewport]
    for view in views:
        (out / view).mkdir(parents=True, exist_ok=True)
    results: list[dict] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for view in views:
            shots = out / view
            chunks = [routes[i :: args.workers] for i in range(args.workers)]
            await asyncio.gather(*[worker(browser, c, view, shots, results) for c in chunks if c])
        await browser.close()

    by_rule: dict[str, dict] = {}
    for entry in results:
        for f in entry["failures"]:
            rule = f.get("rule") or {}
            key = f"{rule.get('sheet', '?')} :: {rule.get('selector', '<none>')}"
            slot = by_rule.setdefault(key, {"count": 0, "routes": set(), "samples": [], "value": rule.get("value")})
            slot["count"] += 1
            slot["routes"].add(entry["route"])
            if len(slot["samples"]) < 3:
                slot["samples"].append({"route": entry["route"], "text": f["text"], "fg": f["fgRaw"],
                                        "bg": f["bg"], "ratio": f["ratio"], "tokens": f["tokens"],
                                        "where": f["where"], "surface": f["surface"]})
    ranked = sorted(by_rule.items(), key=lambda kv: -kv[1]["count"])
    report = {
        "base": BASE, "routesTested": len(routes), "viewports": views,
        "totalFailures": sum(len(e["failures"]) for e in results),
        "routesWithFailures": sorted({e["route"] for e in results if e["failures"]}),
        "routesWithErrors": [e["route"] for e in results if e["errors"]],
        "blankRoutes": sorted({e["route"] for e in results if e.get("blank")}),
        "overflowRoutes": sorted({e["route"] for e in results if (e.get("overflow") or 0) > 2}),
        "protectedRedirectRoutes": sorted({e["route"] for e in results if e.get("unexpectedProtectedRedirect")}),
        "notFoundRoutes": sorted({e["route"] for e in results if e.get("notFound")}),
        "redirectRoutes": sorted({e["route"] for e in results if e.get("redirected")}),
        "validCaptures": sum(1 for e in results if e.get("valid")),
        "winningRules": [{"rule": k, "count": v["count"], "value": v["value"],
                          "routes": sorted(v["routes"])[:12], "samples": v["samples"]}
                         for k, v in ranked[:80]],
        "entries": results,
    }
    (out / "report.json").write_text(json.dumps(report, indent=2, default=str))
    print("\n=== SUMMARY ===")
    print(f"routes={len(routes)} failures={report['totalFailures']} "
          f"routesWithFailures={len(report['routesWithFailures'])} "
          f"blank={len(report['blankRoutes'])} overflow={len(report['overflowRoutes'])}")
    for r in report["winningRules"][:20]:
        print(f"{r['count']:>6}  {r['rule'][:150]}")
    print(f"report: {out / 'report.json'}")


if __name__ == "__main__":
    asyncio.run(main())
