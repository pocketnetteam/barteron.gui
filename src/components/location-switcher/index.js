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
			return this.mapMarker || (!this.sdk.empty(this.sdk.location) ? Object.values(this.sdk.location) : this.geohash);
		},

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			if (this.account?.geohash) {
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
			if (!this.addr?.country) {
				const location = /* this.account?.static ? this.geohash : */ this.location;

				if (!this.addr.fetching && location) {
					this.addr.fetching = true;

					this.sdk.geoLocation(location)
						.then(result => {
							if (result?.address) {
								this.$set(this, "addr", {
									...this.addr,
									...result.address,
									fetching: false
								});
							}
						});
				}

				return null;
			} else {
				const position = [
					this.addr.country,
					this.addr.city || this.addr.town || this.addr.county
				].filter(a => a).join(", ")

				if (!this.lastAddr) this.lastAddr = position;
				return position;
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
			const
				aLat = parseInt(this.mapMarker?.[0] || 0),
				aLon = parseInt(this.mapMarker?.[1] || 0),
				bLat = parseInt(latlng?.[0] || 0),
				bLon = parseInt(latlng?.[1] || 0);
			
			/* Prevent frequently address request */
			if (aLat !== bLat || aLon !== bLon) {
				this.mapMarker = latlng;
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

			this.lastAddr = this.address;
			this.hideLightbox();
		},

		mounted() {
			this.lastAddr = this.address;
		},
	}
}