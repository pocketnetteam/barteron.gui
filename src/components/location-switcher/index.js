export default {
	name: "Location",

	data() {
		return {
			lightbox: false,
			map: null,
			mapMarker: null,
			zoom: null,
			radius: 0,
			offersNear: [],
			addr: {
				fetching: false
			},
			lastAddr: null,
			nearbyDisabled: true,
			saveDisabled: true
		}
	},

	computed: {
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
			return this.decodeGeoHash(this.locationStore.geohash);
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
						"zoom": this.zoom || 18,
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
						}).catch(e => { 
							console.error(e);
						}).finally(() => {
							this.addr.fetching = false;
						});
				}

				return null;
			} else {
				const position = [
					this.addr.country,
					this.addr.city || this.addr.town || this.addr.state || this.addr.county
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
			this.radius = this.locationStore.radius ?? this.defaultRadius;
			this.map.mapObject._onResize();
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
		setMarker(latlng, e) {
			const
				aLat = Number(this.mapMarker?.[0] || 0),
				aLon = Number(this.mapMarker?.[1] || 0),
				bLat = Number(latlng[0] || 0),
				bLon = Number(latlng[1] || 0);

				
			/* Prevent frequently address request */
			if (aLat !== bLat || aLon !== bLon) {
				this.mapMarker = latlng;
				this.addr = {};
				this.nearbyDisabled = false;
			}

			this.debounce(() => {
				if (this.lightbox) this.saveDisabled = false;
			}, 300)();
		},

		/**
		 * Handle radius change
		 * 
		 * @param {Event} e
		 */
		changeRadius(e) {
			this.radius = Number(e.target.value);
			this.nearbyDisabled = false;
			this.saveDisabled = false;
		},

		/**
		 * Show nearby offers on the map
		 */
		showNearby() {
			const
				center = [
					"marker",
					"point",
					"center"
				].map(p => this.map?.[p]).filter(p => p).shift(),
				geohash = this.encodeGeoHash(center || this.location);
				
			this.getOffersFeed(geohash, this.radius);

			this.nearbyDisabled = true;
		},

		/**
		 * Reset account location
		 */
		reset() {
			this.locationStore.reset();

			this.mapMarker = null;
			this.saveDisabled = false;
			this.nearbyDisabled = false;
			this.hideLightbox();
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
				].map(p => this.map?.[p]).filter(p => p).shift(),
				geohash = this.encodeGeoHash(center || this.location);

			this.saveDisabled = true;

			/* Update account with data */
			this.locationStore.set({
				geohash,
				zoom: this.zoom,
				radius: this.radius
			});

			this.lastAddr = this.address;
			this.hideLightbox();
		},

		/**
		 * Get offers feed
		 */
		async getOffersFeed(center, radius) {
			this.offersNear = await this.getOffersFeedList(center, radius);
		}
	},

	mounted() {
		this.lastAddr = this.address;

		this.$2watch("$refs.map").then(map => {
			this.map = map;
			this.getOffersFeed();
		}).catch(e => { 
			console.error(e);
		});
	}
}