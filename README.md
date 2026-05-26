# redfearn.co — interactive resume

Personal resume and portfolio for [Royce Redfearn Jr.](https://redfearn.co). PHP renders the page on the server; a thin client layer handles persona switching, platform/theme demos, and lazy-loaded imagery. Content lives in JSON; media is served from Cloudflare R2.

## Features

- **Persona views** — Tailored copy for `fullstack`, `frontend`, `backend`, `pm`, and `seo` (`?show_as=frontend`). `?show_as=all` shows every tagged bullet with persona badges.
- **Presentation modes** — `platform` (WordPress / Shopify / headless) and `theme` (modern / legacy / accessible), persisted in cookies.
- **SSR + hydration** — `config/render.php` mirrors `assets/js/resume.js` so first paint is complete HTML; JS swaps persona without a full reload.
- **SEO** — Canonical URLs per persona, `sitemap.php`, Open Graph images per persona, Person JSON-LD.
- **Performance** — Inlined critical CSS, lazy images via `data-rc-src`, WebP assets on CDN.
- **Security** — CSP and related headers in `.htaccess` and `config/security.php` (keep both in sync).

## Requirements

| Tool | Use |
|------|-----|
| **PHP 8+** | Built-in server or Apache/nginx in production |
| **Node.js 18+** | Local dev (`browser-sync`) |
| **Python 3** | R2 upload/sync scripts (`boto3`) |

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:8000](http://localhost:8000). BrowserSync proxies PHP on `127.0.0.1:8001` and reloads when PHP, CSS, JS, or `data/**/*.json` change.

PHP only (no live reload):

```bash
npm run dev:php
# → http://127.0.0.1:8001
```

## Project layout

```
├── index.php              # Main entry — loads resume, sets persona/platform/theme
├── sitemap.php            # XML sitemap (persona URLs)
├── config/
│   ├── personas.php       # RC_BASE_URL, CDN base, canonical redirect helpers
│   ├── render.php         # SSR HTML builders (keep in sync with resume.js)
│   └── security.php       # Security headers + CSP
├── data/
│   ├── resume.json        # Single source of truth (content + viewConfig)
│   ├── logos.txt          # Brand logo filename → label map
│   └── experience-classification.md  # Workbook before editing JSON
├── assets/
│   ├── css/resume.css     # Main stylesheet
│   ├── css/critical.min.css
│   └── js/resume.js       # Persona swap, filters, lazy load
├── assets/images/         # Local staging; most files gitignored (see R2)
├── scripts/               # Dev server, R2 sync, migrations, archive import
├── tools/                 # Standalone HTML build, image manifest apply
├── archive/               # Frozen export of the previous site (reference)
├── dist/redfearn-site/    # Deployable snapshot (mirror of site root)
├── standalone.html        # Raw SSR dump for offline / print editing
└── gant.html              # Standalone engineering timeline page
```

## Editing content

1. **`data/resume.json`** — Names, personas, skills, jobs, portfolio, `viewConfig` (platforms/themes). Invalid JSON returns HTTP 503 from `index.php`.
2. **`data/experience-classification.md`** — Classify roles (`job`, `contract`, `agency`, etc.) before adding or restructuring entries in JSON.
3. **`data/logos.txt`** — Tab-separated logo filename and label; used by brand grids and R2 upload discovery.
4. **`config/personas.php`** — Production `RC_BASE_URL` and `assets.redfearn.co` CDN path only (not persona copy).

After changing render rules in JS, update the matching helpers in `config/render.php` so SSR and client stay aligned.

### URL parameters

| Param | Values | Notes |
|-------|--------|--------|
| `show_as` | `fullstack`, `frontend`, `backend`, `pm`, `seo`, `all` | Indexed personas get canonical URLs; `all` is presentation-only |
| `platform` | From `viewConfig.platforms` | Cookie: `rc_platform` |
| `theme` | From `viewConfig.themes` | Cookie: `rc_theme` |

## Images & Cloudflare R2

Resume media is stored at `https://assets.redfearn.co/images/`. The repo keeps only a small set locally (profile, manifest helpers); everything else is uploaded to R2.

Create `.env` in the project root:

```env
CLOUDFLARE_ACCESS_KEY_ID=...
CLOUDFLARE_SECRET_ACCESS_KEY=...
CLOUDFLARE_S3_API=https://<account_id>.r2.cloudflarestorage.com
CLOUDFLARE_S3_BUCKET=...
```

| Script | Purpose |
|--------|---------|
| `python scripts/upload-r2.py` | Upload files referenced by `resume.json` / `logos.txt` under `assets/images/` |
| `python scripts/upload-r2.py --delete-local` | Upload, then remove local copies |
| `python scripts/download-r2.py` | Pull objects from R2 into `assets/images/` |
| `python scripts/sync-r2.py <local-dir> <s3-prefix>` | Generic directory mirror to R2 |
| `node tools/apply-image-manifest.cjs` | Apply `assets/images/image_manifest.json` path moves |

Other asset helpers: `scripts/convert-assets-webp.py`, `scripts/migrate-refs-webp.py`, `scripts/import-archive-assets.py`.

## Standalone / offline HTML

For a self-contained file (CSS inlined, no analytics/chat, relative image paths):

1. Generate or refresh `standalone.html` from a local PHP render.
2. Run `node tools/build-standalone.cjs` to produce an edit-friendly snapshot.

## Deployment

Production expects Apache with `mod_rewrite` / `mod_headers` (see `.htaccess` for HTTPS behind Cloudflare Flexible SSL). Upload the site root (or `dist/redfearn-site/`) plus:

- PHP entry points: `index.php`, `sitemap.php`
- `config/`, `data/`, `assets/css`, `assets/js`
- `.htaccess`

Ensure `data/resume.json` is readable and R2/CDN URLs in `config/personas.php` match the live bucket.

## Maintenance scripts

| Script | Purpose |
|--------|---------|
| `scripts/patch_brand_grids.py` | Patch brand grid markup in render output |
| `scripts/patch_gallery_render.py` | Gallery render adjustments |
| `scripts/patch_resume_descriptions.py` | Bulk description updates in JSON |
| `tools/patch-standalone-advantis-logo.cjs` | One-off standalone logo fix |

## License

Private site source for redfearn.co. All rights reserved unless otherwise noted.
