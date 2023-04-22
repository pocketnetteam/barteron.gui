export default {
	name: "Category",

	created() {
		this.components = Object.assign({}, this.$route.matched[0].instances);
	}
}