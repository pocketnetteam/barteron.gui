import Breadcrumbs from "@/components/breadcrumbs/index.vue";
import SubCategories from "@/components/categories/sub-categories/index.vue";

export default {
	name: "Title",

	inject: ["categories"],

	components: {
		Breadcrumbs,
		SubCategories
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

		subCategories() {
			const category = this.categories.findByName(this.title);

			return this.categories.findById(category.children.slice(0, 10));
		}
	}
}