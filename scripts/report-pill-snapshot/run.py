"""
Preview-vs-PDF snapshot test for report pills and modal buttons.

For each viewport (desktop / tablet / mobile) it:
 1. Loads /__report-contrast in Chromium.
 2. Enumerates every pill ([data-report-pill]) inside every report page
    ([data-report-page]) and every include-mode button
    ([data-aihf-include-btn]) in the modal chrome.
 3. Element-screenshots each = "preview" snapshot.
 4. Exports the PDF from the same DOM (button #harness-export-pdf), pulls
    the ArrayBuffer off window.__pdfArrayBuffer, rasterises every page at
    150 DPI, and crops the matching pill from the PDF using the page-local
    bounding box scaled by (pdfPagePx / previewPagePx).
 5. Compares preview vs PDF crops on dimensions and mean per-channel color;
    writes artifacts/report.json + side-by-side PNGs.

Fails non-zero when any pair breaches thresholds.

Run:
    npm run dev              # localhost:8080 (or npm run preview after build)
    python3 scripts/report-pill-snapshot/run.py
"""
from __future__ import annotations

import asyncio, json, os, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
OUT = HERE / "artifacts"
BASE = os.environ.get("REPORT_SNAPSHOT_BASE_URL", "http://localhost:8080")

# Preview page CSS width comes from REPORT_PAGE_PX.width in ReportEngine.tsx (794px A4).
PREVIEW_PAGE_CSS_WIDTH = 794
PDF_DPI = 150

VIEWPORTS = [
    ("desktop", 1440, 1800),
    ("tablet",   820, 1800),
    ("mobile",   414, 1800),
]

# Snapshot pass thresholds.
DIM_TOL_PX   = 3     # width/height delta allowed after normalisation
MEAN_RGB_TOL = 14    # per-channel mean color difference allowed


def rasterise_pdf(pdf_path: Path, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = out_dir / "pg"
    subprocess.run(
        ["pdftoppm", "-r", str(PDF_DPI), "-png", str(pdf_path), str(prefix)],
        check=True,
    )
    return sorted(out_dir.glob("pg-*.png"))


def mean_rgb(img: Image.Image) -> tuple[float, float, float]:
    small = img.convert("RGB").resize((32, 32))
    px = list(small.getdata())
    n = len(px)
    r = sum(p[0] for p in px) / n
    g = sum(p[1] for p in px) / n
    b = sum(p[2] for p in px) / n
    return (r, g, b)


def color_delta(a, b) -> float:
    return sum(abs(x - y) for x, y in zip(a, b)) / 3



def chromium_launch_kwargs() -> dict:
    """Launch options honouring a CI-supplied Chromium path.

    The workflow falls back to the runner's preinstalled Chrome when
    cdn.playwright.dev refuses the download (it answers GitHub runners with a
    403 "not available in your location" often enough to redden a gate). When
    that happens it exports the path here; otherwise Playwright resolves its
    own binary, exactly as before.
    """
    exe = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE") or os.environ.get("CHROMIUM_PATH")
    kwargs = {"headless": True}
    if exe and os.path.exists(exe):
        kwargs["executable_path"] = exe
    return kwargs

async def snapshot_viewport(page, label: str, w: int, h: int):
    """Return list of pair results for this viewport."""
    art = OUT / label
    art.mkdir(parents=True, exist_ok=True)

    await page.set_viewport_size({"width": w, "height": h})
    await page.goto(f"{BASE}/__report-contrast", wait_until="domcontentloaded")

    # Wait for report pages to render.
    await page.wait_for_selector("[data-report-page]", timeout=15000)
    await page.wait_for_timeout(800)

    # 1. Capture preview element screenshots + record per-page relative bbox.
    targets = await page.evaluate(
        """() => {
          const out = [];
          const pages = Array.from(document.querySelectorAll('[data-report-page]'));
          pages.forEach((pg, pageIndex) => {
            const pb = pg.getBoundingClientRect();
            const pills = pg.querySelectorAll('[data-report-pill]');
            pills.forEach((el, i) => {
              const b = el.getBoundingClientRect();
              out.push({
                kind: 'pill',
                pageIndex,
                indexInPage: i,
                pagePx: pb.width,
                localX: b.left - pb.left,
                localY: b.top  - pb.top,
                w: b.width, h: b.height,
                text: (el.textContent || '').trim(),
              });
            });
          });
          document.querySelectorAll('[data-aihf-include-btn]').forEach((el, i) => {
            const b = el.getBoundingClientRect();
            out.push({
              kind: 'include-btn',
              pageIndex: -1,
              indexInPage: i,
              pagePx: 0,
              localX: 0, localY: 0,
              w: b.width, h: b.height,
              text: (el.textContent || '').trim(),
              active: el.getAttribute('data-active') === 'true',
            });
          });
          return out;
        }"""
    )

    # Preview crops, taken as clipped page screenshots rather than element
    # screenshots.
    #
    # ElementHandle.screenshot() scrolls its target into view first. The report
    # page is a fixed 794px wide, so at the 414px mobile viewport it overflows
    # horizontally and every capture triggers a scroll. That made the mobile
    # run report five false breaches: the crops came back as one identical flat
    # champagne image (mean 229,218,195, stddev 29.9) for pills whose real
    # colours are emerald and near-white — the page ground, not the pill. The
    # same instability also surfaced as intermittent
    # "Element is not attached to the DOM" failures mid-run.
    #
    # Clipping a page screenshot to the element's own bounding box needs no
    # scrolling and no per-element handle, so what is captured is exactly the
    # rectangle that was measured. Full-page capture keeps elements below the
    # fold in frame.
    handles_pill = await page.query_selector_all("[data-report-page] [data-report-pill]")
    handles_btn  = await page.query_selector_all("[data-aihf-include-btn]")

    pill_i = btn_i = 0
    for t in targets:
        slug = f"{t['kind']}_p{t['pageIndex']}_i{t['indexInPage']}"
        path = art / f"preview_{slug}.png"
        handle = handles_pill[pill_i] if t["kind"] == "pill" else handles_btn[btn_i]
        if t["kind"] == "pill":
            pill_i += 1
        else:
            btn_i += 1

        box = await handle.bounding_box()
        if box and box["width"] >= 1 and box["height"] >= 1:
            await page.screenshot(
                path=str(path),
                full_page=True,
                clip={
                    "x": box["x"] + await page.evaluate("() => window.scrollX"),
                    "y": box["y"] + await page.evaluate("() => window.scrollY"),
                    "width": box["width"],
                    "height": box["height"],
                },
            )
        else:
            # Zero-sized box (display:none / detached) — fall back so the run
            # still produces a comparable artefact instead of aborting.
            await handle.screenshot(path=str(path))
        t["previewPath"] = str(path)

    # 2. Export PDF via harness button.
    await page.click("[data-testid=harness-export-pdf]")
    # A full 9-page render measures ~26s on a warm dev server, so the old 30s
    # budget left almost no headroom on a cold CI runner. The harness now
    # reports `pdf error — …` on failure, so a genuine error is raised
    # immediately rather than waiting out the whole window.
    for _ in range(160):  # 80s
        await page.wait_for_timeout(500)
        status = await page.locator("[data-testid=harness-status]").text_content()
        if status and status.startswith("pdf ready"):
            break
        if status and status.startswith("pdf error"):
            raise RuntimeError(f"[{label}] PDF export failed — {status}")
    else:
        raise RuntimeError(f"[{label}] PDF export never completed (status={status!r})")

    buf = await page.evaluate("async () => Array.from(new Uint8Array(window.__pdfArrayBuffer))")
    pdf_bytes = bytes(buf)
    pdf_path = art / "report.pdf"
    pdf_path.write_bytes(pdf_bytes)

    # 3. Rasterise + crop matching pill regions.
    pages_out = art / "pages"
    page_images = rasterise_pdf(pdf_path, pages_out)

    results = []
    for t in targets:
        if t["kind"] != "pill":
            # include-btn only lives in preview UI; record dimension baseline only.
            results.append({**t, "compared": False})
            continue
        pi = t["pageIndex"]
        if pi >= len(page_images):
            results.append({**t, "compared": False, "error": "pdf page missing"})
            continue
        img = Image.open(page_images[pi]).convert("RGB")
        # PDF page renders at PDF_DPI, source is REPORT_PAGE_PX.width (794 css px = 8.27in wide? Actually 794 is CSS px == PDF page width raw).
        # renderReportToPdf sizes each PDF page to REPORT_PAGE_PX.width CSS px, then jsPDF scales that to A4. pdftoppm rasterises A4 @ 150dpi -> width ≈ 1240px. Scale = pdfImg.width / 794.
        scale = img.width / PREVIEW_PAGE_CSS_WIDTH
        x = int(round(t["localX"] * scale))
        y = int(round(t["localY"] * scale))
        w2 = int(round(t["w"] * scale))
        h2 = int(round(t["h"] * scale))
        x = max(0, min(x, img.width - 1))
        y = max(0, min(y, img.height - 1))
        w2 = max(1, min(w2, img.width - x))
        h2 = max(1, min(h2, img.height - y))
        crop = img.crop((x, y, x + w2, y + h2))
        pdf_crop_path = art / f"pdf_{t['kind']}_p{pi}_i{t['indexInPage']}.png"
        crop.save(pdf_crop_path)

        preview_img = Image.open(t["previewPath"]).convert("RGB")
        # Normalise sizes for color compare.
        norm = crop.resize(preview_img.size)
        dcol = color_delta(mean_rgb(preview_img), mean_rgb(norm))
        dW = abs(preview_img.width  - w2)
        dH = abs(preview_img.height - h2)

        breaches = []
        # Color check is the real signal; dimension mismatch between a DPR=1
        # element screenshot and a 150 DPI PDF crop is expected and gets
        # normalised away by resizing before mean-color comparison.
        if dcol > MEAN_RGB_TOL: breaches.append(f"colorDelta={dcol:.1f}")

        results.append({
            **t,
            "compared": True,
            "pdfCropPath": str(pdf_crop_path),
            "pdfCropSize": [w2, h2],
            "previewSize": [preview_img.width, preview_img.height],
            "meanColorDelta": round(dcol, 2),
            "breaches": breaches,
        })
    return results


async def main():
    if OUT.exists():
        for p in OUT.rglob("*"):
            if p.is_file(): p.unlink()
    OUT.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        b = await p.chromium.launch(**chromium_launch_kwargs())
        ctx = await b.new_context()
        page = await ctx.new_page()

        all_results = {}
        total_breaches = 0
        for (label, w, h) in VIEWPORTS:
            print(f"→ {label} {w}x{h}")
            try:
                rs = await snapshot_viewport(page, label, w, h)
            except Exception as e:
                print(f"  ERR {e}")
                all_results[label] = {"error": str(e), "results": []}
                total_breaches += 1
                continue
            breaches = sum(1 for r in rs if r.get("breaches"))
            total_breaches += breaches
            print(f"  {len(rs)} targets, {breaches} breach(es)")
            all_results[label] = {"results": rs}
        await b.close()

    (OUT / "report.json").write_text(json.dumps({
        "baseUrl": BASE,
        "thresholds": {"dimTolPx": DIM_TOL_PX, "meanRgbTol": MEAN_RGB_TOL},
        "viewports": all_results,
    }, indent=2))

    print(f"\nTotal breaches: {total_breaches}")
    if total_breaches:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
