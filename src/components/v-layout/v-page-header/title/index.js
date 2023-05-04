import Breadcrumbs from "@/components/breadcrumbs/index.vue";
import FavoriteCategories from "@/components/categories/favorite-categories/index.vue";

export default {
	name: "PageTitle",

	props: {
		title: {
			type: String,
			default: ""
		},
		breadcrumbs: {
			type: Boolean,
			default: true
		},
		favorite: {
			type: Boolean,
			default: true
		},
		count: {
			type: Boolean,
			default: true
		}
	},

	components: {
		Breadcrumbs,
		FavoriteCategories
	},

	computed: {
		/**
		 * Get page title from route.js
		 * 
		 * @return {String}
		 */
		pageTitle() {
			return this.title ?
				this.decodeString(this.title) :
				this.$t(this.$te(pageTitle) ? pageTitle : `pageLabels.${ pageTitle }`);
		},

		/**
		 * Get list of favorite categories
		 * 
		 * @return {Array}
		 */
		favoriteCategories() {
			const category = this.categories.findByName(this.title);

			return this.categories.findById((category?.children ?? []).slice(0, 14));
		}
	},

	methods: {
		/**
		 * Decode text special chars
		 * 
		 * @param {String} html
		 * @return {String}
		 */
		decodeString(html) {
			const text = document.createElement("textarea");
			text.innerHTML = html;
			return text.value;
		}
	}
}