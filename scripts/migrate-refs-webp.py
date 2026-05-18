#!/usr/bin/env python3
"""Rewrite resume.json, logos.txt, and patch script refs from raster ext → .webp."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys_path = ROOT / "scripts"
import sys

sys.path.insert(0, str(sys_path))
from image_webp import ref_to_webp  # noqa: E402

RASTER_IN_REF = re.compile(r"\.(jpe?g|png|gif|bmp)\b", re.I)


def migrate_text(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        return ref_to_webp(m.group(0))

    return RASTER_IN_REF.sub(lambda m: ref_to_webp(m.group(0)), text)


def migrate_json_obj(obj: object) -> object:
    if isinstance(obj, dict):
        return {k: migrate_json_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [migrate_json_obj(v) for v in obj]
    if isinstance(obj, str) and RASTER_IN_REF.search(obj):
        return migrate_text(obj)
    return obj


def main() -> int:
    files = [
        ROOT / "data" / "resume.json",
        ROOT / "data" / "logos.txt",
        ROOT / "scripts" / "patch_resume_descriptions.py",
    ]
    for path in files:
        if not path.is_file():
            continue
        raw = path.read_text(encoding="utf-8-sig")
        if path.suffix == ".json":
            data = json.loads(raw)
            data = migrate_json_obj(data)
            path.write_text(json.dumps(data, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
        else:
            path.write_text(migrate_text(raw), encoding="utf-8")
        print(f"  [ok] {path.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
