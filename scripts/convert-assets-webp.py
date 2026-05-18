#!/usr/bin/env python3
"""Convert all raster files under assets/images to WebP and remove originals."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets" / "images"
sys.path.insert(0, str(ROOT / "scripts"))

from image_webp import is_raster, save_as_webp  # noqa: E402

SKIP_DIRS = {"__pycache__"}
KEEP_NAMES = {"image-grabber.py", "urls.txt", ".gitkeep"}


def main() -> int:
    if not IMAGES.is_dir():
        print(f"Not found: {IMAGES}")
        return 1

    converted = skipped = 0
    for path in sorted(IMAGES.rglob("*")):
        if not path.is_file():
            continue
        if any(p in SKIP_DIRS for p in path.parts):
            continue
        if path.name in KEEP_NAMES:
            continue
        if not is_raster(path):
            continue
        dest = save_as_webp(path, path)
        path.unlink()
        print(f"  [webp] {dest.relative_to(IMAGES).as_posix()}")
        converted += 1

    print(f"Done: {converted} converted, {skipped} skipped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
