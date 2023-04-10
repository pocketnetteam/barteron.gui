import Breadcrumbs from "@/components/breadcrumbs/index.vue";
import SubCategories from "@/components/categories/sub-categories/index.vue";

export default {
	name: "Title",

	inject: ["categoriesMap"],

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
		}
	}
}