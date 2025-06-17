const
	{ defineConfig } = require("@vue/cli-service"),
	path = require("path"),
	buildDir = path.resolve(__dirname, process.env.VUE_APP_EXPORT || "./dist");

module.exports = defineConfig({
	outputDir: buildDir,

	indexPath: "index.php",

	chainWebpack: config => {
		if (process.env.NODE_ENV === "production") {
			config
				.plugin("html")
				.tap(args => {
					args[0].template = "./public/index.php";
					return args;
				});

			config.output
				.filename('files/[chunkhash].html')
				.chunkFilename('files/[chunkhash].html');
		}
	},

	transpileDependencies: true,

	devServer: {
		open: process.platform === "darwin",
		host: "0.0.0.0",
		port: 8080, // CHANGE YOUR PORT HERE!
		https: true,
		client: {
			webSocketURL: "ws://0.0.0.0:8080/ws",
		},
		headers: { "Access-Control-Allow-Origin": "*" },
		proxy: {
			"/contacts": {
				target: process.env.VUE_APP_PROXY_TO || "https://localhost:8080",
				secure: false,
				changeOrigin: true,
				logLevel: "debug"
			},
		}
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
