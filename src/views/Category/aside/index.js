import SubCategories from "@/components/categories/sub-categories/index.vue";

export default {
	name: "Aside",

	inject: ["categories"],

	components: {
		SubCategories
	},

	computed: {
		category() {
			return this.categories.findByName(this.$route.params.slug);
		},

		subCategories() {
			return this.categories.findById(this.category.children);
		}
	}
}