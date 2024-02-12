import { GeoHash } from "geohash";

export default {
	name: "Location",

	data() {
		return {
			lightbox: false,
			mapMarker: null,
			addr: {
				fetching: false
			},
			lastAddr: null
		}
	},

	computed: {
		/**
		 * Barteron account
		 * 
		 * @returns {@Account}
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
			const location = this.mapMarker || (!this.sdk.empty(this.sdk.location) ? Object.values(this.sdk.location) : null);
			
			return Array.isArray(location) && location.length ? location : null;
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
	
					if (!this.addr.fetching && location) {
						this.addr.fetching = true;
	
						this.sdk.geoLocation(location)
							.then(result => {
								if (result?.address) {
									this.$set(this, "addr", {
										...this.addr,
										...result.address,
										lastUpdate: +new Date
									});
								}
							});
					}
	
					return null;
				} else {
					const last = [
						this.addr.country,
						this.addr.city || this.addr.town || this.addr.county
					].filter(a => a).join(", ");

					if (!this.lightbox) this.lastAddr = last;

					return last;
				}
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
		 * Informing of last marker
		 * 
		 * @param {Array} latlng
		 */
		setMarker(latlng) {
			this.mapMarker = latlng;

			if (+new Date - this.addr.lastUpdate > 1000) {
				this.addr = {};
			}
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
			});

			this.lastAddr = null;
			this.hideLightbox();
		}
	}
}