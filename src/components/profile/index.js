import NameToHSL from "@/js/nametohsl.js";
import Score from "@/components/score/index.vue";

export default {
	name: "Profile",

	components: {
		Score
	},

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
		 * @returns {Object}
		 */
		user() {
			return this.sdk.accounts[this.address];
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
		 * Barteron account
		 * 
		 * @returns {Object}
		 */
		account() {
			return this.sdk.barteron.accounts[this.address];
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