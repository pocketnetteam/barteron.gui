import Vue from "vue";

import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const dateTimeFormats = {
	'en-US': {
		short: {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric'
		},
		middle: {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		},
		long: {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}
	}
}

function loadLocaleMessages() {
	const
		locales = require.context(
			"./", true, /[A-Za-z0-9-_,\s]+\.json$/i
		),
		data = {};

	locales.keys().forEach(key => {
		const
			matched = key.match(/\.\/(?<locale>.+)\//i),
			locale = matched.groups?.locale;

		if (locale) {
			if (!data[locale]) data[locale] = [];
			data[locale].push(locales(key));
		}
	});

	for (let k in data) {
		let localization = {};
		data[k].forEach(d => localization = Object.assign(localization, d));
		data[k] = localization;
		localization = null;
	}
	
	return data;
}

export default new VueI18n({
	locale: process.env.VUE_APP_I18N_LOCALE || "en-US",
	fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || "en-US",
	messages: loadLocaleMessages(),
	missingWarn: false,
	dateTimeFormats
});