import Breadcrumbs from "@/components/breadcrumbs/index.vue";
import FavoriteCategories from "@/components/categories/favorite-categories/index.vue";

export default {
	name: "CategoryHeader",

	inject: ["categories"],

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

			return this.categories.findById(category.children.slice(0, 10));
		}
	}
}