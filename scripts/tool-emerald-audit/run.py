"""Tool Emerald Visual Regression (Python / Playwright).

For every tool route in routes.json:
 1. Screenshot the [data-tool-emerald] shell (fallback: <main> / page).
 2. Scan every pixel and count champagne palette hits + dark ink on emerald.
 3. Write per-route PNG and report.json under artifacts/.

Exit behaviour:
  ✓  Clean route — no breach.
  ⚠  Breach on a route listed in known-violations.json — warning only, does
     NOT exit non-zero. These are tracked pre-existing violations (JBJ-029).
     Remove an entry here only once the violation is confirmed fixed.
  ✗  Breach on a route NOT in known-violations.json — exits non-zero.
     Either fix the violation or add it to known-violations.json with a
     JBJ-### ID in ROADMAP.md.

Run:
    # dev server on :8080 must be up
    python3 scripts/tool-emerald-audit/run.py
"""
from __future__ import annotations

import asyncio, json, os, sys
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
OUT = HERE / "artifacts"
ROUTES = json.loads((HERE / "routes.json").read_text())
BASE = os.environ.get("TOOL_AUDIT_BASE_URL", "http://localhost:8080")
VIEWPORT = {"width": 1280, "height": 1800}

THRESHOLDS = {"champagnePixels": 400, "darkInkPixels": 400}

# ---------------------------------------------------------------------------
# Known pre-existing violations — warn only, do not block CI.
# Each entry must have a JBJ-### ID in ROADMAP.md.
# ---------------------------------------------------------------------------
_kv_path = HERE / "known-violations.json"
_kv: dict = json.loads(_kv_path.read_text()) if _kv_path.exists() else {}
KNOWN_ROUTES: set[str] = {e["route"] for e in _kv.get("routes", [])}
KNOWN_TRACKED_BY: str = _kv.get("trackedBy", "")

CHAMPAGNE = [
    ("champagne-page",    253, 251, 247, 6),
    ("champagne-surface", 247, 242, 234, 8),
    ("champagne-raised",  239, 230, 214, 10),
]


def classify(r, g, b):
    for name, cr, cg, cb, tol in CHAMPAGNE:
        if abs(r - cr) <= tol and abs(g - cg) <= tol and abs(b - cb) <= tol:
            return name
    if r >= 235 and g >= 225 and b >= 205 and b < r and 6 <= (r - b) <= 55:
        return "champagne-generic"
    return None


def is_emerald(r, g, b):
    return r < 60 and 25 <= g <= 130 and b < 95 and g >= r and g >= b - 5


def is_dark_ink(r, g, b):
    return r < 55 and g < 55 and b < 55


def scan(png_path: Path):
    img = Image.open(png_path).convert("RGBA")
    px = img.load()
    w, h = img.size
    total = w * h
    champagne = 0
    emerald = 0
    dark = 0
    violations: dict[str, int] = {}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            if is_emerald(r, g, b):
                emerald += 1
            c = classify(r, g, b)
            if c:
                champagne += 1
                violations[c] = violations.get(c, 0) + 1
    coverage = emerald / total
    if coverage >= 0.15:
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a >= 128 and is_dark_ink(r, g, b):
                    dark += 1
    return {
        "total": total,
        "champagne": champagne,
        "dark": dark,
        "emeraldCoverage": coverage,
        "violations": violations,
    }


async def audit_route(page, route: str):
    url = f"{BASE}{route}"
    slug = "".join(c if c.isalnum() else "_" for c in route).strip("_")
    shot = OUT / f"{slug}.png"
    result = {
        "route": route, "url": url, "slug": slug,
        "reachable": False, "hasShell": False,
        "champagne": 0, "dark": 0, "emeraldCoverage": 0.0,
        "violations": {}, "breach": [],
        "knownViolation": route in KNOWN_ROUTES,
    }
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        for _ in range(6):
            await page.wait_for_timeout(1000)
            if await page.query_selector("[data-tool-emerald]"):
                break
        result["reachable"] = True

        shell = await page.query_selector("[data-tool-emerald]")
        result["hasShell"] = bool(shell)
        target = shell or await page.query_selector("main") or page
        await target.screenshot(path=str(shot))

        result.update(scan(shot))

        if result["hasShell"]:
            if result["champagne"] > THRESHOLDS["champagnePixels"]:
                result["breach"].append(f"champagne:{result['champagne']}>{THRESHOLDS['champagnePixels']}")
            if result["dark"] > THRESHOLDS["darkInkPixels"]:
                result["breach"].append(f"darkInk:{result['dark']}>{THRESHOLDS['darkInkPixels']}")
    except Exception as e:  # noqa: BLE001
        result["error"] = str(e)
    return result


async def main():
    if OUT.exists():
        for p in OUT.iterdir():
            p.unlink()
    OUT.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport=VIEWPORT)
        cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
        if cookies_json:
            cookies = json.loads(cookies_json)
            for c in cookies:
                c["url"] = BASE
            await ctx.add_cookies(cookies)
        page = await ctx.new_page()
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        if storage_key and session_json:
            await page.goto(BASE, wait_until="domcontentloaded")
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
            )

        results = []
        for route in ROUTES:
            r = await audit_route(page, route)
            known = r["knownViolation"]
            if r["breach"]:
                mark = "⚠" if known else "✗"
                tracked = f" [tracked:{KNOWN_TRACKED_BY}]" if known else ""
            else:
                mark = "✓"
                tracked = ""
            print(
                f"{mark} {r['route']:<30} shell={r['hasShell']} "
                f"champagne={r['champagne']} dark={r['dark']} "
                f"emerald={r['emeraldCoverage']*100:.1f}%"
                f"{' ' + ','.join(r['breach']) if r['breach'] else ''}"
                f"{tracked}"
                f"{(' ERR:'+r['error']) if r.get('error') else ''}"
            )
            results.append(r)
        await b.close()

    new_breaches   = [r for r in results if r["breach"] and not r["knownViolation"]]
    known_breaches = [r for r in results if r["breach"] and     r["knownViolation"]]

    report = {
        "baseUrl": BASE,
        "thresholds": THRESHOLDS,
        "knownViolationRoutes": sorted(KNOWN_ROUTES),
        "knownTrackedBy": KNOWN_TRACKED_BY,
        "routes": results,
        "summary": {
            "total": len(results),
            "reachable": sum(1 for r in results if r["reachable"]),
            "shells": sum(1 for r in results if r["hasShell"]),
            "newBreaches": len(new_breaches),
            "knownBreaches": len(known_breaches),
        },
    }
    (OUT / "report.json").write_text(json.dumps(report, indent=2))

    if known_breaches:
        print(
            f"\n⚠  {len(known_breaches)} known pre-existing violation(s) "
            f"tracked as {KNOWN_TRACKED_BY} — not blocking CI:"
        )
        for r in known_breaches:
            print(f"   {r['route']}: {','.join(r['breach'])}")
        print(f"   Fix and remove from known-violations.json when resolved.\n")

    if new_breaches:
        print(f"\n✗  {len(new_breaches)} NEW violation(s) — blocking CI:")
        for r in new_breaches:
            print(f"   {r['route']}: {','.join(r['breach'])}")
        print(
            f"\n   Fix the violation or — if pre-existing and not introduced "
            f"by this PR —\n"
            f"   add it to known-violations.json with a JBJ-### ID in ROADMAP.md."
        )
        print(f"\nSummary: {len(new_breaches)} new (blocking) / {len(known_breaches)} known pre-existing (tracked)")
        sys.exit(1)

    print(
        f"\nSummary: 0 new violations / "
        f"{len(known_breaches)} known pre-existing (tracked as {KNOWN_TRACKED_BY})"
    )


if __name__ == "__main__":
    asyncio.run(main())
