import PageHeader from "@/components/layout/page-header/index.vue";
import CategoryHeader from "@/components/layout/page-header/category/index.vue";

export default {
	name: "Category",

	components: {
		PageHeader,
		CategoryHeader
	},

	created() {
		this.components = Object.assign({}, this.$route.matched[0].instances);
	}
}