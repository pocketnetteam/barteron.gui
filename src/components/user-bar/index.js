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
		 * Get user address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.sdk.address || "%address%";
		},

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
			return this.user?.name?.substring(0, 1).toUpperCase() || "U";
		},

		/**
		 * Generate hsl background for user
		 * 
		 * @returns {String}
		 */
		hslColor() {
			return `--color: ${ this.color.generateHSL(this.user?.name || "User") }`
		}
	},

	methods: {
		/**
		 * Parse links with account permission
		 * 
		 * @param {MouseEvent} e
		 * @param {Object} to
		 * 
		 * @returns {Void}
		 */
		requestAccount(e, to) {
			e.preventDefault();
			
			this.sdk.requestPermissions(["account"]).then(async result => {
				if (result?.account) {
					if (this.address === "%address%") {
						const address = await this.sdk.getAddress();

						for (const p in to?.params || {}) {
							to.params[p] = to.params[p].replace("%address%", address);
						}
					}

					if (to) this.$router.push(to);
				}
			});

			return false;
		}
	}
}