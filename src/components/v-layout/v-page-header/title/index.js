import Breadcrumbs from "@/components/breadcrumbs/index.vue";
import FavoriteCategories from "@/components/categories/favorite-categories/index.vue";

export default {
	name: "PageTitle",

	props: {
		title: {
			type: [String, Boolean],
			default: false
		},
		description: String,
		type: String,
		breadcrumbs: {
			type: [Number, String, Boolean],
			default: false
		},
		lastActive: Boolean,
		favorite: Boolean,
		count: Boolean
	},

	components: {
		Breadcrumbs,
		FavoriteCategories
	},

	computed: {
		/**
		 * Get page title from route.js
		 * 
		 * @returns {String}
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
		 * @returns {Array}
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
		 * 
		 * @returns {String}
		 */
		decodeString(html) {
			const text = document.createElement("textarea");
			text.innerHTML = html;
			return text.value;
		}
	}
}