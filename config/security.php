<?php

declare(strict_types=1);

/**
 * Defensive security header fallback. Skips each header if Apache mod_headers
 * (or an earlier PHP call) already applied it — backup when modules fail silently.
 */
function rc_safe_set_fallback_header(string $name, string $value): void
{
    if (headers_sent()) {
        return;
    }

    foreach (headers_list() as $header) {
        if (stripos($header, $name . ':') === 0) {
            return;
        }
    }

    header("{$name}: {$value}");
}

function rc_content_security_policy(): string
{
    return "default-src 'self'; "
        . "script-src 'self' https://cdn.logr-in.com https://embed.tawk.to https://www.googletagmanager.com "
        . "https://static.cloudflareinsights.com 'unsafe-inline'; "
        . "worker-src 'self' blob:; "
        . "style-src 'self' https://fonts.googleapis.com https://embed.tawk.to https://*.tawk.to 'unsafe-inline'; "
        . "font-src 'self' https://fonts.gstatic.com https://embed.tawk.to https://*.tawk.to; "
        . "img-src 'self' data: https://assets.redfearn.co https://placehold.co https://upload.wikimedia.org "
        . "https://*.tawk.to https://lh3.googleusercontent.com; "
        . "connect-src 'self' https://*.logrocket.io https://*.tawk.to wss://*.tawk.to "
        . "https://www.googletagmanager.com https://*.google-analytics.com "
        . "https://analytics.google.com https://www.google.com https://region1.google-analytics.com; "
        . "frame-src 'self' https://*.tawk.to; "
        . "object-src 'none'; "
        . "base-uri 'self'; "
        . "form-action 'self'; "
        . "upgrade-insecure-requests;";
}

/**
 * Sitewide security headers. Call before any output on every PHP entry point.
 */
function rc_send_security_headers(): void
{
    if (headers_sent()) {
        return;
    }

    $forwarded_proto = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ((string) ($_SERVER['SERVER_PORT'] ?? '') === '443')
        || ($forwarded_proto === 'https');

    if ($is_https) {
        rc_safe_set_fallback_header(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    rc_safe_set_fallback_header('Cross-Origin-Opener-Policy', 'same-origin');
    rc_safe_set_fallback_header('X-Content-Type-Options', 'nosniff');
    rc_safe_set_fallback_header('X-Frame-Options', 'DENY');
    rc_safe_set_fallback_header('Referrer-Policy', 'strict-origin-when-cross-origin');
    rc_safe_set_fallback_header('Content-Signal', 'search=yes,ai-train=no');
    rc_safe_set_fallback_header('Content-Security-Policy', rc_content_security_policy());
}
