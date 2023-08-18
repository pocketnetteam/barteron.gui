import NameToHSL from "@/js/nametohsl.js";

export default {
	name: "Profile",

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
			return this.sdk.account[0];
		},

		/**
		 * Get barteron account
		 * 
		 * @return {Object}
		 */
		account() {
			return this.sdk.barteron.account[this.sdk.address];
		},

		/**
		 * Get first name from account name
		 * 
		 * @return {String}
		 */
		shortName() {
			return this.user?.name.substring(0, 1).toUpperCase();
		}
	},

	created() {
		/* this.sdk.setBrtAccount({
			address: this.sdk.address,
			tags: ['x', 'u', 'j']
		}).then(e => console.log(e, this)); */
		this.sdk.getBrtAccount().then(e => console.log(e, this));
	}
}