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
}