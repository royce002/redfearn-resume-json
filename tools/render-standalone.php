<?php
/**
 * Render index.php to stdout for standalone.html generation.
 * CLI-safe: no redirects, localhost context.
 */
declare(strict_types=1);

chdir(__DIR__ . '/../');

$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['HTTPS'] = 'off';

require 'index.php';
