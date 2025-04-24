export default {
	name: "BoostInfo",

	methods: {
		openBoostInfoLink() {
			this.sdk.openExternalLink(this.sdk.bastyonBoostInfoURL);
		},
	}
}