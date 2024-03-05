import CurrencyStore from "@/stores/currency.js";
import { currencies, numberFormats } from "@/i18n/index.js";

export default {
	name: "CurrencySwitcher",

	props: {
		amount: Number,
		switcher: Boolean,
		hideButton: Boolean,
		vSize: String
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
			return currencies.sort(this.$root.$i18n.locale).map(currency => ({
				text: currency.code,
				value: currency.code,
				graphem: currency.graphem,
				default: currency.code === (this.currency?.value || numberFormats[this.$root.$i18n.locale]?.currency.currency)
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
				result = (((this.amount * currency[this.currency?.value]) * 100) / 100);

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

			this.currency = selected;
			if (store) CurrencyStore.set(selected.value);
		}
	},

	created() {
		if (CurrencyStore?.currency) {
			/* Get currency from store */
			this.selectCurrency(CurrencyStore.currency);
		} else {
			this.selectCurrency(this.currenciesList[0]);
		}

		/* Subscribe to store event to get actual price */
		CurrencyStore.$subscribe(() => {
			this.selectCurrency(CurrencyStore.currency);
		});
	}
}