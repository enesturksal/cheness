#!/usr/bin/env python3
"""Generate PWA icons (PNG) for public/. Run: .venv/Scripts/python tools/make_icons.py"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public"
BG = (0x16, 0x15, 0x12)
GREEN = (0x86, 0xB6, 0x4B)
LIGHT = (0xE8, 0xE4, 0xDA)


def draw_icon(size: int, radius_ratio: float = 0.22, padding_ratio: float = 0.0) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = int(size * padding_ratio)
    d.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=int(size * radius_ratio), fill=BG)
    # 4x4 checker of green squares inside the safe area
    inner = size - 2 * pad
    cell = inner * 10 / 64
    origin = pad + inner * 12 / 64
    for row in range(4):
        for col in range(4):
            if (row + col) % 2 == 0:
                x = origin + col * cell
                y = origin + row * cell
                d.rectangle([x, y, x + cell, y + cell], fill=GREEN)
    # diagonal "line" stroke
    w = max(2, int(inner * 5 / 64))
    d.line(
        [(pad + inner * 14 / 64, pad + inner * 50 / 64), (pad + inner * 50 / 64, pad + inner * 14 / 64)],
        fill=LIGHT,
        width=w,
    )
    return img


def main() -> None:
    OUT.mkdir(exist_ok=True)
    draw_icon(192).save(OUT / "icon-192.png")
    draw_icon(512).save(OUT / "icon-512.png")
    # Apple touch icons are shown without rounding; keep a solid square background.
    apple = Image.new("RGB", (180, 180), BG)
    apple.paste(draw_icon(180, radius_ratio=0.0), (0, 0), draw_icon(180, radius_ratio=0.0))
    apple.save(OUT / "apple-touch-icon.png")
    print("wrote icon-192.png, icon-512.png, apple-touch-icon.png")


if __name__ == "__main__":
    main()
