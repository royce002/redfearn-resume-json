#!/usr/bin/env python3
"""Download all objects from Cloudflare R2 bucket to a local folder."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets" / "images"
ENV_FILE = ROOT / ".env"
DEFAULT_PREFIX = "images/"


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


def main() -> int:
    import argparse
    parser = argparse.ArgumentParser(
        description="Download R2 objects to a local folder (default: assets/images)."
    )
    parser.add_argument(
        "dest",
        type=Path,
        nargs="?",
        default=IMAGES,
        help="Local destination folder (default: assets/images)",
    )
    parser.add_argument(
        "--prefix",
        default=DEFAULT_PREFIX,
        help=f"Only keys under this prefix (default: {DEFAULT_PREFIX!r}); stripped from local paths",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Download entire bucket (ignore --prefix filter; keep full key paths)",
    )
    parser.add_argument("--env", type=Path, default=ENV_FILE)
    args = parser.parse_args()

    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        print("Install boto3: pip install boto3", file=sys.stderr)
        return 1

    env = {**os.environ, **load_env(args.env)}
    required = ("CLOUDFLARE_ACCESS_KEY_ID", "CLOUDFLARE_SECRET_ACCESS_KEY",
                "CLOUDFLARE_S3_API", "CLOUDFLARE_S3_BUCKET")
    missing = [k for k in required if not env.get(k)]
    if missing:
        print(f"Missing in {args.env}: {', '.join(missing)}", file=sys.stderr)
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
    dest = args.dest.resolve()
    dest.mkdir(parents=True, exist_ok=True)

    prefix = "" if args.all else args.prefix.replace("\\", "/")
    if prefix and not prefix.endswith("/"):
        prefix += "/"

    paginator = client.get_paginator("list_objects_v2")
    list_kwargs: dict = {"Bucket": bucket}
    if prefix:
        list_kwargs["Prefix"] = prefix
    objects = []
    for page in paginator.paginate(**list_kwargs):
        objects.extend(page.get("Contents", []))

    if not objects:
        print("No objects found." + (f" (prefix={prefix!r})" if prefix else ""))
        return 0

    print(f"Bucket : {bucket}")
    print(f"Prefix : {prefix or '(all)'}")
    print(f"Objects: {len(objects)}")
    print(f"Dest   : {dest}")

    ok = fail = skip = 0
    for obj in objects:
        key = obj["Key"]
        if key.endswith("/"):
            skip += 1
            continue
        rel = key if args.all or not prefix else key[len(prefix) :]
        if not rel:
            skip += 1
            continue
        local = dest / Path(rel)
        local.parent.mkdir(parents=True, exist_ok=True)
        try:
            client.download_file(bucket, key, str(local))
            print(f"  [ok] {key}")
            ok += 1
        except Exception as exc:
            print(f"  [fail] {key}: {exc}", file=sys.stderr)
            fail += 1

    print(f"\nDone: {ok} downloaded, {skip} skipped (folders), {fail} failed")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
