import AppErrors from "@/js/appErrors.js";
import { GeoHashApproximator } from "@/js/geohashUtils.js";

export default {
	name: "Location",

	data() {
		return {
			lightbox: false,
			center: null,
			zoom: null,
			bounds: null,
			offersRequestData: {
				pageSize: 100,
				pageStart: 0,
				topHeight: null,
				isLoading: false,
			},
			mapActionData: {},
			addr: {
				fetching: false
			},
			lastAddr: null,
			debouncedAddressResetHandler: null,
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
			if (!this.sdk.empty(this.center)) {
				return this.center;
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
						"accept-language": this.sdk.getLanguageByLocale(this.$root.$i18n.locale)
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
		},

		/**
		 * Hide lightbox
		 */
		hideLightbox() {
			this.lightbox = false;
		},

		/**
		 * Hide lightbox
		 */
		setupAddressResetHandler() {
			this.debouncedAddressResetHandler = this.debounce(() => {
				this.addr = {};
			}, 1500);
		},

		/**
		 * Informing of last center
		 * 
		 * @param {Array} latlng
		 */
		setCenter(latlng, e) {
			const
				aLat = Number(this.center?.[0] || 0),
				aLon = Number(this.center?.[1] || 0),
				bLat = Number(latlng[0] || 0),
				bLon = Number(latlng[1] || 0);

				
			/* Prevent frequently address request */
			if (aLat !== bLat || aLon !== bLon) {
				this.center = latlng;

				this.debouncedAddressResetHandler();
			}

			this.debounce(() => {
				if (this.lightbox) this.saveDisabled = false;
			}, 300)();
		},

		/**
		 * Informing of last zoom
		 * 
		 * @param {Number} zoom
		 */
		setZoom(zoom, e) {
			this.zoom = zoom;
		},

		/**
		 * Informing of last bounds
		 * 
		 * @param {Object} bounds
		 */
		setBounds(bounds, e) {
			this.bounds = bounds;
		},

		/**
		 * Reset account location
		 */
		reset() {
			this.locationStore.reset();

			this.center = null;
			this.saveDisabled = true;
			this.hideLightbox();
		},

		/**
		 * Submit form data
		 */
		submit() {
			const geohash = this.encodeGeoHash(this.location);

			this.saveDisabled = true;

			/* Update account with data */
			this.locationStore.set({
				geohash,
				zoom: this.zoom,
				bounds: this.bounds
			});

			this.lastAddr = this.address;
			this.hideLightbox();
		},

		mapAction(actionName, actionParams, event) {

			this.offersRequestData.actionName = actionName;

			if (actionName === "loadData" || actionName === "loadNextPage") {

				const 
					pageStart = (actionName === "loadNextPage") ? (this.offersRequestData.pageStart + 1) : 0,
					topHeight = (actionName === "loadNextPage") ? this.offersRequestData.topHeight : null,
					pageSize = this.offersRequestData.pageSize;

				const ids = this.sdk.requestServiceData.ids;
				ids.getBrtOffersFeed += 1;

				const
					approximator = new GeoHashApproximator(actionParams.bounds),
					location = approximator.getGeohashItems();

				const request = {
					location,
					pageSize,
					pageStart,
					topHeight, 
					checkingData: {
						requestId: ids.getBrtOffersFeed,
						checkRequestId: true,
					}
				}

				this.offersRequestData.isLoading = true;

				this.setMapActionData();

				this.sdk.getBrtOffersFeed(
					request
				).then(offers => {
					if (pageStart === 0) {
						this.offersRequestData.topHeight = offers?.[0]?.height;
					}
					this.offersRequestData.pageStart = pageStart;
					this.offersRequestData.isLoading = false;
					this.setMapActionData(offers);
				}).catch(e => { 
					const
						requestRejected = (e instanceof AppErrors.RequestIdError),
						needHandleError = !(requestRejected);

					if (needHandleError) {
						console.error(e);
						this.offersRequestData.isLoading = false;
						this.setMapActionData(null, e);
					} else {
						console.info(`Location component, map action ${actionName}:`, e.message);
					}
				});				
			} else if (actionName === "moveMap") {
				this.offersRequestData.isLoading = false;
				this.setMapActionData();
			}

		},

		setMapActionData(offers, error) {
			this.mapActionData = {
				actionName: this.offersRequestData.actionName,
				isLoading: this.offersRequestData.isLoading,
				nextPageExists: (offers?.length === this.offersRequestData.pageSize),
				isNextPage: (offers?.length && this.offersRequestData.pageStart > 0),
				offers,
				error
			}
		}
	},

	mounted() {
		this.lastAddr = this.address;
		this.setupAddressResetHandler();
	},

	beforeDestroy() {
		this.debouncedAddressResetHandler?.cancel();
	},
}