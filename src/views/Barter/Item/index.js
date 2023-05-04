export default {
	name: "BarterItem",

	data() {
		return {
			item: this.barters.findById(this.$route.params.id)
		}
	},

	created() {
		this.components = Object.assign({}, this.$route.matched[0].instances);
		console.log(this.item)
	}
}