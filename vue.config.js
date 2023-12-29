const
	{ defineConfig } = require('@vue/cli-service'),
	path = require("path");

module.exports = defineConfig({
	outputDir: path.resolve(__dirname, process.env.VUE_APP_EXPORT || "./dist"),

	indexPath: "index.php",

	chainWebpack: config => {
		if (process.env.NODE_ENV === 'production') {
			config
				.plugin('html')
				.tap(args => {
					args[0].template = "./public/index.php";
					return args;
				});
		}
	},

	transpileDependencies: true,

	devServer: {
		open: process.platform === "darwin",
		host: "0.0.0.0",
		port: 8080, // CHANGE YOUR PORT HERE!
		https: true,
		client: {
			webSocketURL: 'ws://0.0.0.0:8080/ws',
		},
		headers: { "Access-Control-Allow-Origin": "*" }
	},

	pluginOptions: {
		i18n: {
			locale: "en-US",
			fallbackLocale: "en-US",
			localeDir: "i18n",
			enableInSFC: false
		}
	}
});