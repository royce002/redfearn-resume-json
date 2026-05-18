#!/usr/bin/env python3
"""Copy archive/index_files into assets/images as SEO-named WebP (SVG unchanged)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from image_webp import import_to_webp, webp_path  # noqa: E402

ARCHIVE = ROOT / "archive" / "index_files"
DEST = ROOT / "assets" / "images"

SHOWCASE_THUMBS: list[tuple[str, str]] = [
    ("1-thumb.jpg", "fort-worth-web-developer-client-logo-agency-portfolio.webp"),
    ("2-thumb.jpg", "dfw-wordpress-developer-brand-mark-client-logo.webp"),
    ("3-thumb.jpg", "north-texas-web-developer-agency-client-brand.webp"),
    ("35-thumb.jpg", "fort-worth-frontend-developer-portfolio-client-logo.webp"),
    ("5-thumb.jpg", "fort-worth-web-developer-agency-project-site.webp"),
    ("38-thumb.jpg", "dfw-php-developer-client-website-portfolio.webp"),
    ("39-thumb.jpg", "texas-wordpress-developer-custom-web-build.webp"),
    ("40-thumb.jpg", "fort-worth-ui-developer-responsive-design-sample.webp"),
    ("41-thumb.jpg", "dallas-web-developer-agency-site-screenshot.webp"),
    ("42-thumb.jpg", "arlington-full-stack-developer-client-build.webp"),
    ("11-thumb.jpg", "dfw-web-designer-agency-website-project.webp"),
    ("12-thumb.jpg", "north-texas-wordpress-developer-agency-site.webp"),
    ("13-thumb.jpg", "fort-worth-cms-developer-website-portfolio.webp"),
    ("14-thumb.jpg", "texas-frontend-developer-agency-web-sample.webp"),
    ("15-thumb.jpg", "dallas-web-developer-custom-site-design.webp"),
    ("16-thumb.jpg", "tarrant-county-web-developer-business-website.webp"),
    ("17-thumb.jpg", "north-texas-ui-developer-portfolio-project.webp"),
    ("18-thumb.jpg", "dfw-full-stack-developer-freelance-web-project.webp"),
    ("19-thumb.jpg", "fort-worth-php-developer-agency-website-build.webp"),
    ("20-thumb.jpg", "frisco-web-developer-responsive-design-portfolio.webp"),
    ("21-thumb.jpg", "texas-wordpress-developer-portfolio-site-sample.webp"),
]

AGENCY_LOGOS: list[tuple[str, str]] = [
    ("agency-icon.png", "fort-worth-web-developer-webvideo360-agency-logo.webp"),
    ("envision-icon.png", "fort-worth-web-developer-envision-interactive-agency-logo.webp"),
    ("ascend-icon.png", "fort-worth-web-developer-ascend-concepts-agency-logo.webp"),
    ("runner-icon.png", "fort-worth-web-developer-runner-agency-logo.webp"),
    ("amplifi-icon.png", "fort-worth-web-developer-amplifi-commerce-agency-logo.webp"),
]

BRAND_RENAMES: list[tuple[str, str]] = [
    ("brands/adidas.jpg", "brands/fort-worth-wordpress-developer-adidas-client-logo.webp"),
    ("brands/armani.jpg", "brands/fort-worth-wordpress-developer-armani-client-logo.webp"),
    ("brands/fossil.jpg", "brands/dfw-wordpress-developer-fossil-client-logo.webp"),
    ("brands/nintendo.jpg", "brands/fort-worth-web-developer-nintendo-client-logo.webp"),
    ("brands/webvideo360.jpg", "brands/fort-worth-web-developer-webvideo360-client-logo.webp"),
    ("brands/findlay-craft.jpg", "brands/fort-worth-web-developer-findlay-craft-client-logo.webp"),
    ("brands/galatyn-minerals.jpg", "brands/fort-worth-web-developer-galatyn-minerals-client-logo.webp"),
    ("brands/green-grocer.jpg", "brands/fort-worth-web-developer-green-grocer-client-logo.webp"),
    ("brands/teachers-credit-union.jpg", "brands/fort-worth-web-developer-teachers-credit-union-client-logo.webp"),
    ("brands/future-payment-tech.jpg", "brands/fort-worth-web-developer-future-payment-tech-client-logo.webp"),
]

MISC_ARCHIVE: list[tuple[str, str]] = [
    ("html5-icon.jpg", "fort-worth-web-developer-html5-skill-icon.webp"),
    ("css3-icon.jpg", "fort-worth-web-developer-css3-skill-icon.webp"),
    ("javascript-icon.jpg", "fort-worth-web-developer-javascript-skill-icon.webp"),
    ("ajax-icon.jpg", "fort-worth-web-developer-ajax-skill-icon.webp"),
    ("php-icon.jpg", "fort-worth-web-developer-php-skill-icon.webp"),
    ("jquery-icon.jpg", "fort-worth-web-developer-jquery-skill-icon.webp"),
    ("mysql-icon.jpg", "fort-worth-web-developer-mysql-skill-icon.webp"),
    ("linux-icon.jpg", "fort-worth-web-developer-linux-skill-icon.webp"),
    ("apache-icon.jpg", "fort-worth-web-developer-apache-skill-icon.webp"),
    ("word-icon.jpg", "fort-worth-web-developer-microsoft-word-resume-icon.webp"),
    ("pdf-icon.jpg", "fort-worth-web-developer-adobe-pdf-resume-icon.webp"),
    ("web-development.jpg", "fort-worth-web-developer-web-development-hero.webp"),
    ("home-main-intro.png", "fort-worth-web-developer-home-intro-hero.webp"),
]


def resolve_src(name: str) -> Path | None:
    for base in (ARCHIVE, DEST):
        p = base / name
        if p.is_file():
            return p
    return None


def ingest(src_name: str, dest_rel: str) -> bool:
    src = resolve_src(src_name)
    if src is None:
        print(f"  [skip] missing: {src_name}")
        return False
    out = import_to_webp(src, dest_rel, DEST)
    if out is None:
        return False
    print(f"  [ok] {out.relative_to(DEST).as_posix()}")
    return True


def fetch_kcm_logo() -> bool:
    import urllib.request

    url = "https://upload.wikimedia.org/wikipedia/en/2/2a/Kenneth_Copeland_Ministries_logo.png"
    dest = DEST / "brands" / "fort-worth-web-developer-kcm-ministries-client-logo.webp"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "redfearn-portfolio/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            tmp = DEST / "_tmp_kcm.png"
            tmp.write_bytes(resp.read())
        import_to_webp(tmp, dest.relative_to(DEST).as_posix(), DEST)
        tmp.unlink(missing_ok=True)
        print(f"  [ok] {dest.relative_to(DEST).as_posix()} (from Wikimedia)")
        return True
    except Exception as exc:
        print(f"  [warn] KCM logo: {exc}")
        return False


def main() -> int:
    if not ARCHIVE.is_dir():
        print(f"Archive not found: {ARCHIVE}")
        return 1

    DEST.mkdir(parents=True, exist_ok=True)
    n = 0

    for label, pairs in (
        ("Showcase thumbs", SHOWCASE_THUMBS),
        ("Agency strip", AGENCY_LOGOS),
        ("Brand logos", BRAND_RENAMES),
        ("Misc graphics", MISC_ARCHIVE),
    ):
        print(label)
        for src, dest in pairs:
            if ingest(src, dest):
                n += 1

    trva_src = resolve_src("TRVA_logo-e1488690199758.jpg")
    if trva_src:
        out = import_to_webp(trva_src, "brands/fort-worth-web-developer-trva-client-logo.webp", DEST)
        if out:
            print(f"  [ok] {out.relative_to(DEST).as_posix()}")
            n += 1

    print("KCM logo (Wikimedia to WebP)")
    if fetch_kcm_logo():
        n += 1

    print(f"Done: {n} assets under assets/images/ (WebP + SVG only)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
