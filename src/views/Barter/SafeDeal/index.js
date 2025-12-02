export default {
	name: "SafeDeal",

	computed: {
		offer() {
			return this.sdk.barteron.offers[this.$route.query?.offer];
		},
	},

}