import NameToHSL from "@/js/nametohsl.js";

export default {
	name: "Profile",

	data() {
		return {
			user: this.sdk.account[0],
			color: new NameToHSL()
		}
	},

	computed: {
		shortName() {
			return this.user?.name.substring(0, 1).toUpperCase()
		}
	},

	watch: {
		"sdk.account"(account) {
			this.user = account[0]
		}
	}
}