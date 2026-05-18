#!/usr/bin/env python3
"""Patch config/render.php gallery functions."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "config" / "render.php"
content = path.read_text(encoding="utf-8")

marker_start = "/**\n * @param list<array<string, mixed>> $gallery\n */\nfunction rc_render_gallery_html"
marker_end = "function rc_render_experience"

start = content.find(marker_start)
end = content.find(marker_end)
if start < 0 or end < 0:
    raise SystemExit(f"markers not found start={start} end={end}")

new_block = r'''function rc_is_mobile_gallery_file(string $file): bool
{
    return (bool) preg_match('/[-_]mobile\./i', $file);
}

/**
 * @param list<array<string, mixed>> $gallery
 * @return list<array{desktop: array<string, mixed>, mobile: array<string, mixed>|null}>
 */
function rc_pair_gallery_items(array $gallery): array
{
    $byFile = [];
    foreach ($gallery as $item) {
        if (!is_array($item) || !isset($item['file'])) {
            continue;
        }
        $byFile[(string) $item['file']] = $item;
    }
    $pairs = [];
    foreach ($gallery as $item) {
        if (!is_array($item) || !isset($item['file'])) {
            continue;
        }
        $file = (string) $item['file'];
        if (rc_is_mobile_gallery_file($file)) {
            continue;
        }
        $mobile = null;
        if (preg_match('/-desktop\./i', $file)) {
            $mobileFile = preg_replace('/-desktop\./i', '-mobile.', $file);
            $mobile = $byFile[$mobileFile] ?? null;
        }
        $pairs[] = ['desktop' => $item, 'mobile' => $mobile];
    }

    return $pairs;
}

/**
 * @param array<string, mixed> $item
 */
function rc_render_gallery_slide_img(array $item, string $assetsBase, string $class, string $loading, bool &$pageLcpAssigned, bool $decorative = false): string
{
    $file = (string) $item['file'];
    $alt = $decorative ? '' : (string) ($item['alt'] ?? '');
    $w = isset($item['width']) ? (int) $item['width'] : 0;
    $h = isset($item['height']) ? (int) $item['height'] : 0;
    $src = rc_asset_url($assetsBase, $file);
    $srcset = $decorative ? '' : rc_gallery_img_srcset_attr($item, $assetsBase);
    $sizes = $srcset !== '' ? ' sizes="(max-width: 768px) 90vw, 33vw"' : '';
    $fetch = '';
    if (!$decorative && $loading === 'eager' && !$pageLcpAssigned) {
        $fetch = ' fetchpriority="high"';
        $pageLcpAssigned = true;
    }
    $aria = $decorative ? ' alt="" aria-hidden="true"' : ' alt="' . rc_esc($alt) . '"';

    return '<img class="' . rc_esc($class) . '" src="' . rc_esc($src) . '"' . $srcset . $sizes . $aria
        . ($w > 0 ? ' width="' . $w . '"' : '')
        . ($h > 0 ? ' height="' . $h . '"' : '')
        . ' loading="' . rc_esc($loading) . '" decoding="async"' . $fetch . ' />';
}

/**
 * @param list<array<string, mixed>> $gallery
 */
function rc_render_gallery_html(array $gallery, string $assetsBase, bool &$pageLcpAssigned, string $company = ''): string
{
    $pairs = rc_pair_gallery_items($gallery);
    if ($pairs === []) {
        return '';
    }
    $slides = '';
    foreach ($pairs as $index => $pair) {
        $desktop = $pair['desktop'];
        $mobile = $pair['mobile'];
        $file = (string) $desktop['file'];
        $caption = (string) ($desktop['caption'] ?? '');
        $description = (string) ($desktop['description'] ?? '');
        $loading = (string) ($desktop['loading'] ?? 'lazy');
        $desktopSrc = rc_asset_url($assetsBase, $file);
        $mobileSrc = $mobile !== null ? rc_asset_url($assetsBase, (string) $mobile['file']) : '';
        $mobileAlt = $mobile !== null ? (string) ($mobile['alt'] ?? '') : '';
        $pairedClass = $mobile !== null ? ' rc-slide-figure--paired' : '';
        $capHtml = $caption !== '' ? '<figcaption class="rc-slide-caption">' . rc_esc($caption) . '</figcaption>' : '';
        $mobileImg = $mobile !== null
            ? rc_render_gallery_slide_img($mobile, $assetsBase, 'rc-slide-mobile', 'lazy', $pageLcpAssigned, true)
            : '';
        $slides .= '<figure class="rc-slide-figure' . $pairedClass . '" role="button" tabindex="0"'
            . ' data-rc-slide-index="' . $index . '"'
            . ' data-rc-desktop="' . rc_esc($desktopSrc) . '"'
            . ($mobileSrc !== '' ? ' data-rc-mobile="' . rc_esc($mobileSrc) . '"' : '')
            . ' data-rc-desktop-alt="' . rc_esc((string) ($desktop['alt'] ?? '')) . '"'
            . ($mobileAlt !== '' ? ' data-rc-mobile-alt="' . rc_esc($mobileAlt) . '"' : '')
            . ' data-rc-title="' . rc_esc($caption) . '"'
            . ' data-rc-description="' . rc_esc($description) . '">'
            . '<div class="rc-slide-stack">'
            . rc_render_gallery_slide_img($desktop, $assetsBase, 'rc-slide-desktop', $loading, $pageLcpAssigned, false)
            . $mobileImg
            . '</div>'
            . $capHtml
            . '</figure>';
    }
    $companyAttr = $company !== '' ? ' data-rc-company="' . rc_esc($company) . '"' : '';

    return '<div class="rc-job-gallery" data-rc-gallery' . $companyAttr . '>'
        . '<div class="rc-job-gallery-scroll" tabindex="0" role="region" aria-label="Project screenshots">'
        . $slides
        . '</div>'
        . '<button type="button" class="rc-gallery-prev" aria-label="Scroll gallery left">‹</button>'
        . '<button type="button" class="rc-gallery-next" aria-label="Scroll gallery right">›</button>'
        . '</div>';
}

'''

path.write_text(content[:start] + new_block + content[end:], encoding="utf-8")
print("patched", path)
