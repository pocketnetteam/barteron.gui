export default {
	name: "BarterItem",

	data() {
		return {
			item: (() => {
				let item = this.barters.findById(this.$route.params.id);

				if (!item.hasOwnProperty("name")) {
					item = this.barters.generate(1, { id: this.$route.params.id })[0];
				}

				return item;
			})()
		}
	}
}