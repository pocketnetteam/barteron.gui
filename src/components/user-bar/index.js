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
		 * Parse links with permission request
		 * 
		 * @param {MouseEvent} e
		 * @param {Object} to
		 * 
		 * @returns {false}
		 */
		requestPermissions(e, to, permissions = ["account"]) {
			e.preventDefault();
			
			this.sdk.requestPermissions(permissions).then(async result => {
				if (result?.account) {
					if (this.address === "%address%") {
						const
							address = await this.sdk.getAddress(),	/* Get account address */
							params = to?.params || to || {};				/* Get route params */

						for (const p in params) {
							params[p] = params[p].replace("%address%", address);
						}
					}
				}

				if (permissions.every(p => result?.[p]) && to) this.$router.push(to).catch(() => {});
			});

			return false;
		}
	}
}