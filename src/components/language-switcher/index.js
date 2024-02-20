import LocaleStore from "@/stores/locale.js";

export default {
	name: "LanguageSwitcher",

	props: {
		list: {
			type: Array,
			default: null
		}
	},

	computed: {
		/**
		 * Build locales list
		 * 
		 * @returns {Array}
		 */
		localesList() {
			return (this.list || LocaleStore.list).map(l => ({
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
		 * @param {Boolean} store
		 */
		selectLanguage(item, store) {
			const selected = (() => {
				if (item?.value) {
					return item;
				} else {
					return this.localesList.filter(f => f.value.includes(item)).pop();
				}
			})();

			this.$root.$i18n.locale = selected.value;
			if (store) LocaleStore.set(selected.value);
		}
	},

	created() {
		if (LocaleStore?.locale) {
			/* Get locale from store */
			this.selectLanguage(LocaleStore.locale);
		} else if (this.sdk.appinfo) {
			/* Get locale from bastyon */
			this.selectLanguage(this.sdk.appinfo?.locale);
		}
	}
}