import NameToHSL from "@/js/nametohsl.js";

export default {
	name: "Profile",

	props: {
		address: {
			type: String
		}
	},

	data() {
		return {
			color: new NameToHSL()
		}
	},

	computed: {
		/**
		 * Get user
		 * 
		 * @return {Object}
		 */
		user() {
			return this.sdk.account[this.address];
		},

		/**
		 * Get first name from account name
		 * 
		 * @return {String}
		 */
		shortName() {
			return this.user?.name?.substring(0, 1).toUpperCase() || "UN";
		},

		/**
		 * Barteron account
		 * 
		 * @return {Object}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
		},

		/**
		 * Generate hsl background for user
		 * 
		 * @return {String}
		 */
		hslColor() {
			return `--color: ${ this.color.generateHSL(this.user?.name || "username") }`
		}
	}
}