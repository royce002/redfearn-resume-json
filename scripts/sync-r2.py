#!/usr/bin/env python3
"""Mirror a local folder to Cloudflare R2 (aws s3 sync equivalent via boto3)."""

from __future__ import annotations

import argparse
import mimetypes
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.is_file():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        env[key.strip()] = val.strip().strip('"').strip("'")
    return env


def iter_local_files(source: Path) -> list[Path]:
    if not source.is_dir():
        return []
    return [p for p in source.rglob("*") if p.is_file()]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sync a local directory to Cloudflare R2 (no AWS CLI required)"
    )
    parser.add_argument(
        "source",
        type=Path,
        help="Local folder to upload (e.g. C:\\projects\\redfearn.co\\redfearn-assets)",
    )
    parser.add_argument(
        "--prefix",
        default="",
        help="Object key prefix inside the bucket (e.g. images/ for assets.redfearn.co/images/)",
    )
    parser.add_argument(
        "--env",
        type=Path,
        default=ENV_FILE,
        help="Path to .env with CLOUDFLARE_* keys",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List files only; do not upload",
    )
    args = parser.parse_args()

    source = args.source.resolve()
    if not source.is_dir():
        print(f"Source not found: {source}", file=sys.stderr)
        return 1

    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        print("Install boto3: pip install boto3", file=sys.stderr)
        return 1

    env = {**os.environ, **load_env(args.env)}
    required = (
        "CLOUDFLARE_ACCESS_KEY_ID",
        "CLOUDFLARE_SECRET_ACCESS_KEY",
        "CLOUDFLARE_S3_API",
        "CLOUDFLARE_S3_BUCKET",
    )
    missing = [k for k in required if not env.get(k)]
    if missing:
        print(f"Missing in {args.env}: {', '.join(missing)}", file=sys.stderr)
        return 1

    prefix = args.prefix.replace("\\", "/")
    if prefix and not prefix.endswith("/"):
        prefix += "/"

    files = iter_local_files(source)
    if not files:
        print(f"No files under {source}")
        return 0

    client = boto3.client(
        "s3",
        endpoint_url=env["CLOUDFLARE_S3_API"].rstrip("/"),
        aws_access_key_id=env["CLOUDFLARE_ACCESS_KEY_ID"],
        aws_secret_access_key=env["CLOUDFLARE_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )
    bucket = env["CLOUDFLARE_S3_BUCKET"]

    print(f"Bucket: {bucket}")
    print(f"Endpoint: {env['CLOUDFLARE_S3_API']}")
    print(f"Source: {source}")
    print(f"Prefix: {prefix or '(bucket root)'}")
    print(f"Files: {len(files)}")
    if args.dry_run:
        print("(dry run)")

    ok = fail = 0
    for path in sorted(files):
        rel = path.relative_to(source).as_posix()
        key = prefix + rel
        if args.dry_run:
            print(f"  [dry] {key}")
            ok += 1
            continue
        ctype, _ = mimetypes.guess_type(rel)
        extra = {"ContentType": ctype or "application/octet-stream"}
        try:
            client.upload_file(str(path), bucket, key, ExtraArgs=extra)
            print(f"  [ok] {key}")
            ok += 1
        except Exception as exc:
            print(f"  [fail] {key}: {exc}", file=sys.stderr)
            fail += 1

    print(f"Done: {ok} uploaded, {fail} failed")
    public = "https://assets.redfearn.co/"
    print(f"Public base: {public}{prefix}")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
