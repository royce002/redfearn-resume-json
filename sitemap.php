<?php
declare(strict_types=1);

header('Content-Type: application/xml; charset=utf-8');

$resumePath = __DIR__ . '/data/resume.json';
$lastmod = is_readable($resumePath) ? date('Y-m-d', filemtime($resumePath)) : gmdate('Y-m-d');
$base = 'https://redfearn.co';

$urls = [$base . '/'];
foreach (['frontend', 'backend', 'pm', 'seo'] as $p) {
    $urls[] = $base . '/?show_as=' . rawurlencode($p);
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $loc) {
    $safe = htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    echo "  <url><loc>{$safe}</loc><lastmod>{$lastmod}</lastmod></url>\n";
}
echo "</urlset>\n";
