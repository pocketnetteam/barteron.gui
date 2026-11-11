<?php

// Router for `php -S … -t dist build/og-router.php` (build/og-check.mjs):
// static files as they are, every other path to index.php, like the server.
$path = (string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$root = $_SERVER['DOCUMENT_ROOT'];
if ($path !== '/' && is_file($root . $path) && substr($path, -4) !== '.php') {
    return false;
}
chdir($root);
require $root . '/index.php';
