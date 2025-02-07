import CurrencyStore from "@/stores/currency.js";
import { currencies, numberFormats } from "@/i18n/index.js";

export default {
	name: "CurrencySwitcher",

	props: {
		amount: Number,
		currencyPrice: {
			type: Object,
			default: () => ({})
		},
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
		 * @returns {String|null}
		 */
		converted() {
			let value = null;

			const
				selectedCurrency = this.currency?.value?.toUpperCase(),
				fixedCurrency = this.currencyPrice?.currency?.toUpperCase(),
				fixedPrice = this.currencyPrice?.price,
				currencyPriceExists = (fixedCurrency && fixedPrice);
			
			if (currencyPriceExists) {
				const needConvert = (selectedCurrency !== fixedCurrency);
				if (needConvert) {
					const
						rates = this.sdk.currency,
						rateFrom = rates[fixedCurrency],
						rateTo = rates[selectedCurrency],
						isValid = (
							rateFrom 
							&& rateTo 
							&& (typeof rateFrom === "number") 
							&& (typeof rateTo === "number")
						);

					value = isValid ? (fixedPrice * rateTo / rateFrom) : null;
				} else {
					value = fixedPrice;
				}
			} else {
				const
					rates = this.sdk.currency,
					rate = rates[selectedCurrency],
					isValid = (rate && (typeof rate === "number"));

				value = isValid ? (this.amount * rate) : null;
			};
			
			return value;
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