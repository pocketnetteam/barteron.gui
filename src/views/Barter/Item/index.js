export default {
	name: "BarterItem",

	created() {
		this.components = Object.assign({}, this.$route.matched[0].instances);
	}
}