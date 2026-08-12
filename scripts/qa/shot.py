#!/usr/bin/env python3
"""
JBJ visual-validation screenshot helper.

ROOT CAUSE OF BLANK SCREENSHOTS (fixed here):
Vite dev transforms this app's route chunks on first request. A cold route can
take 25-40s before React commits, so any script using a fixed short
`wait_for_timeout` captures the Suspense loader — a blank cream page.

This helper:
  1. Warms the route with a throw-away request so the transform cache is hot.
  2. Waits for REAL content (an <h1>/heading or a caller-supplied selector),
     not a timer, with a generous timeout.
  3. Waits for fonts + in-viewport images before capturing.
  4. Fails loudly (non-zero exit) if the page is still empty, so a blank PNG is
     never reported as proof.

Usage:
  python3 scripts/qa/shot.py /project/some-slug out.png
  python3 scripts/qa/shot.py /developer/x out.png --selector "[data-gallery]" --width 1440
"""
import argparse
import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
READY_FALLBACKS = ["main h1", "h1", "[data-report-page]", "main [data-loaded='1']"]


async def capture(path: str, out: str, selector: str | None, width: int, height: int, scroll_y: int) -> int:
    url = f"{BASE}{path if path.startswith('/') else '/' + path}"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": width, "height": height})
        page = await context.new_page()

        # Restore Lovable's injected owner session for protected-route proof.
        cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
        if cookies_json:
            cookies = json.loads(cookies_json)
            for cookie in cookies:
                cookie["url"] = BASE
            await context.add_cookies(cookies)
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        if storage_key and session_json:
            await page.goto(BASE, wait_until="domcontentloaded", timeout=120_000)
            await page.evaluate(
                "([key, value]) => window.localStorage.setItem(key, value)",
                [storage_key, session_json],
            )

        # Seed the requested skin (sun|moon) before first paint.
        theme = os.environ.get("JBJ_SHOT_THEME")
        if theme in ("sun", "moon"):
            await page.goto(BASE, wait_until="domcontentloaded", timeout=120_000)
            await page.evaluate(
                "(v) => window.localStorage.setItem('jbj-theme-mode', v)", theme
            )

        # 1. Warm the route (cold Vite transform) — ignore what we see here.
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=120_000)
            await page.wait_for_timeout(1500)
        except Exception as exc:  # noqa: BLE001
            print(f"warm-up navigation issue (continuing): {exc}")

        # 2. Real navigation + content wait.
        await page.goto(url, wait_until="domcontentloaded", timeout=120_000)
        targets = [selector] if selector else READY_FALLBACKS
        ready = None
        for sel in targets:
            try:
                await page.wait_for_selector(sel, timeout=90_000, state="visible")
                ready = sel
                break
            except Exception:  # noqa: BLE001, PERF203
                continue

        # 3. Fonts + images settled.
        try:
            await page.evaluate("document.fonts && document.fonts.ready")
        except Exception:  # noqa: BLE001
            pass
        if scroll_y > 0:
            await page.evaluate("y => window.scrollTo({ top: y, behavior: 'instant' })", scroll_y)
        await page.wait_for_timeout(2500)

        text = await page.evaluate("document.querySelector('main')?.innerText?.trim() || document.body.innerText.trim()")
        await page.screenshot(path=out)
        await browser.close()

    if not ready or len(text) < 40:
        print(f"BLANK PAGE: {url} rendered no content (ready={ready}, chars={len(text)}) — screenshot NOT valid proof")
        return 2
    print(f"OK {url} -> {out} (ready via {ready}, {len(text)} chars of text)")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("out")
    ap.add_argument("--selector", default=None)
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=1800)
    ap.add_argument("--scroll-y", type=int, default=0)
    args = ap.parse_args()
    sys.exit(asyncio.run(capture(args.path, args.out, args.selector, args.width, args.height, args.scroll_y)))


if __name__ == "__main__":
    main()
