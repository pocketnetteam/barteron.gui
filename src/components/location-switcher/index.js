import AppErrors from "@/js/appErrors.js";
import { GeoHashApproximator } from "@/js/geohashUtils.js";
import { mapState } from "pinia";
import { useLocaleStore } from "@/stores/locale.js";

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
			saveRegionButtonEnabled: false,
			storedLocationAddress: {},
		}
	},

	inject: ["dialog"],
	
	computed: {
		...mapState(useLocaleStore, ["locale"]),

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			return this.decodeGeoHash(this.locationStore.geohash);
		},

		resetRegionButtonEnabled() {
			return this.searchRegionDefined;
		},

		searchRegionDefined() {
			return !!(this.locationStore.bounds);
		},

		maxDesiredZoomToSaveRegion() {
			return 12;
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
		 * Informing of last center
		 * 
		 * @param {Array} latlng
		 * @param {Event} event
		 */
		setCenter(latlng, event) {
			this.center = latlng;
		},

		/**
		 * Informing of last zoom
		 * 
		 * @param {Number} zoom
		 * @param {Event} event
		 */
		setZoom(zoom, event) {
			this.zoom = zoom;
		},

		/**
		 * Informing of last bounds
		 * 
		 * @param {Object} bounds
		 * @param {Event} event
		 */
		setBounds(bounds, event) {
			this.bounds = bounds;
			
			setTimeout(() => {
				if (this.lightbox) this.saveRegionButtonEnabled = true;
			}, 100);
		},

		/**
		 * Show error from the map
		 * 
		 * @param {Error} error
		 */
		errorEvent(error) {
			this.showError(error);
		},

		async updateStoredLocationAddress() {
			await this.updateAddress(this.storedLocationAddress, this.geohash);
		},

		async updateAddress(address, latLon) {
			if (!(this.sdk.empty(latLon) || address.isLoading)) {
				this.$set(address, "isLoading", true);
				this.$set(address, "text", null);
				const data = await this.loadAddress(latLon);

				const options = {
					detailsAllowed: false,
					onlyCity: true,
				};
				this.$set(address, "text", this.getAddressText(data, options));

				this.$set(address, "isLoading", false);
			}
		},

		loadAddress(latLon) {
			return !(this.sdk.empty(latLon)) ? 
				this.sdk.geoLocation(latLon, {
					"zoom": this.zoom || 18,
					"accept-language": this.sdk.getLanguageByLocale(this.$root.$i18n.locale)
				}).catch(e => {
					console.error(e);
				})
				: null;
		},

		getAddressText(data, options) {
			let result = null;
			const 
				displayName = data?.display_name,
				address = data?.address,
				detailsAllowed = options?.detailsAllowed,
				onlyCity = options?.onlyCity;

			if (detailsAllowed && this.zoom >= 15 && displayName) {
				result = displayName;
			} else if (!(this.sdk.empty(address))) {
				const 
					country = address.country,
					city = address.city || address.town || address.state || address.county;
				
				let items = [];
				if (onlyCity) {
					items = [ (city || country) ];
				} else {
					items = [city, country];
				}
				result = items.filter(a => a).join(", ");
			}
			return result;
		},

		saveRegionEvent() {
			const
				needConfirmation = (this.zoom > this.maxDesiredZoomToSaveRegion),
				completionHandler = () => this.submit();

			if (needConfirmation) {
				this.dialog?.instance
					.view("question", this.$t("dialogLabels.saving_region_warning_by_zoom"))
					.then(state => {
						if (state) {
							completionHandler();
						}
					});
			} else {
				completionHandler();
			}
		},

		/**
		 * Show help
		 */
		help() {
			this.dialog?.instance.view("info", this.$t("dialogLabels.map_help_info"))
		},

		/**
		 * Reset stored location
		 */
		reset() {
			this.locationStore.reset({onlyBounds: true});
			this.saveRegionButtonEnabled = true;
			this.hideLightbox();
		},

		/**
		 * Submit form data
		 */
		submit() {
			const geohash = this.encodeGeoHash(this.center);

			this.locationStore.set({
				geohash,
				zoom: this.zoom,
				bounds: this.bounds
			});

			this.saveRegionButtonEnabled = false;
			this.updateStoredLocationAddress();
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
		this.updateStoredLocationAddress();
	},

	watch: {
		locale() {
			this.updateStoredLocationAddress();
		}
	},
}