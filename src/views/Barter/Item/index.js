export default {
	name: "BarterItem",

	computed: {
		offer() {
			return this.sdk.barteron.offers[this.$route.params.id];
		}
	}
}