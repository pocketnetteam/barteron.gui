const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
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
})