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
			return this.account?.name?.substring(0, 1).toUpperCase();
		}
	}
}