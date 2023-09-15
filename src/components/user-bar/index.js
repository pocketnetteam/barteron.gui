import NameToHSL from "@/js/nametohsl.js";

export default {
	name: "UserBar",

	data() {
		return {
			color: new NameToHSL()
		}
	},

	computed: {
		/**
		 * Get user from sdk
		 * 
		 * @return {Object}
		 */
		user() {
			return this.sdk.account[this.sdk.address];
		},

		/**
		 * Get first name from account name
		 * 
		 * @return {String}
		 */
		shortName() {
			return this.user?.name?.substring(0, 1).toUpperCase();
		}
	}
}