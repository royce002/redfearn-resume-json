<?php

declare(strict_types=1);

/**
 * SSR helpers mirroring assets/js/resume.js rendering rules.
 */

function rc_esc(?string $s): string
{
    return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function rc_contact_link_label(string $url): string
{
    if (preg_match('#github\.com/([^/?#]+)#i', $url, $m)) {
        return 'github.com/' . $m[1];
    }
    $host = parse_url($url, PHP_URL_HOST);
    $path = parse_url($url, PHP_URL_PATH);

    return ($host !== false && $host !== null && $host !== '')
        ? $host . (($path !== false && $path !== null && $path !== '' && $path !== '/') ? $path : '')
        : $url;
}

/**
 * @param array<string, mixed> $basics
 */
function rc_render_contact(array $basics): string
{
    $html = '';
    $em = (string) ($basics['email'] ?? '');
    $ph = (string) ($basics['phone'] ?? '');
    $u = (string) ($basics['url'] ?? '');
    if ($em !== '') {
        $html .= '<a href="mailto:' . rc_esc($em) . '">' . rc_esc($em) . '</a>';
    }
    if ($ph !== '') {
        $tel = preg_replace('/[^\d+]/', '', $ph);
        $html .= '<a href="tel:' . rc_esc($tel) . '">' . rc_esc($ph) . '</a>';
    }
    if ($u !== '') {
        $html .= '<a href="' . rc_esc($u) . '" target="_blank" rel="noopener noreferrer">' . rc_esc($u) . '</a>';
    }
    $sameAs = $basics['sameAs'] ?? [];
    if (!is_array($sameAs)) {
        $sameAs = [];
    }
    foreach ($sameAs as $link) {
        if (!is_string($link) || $link === '') {
            continue;
        }
        $label = rc_contact_link_label($link);
        $html .= '<a href="' . rc_esc($link) . '" target="_blank" rel="noopener noreferrer">' . rc_esc($label) . '</a>';
    }

    return $html;
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

/** Absolute asset URL; encode filename once (spaces, unicode). */
function rc_asset_url(string $assetsBase, string $file): string
{
    return rtrim($assetsBase, '/') . '/' . rawurlencode($file);
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
        $ps = $s['personas'] ?? [];
        if (!is_array($ps) || !in_array($persona, $ps, true)) {
            continue;
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
        $ps = $s['personas'] ?? [];
        if (!is_array($ps) || !in_array($persona, $ps, true)) {
            continue;
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

/**
 * @param list<array<string, mixed>> $gallery
 */
function rc_render_gallery_html(array $gallery, string $assetsBase, bool &$pageLcpAssigned): string
{
    $gallery = array_values(array_filter($gallery, static function ($item): bool {
        if (!is_array($item) || !isset($item['file'])) {
            return false;
        }

        return !preg_match('/_mobile\./i', (string) $item['file']);
    }));
    if ($gallery === []) {
        return '';
    }
    $slides = '';
    foreach ($gallery as $item) {
        $file = (string) $item['file'];
        $alt = (string) ($item['alt'] ?? '');
        $caption = (string) ($item['caption'] ?? '');
        $w = isset($item['width']) ? (int) $item['width'] : 0;
        $h = isset($item['height']) ? (int) $item['height'] : 0;
        $loading = (string) ($item['loading'] ?? 'lazy');
        $src = rc_asset_url($assetsBase, $file);
        $srcset = rc_gallery_img_srcset_attr($item, $assetsBase);
        $sizes = $srcset !== '' ? ' sizes="(max-width: 768px) 90vw, 33vw"' : '';
        $fetch = '';
        if ($loading === 'eager' && !$pageLcpAssigned) {
            $fetch = ' fetchpriority="high"';
            $pageLcpAssigned = true;
        }
        $capHtml = $caption !== '' ? '<figcaption class="rc-slide-caption">' . rc_esc($caption) . '</figcaption>' : '';
        $slides .= '<figure class="rc-slide-figure">'
            . '<img src="' . rc_esc($src) . '"' . $srcset . $sizes
            . ' alt="' . rc_esc($alt) . '"'
            . ($w > 0 ? ' width="' . $w . '"' : '')
            . ($h > 0 ? ' height="' . $h . '"' : '')
            . ' loading="' . rc_esc($loading) . '" decoding="async"' . $fetch . ' />'
            . $capHtml
            . '</figure>';
    }

    return '<div class="rc-job-gallery" data-rc-gallery>'
        . '<div class="rc-job-gallery-scroll" tabindex="0" role="region" aria-label="Project screenshots">'
        . $slides
        . '</div>'
        . '<button type="button" class="rc-gallery-prev" aria-label="Scroll gallery left">‹</button>'
        . '<button type="button" class="rc-gallery-next" aria-label="Scroll gallery right">›</button>'
        . '</div>';
}

/**
 * @param array<string, mixed> $resume
 */
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
            if (!is_array($a) || !isset($a['text'])) {
                continue;
            }
            $aps = $a['personas'] ?? [];
            if (is_array($aps) && in_array($persona, $aps, true)) {
                $filtered[] = (string) $a['text'];
            }
        }
        if ($filtered !== []) {
            $jobs[] = [
                'company' => (string) ($job['company'] ?? ''),
                'position' => (string) ($job['position'] ?? ''),
                'startDate' => (string) ($job['startDate'] ?? ''),
                'endDate' => (string) ($job['endDate'] ?? ''),
                'gallery' => is_array($job['gallery'] ?? null) ? $job['gallery'] : [],
                'bullets' => $filtered,
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
    $pageLcpAssigned = false;
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
        foreach ($job['bullets'] as $t) {
            $lis .= '<li>' . rc_esc($t) . '</li>';
        }
        $gal = is_array($job['gallery']) ? $job['gallery'] : [];
        $galleryHtml = rc_render_gallery_html($gal, $assetsBase, $pageLcpAssigned);
        $html .= '<article class="rc-job" id="' . rc_esc($id) . '">'
            . '<header class="rc-job-header">'
            . '<div>'
            . '<h3>' . rc_esc($job['company']) . '</h3>'
            . '<p class="rc-position">' . rc_esc($job['position']) . '</p>'
            . '</div>'
            . '<p class="rc-job-dates">' . $datesInner . '</p>'
            . '</header>'
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

/**
 * @param array<string, mixed> $resume
 * @return array<string, mixed>
 */
function rc_person_json_ld(array $resume, string $persona, string $canonicalUrl): array
{
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
