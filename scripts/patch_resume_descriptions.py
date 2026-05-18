#!/usr/bin/env python3
"""Add description field to gallery items in resume.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "data" / "resume.json"

DESCRIPTIONS = {
    "fort-worth-wordpress-developer-kcm-homepage-desktop.webp": (
        "Architected and shipped the Kenneth Copeland Ministries marketing homepage on a high-traffic "
        "WordPress stack—atomic components, fluid typography, and performance budgets tuned for Core Web Vitals."
    ),
    "fort-worth-web-developer-kcm-partner-signup-desktop.webp": (
        "Built the partner acquisition funnel with GTM instrumentation and mobile-first layouts that convert "
        "organic and paid traffic into my.kcm.org sign-ups."
    ),
    "fort-worth-seo-web-developer-kcm-daily-devotionals-desktop.webp": (
        "Delivered a high-volume devotionals hub using ACF-JSON and headless-friendly WordPress patterns so "
        "editorial teams can publish without developer bottlenecks."
    ),
    "fort-worth-web-developer-kcm-live-broadcast-platform-desktop.webp": (
        "Implemented Watch Live with HLS delivery and resilient playback UX for enterprise-scale concurrent viewers."
    ),
    "fort-worth-web-developer-kcm-tv-broadcast-schedule-desktop.webp": (
        "Event-driven broadcast schedule experience reusing atomic layout primitives across TV and web surfaces."
    ),
    "fort-worth-web-developer-kcm-about-ministry-desktop.webp": (
        "Institutional about experience with rich media, editorial layouts, and brand-consistent component reuse."
    ),
    "fort-worth-web-developer-kcm-partner-portal-desktop.webp": (
        "Authenticated partner portal (my.kcm.org) with personalized content rails and revenue-oriented user flows."
    ),
    "fort-worth-wordpress-developer-govictory-broadcast-news-desktop.webp": (
        "Rapid-deploy GoVictory news property on shared KCM infrastructure—editorial velocity without sacrificing stability."
    ),
    "fort-worth-web-developer-southwest-believers-convention-desktop.webp": (
        "Southwest Believers Convention event site with live schedule integration and broadcast tie-ins for peak traffic windows."
    ),
    "fort-worth-web-developer-sbc-speakers-directory-desktop.webp": (
        "Structured speaker directory with Schema.org markup for discoverability and reusable profile templates."
    ),
    "fort-worth-web-developer-victory-news-tonight-broadcast-desktop.webp": (
        "Victory News Tonight broadcast news platform—high-traffic publishing patterns shared with the KCM design system."
    ),
    "dfw-full-stack-developer-freelance-web-project.webp": (
        "Programmatic SEO and clinician-capture architecture for Advantis—reverse-proxy to Webflow that shifted acquisition organic."
    ),
    "texas-frontend-developer-agency-web-sample.webp": (
        "Category-driven landing and merchandising UX for high-volume promotional and capture flows."
    ),
    "fort-worth-web-developer-trinity-river-vision-authority-desktop.webp": (
        "Public TRVA property aligning regional floodway and recreation initiatives with accessible, maintainable WordPress builds."
    ),
    "fort-worth-web-developer-panther-island-pavilion-venue-desktop.webp": (
        "Panther Island Pavilion venue site—events, waterfront programming, and TRVA brand alignment."
    ),
    "fort-worth-seo-web-developer-texas-title-real-estate-desktop.webp": (
        "TexasTitle.com responsive property with SEO-focused IA and lead capture tuned for title services."
    ),
    "fort-worth-web-developer-maverick-national-smb-desktop.webp": (
        "MaverickNational.com SMB marketing site—conversion-oriented layouts and maintainable CMS workflows."
    ),
    "fort-worth-web-developer-levarte-travel-booking-desktop.webp": (
        "Levarte travel booking UX with itinerary-forward layouts and mobile-responsive reservation flows."
    ),
    "fort-worth-web-developer-wheresgeorge-php-template-desktop.webp": (
        "WheresGeorge.com template modernization—legacy PHP front-end patterns brought into responsive, accessible markup."
    ),
}


def is_mobile_file(file: str) -> bool:
    return bool(re.search(r"[-_]mobile\.", file, re.I))


def main() -> None:
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    for job in data.get("experience", []):
        for item in job.get("gallery", []):
            f = item.get("file", "")
            if is_mobile_file(f):
                item.setdefault("description", "")
                continue
            if "description" not in item:
                item["description"] = DESCRIPTIONS.get(f, "")

    path.write_text(json.dumps(data, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
    print("updated", path)


if __name__ == "__main__":
    main()
