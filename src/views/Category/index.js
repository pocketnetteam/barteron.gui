import Title from "@/components/categories/title/index.vue";

export default {
	name: "Category",

	components: {
		Title
	},

	created() {
		this.components = Object.assign({}, this.$route.matched[0].instances);
	}
}