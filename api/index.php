<?php

// Create required storage directories in /tmp
$storageDirs = [
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/bootstrap/cache',
    '/tmp/storage/logs',
];

foreach ($storageDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Ensure logs go to Vercel's log system
putenv('LOG_CHANNEL=stderr');
putenv('APP_DEBUG=true'); // Paksa debug aktif untuk melihat error detail di layar

// Forward Vercel requests to normal index.php
require __DIR__ . '/../public/index.php';
