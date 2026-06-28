import asyncio
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8080"
ROUTES = ["/", "/projects", "/developers", "/faq"]


async def assert_normal_scroll(page, route: str):
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    await page.evaluate("sessionStorage.setItem('jj_intro_seen', '1')")
    await page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded")
    await page.wait_for_timeout(900)
    await page.mouse.move(560, 426)
    await page.evaluate("window.scrollTo({ top: 0, behavior: 'auto' })")
    await page.wait_for_timeout(80)

    can_scroll = await page.evaluate("document.documentElement.scrollHeight > window.innerHeight + 20")
    if not can_scroll:
        return {"route": route, "moves": [], "total": 0, "skipped": True}

    moves = []
    for _ in range(6):
        before = await page.evaluate("window.scrollY")
        await page.mouse.wheel(0, 80)
        await page.wait_for_timeout(120)
        after = await page.evaluate("window.scrollY")
        moves.append(after - before)

    positive_moves = [move for move in moves if move > 0]
    biggest_move = max(moves)
    total_move = sum(moves)

    if len(positive_moves) < 5:
        raise AssertionError(f"{route}: wheel input did not consistently scroll ({moves})")
    if biggest_move > 220:
        raise AssertionError(f"{route}: small wheel input jumped too far ({moves})")
    if total_move < 300 or total_move > 950:
        raise AssertionError(f"{route}: total scroll distance is abnormal ({total_move}; {moves})")

    return {"route": route, "moves": moves, "total": total_move}


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1121, "height": 853}, device_scale_factor=2)
        page = await context.new_page()
        results = []
        for route in ROUTES:
            results.append(await assert_normal_scroll(page, route))
        await browser.close()
        print({"ok": True, "results": results})


if __name__ == "__main__":
    asyncio.run(main())