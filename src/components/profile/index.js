import { GeoHash } from "geohash";
import NameToHSL from "@/js/nametohsl.js";
import Score from "@/components/score/index.vue";

export default {
	name: "Profile",

	components: {
		Score
	},

	props: {
		hash: {
			type: String
		}
	},

	data() {
		return {
			color: new NameToHSL(),
			addr: {}
		}
	},

	computed: {
		/**
		 * Get user
		 * 
		 * @returns {Object}
		 */
		user() {
			return this.sdk.accounts[this.hash];
		},

		/**
		 * Get first name from account name
		 * 
		 * @returns {String}
		 */
		shortName() {
			return this.user?.name?.substring(0, 1).toUpperCase() || "?";
		},

		/**
		 * Generate hsl background for user
		 * 
		 * @returns {String}
		 */
		hslColor() {
			return `--color: ${ this.color.generateHSL(this.user?.name || "username") }`
		},

		/**
		 * Barteron account
		 * 
		 * @returns {@Account}
		 */
		account() {
			return this.sdk.barteron.accounts[this.hash];
		},

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			if (this.account.geohash) {
				const { latitude, longitude } = GeoHash.decodeGeoHash(this.account.geohash);
				return [latitude[0], longitude[0]];
			} else {
				return null;
			}
		},

		/**
		 * Get address from geohash
		 * 
		 * @returns {null|String}
		 */
		geopos() {
			if (!this.addr.country) {
				if (!this.addr.fetching && this.geohash) {
					this.addr.fetching = true;
				
					this.sdk.geoLocation(this.geohash)
						.then(result => {
							if (result?.address) this.$set(this, "addr", result.address);
						}).catch(e => { 
							console.error(e);
						}).finally(() => {
							this.addr.fetching = false;
						});
				}

				return null;
			} else {
				return [
					this.addr.country,
					this.addr.city || this.addr.town || this.addr.state || this.addr.country
				].filter(f => f).join(", ");
			}
		}
	}
}