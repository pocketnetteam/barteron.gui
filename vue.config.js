const
	{ defineConfig } = require("@vue/cli-service"),
	HtmlWebpackPlugin = require("html-webpack-plugin"),
	path = require("path"),
	buildDir = path.resolve(__dirname, process.env.VUE_APP_EXPORT || "./dist");

class InjectAssetsPlugin {
	apply(compiler) {
		compiler.hooks.compilation.tap("InjectAssetsPlugin", (compilation) => {
			HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
				"InjectAssetsPlugin",
				(data, cb) => {
					const assets = Object.keys(compilation.assets);

					const chunkTags = assets
						.filter((f) => /chunk.*\..*\.html$/.test(f))
						.map((f) => `<script defer src="/${f}"></script>`);

					const jsTags = assets
						.filter((f) => /app.*\..*\.html$/.test(f))
						.map((f) => `<script defer src="/${f}"></script>`);

					const cssTags = assets
						.filter((f) => /app\..*\.css$/.test(f))
						.map((f) => `<link href="/${f}" rel="stylesheet">`);

					const generatedTags = [...chunkTags, ...jsTags, ...cssTags].join("");

					data.html = data.html.replace(
						"</head>",
						`\t${generatedTags}\n\t\t\t</head>`
					);
					
					cb(null, data);
				}
			);
		});
	}
}

module.exports = defineConfig({
	outputDir: buildDir,

	indexPath: "index.php",

	chainWebpack: config => {
		if (process.env.NODE_ENV === "production") {
			config.output
				.filename("files/[name].[contenthash].html")
				.chunkFilename("files/[name].[contenthash].html");

			config.plugin("html").tap((args) => {
				args[0].template = "./public/index.php";
				args[0].inject = false;
				return args;
			});

			config.plugin("inject-assets").use(InjectAssetsPlugin);
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
