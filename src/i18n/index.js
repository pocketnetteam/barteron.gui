import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const
	locales = [
		"en-US",
		"ru-RU",
		"sr-RS",
	],

	defaultDateTimeFormat = {
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

	dateTimeFormats = {
		"en-US": defaultDateTimeFormat,
		"ru-RU": defaultDateTimeFormat,
		"sr-RS": defaultDateTimeFormat,
	},

	commonCurrency = {
		style: "decimal",
		useGrouping: true,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	},

	commonPkoin = {
		style: "decimal",
		useGrouping: true,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
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
			},
			shortPkoin: commonPkoin,
			shortCurrency: commonCurrency,
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
			},
			shortPkoin: commonPkoin,
			shortCurrency: commonCurrency,
		},

		"sr-RS": {
			currency: {
				style: "currency",
				currency: "RSD"
			},
			currencyNoCents: {
				style: "currency",
				currency: "RSD",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			},
			shortPkoin: commonPkoin,
			shortCurrency: commonCurrency,
		},
	},

	currencies = new (class {
		data = {
			"en-US_1": { code: "USD", graphem: "$" },
			"en-US_2": { code: "EUR", graphem: "€" },
			"ru-RU_1": { code: "RUB", graphem: "₽" },
			"ru-RU_2": { code: "BYN", graphem: "Br" },
			"ru-RU_3": { code: "UAH", graphem: "₴" },
			"ru-RU_4": { code: "KZT", graphem: "₸" },
		};

		/**
		 * Get map of codes
		 * 
		 * @returns {Array}
		 */
		map(fn) {
			return Object.entries(this.data).map(e => fn(e[1].code));
		}
		
		/**
		 * Get map of objects
		 * 
		 * @returns {Array[Object]}
		 */
		list(fn) {
			return Object.entries(this.data).map(e => fn(e[1]));
		}

		/**
		 * Sort data by locale
		 * 
		 * @returns {Array[Object]}
		 */
		sort(locale) {
			return Object.keys(this.data).sort((a, b) => {
				if (
					a.includes(locale) &&
					b.includes(locale) &&
					a > b
				) {
					return 1;
				}

				if (a.includes(locale)) {
					return -1;
				}
				
				return 0;
			}).map(k => this.data[k]);
		}
	}),

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

			return 3;
		},

		"sr-RS": (choice, choicesLength) => {
			// this === VueI18n instance, so the locale property also exists here

			if (choice === 0) {
				return 0;
			} else if (choice === 1 && choicesLength > 1) {
				return 1;
			} else if (1 < choice && choice < 5 && choicesLength > 2) {
				return 2;
			} else if (5 <= choice && choicesLength > 3) {
				return 3;
			}

			return choicesLength > 1 ? 1 : 0;
		},
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