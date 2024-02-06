import { locales } from "@/i18n/index.js";

export default {
	name: "LanguageSwitcher",

	props: {
		locales: {
			type: Array,
			default: () => locales
		}
	},

	computed: {
		/**
		 * Build locales list
		 * 
		 * @returns {Array}
		 */
		localesList() {
			return this.locales.map(l => ({
				text: l.substring(0, 2).toUpperCase(),
				value: l,
				default: l === this.$root.$i18n.locale
			}));
		}
	},

	methods: {
		/**
		 * Set locale
		 * 
		 * @param {String|Object} item
		 */
		selectLanguage(item) {
			const selected = (() => {
				if (item?.value) {
					return item;
				} else {
					return this.localesList.filter(f => f.value.includes(item)).pop();
				}
			})();

			this.$root.$i18n.locale = selected.value;
		}
	},

	created() {
		/* this.selectLanguage("ru"); */
	}
}