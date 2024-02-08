<!DOCTYPE html>
<html lang="">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width,initial-scale=1.0">
		<?php
				require_once('og.php'); 

				$og = new OG($_GET, "http://test.pocketnet.app:8898/");

				$og->check();
				$og->echotags();
		?>
		<link rel="icon" href="<%= BASE_URL %>favicon.ico">
		<title><%= htmlWebpackPlugin.options.title %></title>
		<script src="https://<%= process.env.VUE_APP_SDK %>/js/lib/apps/sdk.js"></script>
		<link rel="stylesheet" href="https://<%= process.env.VUE_APP_SDK %>/js/lib/apps/style.css">
	</head>
	<body>
		<noscript>
			<strong>We're sorry but <%= htmlWebpackPlugin.options.title %> doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
		</noscript>
		<div id="app"></div>
		<!-- built files will be auto injected -->
	</body>
</html>
