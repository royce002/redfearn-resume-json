#!/usr/bin/env python3
"""Sync assets/images to Cloudflare R2 (images/ prefix)."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets" / "images"
RESUME = ROOT / "data" / "resume.json"
ENV_FILE = ROOT / ".env"
R2_PREFIX = "images/"
IMAGE_SUFFIXES = {".webp", ".svg", ".ico", ".webmanifest"}
KEEP_LOCAL = {"image-grabber.py", "urls.txt", ".gitkeep"}


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.is_file():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        val = val.strip().strip('"').strip("'")
        env[key.strip()] = val
    return env


def add_file_name(names: set[str], file_val: object) -> None:
    if isinstance(file_val, str) and file_val and not file_val.startswith(("http://", "https://", "/")):
        names.add(file_val.split("/")[-1])


def collect_from_logos(names: set[str]) -> None:
    logos_path = ROOT / "data" / "logos.txt"
    if not logos_path.is_file():
        return
    for line in logos_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "\t" not in line:
            continue
        _, _, val = line.partition("\t")
        val = val.split("#", 1)[0].strip()
        if not val or val.lower() == "text":
            continue
        if val.startswith("https://"):
            continue
        if val.startswith("/assets/images/"):
            val = val[len("/assets/images/") :]
        if "." in Path(val).name:
            names.add(val.replace("\\", "/"))


def collect_from_resume(names: set[str]) -> None:
    if not RESUME.is_file():
        return
    data = json.loads(RESUME.read_text(encoding="utf-8"))
    for job in data.get("experience", []):
        for item in job.get("gallery") or []:
            if isinstance(item, dict):
                add_file_name(names, item.get("file"))
                for variant in item.get("srcsetVariants") or []:
                    if isinstance(variant, dict):
                        add_file_name(names, variant.get("file"))
        for item in job.get("agencyGrid") or []:
            if isinstance(item, dict):
                add_file_name(names, item.get("file"))
        for item in job.get("brandGrid") or []:
            if isinstance(item, dict):
                add_file_name(names, item.get("file"))
    portfolio = data.get("portfolio") or {}
    for partner in (portfolio.get("agency") or {}).get("partners") or []:
        if isinstance(partner, dict):
            add_file_name(names, partner.get("file"))
    for file in (portfolio.get("showcase") or {}).get("gridOrder") or []:
        add_file_name(names, file)


def collect_files() -> set[str]:
    names: set[str] = set()
    collect_from_resume(names)
    collect_from_logos(names)
    if IMAGES.is_dir():
        for path in IMAGES.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
                continue
            if path.name in KEEP_LOCAL or "__pycache__" in path.parts:
                continue
            names.add(path.relative_to(IMAGES).as_posix())
    return names


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload assets/images to Cloudflare R2")
    parser.add_argument(
        "--delete-local",
        action="store_true",
        help="Remove uploaded files from assets/images after successful upload",
    )
    args = parser.parse_args()

    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        print("Install boto3: pip install boto3", file=sys.stderr)
        return 1

    env = {**os.environ, **load_env(ENV_FILE)}
    required = (
        "CLOUDFLARE_ACCESS_KEY_ID",
        "CLOUDFLARE_SECRET_ACCESS_KEY",
        "CLOUDFLARE_S3_API",
        "CLOUDFLARE_S3_BUCKET",
    )
    missing = [k for k in required if not env.get(k)]
    if missing:
        print(f"Missing in .env: {', '.join(missing)}", file=sys.stderr)
        return 1

    client = boto3.client(
        "s3",
        endpoint_url=env["CLOUDFLARE_S3_API"].rstrip("/"),
        aws_access_key_id=env["CLOUDFLARE_ACCESS_KEY_ID"],
        aws_secret_access_key=env["CLOUDFLARE_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )
    bucket = env["CLOUDFLARE_S3_BUCKET"]
    names = sorted(collect_files())
    ok = 0
    skip = 0
    fail = 0
    uploaded_paths: list[Path] = []

    print(f"Bucket: {bucket}  Prefix: {R2_PREFIX}  Files: {len(names)}")

    for name in names:
        rel = name.replace("\\", "/")
        local = IMAGES / rel
        if not local.is_file():
            print(f"  [skip] missing locally: {rel}")
            skip += 1
            continue
        key = R2_PREFIX + rel
        ctype, _ = mimetypes.guess_type(rel)
        extra = {"ContentType": ctype or "application/octet-stream"}
        try:
            client.upload_file(str(local), bucket, key, ExtraArgs=extra)
            print(f"  [ok] {key}")
            ok += 1
            uploaded_paths.append(local)
        except Exception as exc:
            print(f"  [fail] {name}: {exc}", file=sys.stderr)
            fail += 1

    if args.delete_local and fail == 0:
        for path in uploaded_paths:
            try:
                rel = path.relative_to(IMAGES)
                path.unlink()
                print(f"  [removed] {rel.as_posix()}")
            except OSError as exc:
                print(f"  [warn] could not remove {path}: {exc}", file=sys.stderr)
        for subdir in sorted(IMAGES.rglob("*"), key=lambda p: len(p.parts), reverse=True):
            if subdir.is_dir() and not any(subdir.iterdir()):
                try:
                    subdir.rmdir()
                    print(f"  [removed dir] {subdir.relative_to(IMAGES).as_posix()}")
                except OSError:
                    pass

    print(f"Done: {ok} uploaded, {skip} skipped, {fail} failed")
    print("Public base: https://assets.redfearn.co/images/")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
