import AsideLayout from "@/components/layout/aside/index.vue";
import SubCategories from "@/components/categories/sub-categories/index.vue";

export default {
	name: "Aside",

	inject: ["categories"],

	components: {
		AsideLayout,
		SubCategories
	},

	computed: {
		category() {
			return this.categories.findByName(this.$route.params.slug);
		},

		subCategories() {
			return this.categories.findById(this.category.children);
		}
	},

	mounted() {
		console.log(this.$to)
	},
}