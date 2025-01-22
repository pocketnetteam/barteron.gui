export default {
	name: "Delivery",

	data() {
		return {
			entries: []
		}
	},

	mounted() {
		this.sdk.getBrtOffersFeed({
			tags: [97,98]
		}).then(e => {
			this.entries = e
			console.log(e)
		});
	}
}