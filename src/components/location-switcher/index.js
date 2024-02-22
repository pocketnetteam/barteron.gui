import { GeoHash } from "geohash";

export default {
	name: "Location",

	data() {
		return {
			lightbox: false,
			mapMarker: null,
			mapZoom: null,
			radius: 0,
			addr: {
				fetching: false
			},
			lastAddr: null,
			saveDisabled: true
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
		 * Get my location
		 * 
		 * @returns {Array|null}
		 */
		location() {
			if (!this.sdk.empty(this.mapMarker)) {
				return this.mapMarker;
			} else if (this.locationStore.geohash) {
				return this.geohash;
			} else {
				return undefined;
			}
		},

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			if (this.locationStore.geohash) {
				const { latitude, longitude } = GeoHash.decodeGeoHash(this.locationStore.geohash);
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

				if (!this.addr.fetching && !this.sdk.empty(location)) {
					this.addr.fetching = true;

					this.sdk.geoLocation(location, {
						"zoom": this.mapZoom || 18,
						"accept-language": this.$root.$i18n.locale
					})
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
		},

		/**
		 * Get latest address for top button
		 */
		latestAddress() {
			return this.lastAddr || this.address;
		}
	},

	methods: {
		/**
		 * Show lightbox
		 */
		showLightbox() {
			this.lightbox = true;
			this.radius = this.locationStore.radius ?? 10;
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
				bLat = parseInt(latlng[0] || 0),
				bLon = parseInt(latlng[1] || 0);
			
			/* Prevent frequently address request */
			if (aLat !== bLat || aLon !== bLon) {
				this.mapMarker = latlng;
				this.addr = {};

				this.debounce(() => {
					if (this.lightbox) this.saveDisabled = false;
				}, 1000)();
			}
		},

		/**
		 * Reset account location
		 */
		reset() {
			this.locationStore.reset();

			this.mapMarker = null;
			this.saveDisabled = false;
		},

		/**
		 * Submit form data
		 */
		submit() {
			const
				center = [
					"marker",
					"point",
					"center"
				].map(p => this.$refs.map?.[p]).filter(p => p).shift(),
				hash = GeoHash.encodeGeoHash.apply(null, center || this.location),
				zoom = this.mapZoom,
				data = this.$refs.form.serialize();

			/* Update account with data */
			this.locationStore.set({
				geohash: this.mapMarker ? hash : null,
				near: this.getGeoHashRadius({
					geohash: hash
				}),
				zoom: zoom,
				radius: this.radius
			});

			this.lastAddr = this.address;
			this.saveDisabled = true;
			this.hideLightbox();
		},

		mounted() {
			this.lastAddr = this.address;
		},
	}
}