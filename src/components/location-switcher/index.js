import { GeoHash } from "geohash";

export default {
	name: "Location",

	data() {
		return {
			lightbox: false,
			addr: {}
		}
	},

	computed: {
		/**
		 * Barteron account
		 * 
		 * @returns {Object}
		 */
		account() {
			return this.sdk.barteron.accounts[this.sdk.address];
		},

		/**
		 * Static or dynamic location
		 * 
		 * @returns {String}
		 */
		mapType() {
			return this.account.static ? "static" : "dynamic";
		},

		/**
		 * Get radius of search
		 * 
		 * @returns {Number}
		 */
		radius() {
			return this.account.radius;
		},

		/**
		 * Get my location
		 * 
		 * @returns {Array|null}
		 */
		location() {
			const location = this.sdk.location;
			return location.latitude ? Object.values(location) : null; 
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
		 * @returns {Object|null}
		 */
		address() {
			if (!this.addr.country) {
				if (!this.addr.fetching && (this.geohash || this.location)) {
					this.addr.fetching = true;

					this.sdk.geoLocation(this.account.static ? this.geohash : this.location)
						.then(result => {
							this.$set(this, "addr", result.address);
						});
				}

				return null;
			} else {
				return this.addr;
			}
		}
	},

	methods: {
		/**
		 * Show lightbox
		 */
		showLightbox() {
			this.lightbox = true;
		},

		/**
		 * Hide lightbox
		 */
		hideLightbox() {
			this.lightbox = false;
		},

		/**
		 * Submit form data
		 */
		submit() {
			const
				data = this.$refs.form.serialize(),
				center = [
					"marker",
					"point",
					"center"
				].map(p => this.$refs.map?.[p]).filter(p => p).shift();

			/* Update account with data */
			this.account.set({
				geohash: GeoHash.encodeGeoHash.apply(null, center || this.location),
				static: data.static === "static",
				radius: Number(data.radius)
			}).then(() => this.hideLightbox());
		}
	}
}