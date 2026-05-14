<?php
$path = 'public/js/music.js';
$lines = file($path);
// Line 1282 is index 1281
// We want to remove about 51 lines (from 1282 to 1332)
array_splice($lines, 1281, 51);
file_put_contents($path, implode('', $lines));
echo "Removed lines 1282-1332\n";
?>
