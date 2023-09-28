import Breadcrumbs from "@/components/breadcrumbs/index.vue";
import FavoriteCategories from "@/components/categories/favorite-categories/index.vue";

export default {
	name: "PageTitle",

	props: {
		title: {
			type: [String, Boolean],
			default: false
		},
		parent: {
			type: String,
			default: ""
		},
		breadcrumbs: {
			type: [Number, Boolean],
			default: false
		},
		favorite: {
			type: Boolean,
			default: false
		},
		count: {
			type: Boolean,
			default: false
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
			const title = this.$route.params.id ?? this.$route.name;

			if (typeof this.title === 'string') {
				return this.decodeString(this.title);
			} else if (this.title) {
				return this.$t(this.$te(title) ? title : `pageLabels.${ title }`);
			}

			return this.title;
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