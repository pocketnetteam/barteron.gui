const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
	transpileDependencies: true,
	pluginOptions: {
		i18n: {
			locale: "en-US",
			fallbackLocale: "en-US",
			localeDir: "i18n",
			enableInSFC: false
		}
	}
})