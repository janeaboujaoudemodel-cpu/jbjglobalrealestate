#!/usr/bin/env python3
"""Convert a downloaded developer logo into a pure-white knockout PNG on transparency.

Usage: knockout.py <input> <output.png>

- Detects and removes a uniform background (light or dark), including baked-in
  white/coloured boxes, by flood-filling from the border colour.
- Paints every remaining (ink) pixel pure white, preserving the original alpha
  edges so the mark keeps its exact geometry and anti-aliasing.
- Trims to the tight ink bounds so the emerald plate can scale it consistently.
"""
import sys
from PIL import Image
import numpy as np


def load(path: str) -> Image.Image:
    im = Image.open(path)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    return im


def remove_background(im: Image.Image) -> Image.Image:
    a = np.array(im).astype(np.int16)
    rgb, alpha = a[..., :3], a[..., 3]

    # Already transparent artwork: keep its alpha.
    if (alpha < 16).mean() > 0.10:
        return im

    # Sample border pixels to infer the baked background colour.
    border = np.concatenate([
        rgb[0, :, :].reshape(-1, 3), rgb[-1, :, :].reshape(-1, 3),
        rgb[:, 0, :].reshape(-1, 3), rgb[:, -1, :].reshape(-1, 3),
    ])
    bg = np.median(border, axis=0)

    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    # Soft alpha: background -> 0, ink -> 255.
    new_alpha = np.clip((dist - 28) * 6, 0, 255).astype(np.uint8)
    out = a.copy()
    out[..., 3] = np.minimum(alpha, new_alpha)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def paint_white(im: Image.Image) -> Image.Image:
    a = np.array(im)
    a[..., 0] = 255
    a[..., 1] = 255
    a[..., 2] = 255
    return Image.fromarray(a, "RGBA")


def trim(im: Image.Image) -> Image.Image:
    a = np.array(im)
    mask = a[..., 3] > 12
    if not mask.any():
        return im
    ys, xs = np.where(mask)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    im = load(src)
    # Upscale small rasters before processing so edges stay smooth.
    if max(im.size) < 600:
        f = 600 / max(im.size)
        im = im.resize((int(im.width * f), int(im.height * f)), Image.LANCZOS)
    im = trim(paint_white(remove_background(im)))
    if max(im.size) > 1200:
        f = 1200 / max(im.size)
        im = im.resize((int(im.width * f), int(im.height * f)), Image.LANCZOS)
    im.save(dst)
    print(f"{dst} {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
