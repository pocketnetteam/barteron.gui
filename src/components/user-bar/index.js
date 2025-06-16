import NameToHSL from "@/js/nametohsl.js";
import CurrencySwitcher from "@/components/currency-switcher/index.vue";

export default {
	name: "UserBar",

	components: {
		CurrencySwitcher
	},

	inject: ["dialog"],

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
			return this.user?.name?.substring(0, 1).toUpperCase() || "?";
		},

		/* Get user's avatar */
		avatar() {
			const url = this.user?.i;
			return this.sdk.manageBastyonImageSrc(url);
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
			
			this.sdk.requestPermissions(permissions).then(async () => {
				to.params = { ...to.params || {}, from: this.$route.path };

				if (this.address === "%address%") {
					const
						address = await this.sdk.getAddress(),	/* Get account address */
						params = to?.params || to || {};				/* Get route params */

					for (const p in params) {
						params[p] = params[p].replace("%address%", address);
					}
				}

				if (this.sdk.address && !this.user?.name) {
					this.dialog?.instance.view("warn", this.$t("dialogLabels.pending_reg"));
				} else {
					if (this.user?.name && to && to.path != to.params.from) {
						this.$router.push(to).catch(e => {
							console.error(e);
						});
					}
				}
			}).catch(e => {
				this.showError(e);
			});

			return false;
		},
	}
}