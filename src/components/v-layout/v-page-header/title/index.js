import Breadcrumbs from "@/components/breadcrumbs/index.vue";
import FavoriteCategories from "@/components/categories/favorite-categories/index.vue";

export default {
	name: "PageTitle",

	inject: ["categories"],

	props: {
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
		title() {
			return this.$route.params?.slug ?? this.$route.name;
		},

		favoriteCategories() {
			const category = this.categories.findByName(this.title);

			return this.categories.findById((category?.children ?? []).slice(0, 14));
		}
	}
}