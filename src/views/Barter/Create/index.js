export default {
	name: "CreateBarter",

	created() {
		this.components = Object.assign({}, this.$route.matched[0].instances);
	}
}