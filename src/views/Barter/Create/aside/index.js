import SubCategories from "@/components/categories/sub-categories/index.vue";

export default {
	name: "Aside",

	components: {
		SubCategories
	},

	computed: {
		category() {
			return this.categories.findById(this.$route.params.id);
		},

		subCategories() {
			return this.categories.findById(this.category?.children);
		}
	}
}