<?php
	ini_set('display_errors', '1');
	ini_set('display_startup_errors', '1');
	error_reporting(E_ALL);

	$uri = trim($_SERVER['REQUEST_URI'], '/');

	if (isset($uri)) {
		@list($page, $id) = explode('/', $uri);

		switch($page) {
			case "contacts": {
				header("Content-Type: application/json; charset=utf-8");
				require_once("contacts.php");
				break;
			}

			default: {
				header("Content-Type: text/html; charset=utf-8");
				require_once("og.php"); 
				$og = new OG($_GET, "http://proxy:8898/");
				$og->check();

				echo <<<HTML
					<!DOCTYPE html>
					<html lang="" version="01">
						<head>
							<meta charset="utf-8">
							<meta http-equiv="X-UA-Compatible" content="IE=edge">
							<meta name="viewport" content="width=device-width,initial-scale=1.0">
							<title><%= htmlWebpackPlugin.options.title %></title>
							<script src="https://<%= process.env.VUE_APP_SDK %>/js/lib/apps/sdk.js"></script>
							<link rel="stylesheet" href="https://<%= process.env.VUE_APP_SDK %>/js/lib/apps/style.css">
							{$og->echotags()}
							{$og->getIconLink()}
						</head>
						<body>
							<noscript>
								<strong>We're sorry but <%= htmlWebpackPlugin.options.title %> doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
							</noscript>
							<div id="app"></div>
							<!-- built files will be auto injected -->
						</body>
					</html>
				HTML;
			}
		}
	}
?>
