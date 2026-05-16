<?php

/**
 * Site / CDN config. Persona labels, colors, and copy live in data/resume.json.
 */

$cloudflare = [
    'public_url' => 'https://assets.redfearn.co/images/',
];

const RC_BASE_URL = 'https://redfearn.co/';

/**
 * Strip default :443 / :80 from Host so comparisons match canonical URLs.
 */
function rc_normalize_host_for_canonical(string $host, bool $https): string
{
    $h = strtolower($host);
    if ($https && substr($h, -4) === ':443') {
        return substr($h, 0, -4);
    }
    if (!$https && substr($h, -3) === ':80') {
        return substr($h, 0, -3);
    }

    return $h;
}

/** Keys that are demo/presentation params — not part of the canonical URL for SEO but allowed without 301. */
const RC_DEMO_PARAMS = ['platform', 'theme'];

/**
 * GET only. 301 when scheme/host/path/query duplicate the homepage or drift from the single indexed URL per persona.
 * `platform` and `theme` are presentation params: valid values pass through; unknown keys still trigger a redirect.
 *
 * @param array<string> $validPlatforms
 * @param array<string> $validThemes
 */
function rc_redirect_to_canonical_url_if_needed(
    string $canonicalUrl,
    string $activePersona,
    array $validPlatforms = [],
    array $validThemes = []
): void {
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        return;
    }
    $want = parse_url($canonicalUrl);
    if (!is_array($want) || empty($want['scheme']) || empty($want['host'])) {
        return;
    }

    $forwarded = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ((string) ($_SERVER['SERVER_PORT'] ?? '') === '443')
        || ($forwarded === 'https');
    $gotScheme = $https ? 'https' : 'http';
    $gotHost = rc_normalize_host_for_canonical((string) ($_SERVER['HTTP_HOST'] ?? ''), $https);
    $wantHost = rc_normalize_host_for_canonical((string) $want['host'], strtolower((string) $want['scheme']) === 'https');

    $reqUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
    $rp = parse_url($reqUri);
    if (!is_array($rp)) {
        return;
    }
    $path = $rp['path'] ?? '/';
    if ($path === '/index.php' || $path === '/index.html') {
        header('Location: ' . $canonicalUrl, true, 301);
        exit;
    }
    if ($path !== '/' && $path !== '') {
        return;
    }

    if (strcasecmp((string) $want['scheme'], $gotScheme) !== 0 || strcasecmp($wantHost, $gotHost) !== 0) {
        header('Location: ' . $canonicalUrl, true, 301);
        exit;
    }

    $gotQuery = [];
    if (!empty($rp['query'])) {
        parse_str((string) $rp['query'], $gotQuery);
    }

    // Core persona requirement.
    $requiredPersonaQuery = $activePersona === 'fullstack' ? [] : ['show_as' => $activePersona];

    // Strip validated demo params before comparing to canonical requirements.
    $stripped = $gotQuery;
    unset($stripped['platform'], $stripped['theme']);

    if ($stripped !== $requiredPersonaQuery) {
        // Preserve valid demo params when redirecting so shareable links are not lost.
        $target = $canonicalUrl;
        $passthrough = [];
        if (!empty($validPlatforms) && isset($gotQuery['platform']) && in_array($gotQuery['platform'], $validPlatforms, true) && $gotQuery['platform'] !== 'wordpress') {
            $passthrough['platform'] = $gotQuery['platform'];
        }
        if (!empty($validThemes) && isset($gotQuery['theme']) && in_array($gotQuery['theme'], $validThemes, true) && $gotQuery['theme'] !== 'modern') {
            $passthrough['theme'] = $gotQuery['theme'];
        }
        if (!empty($passthrough)) {
            $sep = str_contains($target, '?') ? '&' : '?';
            $target .= $sep . http_build_query($passthrough);
        }
        header('Location: ' . $target, true, 301);
        exit;
    }

    // Allow valid demo params through; reject any unknown keys.
    foreach (array_keys($gotQuery) as $key) {
        if ($key === 'show_as') {
            continue;
        }
        if ($key === 'platform') {
            if (!empty($validPlatforms) && in_array($gotQuery['platform'], $validPlatforms, true)) {
                continue;
            }
        }
        if ($key === 'theme') {
            if (!empty($validThemes) && in_array($gotQuery['theme'], $validThemes, true)) {
                continue;
            }
        }
        // Unknown or invalid param — redirect to clean canonical.
        header('Location: ' . $canonicalUrl, true, 301);
        exit;
    }
}
