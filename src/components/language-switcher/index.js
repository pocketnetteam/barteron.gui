import { mapState } from "pinia";
import {
	default as LocaleStore,
	useLocaleStore
} from "@/stores/locale.js";
import VueI18n from "@/i18n/index.js";


export default {
	name: "LanguageSwitcher",

	props: {
		list: {
			type: Array,
			default: null
		}
	},

	computed: {
		...mapState(useLocaleStore, ["locale"]),

		/**
		 * Build locales list
		 * 
		 * @returns {Array}
		 */
		localesList() {
			return (this.list || LocaleStore.list).map(l => {
				const text = (l === LocaleStore.inheritLocale) ? 
					VueI18n.t("localeLabels.inherit") 
					: l.substring(0, 2).toUpperCase();

				return {
					text: `<i class="fa fa-globe"></i> ${text}`,
					value: l,
					selected: l === this.locale
				};
			});
		}
	},

	methods: {
		/**
		 * Select locale
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

			this.$root.$i18n.locale = this.getLocale(selected.value);
		},

		/**
		 * Get locale
		 * 
		 * @param {String} value
		 * 
		 * @returns {String}
		 */
		getLocale(value) {
			let result = value;
			if (value === LocaleStore.inheritLocale) {
				const
					language = this.sdk.appinfo?.locale,
					target = this.localesList.filter(f => f.value.includes(language)).pop();
				
				result = target ? target.value : VueI18n.fallbackLocale;
			}
			return result;
		},

		/**
		 * Set locale
		 * 
		 * @param {String|Object} item
		 */
		changeLanguage(item) {
			this.selectLanguage(item);
			LocaleStore.set(item.value);
		},
	},

	watch: {
		locale() {
			this.$refs.locale?.updateButton();
		}
	},

	created() {
		if (this.locale) {
			/* Get locale from store */
			this.selectLanguage(this.locale);
		} else if (this.sdk.appinfo?.locale) {
			/* Get locale from bastyon */
			this.selectLanguage(this.sdk.appinfo?.locale);
		}
	}
}