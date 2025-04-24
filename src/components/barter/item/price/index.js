import CurrencySwitcher from "@/components/currency-switcher/index.vue";

export default {
	name: "Price",

	components: {
		CurrencySwitcher
	},

	props: {
		item: {
			type: Object,
			default: () => ({})
		},
	},

	computed: {
		/**
		 * Get pkoin price
		 * 
		 * @returns {String|null}
		 */
		pkoinPrice() {
			let value = this.item?.price;

			const
				currencyPrice = this.item?.currencyPrice,
				fixedCurrency = currencyPrice?.currency?.toUpperCase(),
				fixedPrice = currencyPrice?.price,
				needCalc = (fixedCurrency && fixedPrice);
			
			if (needCalc) {
				const
					rates = this.sdk.currency,
					rate = rates[fixedCurrency],
					isValid = (rate && (typeof rate === "number"));

				value = isValid ? (fixedPrice / rate) : null;
			};

			return value;
		},

		/**
		 * Get pickup point data
		 * 
		 * @returns {Object}
		 */
		pickupPoint() {
			return this.item.delivery?.pickupPoint;
		},

		/**
		 * Get price prefix
		 * 
		 * @returns {String}
		 */
		pricePrefix() {
			return this.pickupPoint ? (this.$t("priceLabels.from") + " ") : "";
		},
	}
}