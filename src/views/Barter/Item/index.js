export default {
	name: "BarterItem",

	data() {
		return {
			item: this.barters.findById(this.$route.params.id)
		}
	}
}