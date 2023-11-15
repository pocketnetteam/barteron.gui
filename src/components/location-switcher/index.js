import { GeoHash } from "geohash";

export default {
	name: "Location",

	data() {
		return {
			lightbox: false,
			addr: {
				fetching: false
			}
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
		location: {
			cache: false,
			get() {
				const location = this.sdk.location;
				return location.latitude ? Object.values(location) : null; 
			}
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
		address: {
			cache: false,
			get() {
				if (!this.addr?.country) {
					const location = this.account?.static ? this.geohash : this.location;
	
					if (
						!this.addr.fetching &&
						location
					) {
						this.addr.fetching = true;
	
						this.sdk.geoLocation(location)
							.then(result => {
								this.$set(this, "addr", { ...this.addr, ...result.address });
							});
					}
	
					return null;
				} else {
					return [
						this.addr.country,
						this.addr.city || this.addr.town || this.addr.county
					].filter(a => a).join(", ");
				}
			}
		}
	},

	methods: {
		/**
		 * Show lightbox
		 */
		showLightbox() {
			this.sdk.requestPermissions(["location"]).then(result => {
				console.log(result)
				if (result?.location) {
					this.lightbox = true;
				}
			});
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