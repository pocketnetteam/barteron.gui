import CurrencyStore from "@/stores/currency.js";
import { currencies, numberFormats } from "@/i18n/index.js";

export default {
	name: "CurrencySwitcher",

	props: {
		amount: Number
	},

	data() {
		return {
			currency: null
		}
	},

	computed: {
		/**
		 * Currencies list
		 * 
		 * @returns {Array}
		 */
		currenciesList() {
			return currencies.map(currency => ({
				text: currency,
				value: currency,
				default: currency === (this.currency || numberFormats[this.$root.$i18n.locale]?.currency.currency)
			}));
		},

		/**
		 * Calculate amount into selected currency
		 * 
		 * @returns {Number}
		 */
		converted() {
			const
				currency = this.sdk.currency,
				result = (((this.amount * currency[this.currency]) * 100) / 100);

			return !Number.isNaN(result) ? result.toFixed(2) : null;
		}
	},

	methods: {
		/**
		 * Set currency
		 * 
		 * @param {String|Object} item
		 * @param {Boolean} store
		 */
		selectCurrency(item, store) {
			const selected = (() => {
				if (item?.value) {
					return item;
				} else {
					return this.currenciesList.filter(f => f.value.includes(item)).pop();
				}
			})();

			this.currency = selected.value;
			if (store) CurrencyStore.set(selected.value);
		}
	},

	created() {
		if (CurrencyStore?.currency) {
			/* Get currency from store */
			this.selectCurrency(CurrencyStore.currency);
		}
	}
}