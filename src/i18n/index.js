import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const
	dateTimeFormats = {
		"en-US": {
			short: {
				year: "numeric",
				month: "numeric",
				day: "numeric"
			},
			middle: {
				year: "numeric",
				month: "long",
				day: "numeric"
			},
			long: {
				year: "numeric",
				month: "long",
				day: "numeric"
			}
		}
	},

	numberFormats = {
		"en-US": {
			currency: {
				style: "currency",
				currency: "USD"
			},
			currencyNoCents: {
				style: "currency",
				currency: "USD",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			}
		}
	}

function loadLocaleMessages() {
	const
		locales = require.context(
			"./", true, /[A-Za-z0-9-_,\s]+\.json$/i
		),
		data = locales.keys().reduce((obj, path) => {
			const locale = path.substring(
				path.indexOf("/") + 1,
				path.lastIndexOf("/")
			);
	
			if (locale) {
				/* Merge localization from different files to one */
				obj[locale] = { ...obj[locale], ...locales(path) };
			}

			return obj;
		}, {});
	
	return data;
}

export default new VueI18n({
	locale: process.env.VUE_APP_I18N_LOCALE || "en-US",
	fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || "en-US",
	messages: loadLocaleMessages(),
	missingWarn: false,
	dateTimeFormats,
	numberFormats
});

export { dateTimeFormats, numberFormats };