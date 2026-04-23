#!/usr/bin/env python3
"""
Visual Diff Report
==================

Generate a per-page pixel-level visual diff between two PDFs and emit a single,
self-contained HTML report (all images embedded as base64).

Usage:
    python scripts/visual_diff_report.py <baseline.pdf> <candidate.pdf> <output.html>

Example (sanity check — baseline vs baseline, expect 0% diff everywhere):
    python scripts/visual_diff_report.py \
        public/documents/JBJ-Global-Real-Estate-Company-Profile.pdf \
        public/documents/JBJ-Global-Real-Estate-Company-Profile.pdf \
        /mnt/documents/company-profile-visual-diff.html

Requirements:
    - poppler-utils (pdftoppm)  OR  pypdfium2 (pip install pypdfium2)
    - Pillow, numpy             (pip install pillow numpy)
"""

import base64
import io
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

DPI = 150
PIXEL_TOLERANCE = 8        # 0–255 per-channel diff considered "noise"
MINOR_THRESHOLD_PCT = 0.5  # < 0.5% changed pixels => "minor"
MAJOR_THRESHOLD_PCT = 5.0  # >= 5% changed pixels => "major"
MAX_PREVIEW_WIDTH = 900    # downscale embedded preview width for HTML weight


def rasterize(pdf_path: Path, out_dir: Path, prefix: str) -> list[Path]:
    """Rasterize a PDF to one PNG per page. Prefer pdftoppm; fall back to pypdfium2."""
    if shutil.which("pdftoppm"):
        subprocess.run(
            ["pdftoppm", "-png", "-r", str(DPI), str(pdf_path), str(out_dir / prefix)],
            check=True,
        )
        return sorted(out_dir.glob(f"{prefix}-*.png"))

    # Fallback
    import pypdfium2 as pdfium  # type: ignore

    pdf = pdfium.PdfDocument(str(pdf_path))
    pages = []
    for i, page in enumerate(pdf, start=1):
        pil = page.render(scale=DPI / 72).to_pil()
        p = out_dir / f"{prefix}-{i:03d}.png"
        pil.save(p)
        pages.append(p)
    return pages


def blank_like(ref: Image.Image) -> Image.Image:
    return Image.new("RGB", ref.size, (255, 255, 255))


def compute_diff(base_img: Image.Image, cand_img: Image.Image):
    """Return (changed_pct, overlay_image)."""
    if base_img.size != cand_img.size:
        cand_img = cand_img.resize(base_img.size, Image.LANCZOS)

    a = np.asarray(base_img.convert("RGB"), dtype=np.int16)
    b = np.asarray(cand_img.convert("RGB"), dtype=np.int16)

    diff = np.abs(a - b).max(axis=2)               # per-pixel max channel delta
    changed_mask = diff > PIXEL_TOLERANCE          # bool HxW
    changed_pct = float(changed_mask.mean() * 100)

    # Build overlay: desaturated baseline + red wash on changed pixels
    gray = np.asarray(base_img.convert("L"), dtype=np.uint8)
    overlay = np.stack([gray, gray, gray], axis=2).astype(np.uint8)
    # Lighten so the red pops
    overlay = (overlay.astype(np.uint16) * 7 // 10 + 76).clip(0, 255).astype(np.uint8)
    red = np.array([220, 38, 38], dtype=np.uint8)  # tailwind red-600
    overlay[changed_mask] = red

    return changed_pct, Image.fromarray(overlay, mode="RGB")


def to_data_uri(img: Image.Image, max_width: int = MAX_PREVIEW_WIDTH) -> str:
    if img.width > max_width:
        h = int(img.height * (max_width / img.width))
        img = img.resize((max_width, h), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def verdict(pct: float) -> tuple[str, str]:
    if pct < 1e-6:
        return "identical", "#0f766e"     # teal-700
    if pct < MINOR_THRESHOLD_PCT:
        return "minor", "#65a30d"         # lime-600
    if pct < MAJOR_THRESHOLD_PCT:
        return "moderate", "#d97706"      # amber-600
    return "major", "#dc2626"             # red-600


HTML_HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Visual Diff Report — {baseline_name} vs {candidate_name}</title>
<style>
  :root { color-scheme: light; }
  body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
         margin: 0; padding: 32px; color: #0f172a; background: #f8fafc; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #64748b; margin-bottom: 24px; font-size: 13px; }
  .summary { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
             padding: 16px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  th { color: #475569; font-weight: 600; background: #f8fafc; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px;
          color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
  .page { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 16px; margin-bottom: 20px; }
  .page header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .page h2 { font-size: 16px; margin: 0; }
  .triptych { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .triptych figure { margin: 0; }
  .triptych figcaption { font-size: 11px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
  .triptych img { width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; display: block; }
  .stats { font-size: 12px; color: #475569; margin-top: 8px; }
  a { color: inherit; }
</style>
</head>
<body>
<h1>Visual Diff Report</h1>
<div class="meta">
  Baseline: <code>{baseline_path}</code><br/>
  Candidate: <code>{candidate_path}</code><br/>
  DPI: {dpi} · Per-channel tolerance: {tol} · Generated: {ts}
</div>
"""


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(2)

    baseline = Path(sys.argv[1]).resolve()
    candidate = Path(sys.argv[2]).resolve()
    out_html = Path(sys.argv[3]).resolve()
    out_html.parent.mkdir(parents=True, exist_ok=True)

    if not baseline.exists():
        sys.exit(f"Baseline not found: {baseline}")
    if not candidate.exists():
        sys.exit(f"Candidate not found: {candidate}")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        print(f"Rasterizing baseline: {baseline.name}")
        base_pages = rasterize(baseline, tmp_path, "base")
        print(f"Rasterizing candidate: {candidate.name}")
        cand_pages = rasterize(candidate, tmp_path, "cand")

        n = max(len(base_pages), len(cand_pages))
        print(f"Comparing {n} page(s)...")

        rows = []   # (page, pct, verdict_label, color, base_uri, cand_uri, diff_uri, present)
        for i in range(n):
            bp = base_pages[i] if i < len(base_pages) else None
            cp = cand_pages[i] if i < len(cand_pages) else None

            if bp is not None:
                base_img = Image.open(bp).convert("RGB")
            else:
                base_img = blank_like(Image.open(cp).convert("RGB"))

            if cp is not None:
                cand_img = Image.open(cp).convert("RGB")
            else:
                cand_img = blank_like(base_img)

            pct, overlay = compute_diff(base_img, cand_img)
            label, color = verdict(pct)

            rows.append({
                "page": i + 1,
                "pct": pct,
                "label": label,
                "color": color,
                "base": to_data_uri(base_img),
                "cand": to_data_uri(cand_img),
                "diff": to_data_uri(overlay),
                "missing_baseline": bp is None,
                "missing_candidate": cp is None,
            })
            print(f"  page {i+1}: {pct:.4f}% changed -> {label}")

        from datetime import datetime
        head = HTML_HEAD.format(
            baseline_name=baseline.name,
            candidate_name=candidate.name,
            baseline_path=str(baseline),
            candidate_path=str(candidate),
            dpi=DPI,
            tol=PIXEL_TOLERANCE,
            ts=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )

        # Summary
        total_changed = sum(1 for r in rows if r["pct"] > 0)
        avg_pct = sum(r["pct"] for r in rows) / len(rows) if rows else 0.0
        worst = max(rows, key=lambda r: r["pct"]) if rows else None

        summary = ['<div class="summary">']
        summary.append(f"<h2 style='margin:0 0 8px;font-size:15px;'>Summary</h2>")
        summary.append(
            f"<div class='stats'>"
            f"Pages compared: <strong>{len(rows)}</strong> · "
            f"Pages with changes: <strong>{total_changed}</strong> · "
            f"Average changed pixels: <strong>{avg_pct:.4f}%</strong>"
            + (f" · Worst page: <strong>#{worst['page']}</strong> ({worst['pct']:.4f}%)" if worst else "")
            + "</div>"
        )
        summary.append("<table style='margin-top:12px;'>")
        summary.append("<thead><tr><th>Page</th><th>% changed</th><th>Verdict</th><th></th></tr></thead><tbody>")
        for r in rows:
            note = ""
            if r["missing_baseline"]: note = " (no baseline page)"
            elif r["missing_candidate"]: note = " (no candidate page)"
            summary.append(
                f"<tr><td>#{r['page']}</td>"
                f"<td>{r['pct']:.4f}%</td>"
                f"<td><span class='pill' style='background:{r['color']}'>{r['label']}</span>{note}</td>"
                f"<td><a href='#page-{r['page']}'>view ↓</a></td></tr>"
            )
        summary.append("</tbody></table></div>")

        # Per-page sections
        sections = []
        for r in rows:
            sections.append(f"<section class='page' id='page-{r['page']}'>")
            sections.append(
                f"<header><h2>Page {r['page']}</h2>"
                f"<span class='pill' style='background:{r['color']}'>{r['label']} · {r['pct']:.4f}%</span></header>"
            )
            sections.append("<div class='triptych'>")
            sections.append(f"<figure><figcaption>Baseline</figcaption><img src='{r['base']}' alt='baseline page {r['page']}'/></figure>")
            sections.append(f"<figure><figcaption>Candidate</figcaption><img src='{r['cand']}' alt='candidate page {r['page']}'/></figure>")
            sections.append(f"<figure><figcaption>Diff overlay (red = changed)</figcaption><img src='{r['diff']}' alt='diff page {r['page']}'/></figure>")
            sections.append("</div>")
            if r["missing_baseline"]:
                sections.append("<div class='stats'>⚠ Baseline has no page here — candidate-only page treated as 100% new content.</div>")
            if r["missing_candidate"]:
                sections.append("<div class='stats'>⚠ Candidate is missing this page — treated as fully removed.</div>")
            sections.append("</section>")

        html = head + "\n".join(summary) + "\n".join(sections) + "\n</body></html>"
        out_html.write_text(html, encoding="utf-8")
        size_kb = out_html.stat().st_size / 1024
        print(f"\n✓ Wrote {out_html} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
