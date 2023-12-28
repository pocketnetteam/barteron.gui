<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <?php
        ini_set('display_errors', '1');
        ini_set('display_startup_errors', '1');
        error_reporting(E_ALL);

        require_once('og.php'); 

        /* $og = new OG($_GET, "http://127.0.0.1:8898/"); */
        $og = new OG($_GET, "http://test.pocketnet.app:8898/");

        $og->check();
        $og->echotags();
    ?>
    <link rel="icon" href="/<?php echo $og->manifest['icon']; ?>">
    <title><?php echo $og->manifest['name']; ?></title>
  </head>
  <body>
    
  </body>
</html>