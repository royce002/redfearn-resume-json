#!/usr/bin/env python3
"""Shared raster → WebP helpers (SVG passes through unchanged)."""

from __future__ import annotations

import shutil
from pathlib import Path

RASTER_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff"}
WEBP_QUALITY = 85


def is_raster(path: Path) -> bool:
    return path.suffix.lower() in RASTER_SUFFIXES


def webp_path(path: Path | str) -> Path:
    p = Path(path)
    if p.suffix.lower() == ".webp":
        return p
    if p.suffix.lower() in RASTER_SUFFIXES or p.suffix == "":
        return p.with_suffix(".webp")
    return p


def ref_to_webp(ref: str) -> str:
    """Map a site asset reference (path string) to .webp when raster."""
    lower = ref.lower()
    for ext in (".jpeg", ".jpg", ".png", ".gif", ".bmp"):
        if lower.endswith(ext):
            return ref[: -len(ext)] + ".webp"
    return ref


def save_as_webp(src: Path, dest: Path, *, quality: int = WEBP_QUALITY) -> Path:
    """Write raster source to WebP at dest (suffix forced to .webp)."""
    from PIL import Image

    dest = webp_path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)

    if src.suffix.lower() == ".svg":
        shutil.copy2(src, dest.with_suffix(".svg"))
        return dest.with_suffix(".svg")

    with Image.open(src) as img:
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
            img.save(dest, "WEBP", quality=quality, method=6, lossless=False)
        else:
            img = img.convert("RGB")
            img.save(dest, "WEBP", quality=quality, method=6)
    return dest


def import_to_webp(src: Path, dest_rel: str, dest_root: Path) -> Path | None:
    if not src.is_file():
        return None
    dest = webp_path(dest_root / dest_rel.replace("\\", "/"))
    if src.suffix.lower() == ".svg":
        dest = dest_root / dest_rel.replace("\\", "/")
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        return dest
    return save_as_webp(src, dest)
