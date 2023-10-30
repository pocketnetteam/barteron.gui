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
		 * @returns {Object}
		 */
		user() {
			return this.sdk.accounts[this.sdk.address];
		},

		/**
		 * Get first name from account name
		 * 
		 * @returns {String}
		 */
		shortName() {
			return this.user?.name?.substring(0, 1).toUpperCase() || "UN";
		},

		/**
		 * Generate hsl background for user
		 * 
		 * @returns {String}
		 */
		hslColor() {
			return `--color: ${ this.color.generateHSL(this.user?.name || "username") }`
		}
	}
}