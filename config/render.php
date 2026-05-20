<?php

declare(strict_types=1);

if (!defined('RC_VIEW_ALL_PERSONA')) {
    define('RC_VIEW_ALL_PERSONA', 'all');
}

/**
 * SSR helpers mirroring assets/js/resume.js rendering rules.
 */

function rc_is_view_all_persona(string $persona): bool
{
    return $persona === RC_VIEW_ALL_PERSONA;
}

/**
 * @param array<string, mixed> $a
 */
function rc_accomplishment_matches_persona(array $a, string $persona): bool
{
    if (!isset($a['text']) || (string) $a['text'] === '') {
        return false;
    }
    if (rc_is_view_all_persona($persona)) {
        return true;
    }
    $aps = $a['personas'] ?? [];

    return is_array($aps) && in_array($persona, $aps, true);
}

/**
 * @param array<string, mixed> $a
 * @param array<string, mixed> $resume
 */
function rc_render_accomplishment_item(array $a, array $resume, string $persona): string
{
    $text = (string) ($a['text'] ?? '');
    if (!rc_is_view_all_persona($persona)) {
        return '<li>' . rc_esc($text) . '</li>';
    }
    $aps = $a['personas'] ?? [];
    $tags = '';
    if (is_array($aps) && $aps !== []) {
        $personas = $resume['personas'] ?? [];
        $spans = [];
        foreach ($aps as $pk) {
            if (!is_string($pk) || $pk === '') {
                continue;
            }
            $pm = $personas[$pk] ?? null;
            $label = is_array($pm)
                ? (string) ($pm['selectLabel'] ?? $pm['badgeLabel'] ?? $pk)
                : $pk;
            $spans[] = '<span class="rc-persona-tag" data-persona-tag="' . rc_esc($pk) . '">' . rc_esc($label) . '</span>';
        }
        if ($spans !== []) {
            $tags = '<span class="rc-bullet-personas">' . implode('', $spans) . '</span>';
        }
    }

    return '<li class="rc-accomplishment-item rc-accomplishment-item--audit">'
        . $tags
        . '<span class="rc-accomplishment-text">' . rc_esc($text) . '</span></li>';
}

function rc_esc(?string $s): string
{
    return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function rc_contact_link_label(string $url): string
{
    if (preg_match('~github\.com/([^/?#]+)~i', $url, $m)) {
        return 'github.com/' . $m[1];
    }
    $host = parse_url($url, PHP_URL_HOST);
    $path = parse_url($url, PHP_URL_PATH);

    return ($host !== false && $host !== null && $host !== '')
        ? $host . (($path !== false && $path !== null && $path !== '' && $path !== '/') ? $path : '')
        : $url;
}

function rc_contact_type_from_url(string $url): string
{
    if (preg_match('~linkedin\.com~i', $url)) {
        return 'linkedin';
    }
    if (preg_match('~github\.com~i', $url)) {
        return 'github';
    }

    return 'website';
}

function rc_contact_icon_svg(string $type): string
{
    return match ($type) {
        'email' => '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true">'
            . '<path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2v.01L12 13 4 6.01V6h16ZM4 18V8.24l7.38 6.46a1 1 0 0 0 1.24 0L20 8.24V18H4Z"/>'
            . '</svg>',
        'phone' => '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true">'
            . '<path fill="currentColor" d="M15.5 1h-7A2.5 2.5 0 0 0 6 3.5v17A2.5 2.5 0 0 0 8.5 23h7a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 15.5 1Zm-3.5 20a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"/>'
            . '</svg>',
        'linkedin' => '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true">'
            . '<path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2Z"/>'
            . '</svg>',
        'github' => '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true">'
            . '<path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.88-.39c.98.01 1.97.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.68.42.36.8 1.08.8 2.18 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>'
            . '</svg>',
        default => '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true">'
            . '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V18a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1.93A8.001 8.001 0 0 1 4.07 13H6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4.07A8.001 8.001 0 0 1 11 4.07V6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4.07A8.001 8.001 0 0 1 19.93 11H18a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1.93A8.001 8.001 0 0 1 13 19.93Z"/>'
            . '</svg>',
    };
}

/**
 * @param array{type: string, href: string, label: string, showLabel: bool, external: bool, ariaLabel: string} $item
 */
function rc_render_contact_item(array $item): string
{
    $type = (string) ($item['type'] ?? 'website');
    $href = (string) ($item['href'] ?? '');
    if ($href === '') {
        return '';
    }
    $label = (string) ($item['label'] ?? '');
    $showLabel = (bool) ($item['showLabel'] ?? false);
    $external = (bool) ($item['external'] ?? false);
    $ariaLabel = (string) ($item['ariaLabel'] ?? $label);

    $attrs = ' class="rc-contact-item rc-contact-item--' . rc_esc($type) . '" href="' . rc_esc($href) . '"';
    if ($external) {
        $attrs .= ' target="_blank" rel="noopener noreferrer"';
    }
    if (!$showLabel) {
        $attrs .= ' aria-label="' . rc_esc($ariaLabel) . '"';
    }

    $icon = rc_contact_icon_svg($type);
    $text = $showLabel && $label !== ''
        ? '<span class="rc-contact-label">' . rc_esc($label) . '</span>'
        : '';

    return '<a' . $attrs . '>' . $icon . $text . '</a>';
}

/**
 * @return list<array{type: string, href: string, label: string, showLabel: bool, external: bool, ariaLabel: string}>
 */
function rc_build_contact_items(array $basics): array
{
    $items = [];

    $em = (string) ($basics['email'] ?? '');
    if ($em !== '') {
        $items[] = [
            'type' => 'email',
            'href' => 'mailto:' . $em,
            'label' => $em,
            'showLabel' => true,
            'external' => false,
            'ariaLabel' => 'Email ' . $em,
        ];
    }

    $ph = (string) ($basics['phone'] ?? '');
    if ($ph !== '') {
        $tel = preg_replace('/[^\d+]/', '', $ph) ?? '';
        $items[] = [
            'type' => 'phone',
            'href' => 'tel:' . $tel,
            'label' => $ph,
            'showLabel' => true,
            'external' => false,
            'ariaLabel' => 'Phone ' . $ph,
        ];
    }

    $u = (string) ($basics['url'] ?? '');
    if ($u !== '') {
        $hostLabel = rc_contact_link_label($u);
        $items[] = [
            'type' => 'website',
            'href' => $u,
            'label' => $hostLabel,
            'showLabel' => false,
            'external' => true,
            'ariaLabel' => 'Website: ' . $hostLabel,
        ];
    }

    $sameAs = $basics['sameAs'] ?? [];
    if (!is_array($sameAs)) {
        $sameAs = [];
    }
    foreach ($sameAs as $link) {
        if (!is_string($link) || $link === '') {
            continue;
        }
        $type = rc_contact_type_from_url($link);
        $hostLabel = rc_contact_link_label($link);
        $aria = match ($type) {
            'linkedin' => 'LinkedIn profile',
            'github' => 'GitHub profile',
            default => $hostLabel,
        };
        $items[] = [
            'type' => $type,
            'href' => $link,
            'label' => $hostLabel,
            'showLabel' => false,
            'external' => true,
            'ariaLabel' => $aria,
        ];
    }

    return $items;
}

/**
 * @param array<string, mixed> $basics
 */
function rc_render_contact(array $basics): string
{
    $labeled = '';
    $social = '';
    foreach (rc_build_contact_items($basics) as $item) {
        if (!empty($item['showLabel'])) {
            $labeled .= rc_render_contact_item($item);
        } else {
            $social .= rc_render_contact_item($item);
        }
    }
    if ($social !== '') {
        $labeled .= '<div class="rc-contact-social" aria-label="Social and web links">' . $social . '</div>';
    }

    return $labeled;
}

/** Accept JSON scalars; strict_types-safe for odd resume data. */
function rc_fmt_date($d): string
{
    $d = (string) $d;
    if ($d === 'Present') {
        return 'Present';
    }
    $parts = explode('-', $d);
    if (count($parts) < 2) {
        return rc_esc($d);
    }
    $y = (int) $parts[0];
    $m = (int) $parts[1];
    $ts = mktime(0, 0, 0, $m, 1, $y);

    return date('M Y', $ts);
}

/**
 * Month index for sorting experience (YYYY-MM or year-only in JSON).
 * Ongoing roles sort after any fixed end date.
 */
function rc_resume_month_key(string $date, bool $isEndDate): int
{
    if ($isEndDate && ($date === '' || $date === 'Present')) {
        return PHP_INT_MAX;
    }
    if ($date === '') {
        return 0;
    }
    $parts = explode('-', $date);
    $y = (int) ($parts[0] ?? 0);
    $m = isset($parts[1]) ? (int) $parts[1] : ($isEndDate ? 12 : 1);
    if ($y <= 0) {
        return 0;
    }
    $m = max(1, min(12, $m));

    return $y * 12 + $m;
}

function rc_slugify($str): string
{
    $s = strtolower((string) $str);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';

    return trim($s, '-');
}

/** Absolute asset URL; encode each path segment (supports brands/foo.svg). */
function rc_asset_url(string $assetsBase, string $file): string
{
    $file = str_replace('\\', '/', trim($file));
    $segments = array_filter(explode('/', $file), static fn (string $s): bool => $s !== '');
    $encoded = implode('/', array_map(rawurlencode(...), $segments));

    return rtrim($assetsBase, '/') . '/' . $encoded;
}

/** Same-origin path under /assets/images/ (profile, local dev). */
function rc_site_image_url(string $file): string
{
    $file = str_replace('\\', '/', trim($file));
    if ($file === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $file)) {
        return $file;
    }
    $file = preg_replace('#^assets/images/#i', '', $file) ?? $file;
    $segments = array_filter(explode('/', $file), static fn (string $s): bool => $s !== '');
    $encoded = implode('/', array_map(rawurlencode(...), $segments));

    return '/assets/images/' . $encoded;
}

function rc_img_placeholder_src(): string
{
    return 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201%201%27%2F%3E';
}

/** @return array{loading: string, fetch: string} */
function rc_lazy_img_priority(bool $eager = false): array
{
    if ($eager) {
        return ['loading' => 'eager', 'fetch' => ' fetchpriority="high"'];
    }

    return ['loading' => 'lazy', 'fetch' => ' fetchpriority="low"'];
}

function rc_render_deferred_img(string $class, string $dataSrc, string $alt, string $extraAttrs = ''): string
{
    $extraAttrs = trim($extraAttrs);

    return '<img class="' . rc_esc(trim($class . ' rc-deferred-img')) . '"'
        . ' src="' . rc_esc(rc_img_placeholder_src()) . '"'
        . ' data-rc-src="' . rc_esc($dataSrc) . '"'
        . ' alt="' . rc_esc($alt) . '"'
        . ' loading="lazy" decoding="async" fetchpriority="low"'
        . ($extraAttrs !== '' ? ' ' . $extraAttrs : '')
        . ' />';
}

/**
 * Optional responsive variants: item["srcsetVariants"] = [["w"=>480,"file"=>"x-480w.webp"], ...]
 */
function rc_gallery_img_srcset_attr(array $item, string $assetsBase): string
{
    $variants = $item['srcsetVariants'] ?? null;
    if (!is_array($variants) || $variants === []) {
        return '';
    }
    $parts = [];
    foreach ($variants as $v) {
        if (!is_array($v) || !isset($v['w'], $v['file'])) {
            continue;
        }
        $parts[] = rc_esc(rc_asset_url($assetsBase, (string) $v['file'])) . ' ' . (int) $v['w'] . 'w';
    }

    return $parts !== [] ? ' srcset="' . implode(', ', $parts) . '"' : '';
}

function rc_render_name_html($name): string
{
    $name = (string) $name;
    if (preg_match('/^(.*)(Jr\.)$/u', $name, $m)) {
        return rc_esc($m[1]) . '<span class="flicker-suffix">' . rc_esc($m[2]) . '</span>';
    }

    return rc_esc($name);
}

/**
 * @param array<string, mixed> $resume
 */
function rc_persona_headline(array $resume, string $persona): string
{
    if (rc_is_view_all_persona($persona)) {
        return (string) ($resume['basics']['label'] ?? 'Resume');
    }
    $p = $resume['personas'][$persona] ?? [];
    if (!empty($p['headline'])) {
        return (string) $p['headline'];
    }
    if (!empty($p['title'])) {
        return (string) $p['title'];
    }

    return (string) ($resume['basics']['label'] ?? '');
}

/**
 * @param array<string, mixed> $resume
 */
function rc_render_summary(array $resume, string $persona): string
{
    if (rc_is_view_all_persona($persona)) {
        return '<strong>Summary</strong><em class="rc-view-all-note">Viewing all personas — experience lists every tagged bullet with persona labels.</em>';
    }
    $p = $resume['personas'][$persona] ?? [];
    $summary = (string) ($p['summary'] ?? '');

    return '<strong>Summary</strong>' . rc_esc($summary);
}

/**
 * @param array<string, mixed> $resume
 */
function rc_render_skills(array $resume, string $persona): string
{
    $skills = $resume['skills'] ?? [];
    if (!is_array($skills)) {
        return '<p class="rc-empty">No skills are tagged for this persona yet. Select <strong>Full-Stack Developer</strong> for the complete skill matrix.</p>';
    }
    $out = '';
    foreach ($skills as $s) {
        if (!is_array($s)) {
            continue;
        }
        if (!rc_is_view_all_persona($persona)) {
            $ps = $s['personas'] ?? [];
            if (!is_array($ps) || !in_array($persona, $ps, true)) {
                continue;
            }
        }
        $cat = (string) ($s['category'] ?? '');
        $items = $s['items'] ?? [];
        if (!is_array($items)) {
            $items = [];
        }
        $chips = [];
        foreach ($items as $i) {
            $chips[] = '<span class="rc-chip">' . rc_esc((string) $i) . '</span>';
        }
        $out .= '<div class="rc-skill-card"><h3>' . rc_esc($cat) . '</h3>'
            . '<div class="rc-chips">' . implode('', $chips) . '</div></div>';
    }

    return $out !== '' ? $out : '<p class="rc-empty">No skills are tagged for this persona yet. Select <strong>Full-Stack Developer</strong> for the complete skill matrix.</p>';
}

/**
 * Render skills section HTML depending on the active platform engine.
 * - wordpress: standard skill card grid (default)
 * - shopify:   Liquid-inspired collection / variant layout
 * - headless:  skeleton atoms (JS will hydrate after simulated API fetch)
 */
function rc_render_skills_for_platform(array $resume, string $persona, string $platform): string
{
    if ($platform === 'shopify') {
        return rc_render_skills_shopify($resume, $persona);
    }
    if ($platform === 'headless') {
        return rc_render_skills_headless_skeleton();
    }
    return rc_render_skills($resume, $persona);
}

/** Shopify Liquid-style collection + variant card SSR. */
function rc_render_skills_shopify(array $resume, string $persona): string
{
    $skills = $resume['skills'] ?? [];
    if (!is_array($skills)) {
        return '<p class="rc-empty">No collections available for this persona.</p>';
    }
    $out = '';
    foreach ($skills as $s) {
        if (!is_array($s)) {
            continue;
        }
        if (!rc_is_view_all_persona($persona)) {
            $ps = $s['personas'] ?? [];
            if (!is_array($ps) || !in_array($persona, $ps, true)) {
                continue;
            }
        }
        $cat = (string) ($s['category'] ?? '');
        $handle = strtolower((string) preg_replace('/[^a-z0-9]+/i', '-', $cat));
        $items = $s['items'] ?? [];
        if (!is_array($items)) {
            $items = [];
        }
        $variants = [];
        foreach ($items as $i) {
            $variants[] = '<span class="rc-variant-tag">' . rc_esc((string) $i) . '</span>';
        }
        $out .= '<div class="rc-collection-card" data-collection-handle="' . rc_esc($handle) . '">'
            . '<h3 class="rc-collection-title"><span class="rc-collection-prefix">collection:</span> ' . rc_esc($cat) . '</h3>'
            . '<div class="rc-collection-variants">' . implode('', $variants) . '</div>'
            . '</div>';
    }
    return $out !== '' ? $out : '<p class="rc-empty">No collections available for this persona.</p>';
}

/** Headless: skeleton atoms for SSR first-paint — JS replaces on hydration. */
function rc_render_skills_headless_skeleton(): string
{
    $skeletons = [
        [55, [88, 72, 80, 64]],
        [48, [84, 76, 58, 90, 54]],
        [62, [68, 84, 100, 62]],
        [50, [80, 90, 68]],
    ];
    $out = '';
    foreach ($skeletons as [$titlePct, $chipWidths]) {
        $chips = implode('', array_map(
            static fn (int $w) => '<div class="rc-skeleton rc-sk-chip" style="width:' . $w . 'px;"></div>',
            $chipWidths
        ));
        $out .= '<div class="rc-skill-card">'
            . '<div class="rc-skeleton" style="height:14px;width:' . $titlePct . '%;margin-bottom:14px;"></div>'
            . '<div style="display:flex;flex-wrap:wrap;gap:6px;">' . $chips . '</div>'
            . '</div>';
    }
    return $out;
}

function rc_is_mobile_gallery_file(string $file): bool
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
function rc_render_gallery_slide_img(array $item, string $assetsBase, string $class, bool $decorative = false): string
{
    $file = (string) $item['file'];
    $alt = $decorative ? '' : (string) ($item['alt'] ?? '');
    $w = isset($item['width']) ? (int) $item['width'] : 0;
    $h = isset($item['height']) ? (int) $item['height'] : 0;
    $src = rc_asset_url($assetsBase, $file);
    $srcset = $decorative ? '' : rc_gallery_img_srcset_attr($item, $assetsBase);
    $sizes = $srcset !== '' ? ' sizes="(max-width: 768px) 90vw, 33vw"' : '';
    $prio = rc_lazy_img_priority(false);
    $aria = $decorative ? ' alt="" aria-hidden="true"' : ' alt="' . rc_esc($alt) . '"';

    return '<img class="' . rc_esc($class) . '" src="' . rc_esc($src) . '"' . $srcset . $sizes . $aria
        . ($w > 0 ? ' width="' . $w . '"' : '')
        . ($h > 0 ? ' height="' . $h . '"' : '')
        . ' loading="' . $prio['loading'] . '" decoding="async"' . $prio['fetch'] . ' />';
}

function rc_brand_display_name(array $brand): string
{
    $name = trim((string) ($brand['name'] ?? ''));
    if ($name !== '') {
        return $name;
    }

    return trim((string) ($brand['caption'] ?? ''));
}

function rc_brand_initials(string $name): string
{
    $name = trim($name);
    if ($name === '') {
        return '?';
    }
    if (preg_match('/^A\/X\b/i', $name) === 1) {
        return 'AX';
    }
    $clean = preg_replace('/[()\/]/', ' ', $name) ?? $name;
    $words = preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $skip = ['LTD', 'BY', 'THE', 'AND', 'OF', 'LABEL', 'PRIVATE'];
    $letters = '';
    foreach ($words as $word) {
        $upper = strtoupper($word);
        if (in_array($upper, $skip, true)) {
            continue;
        }
        $letters .= strtoupper(substr($word, 0, 1));
        if (strlen($letters) >= 2) {
            break;
        }
    }

    return $letters !== '' ? substr($letters, 0, 3) : '?';
}

/**
 * @return array<string, array{type: string, src?: string}> uppercase label => logo entry
 */
function rc_load_brand_logos(): array
{
    static $cache = null;
    if (is_array($cache)) {
        return $cache;
    }
    $cache = [];
    $path = dirname(__DIR__) . '/data/logos.txt';
    if (!is_readable($path)) {
        return $cache;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        return $cache;
    }
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = preg_split("/\t+/", $line, 2);
        if (!is_array($parts) || $parts === []) {
            continue;
        }
        $key = strtoupper(trim($parts[0]));
        if ($key === '') {
            continue;
        }
        $entry = rc_parse_brand_logo_value(isset($parts[1]) ? (string) $parts[1] : '');
        if ($entry !== null) {
            $cache[$key] = $entry;
        }
    }

    return $cache;
}

function rc_brand_logo_key(string $label): string
{
    return strtoupper(trim($label));
}

/**
 * @return array{type: string, src?: string}|null
 */
function rc_parse_brand_logo_value(string $raw): ?array
{
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }
    if (strcasecmp($raw, 'text') === 0 || str_contains(strtolower($raw), 'text-fallback')) {
        return ['type' => 'text'];
    }
    if (str_starts_with($raw, 'https://') && filter_var($raw, FILTER_VALIDATE_URL)) {
        if (preg_match('/\.(svg|webp)(\?|#|$)/i', $raw) === 1) {
            return ['type' => 'url', 'src' => $raw];
        }

        return null;
    }
    if (preg_match('#/assets/images/(.+)$#i', $raw, $m) === 1) {
        $raw = $m[1];
    }
    if (preg_match('/\.(svg|webp)$/i', $raw) === 1) {
        return ['type' => 'file', 'src' => $raw];
    }

    return null;
}

/**
 * @return array{type: string, src?: string}|null
 */
function rc_resolve_brand_logo_entry(string $label): ?array
{
    $key = rc_brand_logo_key($label);
    if ($key === '') {
        return null;
    }
    $logos = rc_load_brand_logos();

    return $logos[$key] ?? null;
}

function rc_brand_fallback_display_text(string $label): string
{
    $key = rc_brand_logo_key($label);
    $short = [
        'PL (PRIVATE LABEL)' => 'PL',
        'AAVAN ALLIANCE LTD' => 'AAVAN',
        'MASS MARKET' => 'MASS',
        'PRIVATE LABEL' => 'PRIVATE',
        'PHILIPPE STARCK' => 'STARCK',
    ];
    if (isset($short[$key])) {
        return $short[$key];
    }

    return mb_strtoupper(trim($label));
}

function rc_brand_text_fallback_markup(string $label): string
{
    return '<span class="rc-job-brand-text" aria-hidden="true">' . rc_esc(rc_brand_fallback_display_text($label)) . '</span>';
}

/**
 * @param array<string, mixed> $brand
 */
function rc_render_brand_cell(array $brand, string $assetsBase): string
{
    $label = rc_brand_display_name($brand);
    if ($label === '') {
        return '';
    }
    $file = trim((string) ($brand['file'] ?? ''));
    $alt = (string) ($brand['alt'] ?? $label);
    $prio = rc_lazy_img_priority(false);
    $lazyAttrs = ' loading="' . $prio['loading'] . '" decoding="async"' . $prio['fetch'];
    if ($file !== '') {
        $src = rc_asset_url($assetsBase, $file);
        $media = '<img class="rc-job-brand-img" src="' . rc_esc($src) . '" alt="' . rc_esc($alt) . '"' . $lazyAttrs . ' />';
    } else {
        $entry = null;
        $external = trim((string) ($brand['url'] ?? ''));
        if ($external !== '' && filter_var($external, FILTER_VALIDATE_URL) && str_starts_with($external, 'https://')) {
            $entry = ['type' => 'url', 'src' => $external];
        } else {
            $entry = rc_resolve_brand_logo_entry($label);
        }
        if ($entry !== null && ($entry['type'] ?? '') === 'text') {
            $media = rc_brand_text_fallback_markup($label);
        } elseif ($entry !== null && ($entry['type'] ?? '') === 'url' && isset($entry['src'])) {
            $media = rc_render_deferred_img('rc-job-brand-img', (string) $entry['src'], $alt, 'referrerpolicy="no-referrer"');
        } elseif ($entry !== null && ($entry['type'] ?? '') === 'file' && isset($entry['src'])) {
            $src = rc_asset_url($assetsBase, (string) $entry['src']);
            $media = '<img class="rc-job-brand-img" src="' . rc_esc($src) . '" alt="' . rc_esc($alt) . '"' . $lazyAttrs . ' />';
        } else {
            $media = rc_brand_text_fallback_markup($label);
        }
    }

    return '<li class="rc-fifth-grid__cell rc-job-brand-cell">'
        . $media
        . '<span class="rc-job-brand-caption">' . rc_esc($label) . '</span>'
        . '</li>';
}

/**
 * Legacy Integrity #x-content-band-11: 5 columns, 4% gap, 30px row gap, 1180px max-width.
 */
function rc_render_fifth_grid(string $cellsHtml, string $ariaLabel = '', string $wrapClass = ''): string
{
    if ($cellsHtml === '') {
        return '';
    }
    $wrapClass = trim('rc-fifth-grid-wrap ' . $wrapClass);
    $attrs = $ariaLabel !== ''
        ? ' role="group" aria-label="' . rc_esc($ariaLabel) . '"'
        : '';

    return '<div class="' . rc_esc($wrapClass) . '"' . $attrs . '>'
        . '<ul class="rc-fifth-grid">' . $cellsHtml . '</ul>'
        . '</div>';
}

/**
 * @param list<array<string, mixed>> $brands
 */
function rc_render_job_brand_grid(array $brands, string $assetsBase, string $ariaLabel): string
{
    if ($brands === []) {
        return '';
    }
    $cells = '';
    foreach ($brands as $brand) {
        if (!is_array($brand)) {
            continue;
        }
        $cells .= rc_render_brand_cell($brand, $assetsBase);
    }
    return rc_render_fifth_grid($cells, $ariaLabel, 'rc-job-brand-grid');
}

/**
 * @param list<array<string, mixed>> $agency
 * @param list<array<string, mixed>> $marks
 */
function rc_render_job_brand_grids(array $agency, array $marks, string $assetsBase): string
{
    $agencyHtml = rc_render_job_brand_grid($agency, $assetsBase, 'Client and agency brands');
    $marksHtml = rc_render_job_brand_grid($marks, $assetsBase, 'WPMU brand marks');
    if ($agencyHtml === '' && $marksHtml === '') {
        return '';
    }

    return '<div class="rc-job-brand-grids">' . $agencyHtml . $marksHtml . '</div>';
}

/**
 * @param list<array<string, mixed>> $gallery
 */
function rc_render_gallery_html(array $gallery, string $assetsBase, string $company = ''): string
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
        $desktopSrc = rc_asset_url($assetsBase, $file);
        $mobileSrc = $mobile !== null ? rc_asset_url($assetsBase, (string) $mobile['file']) : '';
        $mobileAlt = $mobile !== null ? (string) ($mobile['alt'] ?? '') : '';
        $pairedClass = $mobile !== null ? ' rc-slide-figure--paired' : '';
        $capHtml = $caption !== '' ? '<figcaption class="rc-slide-caption">' . rc_esc($caption) . '</figcaption>' : '';
        $mobileImg = $mobile !== null
            ? rc_render_gallery_slide_img($mobile, $assetsBase, 'rc-slide-mobile', true)
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
            . rc_render_gallery_slide_img($desktop, $assetsBase, 'rc-slide-desktop', false)
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

function rc_render_experience(array $resume, string $persona, string $assetsBase): string
{
    $experience = $resume['experience'] ?? [];
    if (!is_array($experience)) {
        return '<p class="rc-empty">Experience specific to this persona is currently being updated. Please select <strong>Full-Stack Developer</strong> for a complete work history.</p>';
    }
    $jobs = [];
    foreach ($experience as $job) {
        if (!is_array($job)) {
            continue;
        }
        $accomplishments = $job['accomplishments'] ?? [];
        if (!is_array($accomplishments)) {
            $accomplishments = [];
        }
        $filtered = [];
        foreach ($accomplishments as $a) {
            if (!is_array($a) || !rc_accomplishment_matches_persona($a, $persona)) {
                continue;
            }
            $filtered[] = $a;
        }
        if ($filtered !== []) {
            $jobs[] = [
                'company' => (string) ($job['company'] ?? ''),
                'position' => (string) ($job['position'] ?? ''),
                'startDate' => (string) ($job['startDate'] ?? ''),
                'endDate' => (string) ($job['endDate'] ?? ''),
                'gallery' => is_array($job['gallery'] ?? null) ? $job['gallery'] : [],
                'agencyGrid' => is_array($job['agencyGrid'] ?? null) ? $job['agencyGrid'] : [],
                'brandGrid' => is_array($job['brandGrid'] ?? null) ? $job['brandGrid'] : [],
                'accomplishments' => $filtered,
            ];
        }
    }
    if ($jobs === []) {
        return '<p class="rc-empty">Experience specific to this persona is currently being updated. Please select <strong>Full-Stack Developer</strong> for a complete work history.</p>';
    }
    usort(
        $jobs,
        static function (array $a, array $b): int {
            $endA = rc_resume_month_key((string) ($a['endDate'] ?? ''), true);
            $endB = rc_resume_month_key((string) ($b['endDate'] ?? ''), true);
            if ($endB !== $endA) {
                return $endB <=> $endA;
            }
            $startA = rc_resume_month_key((string) ($a['startDate'] ?? ''), false);
            $startB = rc_resume_month_key((string) ($b['startDate'] ?? ''), false);

            return $startB <=> $startA;
        }
    );
    $html = '';
    foreach ($jobs as $job) {
        $id = rc_slugify($job['company']);
        $startD = rc_esc($job['startDate']);
        $endD = $job['endDate'];
        $endDtAttr = $endD !== 'Present' && $endD !== '' ? ' datetime="' . rc_esc($endD) . '"' : '';
        $datesInner = '<time datetime="' . $startD . '">' . rc_fmt_date($job['startDate']) . '</time>'
            . ' – '
            . ($endD === 'Present' || $endD === ''
                ? 'Present'
                : '<time' . $endDtAttr . '>' . rc_fmt_date($endD) . '</time>');
        $lis = '';
        foreach ($job['accomplishments'] as $a) {
            if (!is_array($a)) {
                continue;
            }
            $lis .= rc_render_accomplishment_item($a, $resume, $persona);
        }
        $gal = is_array($job['gallery']) ? $job['gallery'] : [];
        $agency = is_array($job['agencyGrid']) ? $job['agencyGrid'] : [];
        $marks = is_array($job['brandGrid']) ? $job['brandGrid'] : [];
        $brandGridHtml = rc_render_job_brand_grids($agency, $marks, $assetsBase);
        $galleryHtml = rc_render_gallery_html($gal, $assetsBase, $job['company']);
        $html .= '<article class="rc-job" id="' . rc_esc($id) . '">'
            . '<header class="rc-job-header">'
            . '<div>'
            . '<h3>' . rc_esc($job['company']) . '</h3>'
            . '<p class="rc-position">' . rc_esc($job['position']) . '</p>'
            . '</div>'
            . '<p class="rc-job-dates">' . $datesInner . '</p>'
            . '</header>'
            . $brandGridHtml
            . $galleryHtml
            . '<ul class="rc-accomplishments">' . $lis . '</ul>'
            . '</article>';
    }

    return $html;
}

/**
 * @param array<string, mixed> $resume
 */
function rc_render_education(array $resume): string
{
    $edu = $resume['education'] ?? [];
    if (!is_array($edu) || $edu === []) {
        return '';
    }
    $out = '';
    foreach ($edu as $e) {
        if (!is_array($e)) {
            continue;
        }
        $program = (string) ($e['area'] ?? $e['degree'] ?? '');
        $focusLegacy = !empty($e['focus']) && empty($e['area']) ? (string) $e['focus'] : '';
        $studyBits = [];
        if (!empty($e['studyType'])) {
            $studyBits[] = (string) $e['studyType'];
        }
        if (!empty($e['startDate']) && !empty($e['endDate'])) {
            $studyBits[] = (string) $e['startDate'] . ' – ' . (string) $e['endDate'];
        }
        $studyLine = implode(' · ', $studyBits);
        $grade = $e['score'] ?? $e['gpa'] ?? null;
        $highlights = '';
        $hl = $e['highlights'] ?? [];
        if (is_array($hl) && $hl !== []) {
            $lih = '';
            foreach ($hl as $h) {
                $lih .= '<li>' . rc_esc((string) $h) . '</li>';
            }
            $highlights = '<ul class="rc-edu-highlights">' . $lih . '</ul>';
        }
        $out .= '<div class="rc-edu-card">'
            . '<h3 class="rc-edu-institution">' . rc_esc((string) ($e['institution'] ?? '')) . '</h3>'
            . ($program !== '' ? '<p class="rc-edu-area">' . rc_esc($program) . '</p>' : '')
            . ($focusLegacy !== '' ? '<p class="rc-edu-focus">' . rc_esc($focusLegacy) . '</p>' : '')
            . ($studyLine !== '' ? '<p class="rc-edu-study">' . rc_esc($studyLine) . '</p>' : '')
            . ($grade !== null && $grade !== '' ? '<p class="rc-edu-meta">GPA: ' . rc_esc((string) $grade) . '</p>' : '')
            . $highlights
            . '</div>';
    }

    return $out;
}

/**
 * @param array<string, mixed> $resume
 */
function rc_render_recommendations(array $resume, string $persona): string
{
    $all = $resume['recommendations'] ?? [];
    if (!is_array($all)) {
        return '';
    }
    $filtered = [];
    foreach ($all as $r) {
        if (!is_array($r)) {
            continue;
        }
        $rps = $r['personas'] ?? [];
        if (!is_array($rps) || $rps === [] || in_array($persona, $rps, true)) {
            $filtered[] = $r;
        }
    }
    if ($filtered === []) {
        return '';
    }
    $out = '';
    foreach ($filtered as $r) {
        $name = (string) ($r['name'] ?? '');
        $text = (string) ($r['text'] ?? '');
        $title = (string) ($r['title'] ?? '');
        $out .= '<blockquote class="rc-rec-card" cite="' . rc_esc($name) . '">'
            . '<p class="rc-rec-text">' . rc_esc($text) . '</p>'
            . '<footer class="rc-rec-attribution">'
            . '<strong>' . rc_esc($name) . '</strong>'
            . ($title !== '' ? '<span class="rc-rec-title">' . rc_esc($title) . '</span>' : '')
            . '</footer></blockquote>';
    }

    return $out;
}

function rc_resolve_portfolio_image(string $file, string $assetsBase): string
{
    return rc_asset_url($assetsBase, $file);
}

/**
 * @param array<string, mixed> $item
 */
function rc_portfolio_item_visible(array $item, string $persona): bool
{
    $personas = $item['personas'] ?? null;
    if (!is_array($personas) || $personas === []) {
        return true;
    }

    return in_array($persona, $personas, true);
}

function rc_portfolio_format_icon_svg(string $format): string
{
    if ($format === 'pdf') {
        return '<svg class="rc-cred-icon" viewBox="0 0 48 48" aria-hidden="true">'
            . '<rect width="48" height="48" rx="10" fill="#dc2626"/>'
            . '<text x="24" y="31" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" font-family="Inter,sans-serif">PDF</text>'
            . '</svg>';
    }

    return '<svg class="rc-cred-icon" viewBox="0 0 48 48" aria-hidden="true">'
        . '<rect width="48" height="48" rx="10" fill="#2563eb"/>'
        . '<text x="24" y="31" text-anchor="middle" fill="#fff" font-size="14" font-weight="700" font-family="Inter,sans-serif">W</text>'
        . '</svg>';
}

/**
 * @param array<string, mixed> $block
 */
function rc_render_credentials_block(array $block, string $assetsBase): string
{
    $heading = (string) ($block['heading'] ?? 'Credentials');
    $intro = (string) ($block['intro'] ?? '');
    $downloads = $block['downloads'] ?? [];
    if (!is_array($downloads) || $downloads === []) {
        return '';
    }

    $cards = '';
    foreach ($downloads as $dl) {
        if (!is_array($dl)) {
            continue;
        }
        $format = (string) ($dl['format'] ?? '');
        $label = (string) ($dl['label'] ?? $format);
        $file = (string) ($dl['file'] ?? '');
        $icon = (string) ($dl['icon'] ?? '');
        $hint = (string) ($dl['hint'] ?? '');
        if ($file === '') {
            continue;
        }
        if ($icon !== '') {
            $iconHtml = '<img class="rc-cred-icon" src="' . rc_esc(rc_asset_url($assetsBase, $icon)) . '" alt="" width="48" height="48" decoding="async" />';
        } else {
            $iconHtml = rc_portfolio_format_icon_svg($format);
        }
        $cards .= '<a class="rc-cred-card rc-cred-card--' . rc_esc($format) . '" href="' . rc_esc($file) . '" download>'
            . $iconHtml
            . '<span class="rc-cred-label">' . rc_esc($label) . '</span>'
            . ($hint !== '' ? '<span class="rc-cred-hint">' . rc_esc($hint) . '</span>' : '')
            . '</a>';
    }

    if ($cards === '') {
        return '';
    }

    $introHtml = $intro !== '' ? '<p class="rc-portfolio-lead">' . rc_esc($intro) . '</p>' : '';

    return '<div class="rc-portfolio-block rc-portfolio-credentials">'
        . '<h3 class="rc-portfolio-subheading">' . rc_esc($heading) . '</h3>'
        . $introHtml
        . '<div class="rc-cred-grid">' . $cards . '</div></div></div>';
}

/**
 * @param array<string, mixed> $block
 */
function rc_render_agency_block(array $block, string $assetsBase): string
{
    $heading = (string) ($block['heading'] ?? 'Agency Experience');
    $intro = (string) ($block['intro'] ?? '');
    $grid = $block['grid'] ?? [];
    $gridHtml = '';
    if (is_array($grid) && $grid !== []) {
        $gridHtml = rc_render_job_brand_grid($grid, $assetsBase, 'Career employers and agency clients');
    }
    $partners = $block['partners'] ?? [];
    if ($gridHtml === '' && (!is_array($partners) || $partners === [])) {
        return '';
    }

    $logos = '';
    foreach ($partners as $partner) {
        if (!is_array($partner)) {
            continue;
        }
        $file = (string) ($partner['file'] ?? '');
        $alt = (string) ($partner['alt'] ?? '');
        if ($file === '') {
            continue;
        }
        $src = rc_resolve_portfolio_image($file, $assetsBase);
        $url = (string) ($partner['url'] ?? '');
        $inner = '<img src="' . rc_esc($src) . '" alt="' . rc_esc($alt) . '" loading="lazy" decoding="async" fetchpriority="low" />';
        if ($url !== '') {
            $inner = '<a href="' . rc_esc($url) . '" target="_blank" rel="noopener noreferrer">' . $inner . '</a>';
        }
        $logos .= '<li class="rc-fifth-grid__cell rc-agency-logo">' . $inner . '</li>';
    }

    $introHtml = $intro !== '' ? '<p class="rc-portfolio-lead rc-portfolio-lead--center">' . rc_esc($intro) . '</p>' : '';
    $stripHtml = $logos !== '' ? rc_render_fifth_grid($logos, 'Agency partners', 'rc-agency-strip') : '';

    return '<div class="rc-portfolio-block rc-portfolio-agency rc-fifth-band">'
        . '<h3 class="rc-portfolio-subheading rc-portfolio-subheading--center">' . rc_esc($heading) . '</h3>'
        . $introHtml
        . $gridHtml
        . $stripHtml
        . '</div>';
}

/**
 * @param array<string, mixed> $block
 */
function rc_render_showcase_block(array $block, string $assetsBase): string
{
    $heading = (string) ($block['heading'] ?? 'Example Websites');
    $intro = (string) ($block['intro'] ?? '');
    $gridOrder = $block['gridOrder'] ?? [];
    if (!is_array($gridOrder) || $gridOrder === []) {
        return '';
    }

    $cells = '';
    $index = 0;
    foreach ($gridOrder as $file) {
        if (!is_string($file) || $file === '') {
            continue;
        }
        $index++;
        $src = rc_resolve_portfolio_image($file, $assetsBase);
        $alt = 'Fort Worth web developer portfolio sample ' . $index;
        $cells .= '<li class="rc-fifth-grid__cell rc-showcase-cell">'
            . '<img src="' . rc_esc($src) . '" alt="' . rc_esc($alt) . '" loading="lazy" decoding="async" fetchpriority="low" />'
            . '</li>';
    }

    if ($cells === '') {
        return '';
    }

    $introHtml = $intro !== '' ? '<p class="rc-portfolio-lead rc-portfolio-lead--center">' . rc_esc($intro) . '</p>' : '';
    $gridHtml = rc_render_fifth_grid($cells, '', 'rc-showcase-grid');

    return '<div class="rc-portfolio-block rc-portfolio-showcase rc-fifth-band">'
        . '<h3 class="rc-portfolio-subheading rc-portfolio-subheading--center">' . rc_esc($heading) . '</h3>'
        . $introHtml
        . $gridHtml
        . '</div>';
}

/**
 * @param array<string, mixed> $resume
 */
function rc_render_portfolio(array $resume, string $persona, string $assetsBase): string
{
    $portfolio = $resume['portfolio'] ?? null;
    if (!is_array($portfolio)) {
        return '';
    }
    $sectionPersonas = $portfolio['personas'] ?? [];
    if (!rc_is_view_all_persona($persona)
        && is_array($sectionPersonas) && $sectionPersonas !== [] && !in_array($persona, $sectionPersonas, true)) {
        return '';
    }

    $out = '';
    $credentials = $portfolio['credentials'] ?? null;
    if (is_array($credentials)) {
        $out .= rc_render_credentials_block($credentials, $assetsBase);
    }
    $agency = $portfolio['agency'] ?? null;
    if (is_array($agency)) {
        $out .= rc_render_agency_block($agency, $assetsBase);
    }
    $showcase = $portfolio['showcase'] ?? null;
    if (is_array($showcase)) {
        $out .= rc_render_showcase_block($showcase, $assetsBase);
    }

    return $out;
}

/**
 * @param array<string, mixed> $resume
 * @return array<string, mixed>
 */
function rc_person_json_ld(array $resume, string $persona, string $canonicalUrl): array
{
    if (rc_is_view_all_persona($persona)) {
        $persona = 'fullstack';
    }

    $filterNulls = static function (array $a): array {
        return array_filter(
            $a,
            static function ($v): bool {
                if ($v === null || $v === '' || $v === []) {
                    return false;
                }
                if (is_array($v)) {
                    return $v !== [];
                }

                return true;
            }
        );
    };

    $basics = $resume['basics'] ?? [];
    $p = $resume['personas'][$persona] ?? [];
    $name = (string) ($basics['name'] ?? '');
    $email = (string) ($basics['email'] ?? '');
    $phone = (string) ($basics['phone'] ?? '');
    $personSiteUrl = (string) ($basics['url'] ?? '');
    $sameAs = $basics['sameAs'] ?? [];
    if (!is_array($sameAs)) {
        $sameAs = [];
    }
    $sameAs = array_values(array_filter($sameAs, static function ($x): bool {
        return is_string($x) && $x !== '';
    }));

    $imagePath = (string) ($p['image'] ?? $basics['image'] ?? '');
    $siteBase = defined('RC_BASE_URL') ? rtrim((string) RC_BASE_URL, '/') : rtrim((string) preg_replace('/\?.*/', '', $canonicalUrl), '/');
    if ($imagePath !== '' && preg_match('#^https?://#i', $imagePath)) {
        $imageAbsolute = $imagePath;
    } elseif ($imagePath !== '') {
        $imageAbsolute = $siteBase . '/' . ltrim($imagePath, '/');
    } else {
        $imageAbsolute = null;
    }

    $knowsAbout = [];
    $skills = $resume['skills'] ?? [];
    if (is_array($skills)) {
        foreach ($skills as $s) {
            if (!is_array($s)) {
                continue;
            }
            $ps = $s['personas'] ?? [];
            if (!is_array($ps) || !in_array($persona, $ps, true)) {
                continue;
            }
            $items = $s['items'] ?? [];
            if (is_array($items)) {
                foreach ($items as $i) {
                    $knowsAbout[] = (string) $i;
                }
            }
        }
    }

    $worksFor = [];
    $exp = $resume['experience'] ?? [];
    if (is_array($exp)) {
        foreach ($exp as $job) {
            if (!is_array($job)) {
                continue;
            }
            if (($job['endDate'] ?? '') === 'Present' && !empty($job['company'])) {
                $worksFor[] = [
                    '@type' => 'Organization',
                    'name' => (string) $job['company'],
                ];
            }
        }
    }

    $alumniOf = [];
    $edu = $resume['education'] ?? [];
    if (is_array($edu)) {
        foreach ($edu as $e) {
            if (is_array($e) && !empty($e['institution'])) {
                $alumniOf[] = [
                    '@type' => 'CollegeOrUniversity',
                    'name' => (string) $e['institution'],
                ];
            }
        }
    }

    $jobTitle = (string) ($p['title'] ?? $basics['label'] ?? '');
    $personId = $canonicalUrl . '#person';

    $pageName = $name !== '' && $jobTitle !== ''
        ? $name . ' — ' . $jobTitle
        : ($name !== '' ? $name : ($jobTitle !== '' ? $jobTitle : null));

    $person = $filterNulls([
        '@type' => 'Person',
        '@id' => $personId,
        'name' => $name !== '' ? $name : null,
        'image' => $imageAbsolute,
        'url' => $personSiteUrl !== '' ? $personSiteUrl : $canonicalUrl,
        'email' => $email !== '' ? $email : null,
        'telephone' => $phone !== '' ? $phone : null,
        'jobTitle' => $jobTitle !== '' ? $jobTitle : null,
        'description' => (string) ($p['summary'] ?? '') !== '' ? (string) $p['summary'] : null,
        'address' => [
            '@type' => 'PostalAddress',
            'addressLocality' => 'Fort Worth',
            'addressRegion' => 'TX',
            'addressCountry' => 'US',
        ],
        'worksFor' => $worksFor !== [] ? (count($worksFor) === 1 ? $worksFor[0] : $worksFor) : null,
        'alumniOf' => $alumniOf !== [] ? (count($alumniOf) === 1 ? $alumniOf[0] : $alumniOf) : null,
        'knowsAbout' => $knowsAbout !== [] ? array_values(array_unique($knowsAbout)) : null,
        'sameAs' => $sameAs !== [] ? $sameAs : null,
        'mainEntityOfPage' => [
            '@type' => 'ProfilePage',
            '@id' => $canonicalUrl,
        ],
    ]);

    $pageDescription = (string) ($p['metaDescription'] ?? '');
    if ($pageDescription === '') {
        $pageDescription = (string) ($p['summary'] ?? '');
    }

    return $filterNulls([
        '@context' => 'https://schema.org',
        '@type' => 'ProfilePage',
        '@id' => $canonicalUrl,
        'url' => $canonicalUrl,
        'name' => $pageName,
        'description' => $pageDescription !== '' ? $pageDescription : null,
        'mainEntity' => $person,
    ]);
}
