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
		 * Set locale
		 * 
		 * @param {String|Object} item
		 */
		changeLanguage(item) {
			LocaleStore.set(item.value);
		},
	},

	watch: {
		locale() {
			this.$refs.locale?.updateButton();
		}
	},
}