import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const
	locales = [
		"en-US",
		"ru-RU"
	],

	currencies = [
		"USD",
		"EUR",
		"RUB",
		"BYR"
	],

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
		},

		"ru-RU": {
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
		},

		"ru-RU": {
			currency: {
				style: "currency",
				currency: "RUB"
			},
			currencyNoCents: {
				style: "currency",
				currency: "RUB",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			}
		}
	},

	pluralizationRules = {
		/**
		 * @param choice {number} a choice index given by the input to $tc: `$tc('path.to.rule', choiceIndex)`
		 * @param choicesLength {number} an overall amount of available choices
		 * 
		 * @returns a final choice index to select plural word by
		 */
		"ru-RU": (choice, choicesLength) => {
			// this === VueI18n instance, so the locale property also exists here

			if (choice === 0) {
				return 0;
			}

			const teen = choice > 10 && choice < 20;
			const endsWithOne = choice % 10 === 1;

			if (choicesLength < 4) {
				return (!teen && endsWithOne) ? 1 : 2;
			}
			if (!teen && endsWithOne) {
				return 1;
			}
			if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
				return 2;
			}

			return (choicesLength < 4) ? 2 : 3;
		}
	};

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
	fallbackWarn: false,
	missingWarn: false,
	dateTimeFormats,
	numberFormats,
	pluralizationRules
});

export { locales, currencies, dateTimeFormats, numberFormats };